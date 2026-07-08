import { Component, computed, OnInit, signal } from '@angular/core';

import { StockLot } from '../models/stock-lot.model';
import { InventoryStockService } from '../services/inventory-stock.service';

@Component({
  selector: 'app-almacen-home',
  imports: [],
  templateUrl: './almacen-home.html',
  styleUrl: './almacen-home.scss'
})
export class AlmacenHomeComponent implements OnInit {
  stocks = signal<StockLot[]>([]);
  loading = signal(true);
  errorMessage = signal('');

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

  constructor(private readonly stockService: InventoryStockService) {}

  ngOnInit(): void {
    this.loadStocks();
  }

  loadStocks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.stockService.getStocks().subscribe({
      next: (items) => {
        this.stocks.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el inventario desde el backend.');
        this.loading.set(false);
      }
    });
  }
}