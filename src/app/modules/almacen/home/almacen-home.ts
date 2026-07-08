import { Component, computed, OnInit, signal } from '@angular/core';

import { KardexMovement } from '../models/kardex-movement.model';
import { CommercialMedicine } from '../models/commercial-medicine.model';
import { StockEntryResponse } from '../models/stock-entry.model';
import { StockLot } from '../models/stock-lot.model';
import { StockOutputResponse } from '../models/stock-output.model';
import { InventoryKardexService } from '../services/inventory-kardex.service';
import { InventoryMedicineService } from '../services/inventory-medicine.service';
import { InventoryStockService } from '../services/inventory-stock.service';

type AlmacenTab = 'inventario' | 'kardex' | 'alertas';
type StockFilter = 'todos' | 'stockBajo' | 'porVencer' | 'vencidos';
type OperationPanel = 'ingreso' | 'salida' | null;

interface MedicineSearchOption {
  medicamentoId: number;
  medicamentoNombre: string;
  dciNombre: string;
  registroSanitario: string;
  concentracion: string;
  presentacionComercial: string;
  stockDisponible: number;
}

interface RealOperationConfirmationDetail {
  label: string;
  value: string;
}

interface RealOperationConfirmation {
  operation: 'ingreso' | 'salida';
  title: string;
  subtitle: string;
  warning: string;
  actionText: string;
  accent: 'success' | 'danger';
  details: RealOperationConfirmationDetail[];
}

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
  medicines = signal<CommercialMedicine[]>([]);
  kardex = signal<KardexMovement[]>([]);

  loadingStocks = signal(true);
  loadingKardex = signal(true);

  stockErrorMessage = signal('');
  kardexErrorMessage = signal('');
  medicineErrorMessage = signal('');

  stockSearch = signal('');
  stockFilter = signal<StockFilter>('todos');

  ingresoMedicineSearch = signal('');
  salidaMedicineSearch = signal('');

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
  ingresoOperationExecuted = signal(false);

  salidaMedicamentoId = signal('');
  salidaCantidad = signal('');
  salidaTipoMovimiento = signal('ENTREGA_INTERNA');
  salidaMotivo = signal('Salida visual FEFO de prueba');
  salidaUsuario = signal('asistente.logistico');

  submittingSalida = signal(false);
  salidaSuccessMessage = signal('');
  salidaErrorMessage = signal('');
  lastSalidaResult = signal<StockOutputResponse | null>(null);
  salidaOperationExecuted = signal(false);

  realOperationConfirmation = signal<RealOperationConfirmation | null>(null);

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

  medicineOptions = computed<MedicineSearchOption[]>(() => {
    const catalogOptions = this.medicines()
      .filter((item) => item && item.id && item.nombreComercial)
      .map((item) => ({
        medicamentoId: item.id,
        medicamentoNombre: item.nombreComercial,
        dciNombre: item.dciNombre ?? '',
        registroSanitario: item.registroSanitario ?? '',
        concentracion: item.concentracion ?? '',
        presentacionComercial: item.presentacionComercial ?? '',
        stockDisponible: this.stockDisponibleByMedicineId(item.id)
      }));

    if (catalogOptions.length > 0) {
      return catalogOptions.sort((a, b) =>
        a.medicamentoNombre.localeCompare(b.medicamentoNombre)
      );
    }

    const map = new Map<number, MedicineSearchOption>();

    for (const item of this.stocks()) {
      if (!map.has(item.medicamentoId)) {
        map.set(item.medicamentoId, {
          medicamentoId: item.medicamentoId,
          medicamentoNombre: item.medicamentoNombre,
          dciNombre: item.dciNombre ?? '',
          registroSanitario: item.registroSanitario ?? '',
          concentracion: '',
          presentacionComercial: '',
          stockDisponible: this.stockDisponibleByMedicineId(item.medicamentoId)
        });
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
      (a.proveedorNombre ?? '').localeCompare(b.proveedorNombre ?? '')
    );
  });

  filteredIngresoMedicineOptions = computed(() =>
    this.filterMedicineOptions(this.ingresoMedicineSearch())
  );

  filteredSalidaMedicineOptions = computed(() =>
    this.filterMedicineOptions(this.salidaMedicineSearch())
  );

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
    private readonly medicineService: InventoryMedicineService,
    private readonly kardexService: InventoryKardexService
  ) {}

  ngOnInit(): void {
    this.loadMedicines();
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

  updateIngresoMedicineSearch(value: string): void {
    this.ingresoMedicineSearch.set(value);
    this.ingresoMedicamentoId.set('');
    this.resetIngresoOperationState();
  }

  updateSalidaMedicineSearch(value: string): void {
    this.salidaMedicineSearch.set(value);
    this.salidaMedicamentoId.set('');
    this.resetSalidaOperationState();
  }

  selectIngresoMedicine(item: MedicineSearchOption): void {
    this.ingresoMedicamentoId.set(String(item.medicamentoId));
    this.ingresoMedicineSearch.set(this.formatMedicineOption(item));
    this.resetIngresoOperationState();
  }

  selectSalidaMedicine(item: MedicineSearchOption): void {
    this.salidaMedicamentoId.set(String(item.medicamentoId));
    this.salidaMedicineSearch.set(this.formatMedicineOption(item));
    this.resetSalidaOperationState();
  }

  clearIngresoMedicineSelection(): void {
    this.ingresoMedicamentoId.set('');
    this.ingresoMedicineSearch.set('');
    this.resetIngresoOperationState();
  }

  clearSalidaMedicineSelection(): void {
    this.salidaMedicamentoId.set('');
    this.salidaMedicineSearch.set('');
    this.resetSalidaOperationState();
  }

  openIngresoRealConfirmation(): void {
    const medicamentoId = Number(this.ingresoMedicamentoId());
    const cantidad = Number(this.ingresoCantidad());
    const numeroLote = this.ingresoLote().trim();
    const fechaVencimiento = this.ingresoVencimiento();

    this.ingresoErrorMessage.set('');

    if (this.ingresoOperationExecuted()) {
      this.ingresoErrorMessage.set('Este ingreso ya fue registrado. Modifique los datos para habilitar una nueva operación.');
      return;
    }

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

    this.realOperationConfirmation.set({
      operation: 'ingreso',
      accent: 'success',
      title: 'Confirmar ingreso real de stock',
      subtitle: 'Esta acción creará un lote real, actualizará inventario y generará Kardex.',
      warning: 'Operación irreversible: después de confirmar, el movimiento quedará registrado en Kardex.',
      actionText: 'Confirmar ingreso real',
      details: [
        { label: 'Medicamento', value: this.selectedIngresoMedicineName() },
        { label: 'Lote', value: numeroLote },
        { label: 'Cantidad', value: String(cantidad) },
        { label: 'Vencimiento', value: fechaVencimiento },
        { label: 'Usuario', value: this.ingresoUsuario() || 'No definido' }
      ]
    });
  }

  openSalidaRealConfirmation(): void {
    const medicamentoId = Number(this.salidaMedicamentoId());
    const cantidad = Number(this.salidaCantidad());

    this.salidaErrorMessage.set('');

    if (this.salidaOperationExecuted()) {
      this.salidaErrorMessage.set('Esta salida ya fue registrada. Modifique los datos para habilitar una nueva operación.');
      return;
    }

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

    this.realOperationConfirmation.set({
      operation: 'salida',
      accent: 'danger',
      title: 'Confirmar salida FEFO real',
      subtitle: 'Esta acción descontará stock real aplicando FEFO y generará Kardex.',
      warning: 'Operación irreversible: después de confirmar, el stock será descontado y el movimiento quedará auditado.',
      actionText: 'Confirmar salida real',
      details: [
        { label: 'Medicamento', value: this.selectedSalidaMedicineName() },
        { label: 'Cantidad', value: String(cantidad) },
        { label: 'Tipo', value: this.salidaTipoMovimiento() },
        { label: 'Stock disponible', value: String(this.selectedSalidaStockDisponible()) },
        { label: 'Primer lote FEFO', value: this.selectedSalidaLots()[0]?.numeroLote ?? 'No definido' },
        { label: 'Usuario', value: this.salidaUsuario() || 'No definido' }
      ]
    });
  }

  closeRealOperationConfirmation(): void {
    this.realOperationConfirmation.set(null);
  }

  confirmRealOperation(): void {
    const confirmation = this.realOperationConfirmation();

    if (!confirmation) {
      return;
    }

    this.closeRealOperationConfirmation();

    if (confirmation.operation === 'ingreso') {
      this.ejecutarIngresoReal();
      return;
    }

    if (confirmation.operation === 'salida') {
      this.ejecutarSalidaReal();
    }
  }

  setIngresoMedicamentoId(value: string): void {
    this.ingresoMedicamentoId.set(value);
    const selected = this.medicineOptions().find((item) => item.medicamentoId === Number(value));
    if (selected) {
      this.ingresoMedicineSearch.set(this.formatMedicineOption(selected));
    }
    this.resetIngresoOperationState();
  }

  setIngresoLote(value: string): void {
    this.ingresoLote.set(value);
    this.resetIngresoOperationState();
  }

  setIngresoVencimiento(value: string): void {
    this.ingresoVencimiento.set(value);
    this.resetIngresoOperationState();
  }

  setIngresoCantidad(value: string): void {
    this.ingresoCantidad.set(value);
    this.resetIngresoOperationState();
  }

  setIngresoProveedor(value: string): void {
    this.ingresoProveedor.set(value);
    this.resetIngresoOperationState();
  }

  setIngresoMotivo(value: string): void {
    this.ingresoMotivo.set(value);
    this.resetIngresoOperationState();
  }

  setIngresoUsuario(value: string): void {
    this.ingresoUsuario.set(value);
    this.resetIngresoOperationState();
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
    this.closeRealOperationConfirmation();

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
        this.ingresoOperationExecuted.set(true);
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
    const selected = this.medicineOptions().find((item) => item.medicamentoId === Number(value));
    if (selected) {
      this.salidaMedicineSearch.set(this.formatMedicineOption(selected));
    }
    this.resetSalidaOperationState();
  }

  setSalidaCantidad(value: string): void {
    this.salidaCantidad.set(value);
    this.resetSalidaOperationState();
  }

  setSalidaTipoMovimiento(value: string): void {
    this.salidaTipoMovimiento.set(value);
    this.resetSalidaOperationState();
  }

  setSalidaMotivo(value: string): void {
    this.salidaMotivo.set(value);
    this.resetSalidaOperationState();
  }

  setSalidaUsuario(value: string): void {
    this.salidaUsuario.set(value);
    this.resetSalidaOperationState();
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
    this.closeRealOperationConfirmation();

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
        this.salidaOperationExecuted.set(true);
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

  private resetIngresoOperationState(): void {
    if (this.submittingIngreso()) {
      return;
    }

    this.ingresoOperationExecuted.set(false);
    this.ingresoSuccessMessage.set('');
    this.ingresoErrorMessage.set('');
    this.lastIngresoResult.set(null);
  }

  private resetSalidaOperationState(): void {
    if (this.submittingSalida()) {
      return;
    }

    this.salidaOperationExecuted.set(false);
    this.salidaSuccessMessage.set('');
    this.salidaErrorMessage.set('');
    this.lastSalidaResult.set(null);
  }

  loadAll(): void {
    this.loadMedicines();
    this.loadStocks();
    this.loadKardex();
  }

  loadMedicines(): void {
    this.medicineErrorMessage.set('');

    this.medicineService.getMedicines().subscribe({
      next: (items) => {
        this.medicines.set(items ?? []);
      },
      error: () => {
        this.medicineErrorMessage.set('No se pudo cargar el catálogo de medicamentos.');
      }
    });
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

  private filterMedicineOptions(searchValue: string): MedicineSearchOption[] {
    const search = this.normalize(searchValue);

    if (!search) {
      return this.medicineOptions().slice(0, 8);
    }

    return this.medicineOptions()
      .filter((item) =>
        this.normalize(item.medicamentoNombre).includes(search) ||
        this.normalize(item.dciNombre).includes(search) ||
        this.normalize(item.registroSanitario).includes(search) ||
        this.normalize(item.concentracion).includes(search) ||
        this.normalize(item.presentacionComercial).includes(search)
      )
      .slice(0, 10);
  }

  private formatMedicineOption(item: MedicineSearchOption): string {
    const dci = item.dciNombre ? ` | DCI: ${item.dciNombre}` : '';
    const rs = item.registroSanitario ? ` | RS: ${item.registroSanitario}` : '';
    return `${item.medicamentoNombre}${dci}${rs}`;
  }

  private stockDisponibleByMedicineId(medicamentoId: number): number {
    return this.stocks()
      .filter((item) => item.medicamentoId === medicamentoId)
      .reduce((total, item) => total + Number(item.stockDisponible || 0), 0);
  }

  private normalize(value: string | number | null | undefined): string {
    return String(value ?? '').trim().toLowerCase();
  }
}