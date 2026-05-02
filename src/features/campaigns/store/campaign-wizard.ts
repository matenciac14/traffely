import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { CampaignWizardState, Piece, AdSet, CampanaWizard, TipoOferta, AutoMode, ConceptoWizard } from "../types"
import { EQUIPO_DEFAULT } from "../constants/campaign-data"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nanoid(prefix = "P") {
  return prefix + Math.random().toString(36).substring(2, 7).toUpperCase()
}

export function newPieza(estado: "activa" | "reserva" = "activa", producto = ""): Piece {
  return {
    id: nanoid("P"),
    estado,
    subpaso: 1,
    producto,
    tipoPieza: "",
    formato: "",
    carruselSlides: 5,
    angulo: "",
    trafico: "",
    conciencia: "",
    motivo: "",
    narrativa: "",
    estructuraCopy: "",
    duracion: "",
    _customs: {},
  }
}

export function newConjunto(nombre = "", porcentaje = 33): AdSet {
  return {
    id: nanoid("C"),
    nombre,
    publico: "",
    publicoCustom: "",
    porcentaje,
    piezas: [],
  }
}

export function newCampana(nombre = ""): CampanaWizard {
  return {
    id: nanoid("CA"),
    nombre,
    conjuntos: [newConjunto("Conjunto 1")],
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_STATE: CampaignWizardState = {
  currentStep: 1,
  empresa: "",
  empresaId: "",
  empresaIndustria: "",
  tipoProducto: "",
  tipoCampana: "",
  eventoEstacional: "",
  eventoCustom: "",
  nombreCampana: "",
  contextoCampana: "",
  objetivoCampana: "",
  publicoObjetivo: "",
  insightMensajeClave: "",
  propuestasValor: "",
  tonoYestilo: "",
  llamadaAccion: "",
  queNOhacer: "",
  tipoOferta: "",
  otraOferta: "",
  contextoOferta: "",
  ofertaMetodosPago: "",
  ofertaRegalo: "",
  ofertaGarantia: "",
  ofertaCambios: "",
  ofertaEnvio: "",
  productosSeleccionados: [],
  productosCustom: [],
  preciosProductos: {},
  productosDescripcion: {},
  objetivo: "",
  tipoPresupuesto: "ABO",
  campanas: [],
  autoMode: "quick",
  autoCampanas: 1,
  autoConjuntos: 3,
  autoPiezasXConj: 5,
  autoPiezasCustom: [5, 5, 5],
  angulosPersonalizados: [],
  narrativasCustom: [],
  tiposPiezaCustom: [],
  presupuestoModo: "mensual",
  presupuestoValor: "",
  fechaInicio: "",
  fechaFin: "",
  sinFechaFin: false,
  conceptos: [],
  equipo: EQUIPO_DEFAULT,
  _avisoReservaMostrado: false,
}

// ─── Store Actions ────────────────────────────────────────────────────────────

interface CampaignWizardActions {
  // Navigation
  goNext: () => { ok: true } | { ok: false; error: string; isWarning?: boolean }
  goBack: () => void
  setStep: (step: number) => void
  reset: () => void
  loadFromJson: (data: Partial<CampaignWizardState>) => void

  // Step 1
  setEmpresa: (v: string) => void

  // Step 2
  setTipoCampana: (tipo: "evergreen" | "estacional") => void
  seleccionarEvento: (ev: string) => void
  setField: <K extends keyof CampaignWizardState>(key: K, value: CampaignWizardState[K]) => void

  // Step 3
  setTipoOferta: (tipo: TipoOferta) => void
  cambiarTipoOferta: () => void
  appendOfertaField: (field: keyof CampaignWizardState, value: string) => void

  // Step 4
  toggleProducto: (nombre: string) => void
  updatePrecio: (producto: string, tipo: "antes" | "ahora", valor: string) => void
  updateProductoDesc: (producto: string, valor: string) => void
  agregarProductoCustom: (nombre: string) => void
  eliminarProductoCustom: (nombre: string) => void

  // Step 5 · Asistente
  setAutoMode: (mode: AutoMode) => void
  autoStep: (tipo: "camp" | "conj" | "pieza", delta: number) => void
  autoCustomStep: (idx: number, delta: number) => void
  crearEstructuraAuto: () => void
  resetCampanas: () => void

  // Step 5 · Campañas
  agregarCampana: () => void
  eliminarCampana: (ci: number) => void
  updateCampanaNombre: (ci: number, nombre: string) => void
  agregarConjunto: (ci: number) => void
  eliminarConjunto: (ci: number, cji: number) => void
  updateConjunto: (ci: number, cji: number, data: Partial<AdSet>) => void
  agregarPieza: (ci: number, cji: number, estado: "activa" | "reserva") => void
  eliminarPieza: (ci: number, cji: number, pi: number) => void
  updatePiezaField: (ci: number, cji: number, pi: number, field: keyof Piece, value: unknown) => void
  setSubpaso: (ci: number, cji: number, pi: number, n: 1 | 2) => void
  duplicarPiezas: (ci: number) => void

  // Step 3 · Conceptos
  setConceptos: (conceptos: ConceptoWizard[]) => void
  toggleConcepto: (id: string) => void

  // Step 7 (now Step 8)
  agregarPersona: () => void
  eliminarPersona: (i: number) => void
  updatePersona: (i: number, field: "rol" | "email", value: string) => void

  // Computed helpers
  getAllProductos: () => string[]
  getTotalPiezas: () => number
}

// ─── Store ────────────────────────────────────────────────────────────────────

import { validarPaso } from "../lib/validators"

export const useCampaignWizard = create<CampaignWizardState & CampaignWizardActions>()(
  devtools(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Navigation ──────────────────────────────────────────────────────────

      goNext: () => {
        const state = get()
        const result = validarPaso(state, state.currentStep)
        if (!result.ok) return result
        set((s) => ({ currentStep: s.currentStep + 1, _avisoReservaMostrado: false }))
        return { ok: true }
      },

      goBack: () =>
        set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),

      setStep: (step) => set({ currentStep: step }),

      reset: () => set(INITIAL_STATE),

      loadFromJson: (data) => set((s) => ({ ...s, ...data })),

      // ── Step 1 ──────────────────────────────────────────────────────────────

      setEmpresa: (v) => set({ empresa: v }),

      // ── Step 2 ──────────────────────────────────────────────────────────────

      setTipoCampana: (tipo) =>
        set({
          tipoCampana: tipo,
          eventoEstacional: tipo === "evergreen" ? "" : get().eventoEstacional,
          eventoCustom: tipo === "evergreen" ? "" : get().eventoCustom,
        }),

      seleccionarEvento: (ev) =>
        set({
          eventoEstacional: ev,
          eventoCustom: ev === "__custom__" ? "" : get().eventoCustom,
          nombreCampana: ev === "__custom__" ? "" : ev !== "" ? ev : get().nombreCampana,
        }),

      setField: (key, value) => set({ [key]: value } as unknown as Partial<CampaignWizardState>),

      // ── Step 3 · Conceptos ──────────────────────────────────────────────────

      setConceptos: (conceptos) => set({ conceptos }),

      toggleConcepto: (id) =>
        set((s) => ({
          conceptos: s.conceptos.map((c) => (c.id === id ? { ...c, isSelected: !c.isSelected } : c)),
        })),

      // ── Step 4 · Oferta ─────────────────────────────────────────────────────

      setTipoOferta: (tipo) => set({ tipoOferta: tipo }),

      cambiarTipoOferta: () => set({ tipoOferta: "", otraOferta: "" }),

      appendOfertaField: (field, value) =>
        set((s) => {
          const cur = (s[field] as string) || ""
          return { [field]: cur ? `${cur}, ${value}` : value } as unknown as Partial<CampaignWizardState>
        }),

      // ── Step 4 ──────────────────────────────────────────────────────────────

      toggleProducto: (nombre) =>
        set((s) => {
          const idx = s.productosSeleccionados.indexOf(nombre)
          if (idx >= 0) {
            const next = [...s.productosSeleccionados]
            next.splice(idx, 1)
            const precios = { ...s.preciosProductos }
            const descs = { ...s.productosDescripcion }
            delete precios[nombre]
            delete descs[nombre]
            return { productosSeleccionados: next, preciosProductos: precios, productosDescripcion: descs }
          }
          return {
            productosSeleccionados: [...s.productosSeleccionados, nombre],
            preciosProductos: { ...s.preciosProductos, [nombre]: { antes: "", ahora: "" } },
          }
        }),

      updatePrecio: (producto, tipo, valor) =>
        set((s) => ({
          preciosProductos: {
            ...s.preciosProductos,
            [producto]: { ...(s.preciosProductos[producto] || { antes: "", ahora: "" }), [tipo]: valor },
          },
        })),

      updateProductoDesc: (producto, valor) =>
        set((s) => ({ productosDescripcion: { ...s.productosDescripcion, [producto]: valor } })),

      agregarProductoCustom: (nombre) =>
        set((s) => ({
          productosCustom: [...s.productosCustom, nombre],
          productosSeleccionados: [...s.productosSeleccionados, nombre],
          preciosProductos: { ...s.preciosProductos, [nombre]: { antes: "", ahora: "" } },
        })),

      eliminarProductoCustom: (nombre) =>
        set((s) => {
          const precios = { ...s.preciosProductos }
          const desc = { ...s.productosDescripcion }
          delete precios[nombre]
          delete desc[nombre]
          return {
            productosCustom: s.productosCustom.filter((m) => m !== nombre),
            productosSeleccionados: s.productosSeleccionados.filter((m) => m !== nombre),
            preciosProductos: precios,
            productosDescripcion: desc,
          }
        }),

      // ── Step 5 · Asistente ──────────────────────────────────────────────────

      setAutoMode: (mode) => set({ autoMode: mode, campanas: [] }),

      autoStep: (tipo, delta) =>
        set((s) => {
          if (tipo === "camp") return { autoCampanas: Math.max(1, Math.min(5, s.autoCampanas + delta)) }
          if (tipo === "conj") return { autoConjuntos: Math.max(1, Math.min(8, s.autoConjuntos + delta)) }
          return { autoPiezasXConj: Math.max(1, Math.min(12, s.autoPiezasXConj + delta)) }
        }),

      autoCustomStep: (idx, delta) =>
        set((s) => {
          const next = [...s.autoPiezasCustom]
          next[idx] = Math.max(1, Math.min(12, (next[idx] || 1) + delta))
          return { autoPiezasCustom: next }
        }),

      crearEstructuraAuto: () =>
        set((s) => {
          const { autoMode, autoCampanas, autoConjuntos, autoPiezasXConj, autoPiezasCustom, nombreCampana, tipoPresupuesto, productosSeleccionados, productosCustom } = s
          const allProductos = [...productosSeleccionados, ...productosCustom]
          const defaultProducto = allProductos.length === 1 ? allProductos[0] : ""
          const baseName = nombreCampana || "Campaña"
          const campanas: CampanaWizard[] = []

          for (let ci = 0; ci < autoCampanas; ci++) {
            const nombre = autoCampanas === 1 ? baseName : `${baseName} ${ci + 1}`
            const conjuntos: AdSet[] = []

            for (let cji = 0; cji < autoConjuntos; cji++) {
              const nPiezas = autoMode === "quick" ? autoPiezasXConj : (autoPiezasCustom[cji] || 1)
              const conj = newConjunto(`Conjunto ${cji + 1}`)
              for (let pi = 0; pi < nPiezas; pi++) {
                conj.piezas.push(newPieza("activa", defaultProducto))
              }
              conjuntos.push(conj)
            }
            campanas.push({ id: nanoid("CA"), nombre, conjuntos })
          }

          // Distribuir % si ABO
          if (tipoPresupuesto === "ABO") {
            campanas.forEach((c) => {
              const n = c.conjuntos.length
              const base = Math.floor(100 / n)
              const resto = 100 - base * n
              c.conjuntos.forEach((cj, i) => { cj.porcentaje = base + (i === 0 ? resto : 0) })
            })
          }

          return { campanas }
        }),

      resetCampanas: () => set({ campanas: [] }),

      // ── Step 5 · Campañas ───────────────────────────────────────────────────

      agregarCampana: () =>
        set((s) => ({ campanas: [...s.campanas, newCampana(`Campaña ${s.campanas.length + 1}`)] })),

      eliminarCampana: (ci) =>
        set((s) => ({ campanas: s.campanas.filter((_, i) => i !== ci) })),

      updateCampanaNombre: (ci, nombre) =>
        set((s) => {
          const next = [...s.campanas]
          next[ci] = { ...next[ci], nombre }
          return { campanas: next }
        }),

      agregarConjunto: (ci) =>
        set((s) => {
          const next = [...s.campanas]
          const total = next[ci].conjuntos.length + 1
          next[ci] = { ...next[ci], conjuntos: [...next[ci].conjuntos, newConjunto(`Conjunto ${total}`)] }
          return { campanas: next }
        }),

      eliminarConjunto: (ci, cji) =>
        set((s) => {
          const next = [...s.campanas]
          next[ci] = { ...next[ci], conjuntos: next[ci].conjuntos.filter((_, i) => i !== cji) }
          return { campanas: next }
        }),

      updateConjunto: (ci, cji, data) =>
        set((s) => {
          const next = [...s.campanas]
          const conjs = [...next[ci].conjuntos]
          conjs[cji] = { ...conjs[cji], ...data }
          next[ci] = { ...next[ci], conjuntos: conjs }
          return { campanas: next }
        }),

      agregarPieza: (ci, cji, estado) =>
        set((s) => {
          const allProductos = [...s.productosSeleccionados, ...s.productosCustom]
          const defaultProducto = allProductos.length === 1 ? allProductos[0] : ""
          const next = [...s.campanas]
          const conjs = [...next[ci].conjuntos]
          conjs[cji] = { ...conjs[cji], piezas: [...conjs[cji].piezas, newPieza(estado, defaultProducto)] }
          next[ci] = { ...next[ci], conjuntos: conjs }
          return { campanas: next }
        }),

      eliminarPieza: (ci, cji, pi) =>
        set((s) => {
          const next = [...s.campanas]
          const conjs = [...next[ci].conjuntos]
          conjs[cji] = { ...conjs[cji], piezas: conjs[cji].piezas.filter((_, i) => i !== pi) }
          next[ci] = { ...next[ci], conjuntos: conjs }
          return { campanas: next }
        }),

      updatePiezaField: (ci, cji, pi, field, value) =>
        set((s) => {
          const next = [...s.campanas]
          const conjs = [...next[ci].conjuntos]
          const piezas = [...conjs[cji].piezas]
          piezas[pi] = { ...piezas[pi], [field]: value }
          conjs[cji] = { ...conjs[cji], piezas }
          next[ci] = { ...next[ci], conjuntos: conjs }
          return { campanas: next }
        }),

      setSubpaso: (ci, cji, pi, n) =>
        set((s) => {
          const next = [...s.campanas]
          const conjs = [...next[ci].conjuntos]
          const piezas = [...conjs[cji].piezas]
          piezas[pi] = { ...piezas[pi], subpaso: n }
          conjs[cji] = { ...conjs[cji], piezas }
          next[ci] = { ...next[ci], conjuntos: conjs }
          return { campanas: next }
        }),

      duplicarPiezas: (ci) =>
        set((s) => {
          const camp = s.campanas[ci]
          if (!camp?.conjuntos[0]?.piezas.length) return {}
          const base = camp.conjuntos[0].piezas
          const next = [...s.campanas]
          next[ci] = {
            ...camp,
            conjuntos: camp.conjuntos.map((cj, i) =>
              i === 0 ? cj : { ...cj, piezas: base.map((p) => ({ ...p, id: nanoid("P"), _customs: { ...p._customs } })) }
            ),
          }
          return { campanas: next }
        }),

      // ── Step 7 ──────────────────────────────────────────────────────────────

      agregarPersona: () =>
        set((s) => ({ equipo: [...s.equipo, { rol: "", email: "" }] })),

      eliminarPersona: (i) =>
        set((s) => ({ equipo: s.equipo.filter((_, idx) => idx !== i) })),

      updatePersona: (i, field, value) =>
        set((s) => {
          const next = [...s.equipo]
          next[i] = { ...next[i], [field]: value }
          return { equipo: next }
        }),

      // ── Computed ────────────────────────────────────────────────────────────

      getAllProductos: () => {
        const s = get()
        return [...s.productosCustom]
      },

      getTotalPiezas: () => {
        const s = get()
        return s.campanas.reduce((a, c) => a + c.conjuntos.reduce((b, cj) => b + cj.piezas.length, 0), 0)
      },
    }),
    { name: "campaign-wizard" }
  )
)
