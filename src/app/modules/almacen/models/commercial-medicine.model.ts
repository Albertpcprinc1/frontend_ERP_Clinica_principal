export interface CommercialMedicine {
  id: number;
  nombreComercial: string;
  dciId?: number | null;
  dciNombre?: string | null;
  registroSanitario?: string | null;
  concentracion?: string | null;
  formaFarmaceutica?: string | null;
  presentacionComercial?: string | null;
  unidadMedidaId?: number | null;
  unidadMedidaCodigo?: string | null;
  unidadMedidaNombre?: string | null;
  unidadPresentacion?: string | null;
  factorConversionUnidadBase?: number | null;
  activo?: boolean;
}