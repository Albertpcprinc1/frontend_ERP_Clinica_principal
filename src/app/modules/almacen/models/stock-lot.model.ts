export interface StockLot {
  inventarioLoteId: number;
  loteId: number;
  medicamentoId: number;
  medicamentoNombre: string;
  dciNombre: string;
  registroSanitario: string;
  numeroLote: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  diasParaVencer: number;
  vencido: boolean;
  alertaVencimiento: boolean;
  estadoVencimiento: string;
  stockActual: number;
  stockComprometido: number;
  stockDisponible: number;
  stockMinimo: number;
  alertaStockBajo: boolean;
  proveedorId: number;
  proveedorNombre: string;
  ubicacionFisica: string;
}