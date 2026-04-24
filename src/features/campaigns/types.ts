// ─── Enums ───────────────────────────────────────────────────────────────────

export type CampaignType = "evergreen" | "estacional"

export type TipoOferta =
  | "escalonada"
  | "descuento"
  | "2x1"
  | "envio"
  | "financiacion"
  | "precio-plano"
  | "otra"

export type PieceEstado = "activa" | "reserva"

export type AutoMode = "quick" | "manual"

// ─── Piece ───────────────────────────────────────────────────────────────────

export interface Piece {
  id: string
  estado: PieceEstado
  subpaso: 1 | 2
  // Sub-paso 1: esencial
  modelo: string
  tipoPieza: string
  trafico: string
  angulo: string
  conciencia: string
  motivo: string
  narrativa: string
  // Sub-paso 2: formato y copy
  estructuraCopy: string
  formato: string
  duracion: string
  carruselSlides: number
  // Customs para valores fuera de lista
  _customs: Record<string, string>
}

// ─── AdSet ───────────────────────────────────────────────────────────────────

export interface AdSet {
  id: string
  nombre: string
  publico: string
  publicoCustom: string
  porcentaje: number
  piezas: Piece[]
}

// ─── Campaign (dentro del wizard, no confundir con Campaign de DB) ────────────

export interface CampanaWizard {
  id: string
  nombre: string
  conjuntos: AdSet[]
}

// ─── Modelo ──────────────────────────────────────────────────────────────────

export interface ModeloPrecio {
  antes: string
  ahora: string
}

// ─── Equipo ──────────────────────────────────────────────────────────────────

export interface MiembroEquipo {
  rol: string
  email: string
}

// ─── Wizard State ─────────────────────────────────────────────────────────────

export interface CampaignWizardState {
  currentStep: number

  // Paso 1
  empresa: string
  empresaId: string

  // Paso 2 · Brief
  tipoCampana: CampaignType | ""
  eventoEstacional: string
  eventoCustom: string
  nombreCampana: string
  contextoCampana: string
  objetivoCampana: string
  publicoObjetivo: string
  insightMensajeClave: string
  propuestasValor: string
  tonoYestilo: string
  llamadaAccion: string
  queNOhacer: string

  // Paso 3 · Oferta
  tipoOferta: TipoOferta | ""
  otraOferta: string
  contextoOferta: string
  ofertaMetodosPago: string
  ofertaRegalo: string
  ofertaGarantia: string
  ofertaCambios: string
  ofertaEnvio: string

  // Paso 4 · Modelos
  modelosSeleccionados: string[]
  modelosCustom: string[]
  preciosModelos: Record<string, ModeloPrecio>
  modelosDescripcion: Record<string, string>

  // Paso 5 · Estructura Meta
  objetivo: string
  tipoPresupuesto: "ABO" | "CBO"
  campanas: CampanaWizard[]
  autoMode: AutoMode
  autoCampanas: number
  autoConjuntos: number
  autoPiezasXConj: number
  autoPiezasCustom: number[]
  angulosPersonalizados: string[]
  narrativasCustom: string[]
  tiposPiezaCustom: string[]

  // Paso 6 · Presupuesto
  presupuestoModo: "diario" | "mensual"
  presupuestoValor: string
  fechaInicio: string
  fechaFin: string
  sinFechaFin: boolean

  // Paso 7 · Equipo
  equipo: MiembroEquipo[]

  // Control interno
  _avisoReservaMostrado: boolean
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string; isWarning?: boolean }
