export interface DashboardKardexItem {
  id: number;
  medicamentoNombre: string;
  numeroLote: string;
  tipoMovimiento: string;
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  usuarioResponsable: string;
  fechaMovimiento: string;
}

export interface InventoryDashboardSummary {
  totalMedicamentosActivos: number;
  totalLotesActivos: number;
  lotesAgotados: number;
  lotesStockBajo: number;
  lotesPorVencer: number;
  lotesVencidos: number;
  stockTotalDisponible: number;
  ultimosMovimientos: DashboardKardexItem[];
}