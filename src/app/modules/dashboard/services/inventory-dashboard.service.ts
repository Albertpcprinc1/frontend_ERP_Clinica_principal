import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { InventoryDashboardSummary } from '../models/inventory-dashboard-summary.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryDashboardService {
  private readonly baseUrl = `${environment.apiUrl}/inventory/dashboard-summary`;

  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<InventoryDashboardSummary> {
    return this.http.get<InventoryDashboardSummary>(this.baseUrl);
  }
}