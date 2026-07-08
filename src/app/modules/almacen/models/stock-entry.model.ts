export interface StockEntryRequest {
  medicamentoId: number;
  proveedorId?: number | null;
  numeroLote: string;
  fechaVencimiento: string;
  fechaIngreso?: string | null;
  documentoIngreso?: string | null;
  guiaRemision?: string | null;
  ubicacionFisica?: string | null;
  costoUnitario?: number | null;
  stockMinimo?: number | null;
  cantidad: number;
  motivo?: string | null;
  usuarioResponsable?: string | null;
}

export interface StockEntryResponse {
  medicamentoId: number;
  medicamentoNombre: string;
  loteId: number;
  numeroLote: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  inventarioLoteId: number;
  stockActual: number;
  stockComprometido: number;
  stockDisponible: number;
  stockMinimo: number;
  kardexId: number;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento?: string;
}