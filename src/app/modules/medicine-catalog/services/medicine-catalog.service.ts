import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CatalogOption,
  DciOption,
  LaboratoryOption,
  MedicineCatalogItem,
  MedicineCreateRequest,
  MedicineFormOptions
} from '../models/medicine-catalog-item.model';

interface ApiMedicine {
  id?: number;
  medicamentoId?: number;
  nombreComercial?: string;
  dciNombre?: string;
  laboratorioNombre?: string;
  concentracion?: string | null;
  formaFarmaceutica?: string | null;
  presentacionComercial?: string | null;
  presentacion?: string | null;
  unidadPresentacion?: string | null;
  factorConversionUnidadBase?: number | null;
  registroSanitario?: string | null;
  activo?: boolean;
}

interface ApiStockLot {
  medicamentoId?: number;
  medicineId?: number;
  idMedicamento?: number;
  stockDisponible?: number;
  stockActual?: number;
  cantidadDisponible?: number;
  activo?: boolean;
}

interface ApiInventoryCatalogs {
  categorias?: CatalogOption[];
  unidades?: CatalogOption[];
}

@Injectable({
  providedIn: 'root'
})
export class MedicineCatalogService {
  private readonly medicinesUrl = `${environment.apiUrl}/inventory/medicines`;
  private readonly stocksUrl = `${environment.apiUrl}/inventory/stocks`;
  private readonly dciUrl = `${environment.apiUrl}/inventory/dci`;
  private readonly laboratoriesUrl = `${environment.apiUrl}/inventory/laboratories`;
  private readonly catalogsUrl = `${environment.apiUrl}/inventory/catalogs`;

  constructor(private readonly http: HttpClient) {}

  getMedicineCatalog(): Observable<MedicineCatalogItem[]> {
    return forkJoin({
      medicines: this.http.get<ApiMedicine[]>(this.medicinesUrl),
      stocks: this.http.get<ApiStockLot[]>(this.stocksUrl)
    }).pipe(
      map(({ medicines, stocks }) => this.toCatalogItems(medicines ?? [], stocks ?? []))
    );
  }

  createMedicine(payload: MedicineCreateRequest): Observable<ApiMedicine> {
    return this.http.post<ApiMedicine>(this.medicinesUrl, payload);
  }

  getFormOptions(): Observable<MedicineFormOptions> {
    return forkJoin({
      dci: this.http.get<DciOption[]>(this.dciUrl),
      laboratories: this.http.get<LaboratoryOption[]>(this.laboratoriesUrl),
      catalogs: this.http.get<ApiInventoryCatalogs>(this.catalogsUrl)
    }).pipe(
      map(({ dci, laboratories, catalogs }) => ({
        dci: (dci ?? []).filter((item) => item.activo ?? true),
        laboratories: (laboratories ?? []).filter((item) => item.activo ?? true),
        categories: catalogs?.categorias ?? [],
        units: catalogs?.unidades ?? []
      }))
    );
  }

  private toCatalogItems(medicines: ApiMedicine[], stocks: ApiStockLot[]): MedicineCatalogItem[] {
    return medicines
      .map((medicine) => {
        const medicamentoId = Number(medicine.id ?? medicine.medicamentoId ?? 0);
        const relatedLots = stocks.filter((lot) => this.getLotMedicineId(lot) === medicamentoId);

        const stockTotalDisponible = relatedLots.reduce(
          (total, lot) => total + this.getLotStock(lot),
          0
        );

        return {
          medicamentoId,
          nombreComercial: medicine.nombreComercial ?? 'Sin nombre comercial',
          dciNombre: medicine.dciNombre ?? 'Sin DCI vinculado',
          laboratorioNombre: medicine.laboratorioNombre ?? 'Sin laboratorio',
          concentracion: medicine.concentracion ?? null,
          formaFarmaceutica: medicine.formaFarmaceutica ?? null,
          presentacionComercial: medicine.presentacionComercial ?? medicine.presentacion ?? null,
          unidadPresentacion: medicine.unidadPresentacion ?? null,
          factorConversionUnidadBase: medicine.factorConversionUnidadBase ?? null,
          registroSanitario: medicine.registroSanitario ?? null,
          stockTotalDisponible,
          totalLotesActivos: relatedLots.length,
          activo: medicine.activo ?? true
        };
      })
      .sort((a, b) => a.nombreComercial.localeCompare(b.nombreComercial, 'es'));
  }

  private getLotMedicineId(lot: ApiStockLot): number {
    return Number(lot.medicamentoId ?? lot.medicineId ?? lot.idMedicamento ?? 0);
  }

  private getLotStock(lot: ApiStockLot): number {
    return Number(lot.stockDisponible ?? lot.stockActual ?? lot.cantidadDisponible ?? 0);
  }
}