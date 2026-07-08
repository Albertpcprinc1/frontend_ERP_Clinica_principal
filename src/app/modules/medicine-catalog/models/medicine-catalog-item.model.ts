export interface MedicineCatalogItem {
  medicamentoId: number;
  nombreComercial: string;
  dciNombre: string;
  laboratorioNombre: string;
  concentracion: string | null;
  formaFarmaceutica: string | null;
  presentacion: string | null;
  registroSanitario: string | null;
  stockTotalDisponible: number;
  totalLotesActivos: number;
  activo: boolean;
}