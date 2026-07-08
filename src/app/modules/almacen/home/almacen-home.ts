import { Component, computed, OnInit, signal } from '@angular/core';

import { KardexMovement } from '../models/kardex-movement.model';
import { StockLot } from '../models/stock-lot.model';
import { InventoryKardexService } from '../services/inventory-kardex.service';
import { InventoryStockService } from '../services/inventory-stock.service';

type AlmacenTab = 'inventario' | 'kardex' | 'alertas';

@Component({
  selector: 'app-almacen-home',
  imports: [],
  templateUrl: './almacen-home.html',
  styleUrl: './almacen-home.scss'
})
export class AlmacenHomeComponent implements OnInit {
  activeTab = signal<AlmacenTab>('inventario');

  stocks = signal<StockLot[]>([]);
  kardex = signal<KardexMovement[]>([]);

  loadingStocks = signal(true);
  loadingKardex = signal(true);

  stockErrorMessage = signal('');
  kardexErrorMessage = signal('');

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
}