import { Component, computed, OnInit, signal } from '@angular/core';

import { KardexMovement } from '../models/kardex-movement.model';
import { StockLot } from '../models/stock-lot.model';
import { InventoryKardexService } from '../services/inventory-kardex.service';
import { InventoryStockService } from '../services/inventory-stock.service';

type AlmacenTab = 'inventario' | 'kardex' | 'alertas';
type StockFilter = 'todos' | 'stockBajo' | 'porVencer' | 'vencidos';
type OperationPanel = 'ingreso' | 'salida' | null;

@Component({
  selector: 'app-almacen-home',
  imports: [],
  templateUrl: './almacen-home.html',
  styleUrl: './almacen-home.scss'
})
export class AlmacenHomeComponent implements OnInit {
  activeTab = signal<AlmacenTab>('inventario');
  activeOperation = signal<OperationPanel>(null);

  stocks = signal<StockLot[]>([]);
  kardex = signal<KardexMovement[]>([]);

  loadingStocks = signal(true);
  loadingKardex = signal(true);

  stockErrorMessage = signal('');
  kardexErrorMessage = signal('');

  stockSearch = signal('');
  stockFilter = signal<StockFilter>('todos');

  kardexSearch = signal('');
  kardexMovementFilter = signal('TODOS');

  ingresoMedicamentoId = signal('');
  ingresoLote = signal('');
  ingresoVencimiento = signal('');
  ingresoCantidad = signal('');
  ingresoProveedor = signal('');
  ingresoMotivo = signal('Ingreso visual de prueba');
  ingresoUsuario = signal('asistente.logistico');

  salidaMedicamentoId = signal('');
  salidaCantidad = signal('');
  salidaTipoMovimiento = signal('ENTREGA_INTERNA');
  salidaMotivo = signal('Salida visual FEFO de prueba');
  salidaUsuario = signal('asistente.logistico');

  totalLotes = computed(() => this.stocks().length);

  stockTotalDisponible = computed(() =>
    this.stocks().reduce((total, item) => total + Number(item.stockDisponible || 0), 0)
  );

  lotesStockBajo = computed(() =>
    this.stocks().filter((item) => item.alertaStockBajo).length
  );

  lotesPorVencer = computed(() =>
    this.stocks().filter((item) => item.alertaVencimiento).length
  );

  lotesVencidos = computed(() =>
    this.stocks().filter((item) => item.vencido).length
  );

  alertasStockBajo = computed(() =>
    this.stocks().filter((item) => item.alertaStockBajo)
  );

  alertasVencimiento = computed(() =>
    this.stocks().filter((item) => item.alertaVencimiento || item.vencido)
  );

