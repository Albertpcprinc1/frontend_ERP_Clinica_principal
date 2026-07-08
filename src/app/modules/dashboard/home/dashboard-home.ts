import { Component, OnInit, signal } from '@angular/core';

import { InventoryDashboardSummary } from '../models/inventory-dashboard-summary.model';
import { InventoryDashboardService } from '../services/inventory-dashboard.service';

@Component({
  selector: 'app-dashboard-home',
  imports: [],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss'
})
export class DashboardHomeComponent implements OnInit {
  summary = signal<InventoryDashboardSummary | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  constructor(private readonly dashboardService: InventoryDashboardService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.summary.set(null);

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo conectar con el backend de inventario.');
        this.loading.set(false);
      }
    });
  }
}