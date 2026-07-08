import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { KardexMovement } from '../models/kardex-movement.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryKardexService {
  private readonly baseUrl = `${environment.apiUrl}/inventory/kardex`;

  constructor(private readonly http: HttpClient) {}

  getKardex(filters?: {
    medicamentoId?: number;
    loteId?: number;
    tipoMovimiento?: string;
  }): Observable<KardexMovement[]> {
    let params = new HttpParams();

    if (filters?.medicamentoId) {
      params = params.set('medicamentoId', filters.medicamentoId);
    }

    if (filters?.loteId) {
      params = params.set('loteId', filters.loteId);
    }

    if (filters?.tipoMovimiento) {
      params = params.set('tipoMovimiento', filters.tipoMovimiento);
    }

    return this.http.get<KardexMovement[]>(this.baseUrl, { params });
  }
}