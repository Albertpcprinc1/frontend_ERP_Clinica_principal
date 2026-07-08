import { Component, computed, OnInit, signal } from '@angular/core';

import { KardexMovement } from '../models/kardex-movement.model';
import { StockEntryResponse } from '../models/stock-entry.model';
import { StockLot } from '../models/stock-lot.model';
import { StockOutputResponse } from '../models/stock-output.model';
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

  submittingIngreso = signal(false);
  ingresoSuccessMessage = signal('');
  ingresoErrorMessage = signal('');
  lastIngresoResult = signal<StockEntryResponse | null>(null);

  salidaMedicamentoId = signal('');
  salidaCantidad = signal('');
  salidaTipoMovimiento = signal('ENTREGA_INTERNA');
  salidaMotivo = signal('Salida visual FEFO de prueba');
  salidaUsuario = signal('asistente.logistico');

  submittingSalida = signal(false);
  salidaSuccessMessage = signal('');
  salidaErrorMessage = signal('');
  lastSalidaResult = signal<StockOutputResponse | null>(null);

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

  providerOptions = computed(() => {
    const map = new Map<number, StockLot>();

    for (const item of this.stocks()) {
      if (item.proveedorId && !map.has(item.proveedorId)) {
        map.set(item.proveedorId, item);
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.proveedorNombre.localeCompare(b.proveedorNombre)
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

  ejecutarIngresoReal(): void {
    const medicamentoId = Number(this.ingresoMedicamentoId());
    const cantidad = Number(this.ingresoCantidad());
    const numeroLote = this.ingresoLote().trim();
    const fechaVencimiento = this.ingresoVencimiento();
    const proveedorId = this.providerOptions()[0]?.proveedorId ?? null;

    this.ingresoSuccessMessage.set('');
    this.ingresoErrorMessage.set('');
    this.lastIngresoResult.set(null);

    if (!medicamentoId) {
      this.ingresoErrorMessage.set('Seleccione un medicamento antes de ejecutar el ingreso real.');
      return;
    }

    if (!numeroLote) {
      this.ingresoErrorMessage.set('Ingrese el número de lote.');
      return;
    }

    if (!fechaVencimiento) {
      this.ingresoErrorMessage.set('Ingrese la fecha de vencimiento.');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      this.ingresoErrorMessage.set('Ingrese una cantidad mayor a cero.');
      return;
    }

    const confirmado = window.confirm(
      `Esta acción registrará stock real y generará Kardex.\n\nMedicamento: ${this.selectedIngresoMedicineName()}\nLote: ${numeroLote}\nCantidad: ${cantidad}\nVencimiento: ${fechaVencimiento}\n\n¿Desea continuar?`
    );

    if (!confirmado) {
      return;
    }

    const timestamp = Date.now();

    this.submittingIngreso.set(true);

    this.stockService.createStockEntry({
      medicamentoId,
      proveedorId,
      numeroLote,
      fechaVencimiento,
      fechaIngreso: new Date().toISOString().slice(0, 10),
      documentoIngreso: `DOC-ANGULAR-${timestamp}`,
      guiaRemision: `GUIA-ANGULAR-${timestamp}`,
      ubicacionFisica: 'ALMACEN-A1-ESTANTE-03',
      costoUnitario: 0,
      stockMinimo: 10,
      cantidad,
      motivo: this.ingresoMotivo(),
      usuarioResponsable: this.ingresoUsuario()
    }).subscribe({
      next: (response) => {
        this.lastIngresoResult.set(response);
        this.ingresoSuccessMessage.set('Ingreso real registrado correctamente. Inventario y Kardex actualizados.');
        this.submittingIngreso.set(false);
        this.loadAll();
      },
      error: (error) => {
        const message = error?.error?.message || 'No se pudo registrar el ingreso real.';
        this.ingresoErrorMessage.set(message);
        this.submittingIngreso.set(false);
      }
    });
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

  ejecutarSalidaReal(): void {
    const medicamentoId = Number(this.salidaMedicamentoId());
    const cantidad = Number(this.salidaCantidad());

    this.salidaSuccessMessage.set('');
    this.salidaErrorMessage.set('');
    this.lastSalidaResult.set(null);

    if (!medicamentoId) {
      this.salidaErrorMessage.set('Seleccione un medicamento antes de ejecutar la salida real.');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      this.salidaErrorMessage.set('Ingrese una cantidad mayor a cero.');
      return;
    }

    if (this.salidaStockInsuficiente()) {
      this.salidaErrorMessage.set('No se puede ejecutar la salida porque el stock disponible es insuficiente.');
      return;
    }

    const confirmado = window.confirm(
      `Esta acción modificará stock real y generará Kardex.\n\nMedicamento: ${this.selectedSalidaMedicineName()}\nCantidad: ${cantidad}\nTipo: ${this.salidaTipoMovimiento()}\n\n¿Desea continuar?`
    );

    if (!confirmado) {
      return;
    }

    this.submittingSalida.set(true);

    this.stockService.createStockOutput({
      medicamentoId,
      cantidad,
      tipoMovimiento: this.salidaTipoMovimiento(),
      referenciaTipo: 'SALIDA_FEFO_ANGULAR',
      referenciaId: Date.now(),
      motivo: this.salidaMotivo(),
      usuarioResponsable: this.salidaUsuario()
    }).subscribe({
      next: (response) => {
        this.lastSalidaResult.set(response);
        this.salidaSuccessMessage.set('Salida FEFO real registrada correctamente. Inventario y Kardex actualizados.');
        this.submittingSalida.set(false);
        this.loadAll();
      },
      error: (error) => {
        const message = error?.error?.message || 'No se pudo registrar la salida FEFO real.';
        this.salidaErrorMessage.set(message);
        this.submittingSalida.set(false);
      }
    });
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