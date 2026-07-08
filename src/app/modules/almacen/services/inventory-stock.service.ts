import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { StockLot } from '../models/stock-lot.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryStockService {
  private readonly baseUrl = `${environment.apiUrl}/inventory/stocks`;

  constructor(private readonly http: HttpClient) {}

  getStocks(): Observable<StockLot[]> {
    return this.http.get<StockLot[]>(this.baseUrl);
  }
}