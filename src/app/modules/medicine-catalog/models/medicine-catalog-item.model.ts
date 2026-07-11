export interface MedicineCatalogItem {
  medicamentoId: number;
  nombreComercial: string;
  dciNombre: string;
  laboratorioNombre: string;
  concentracion: string | null;
  formaFarmaceutica: string | null;
  presentacionComercial: string | null;
  unidadPresentacion: string | null;
  factorConversionUnidadBase: number | null;
  registroSanitario: string | null;
  stockTotalDisponible: number;
  totalLotesActivos: number;
  activo: boolean;
}

export interface MedicineFormDraft {
  dciId: number | null;
  categoriaId: number | null;
  laboratorioId: number | null;
  unidadMedidaId: number | null;
  nombreComercial: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacionComercial: string;
  unidadPresentacion: string;
  factorConversionUnidadBase: number | null;
  registroSanitario: string;
  esGenerico: boolean;
  requiereReceta: boolean;
  requiereRecetaArchivada: boolean;
  precioPublico: number | null;
  precioAseguradora: number | null;
  stockMinimoTotal: number | null;
  observaciones: string;
}

export interface MedicineCreateRequest {
  dciId: number;
  categoriaId: number | null;
  laboratorioId: number | null;
  unidadMedidaId: number | null;
  nombreComercial: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacionComercial: string;
  unidadPresentacion: string;
  factorConversionUnidadBase: number;
  registroSanitario: string;
  esGenerico: boolean;
  requiereReceta: boolean;
  requiereRecetaArchivada: boolean;
  precioPublico: number | null;
  precioAseguradora: number | null;
  stockMinimoTotal: number | null;
  observaciones: string | null;
}

export interface DciOption {
  id: number;
  nombreGenerico: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CatalogOption {
  id: number;
  codigo?: string;
  nombre: string;
  descripcion?: string | null;
}

export interface LaboratoryOption {
  id: number;
  nombre: string;
  ruc?: string | null;
  activo?: boolean;
}

export interface MedicineFormOptions {
  dci: DciOption[];
  categories: CatalogOption[];
  units: CatalogOption[];
  laboratories: LaboratoryOption[];
}