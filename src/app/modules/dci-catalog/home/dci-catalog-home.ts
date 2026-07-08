import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { DciStockSummary } from '../models/dci-stock-summary.model';
import { DciCatalogService } from '../services/dci-catalog.service';

@Component({
  selector: 'app-dci-catalog-home',
  imports: [CommonModule],
  templateUrl: './dci-catalog-home.html',
  styleUrl: './dci-catalog-home.scss'
})
export class DciCatalogHomeComponent {
  private readonly dciCatalogService = inject(DciCatalogService);

  readonly dciItems = signal<DciStockSummary[]>([]);
  readonly searchText = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly filteredDciItems = computed(() => {
    const search = this.normalize(this.searchText());

    if (!search) {
      return this.dciItems();
    }

    return this.dciItems().filter((item) =>
      this.normalize(item.nombreGenerico).includes(search) ||
      this.normalize(item.descripcion ?? '').includes(search)
    );
  });

  readonly totalDci = computed(() => this.dciItems().length);

  readonly totalDciConStock = computed(() =>
    this.dciItems().filter((item) => Number(item.stockTotalDisponible || 0) > 0).length
  );

  readonly totalDciSinStock = computed(() =>
    this.dciItems().filter((item) => Number(item.stockTotalDisponible || 0) <= 0).length
  );

  readonly stockTotalCatalogo = computed(() =>
    this.dciItems().reduce((total, item) => total + Number(item.stockTotalDisponible || 0), 0)
  );

  constructor() {
    this.loadDciStockSummary();
  }

  loadDciStockSummary(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dciCatalogService.getDciStockSummary().subscribe({
      next: (items) => {
        this.dciItems.set(items ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el catálogo maestro DCI.');
        this.isLoading.set(false);
      }
    });
  }

  updateSearchText(value: string): void {
    this.searchText.set(value);
  }

  clearSearch(): void {
    this.searchText.set('');
  }

  stockStatus(item: DciStockSummary): 'con-stock' | 'sin-stock' {
    return Number(item.stockTotalDisponible || 0) > 0 ? 'con-stock' : 'sin-stock';
  }

  stockStatusLabel(item: DciStockSummary): string {
    return Number(item.stockTotalDisponible || 0) > 0 ? 'Con stock' : 'Sin stock';
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}