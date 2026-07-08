import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { MedicineCatalogItem } from '../models/medicine-catalog-item.model';
import { MedicineCatalogService } from '../services/medicine-catalog.service';

@Component({
  selector: 'app-medicine-catalog-home',
  imports: [CommonModule],
  templateUrl: './medicine-catalog-home.html',
  styleUrl: './medicine-catalog-home.scss'
})
export class MedicineCatalogHomeComponent {
  private readonly medicineCatalogService = inject(MedicineCatalogService);

  readonly medicines = signal<MedicineCatalogItem[]>([]);
  readonly searchText = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly filteredMedicines = computed(() => {
    const search = this.normalize(this.searchText());

    if (!search) {
      return this.medicines();
    }

    return this.medicines().filter((item) =>
      this.normalize(item.nombreComercial).includes(search) ||
      this.normalize(item.dciNombre).includes(search) ||
      this.normalize(item.laboratorioNombre).includes(search) ||
      this.normalize(item.registroSanitario ?? '').includes(search) ||
      this.normalize(item.concentracion ?? '').includes(search) ||
      this.normalize(item.presentacion ?? '').includes(search)
    );
  });

  readonly totalMedicamentos = computed(() => this.medicines().length);

  readonly totalConStock = computed(() =>
    this.medicines().filter((item) => Number(item.stockTotalDisponible || 0) > 0).length
  );

  readonly totalSinStock = computed(() =>
    this.medicines().filter((item) => Number(item.stockTotalDisponible || 0) <= 0).length
  );

  readonly stockTotalCatalogo = computed(() =>
    this.medicines().reduce((total, item) => total + Number(item.stockTotalDisponible || 0), 0)
  );

  constructor() {
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.medicineCatalogService.getMedicineCatalog().subscribe({
      next: (items) => {
        this.medicines.set(items ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el catálogo de medicamentos comerciales.');
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

  stockStatusLabel(item: MedicineCatalogItem): string {
    return Number(item.stockTotalDisponible || 0) > 0 ? 'Con stock' : 'Sin stock';
  }

  hasStock(item: MedicineCatalogItem): boolean {
    return Number(item.stockTotalDisponible || 0) > 0;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}