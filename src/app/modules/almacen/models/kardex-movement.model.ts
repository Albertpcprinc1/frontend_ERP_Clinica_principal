export interface KardexMovement {
  id: number;
  medicamentoId: number;
  medicamentoNombre: string;
  dciNombre: string;
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string;
  tipoMovimiento: string;
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  referenciaTipo: string;
  referenciaId: number;
  motivo: string;
  usuarioResponsable: string;
  fechaMovimiento: string;
}