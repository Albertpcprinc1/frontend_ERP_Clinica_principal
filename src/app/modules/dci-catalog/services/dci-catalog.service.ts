import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DciStockSummary } from '../models/dci-stock-summary.model';

@Injectable({
  providedIn: 'root'
})
export class DciCatalogService {
  private readonly dciStockSummaryUrl = `${environment.apiUrl}/inventory/dci/stock-summary`;

  constructor(private readonly http: HttpClient) {}

  getDciStockSummary(): Observable<DciStockSummary[]> {
    return this.http.get<DciStockSummary[]>(this.dciStockSummaryUrl);
  }
}