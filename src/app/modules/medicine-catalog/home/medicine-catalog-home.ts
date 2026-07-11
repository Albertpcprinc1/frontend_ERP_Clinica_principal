import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import {
  CatalogOption,
  DciOption,
  LaboratoryOption,
  MedicineCatalogItem,
  MedicineCreateRequest,
  MedicineFormDraft
} from '../models/medicine-catalog-item.model';
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

  readonly isFormOpen = signal(false);
  readonly isLoadingOptions = signal(false);
  readonly isSubmittingForm = signal(false);
  readonly formErrorMessage = signal('');
  readonly formSuccessMessage = signal('');
  readonly formPayloadPreview = signal('');

  readonly dciOptions = signal<DciOption[]>([]);
  readonly categoryOptions = signal<CatalogOption[]>([]);
  readonly unitOptions = signal<CatalogOption[]>([]);
  readonly laboratoryOptions = signal<LaboratoryOption[]>([]);

  readonly draft = signal<MedicineFormDraft>(this.emptyDraft());

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
      this.normalize(item.presentacionComercial ?? '').includes(search)
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
        this.errorMessage.set('No se pudo cargar el catÃ¡logo de medicamentos comerciales.');
        this.isLoading.set(false);
      }
    });
  }

  openNewMedicineForm(): void {
    this.draft.set(this.emptyDraft());
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
    this.formPayloadPreview.set('');
    this.isFormOpen.set(true);
    this.loadFormOptions();
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  loadFormOptions(): void {
    this.isLoadingOptions.set(true);

    this.medicineCatalogService.getFormOptions().subscribe({
      next: (options) => {
        this.dciOptions.set(options.dci);
        this.categoryOptions.set(options.categories);
        this.unitOptions.set(options.units);
        this.laboratoryOptions.set(options.laboratories);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.formErrorMessage.set('No se pudieron cargar los catÃ¡logos para el formulario.');
        this.isLoadingOptions.set(false);
      }
    });
  }

  updateSearchText(value: string): void {
    this.searchText.set(value);
  }

  clearSearch(): void {
    this.searchText.set('');
  }

  updateDraftText(field: keyof MedicineFormDraft, value: string): void {
    this.draft.update((current) => ({
      ...current,
      [field]: value
    }));
  }

  updateDraftNumber(field: keyof MedicineFormDraft, value: string): void {
    const parsedValue = value === '' ? null : Number(value);

    this.draft.update((current) => ({
      ...current,
      [field]: Number.isFinite(parsedValue as number) ? parsedValue : null
    }));
  }

  updateDraftBoolean(field: keyof MedicineFormDraft, checked: boolean): void {
    this.draft.update((current) => ({
      ...current,
      [field]: checked
    }));
  }

  prepareVisualPayload(): void {
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
    this.formPayloadPreview.set('');

    const validationErrors = this.validateDraft();

    if (validationErrors.length > 0) {
      this.formErrorMessage.set(validationErrors.join(' | '));
      return;
    }

    const payload = this.buildMedicinePayload();

    this.formPayloadPreview.set(JSON.stringify(payload, null, 2));
    this.formSuccessMessage.set('Formulario validado. Revise el JSON y luego guarde el medicamento real.');
  }

  saveMedicine(): void {
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');

    const validationErrors = this.validateDraft();

    if (validationErrors.length > 0) {
      this.formErrorMessage.set(validationErrors.join(' | '));
      return;
    }

    const payload = this.buildMedicinePayload();

    this.formPayloadPreview.set(JSON.stringify(payload, null, 2));
    this.isSubmittingForm.set(true);

    this.medicineCatalogService.createMedicine(payload).subscribe({
      next: () => {
        this.formSuccessMessage.set('Medicamento comercial registrado correctamente.');
        this.formErrorMessage.set('');
        this.isSubmittingForm.set(false);
        this.loadMedicines();

        setTimeout(() => {
          this.closeForm();
        }, 700);
      },
      error: (error) => {
        const message = error?.error?.message || 'No se pudo registrar el medicamento comercial.';
        this.formErrorMessage.set(message);
        this.isSubmittingForm.set(false);
      }
    });
  }

  stockStatusLabel(item: MedicineCatalogItem): string {
    return Number(item.stockTotalDisponible || 0) > 0 ? 'Con stock' : 'Sin stock';
  }

  hasStock(item: MedicineCatalogItem): boolean {
    return Number(item.stockTotalDisponible || 0) > 0;
  }

  private validateDraft(): string[] {
    const draft = this.draft();
    const errors: string[] = [];

    if (!draft.dciId) {
      errors.push('Seleccione un DCI.');
    }

    if (!draft.nombreComercial.trim()) {
      errors.push('Ingrese el nombre comercial.');
    }

    if (!draft.concentracion.trim()) {
      errors.push('Ingrese la concentraci\u00f3n.');
    }

    if (!draft.formaFarmaceutica.trim()) {
      errors.push('Ingrese la forma farmac\u00e9utica.');
    }

    if (!draft.presentacionComercial.trim()) {
      errors.push('Ingrese la presentaci\u00f3n comercial.');
    }

    if (!draft.unidadPresentacion.trim()) {
      errors.push('Ingrese la unidad de presentacion.');
    }

    if (!draft.factorConversionUnidadBase || draft.factorConversionUnidadBase <= 0) {
      errors.push('Ingrese un factor de conversion mayor a cero.');
    }

    if (!draft.registroSanitario.trim()) {
      errors.push('Ingrese el Registro Sanitario.');
    }

    return errors;
  }

  private buildMedicinePayload(): MedicineCreateRequest {
    const draft = this.draft();

    return {
      dciId: Number(draft.dciId),
      categoriaId: draft.categoriaId,
      laboratorioId: draft.laboratorioId,
      unidadMedidaId: draft.unidadMedidaId,
      nombreComercial: draft.nombreComercial.trim(),
      concentracion: draft.concentracion.trim(),
      formaFarmaceutica: draft.formaFarmaceutica.trim(),
      presentacionComercial: draft.presentacionComercial.trim(),
      unidadPresentacion: draft.unidadPresentacion.trim(),
      factorConversionUnidadBase: Number(draft.factorConversionUnidadBase),
      registroSanitario: draft.registroSanitario.trim(),
      esGenerico: draft.esGenerico,
      requiereReceta: draft.requiereReceta,
      requiereRecetaArchivada: draft.requiereRecetaArchivada,
      precioPublico: draft.precioPublico,
      precioAseguradora: draft.precioAseguradora,
      stockMinimoTotal: draft.stockMinimoTotal,
      observaciones: draft.observaciones.trim() || null
    };
  }

  private emptyDraft(): MedicineFormDraft {
    return {
      dciId: null,
      categoriaId: null,
      laboratorioId: null,
      unidadMedidaId: null,
      nombreComercial: '',
      concentracion: '',
      formaFarmaceutica: '',
      presentacionComercial: '',
      unidadPresentacion: 'Caja',
      factorConversionUnidadBase: 100,
      registroSanitario: '',
      esGenerico: false,
      requiereReceta: true,
      requiereRecetaArchivada: false,
      precioPublico: null,
      precioAseguradora: null,
      stockMinimoTotal: null,
      observaciones: ''
    };
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}