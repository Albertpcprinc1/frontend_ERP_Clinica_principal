import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MedicineCatalogItem } from '../models/medicine-catalog-item.model';

interface ApiMedicine {
  id?: number;
  medicamentoId?: number;
  nombreComercial?: string;
  dciNombre?: string;
  laboratorioNombre?: string;
  concentracion?: string | null;
  formaFarmaceutica?: string | null;
  presentacion?: string | null;
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

@Injectable({
  providedIn: 'root'
})
export class MedicineCatalogService {
  private readonly medicinesUrl = `${environment.apiUrl}/inventory/medicines`;
  private readonly stocksUrl = `${environment.apiUrl}/inventory/stocks`;

  constructor(private readonly http: HttpClient) {}

  getMedicineCatalog(): Observable<MedicineCatalogItem[]> {
    return forkJoin({
      medicines: this.http.get<ApiMedicine[]>(this.medicinesUrl),
      stocks: this.http.get<ApiStockLot[]>(this.stocksUrl)
    }).pipe(
      map(({ medicines, stocks }) => this.toCatalogItems(medicines ?? [], stocks ?? []))
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
          presentacion: medicine.presentacion ?? null,
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