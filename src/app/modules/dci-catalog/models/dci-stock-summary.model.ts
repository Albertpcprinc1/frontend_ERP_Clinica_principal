export interface DciStockSummary {
  dciId: number;
  nombreGenerico: string;
  descripcion: string | null;
  totalMedicamentosComerciales: number;
  totalLotesActivos: number;
  stockTotalDisponible: number;
  activo: boolean;
}