  medicineOptions = computed(() => {
    const map = new Map<number, StockLot>();

    for (const item of this.stocks()) {
      if (!map.has(item.medicamentoId)) {
        map.set(item.medicamentoId, item);
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.medicamentoNombre.localeCompare(b.medicamentoNombre)
    );
  });

  selectedSalidaLots = computed(() => {
    const medicamentoId = Number(this.salidaMedicamentoId());

    if (!medicamentoId) {
      return [];
    }

    return this.stocks()
      .filter((item) => item.medicamentoId === medicamentoId && item.stockDisponible > 0 && !item.vencido)
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
  });

  selectedSalidaStockDisponible = computed(() =>
    this.selectedSalidaLots().reduce((total, item) => total + Number(item.stockDisponible || 0), 0)
  );

  salidaCantidadNumber = computed(() => Number(this.salidaCantidad() || 0));

  salidaStockInsuficiente = computed(() =>
    this.salidaCantidadNumber() > 0 && this.salidaCantidadNumber() > this.selectedSalidaStockDisponible()
  );

  selectedIngresoMedicineName = computed(() => {
    const medicamentoId = Number(this.ingresoMedicamentoId());
    return this.medicineOptions().find((item) => item.medicamentoId === medicamentoId)?.medicamentoNombre ?? 'No seleccionado';
  });

  selectedSalidaMedicineName = computed(() => {
    const medicamentoId = Number(this.salidaMedicamentoId());
    return this.medicineOptions().find((item) => item.medicamentoId === medicamentoId)?.medicamentoNombre ?? 'No seleccionado';
  });

  filteredStocks = computed(() => {
    const search = this.normalize(this.stockSearch());
    const filter = this.stockFilter();

    return this.stocks().filter((item) => {
      const matchesSearch =
        !search ||
        this.normalize(item.medicamentoNombre).includes(search) ||
        this.normalize(item.dciNombre).includes(search) ||
        this.normalize(item.numeroLote).includes(search) ||
        this.normalize(item.proveedorNombre).includes(search) ||
        this.normalize(item.ubicacionFisica).includes(search) ||
        this.normalize(item.registroSanitario).includes(search);

      const matchesFilter =
        filter === 'todos' ||
        (filter === 'stockBajo' && item.alertaStockBajo) ||
        (filter === 'porVencer' && item.alertaVencimiento) ||
        (filter === 'vencidos' && item.vencido);

      return matchesSearch && matchesFilter;
    });
  });

  movementTypes = computed(() => {
    const types = new Set(this.kardex().map((item) => item.tipoMovimiento).filter(Boolean));
    return Array.from(types).sort();
  });

  filteredKardex = computed(() => {
    const search = this.normalize(this.kardexSearch());
    const movementFilter = this.kardexMovementFilter();

    return this.kardex().filter((item) => {
      const matchesSearch =
        !search ||
        this.normalize(item.medicamentoNombre).includes(search) ||
        this.normalize(item.dciNombre).includes(search) ||
        this.normalize(item.numeroLote).includes(search) ||
        this.normalize(item.tipoMovimiento).includes(search) ||
        this.normalize(item.usuarioResponsable).includes(search) ||
        this.normalize(item.referenciaTipo).includes(search);

      const matchesMovement =
        movementFilter === 'TODOS' || item.tipoMovimiento === movementFilter;

      return matchesSearch && matchesMovement;
    });
  });

  constructor(
    private readonly stockService: InventoryStockService,
    private readonly kardexService: InventoryKardexService
  ) {}

  ngOnInit(): void {
    this.loadStocks();
    this.loadKardex();
  }

  setTab(tab: AlmacenTab): void {
    this.activeTab.set(tab);
  }

  openOperation(panel: OperationPanel): void {
    this.activeOperation.set(panel);
  }

  closeOperation(): void {
    this.activeOperation.set(null);
  }

  setIngresoMedicamentoId(value: string): void {
    this.ingresoMedicamentoId.set(value);
  }

  setIngresoLote(value: string): void {
    this.ingresoLote.set(value);
  }

  setIngresoVencimiento(value: string): void {
    this.ingresoVencimiento.set(value);
  }

  setIngresoCantidad(value: string): void {
    this.ingresoCantidad.set(value);
  }

  setIngresoProveedor(value: string): void {
    this.ingresoProveedor.set(value);
  }

  setIngresoMotivo(value: string): void {
    this.ingresoMotivo.set(value);
  }

  setIngresoUsuario(value: string): void {
    this.ingresoUsuario.set(value);
  }

  setSalidaMedicamentoId(value: string): void {
    this.salidaMedicamentoId.set(value);
  }

  setSalidaCantidad(value: string): void {
    this.salidaCantidad.set(value);
  }

  setSalidaTipoMovimiento(value: string): void {
    this.salidaTipoMovimiento.set(value);
  }

  setSalidaMotivo(value: string): void {
    this.salidaMotivo.set(value);
  }

  setSalidaUsuario(value: string): void {
    this.salidaUsuario.set(value);
  }

  setStockSearch(value: string): void {
    this.stockSearch.set(value);
  }

  setStockFilter(value: StockFilter): void {
    this.stockFilter.set(value);
  }

  clearStockFilters(): void {
    this.stockSearch.set('');
    this.stockFilter.set('todos');
  }

  setKardexSearch(value: string): void {
    this.kardexSearch.set(value);
  }

  setKardexMovementFilter(value: string): void {
    this.kardexMovementFilter.set(value);
  }

  clearKardexFilters(): void {
    this.kardexSearch.set('');
    this.kardexMovementFilter.set('TODOS');
  }

  loadAll(): void {
    this.loadStocks();
    this.loadKardex();
  }

  loadStocks(): void {
    this.loadingStocks.set(true);
    this.stockErrorMessage.set('');

    this.stockService.getStocks().subscribe({
      next: (items) => {
        this.stocks.set(items);
        this.loadingStocks.set(false);
      },
      error: () => {
        this.stockErrorMessage.set('No se pudo cargar el inventario desde el backend.');
        this.loadingStocks.set(false);
      }
    });
  }

  loadKardex(): void {
    this.loadingKardex.set(true);
    this.kardexErrorMessage.set('');

    this.kardexService.getKardex().subscribe({
      next: (items) => {
        this.kardex.set(items);
        this.loadingKardex.set(false);
      },
      error: () => {
        this.kardexErrorMessage.set('No se pudo cargar el Kardex desde el backend.');
        this.loadingKardex.set(false);
      }
    });
  }

  private normalize(value: string | number | null | undefined): string {
    return String(value ?? '').trim().toLowerCase();
  }
}