export interface StockOutputRequest {
  medicamentoId: number;
  cantidad: number;
  tipoMovimiento: string;
  referenciaTipo: string;
  referenciaId: number;
  motivo: string;
  usuarioResponsable: string;
}

export interface StockOutputLineResponse {
  inventarioLoteId?: number;
  loteId: number;
  numeroLote: string;
  fechaVencimiento?: string;
  cantidadAtendida: number;
  stockAnterior: number;
  stockPosterior: number;
  stockDisponiblePosterior?: number;
  kardexMovimientoId?: number;
}

export interface StockOutputResponse {
  medicamentoId?: number;
  medicamentoNombre?: string;
  tipoMovimiento: string;
  cantidadSolicitada: number;
  cantidadAtendida: number;
  referenciaTipo?: string;
  referenciaId?: number;
  motivo?: string;
  usuarioResponsable?: string;
  lineas?: StockOutputLineResponse[];
}