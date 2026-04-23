"use client"

import { useEffect, useRef, useState } from "react"
import { useCampaignWizard } from "../store/campaign-wizard"
import { EQUIPO_DEFAULT } from "../constants/campaign-data"
import type { CampaignWizardState } from "../types"

const LS_KEY = "traffely_wizard_draft"
const LS_DRAFT_ID_KEY = "traffely_wizard_draft_id"
const AUTOSAVE_DELAY = 2000 // ms

// Reconstructs wizard state from the DB campaign JSON fields
function campaignToWizardState(campaign: Record<string, unknown>): Partial<CampaignWizardState> {
  const brief = campaign.brief as Record<string, string> | null
  const oferta = campaign.oferta as Record<string, string> | null
  const modelos = campaign.modelos as Record<string, unknown> | null
  const estructura = campaign.estructura as Record<string, unknown> | null
  const presupuesto = campaign.presupuesto as Record<string, unknown> | null

  return {
    currentStep: Math.min((campaign.currentStep as number) ?? 1, 7),
    nombreCampana: (campaign.name as string) ?? "",
    tipoCampana: campaign.tipo === "EVERGREEN" ? "evergreen" : "estacional",
    eventoEstacional: (campaign.eventoEstacional as string) ?? "",
    // Brief (step 2)
    contextoCampana: brief?.contextoCampana ?? "",
    objetivoCampana: brief?.objetivoCampana ?? "",
    publicoObjetivo: brief?.publicoObjetivo ?? "",
    insightMensajeClave: brief?.insightMensajeClave ?? "",
    propuestasValor: brief?.propuestasValor ?? "",
    tonoYestilo: brief?.tonoYestilo ?? "",
    llamadaAccion: brief?.llamadaAccion ?? "",
    queNOhacer: brief?.queNOhacer ?? "",
    // Oferta (step 3)
    tipoOferta: (oferta?.tipoOferta ?? "") as CampaignWizardState["tipoOferta"],
    otraOferta: oferta?.otraOferta ?? "",
    contextoOferta: oferta?.contextoOferta ?? "",
    ofertaMetodosPago: oferta?.metodosPago ?? "",
    ofertaRegalo: oferta?.regalo ?? "",
    ofertaGarantia: oferta?.garantia ?? "",
    ofertaCambios: oferta?.cambios ?? "",
    ofertaEnvio: oferta?.envio ?? "",
    // Modelos (step 4)
    modelosSeleccionados: (modelos?.seleccionados as string[]) ?? [],
    modelosCustom: (modelos?.custom as string[]) ?? [],
    preciosModelos: (modelos?.precios as CampaignWizardState["preciosModelos"]) ?? {},
    modelosDescripcion: (modelos?.descripcion as CampaignWizardState["modelosDescripcion"]) ?? {},
    // Estructura (step 5)
    objetivo: (estructura?.objetivo as string) ?? "",
    tipoPresupuesto: ((estructura?.tipoPresupuesto as string) ?? "ABO") as CampaignWizardState["tipoPresupuesto"],
    campanas: (estructura?.campanas as CampaignWizardState["campanas"]) ?? [],
    // Presupuesto (step 6)
    presupuestoModo: ((presupuesto?.modo as string) ?? "mensual") as CampaignWizardState["presupuestoModo"],
    presupuestoValor: (presupuesto?.valor as string) ?? "",
    fechaInicio: (presupuesto?.fechaInicio as string) ?? "",
    fechaFin: (presupuesto?.fechaFin as string) ?? "",
    sinFechaFin: (presupuesto?.sinFechaFin as boolean) ?? false,
    // Equipo (step 7)
    equipo: (campaign.equipo as CampaignWizardState["equipo"]) ?? EQUIPO_DEFAULT,
  }
}

export function useWizardDraft(resumeId?: string | null) {
  const store = useCampaignWizard()
  const { loadFromJson } = store
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  // On mount: if resumeId, load from DB. Otherwise restore from localStorage.
  useEffect(() => {
    if (resumeId) {
      // Resume an existing campaign — load from DB
      fetch(`/api/campaigns/${resumeId}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: Record<string, unknown> | null) => {
          if (data) {
            const wizardState = campaignToWizardState(data)
            loadFromJson(wizardState)
            setDraftId(resumeId)
            localStorage.setItem(LS_DRAFT_ID_KEY, resumeId)
            // Clear old localStorage draft to avoid conflicts
            localStorage.removeItem(LS_KEY)
            setDraftRestored(true)
          }
        })
        .catch(() => {/* fallback to empty wizard */})
        .finally(() => { initialized.current = true })
      return
    }

    // Normal flow: restore from localStorage
    try {
      const raw = localStorage.getItem(LS_KEY)
      const existingDraftId = localStorage.getItem(LS_DRAFT_ID_KEY)

      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.empresa || saved.nombreCampana) {
          // Clamp currentStep to valid wizard range (1–7)
          // A saved step > 7 means the wizard was already completed
          if (saved.currentStep > 7) saved.currentStep = 1
          loadFromJson(saved)
          setDraftRestored(true)
        }
      }

      if (existingDraftId) {
        setDraftId(existingDraftId)
      } else {
        // Create a new draft in DB
        fetch("/api/campaigns", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: store.nombreCampana || "Borrador" }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.id) {
              setDraftId(data.id)
              localStorage.setItem(LS_DRAFT_ID_KEY, data.id)
            }
          })
          .catch(() => {/* offline or auth issue */})
      }
    } catch {
      localStorage.removeItem(LS_KEY)
      localStorage.removeItem(LS_DRAFT_ID_KEY)
    }

    initialized.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave to localStorage on every state change (debounced 2s)
  // Then also sync to DB every 5s
  useEffect(() => {
    if (!initialized.current) return

    // localStorage save
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        const snapshot = Object.fromEntries(
          Object.entries(store).filter(([, v]) => typeof v !== "function")
        )
        localStorage.setItem(LS_KEY, JSON.stringify(snapshot))
      } catch { /* storage full */ }
    }, AUTOSAVE_DELAY)

    // DB sync (slower)
    if (dbDebounceRef.current) clearTimeout(dbDebounceRef.current)
    dbDebounceRef.current = setTimeout(() => {
      const id = draftId || localStorage.getItem(LS_DRAFT_ID_KEY)
      if (!id) return
      fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autosave", wizardState: store }),
      }).catch(() => {/* ignore network errors */})
    }, 5000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (dbDebounceRef.current) clearTimeout(dbDebounceRef.current)
    }
  })

  function clearDraft() {
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(LS_DRAFT_ID_KEY)
    setDraftRestored(false)
    setDraftId(null)
  }

  function dismissRestoredBanner() {
    setDraftRestored(false)
  }

  return { draftRestored, draftId, clearDraft, dismissRestoredBanner }
}
