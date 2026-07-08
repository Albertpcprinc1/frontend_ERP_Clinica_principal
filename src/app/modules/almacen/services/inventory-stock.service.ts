import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { StockLot } from '../models/stock-lot.model';
import { StockOutputRequest, StockOutputResponse } from '../models/stock-output.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryStockService {
  private readonly stocksUrl = `${environment.apiUrl}/inventory/stocks`;
  private readonly stockOutputsUrl = `${environment.apiUrl}/inventory/stock-outputs`;

  constructor(private readonly http: HttpClient) {}

  getStocks(): Observable<StockLot[]> {
    return this.http.get<StockLot[]>(this.stocksUrl);
  }

  createStockOutput(request: StockOutputRequest): Observable<StockOutputResponse> {
    return this.http.post<StockOutputResponse>(this.stockOutputsUrl, request);
  }
}