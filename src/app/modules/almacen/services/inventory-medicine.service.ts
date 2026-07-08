import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CommercialMedicine } from '../models/commercial-medicine.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryMedicineService {
  private readonly medicinesUrl = `${environment.apiUrl}/inventory/medicines`;

  constructor(private readonly http: HttpClient) {}

  getMedicines(): Observable<CommercialMedicine[]> {
    return this.http.get<CommercialMedicine[]>(this.medicinesUrl);
  }
}