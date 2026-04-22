import type { CampaignWizardState, ValidationResult } from "../types"

export function validarPaso(state: CampaignWizardState, paso: number): ValidationResult {
  switch (paso) {
    case 1:
      if (!state.empresa.trim()) return { ok: false, error: "Ingresa el nombre de la empresa" }
      break

    case 2:
      if (!state.tipoCampana) return { ok: false, error: "Selecciona evergreen o estacional" }
      if (state.tipoCampana === "estacional") {
        if (!state.eventoEstacional) return { ok: false, error: "Selecciona un evento estacional" }
        if (state.eventoEstacional === "__custom__" && !state.eventoCustom.trim())
          return { ok: false, error: "Escribe el nombre del evento custom" }
      }
      if (!state.nombreCampana.trim()) return { ok: false, error: "Ingresa el nombre de la campaña" }
      break

    case 3:
      if (!state.tipoOferta) return { ok: false, error: "Selecciona un tipo de oferta" }
      if (!state.contextoOferta.trim()) return { ok: false, error: "Detalla tu oferta" }
      break

    case 4:
      if (state.modelosSeleccionados.length === 0) return { ok: false, error: "Selecciona al menos un modelo" }
      break

    case 5: {
      if (!state.objetivo) return { ok: false, error: "Selecciona el objetivo de la campaña" }
      if (!state.tipoPresupuesto) return { ok: false, error: "Selecciona ABO o CBO" }

      const totalPiezas = state.campanas.reduce(
        (a, c) => a + c.conjuntos.reduce((b, cj) => b + cj.piezas.length, 0),
        0
      )
      if (totalPiezas === 0) return { ok: false, error: "Crea la estructura o agrega al menos una pieza" }

      // Validar % ABO suma 100
      if (state.tipoPresupuesto === "ABO") {
        for (let ci = 0; ci < state.campanas.length; ci++) {
          const suma = state.campanas[ci].conjuntos.reduce((a, cj) => a + (parseInt(String(cj.porcentaje)) || 0), 0)
          if (suma !== 100)
            return {
              ok: false,
              error: `El % del presupuesto de la Campaña ${ci + 1} suma ${suma}% — debe sumar 100%`,
            }
        }
      }

      // Validar público por conjunto
      for (let ci = 0; ci < state.campanas.length; ci++) {
        for (let cji = 0; cji < state.campanas[ci].conjuntos.length; cji++) {
          const cj = state.campanas[ci].conjuntos[cji]
          if (!cj.publico)
            return { ok: false, error: `Falta público en Campaña ${ci + 1} · Conjunto ${cji + 1}` }
          if (cj.publico === "__custom__" && !cj.publicoCustom.trim())
            return { ok: false, error: `Escribe el público custom de Campaña ${ci + 1} · Conjunto ${cji + 1}` }
        }
      }

      // Validar todos los campos de cada pieza
      for (let ci = 0; ci < state.campanas.length; ci++) {
        for (let cji = 0; cji < state.campanas[ci].conjuntos.length; cji++) {
          for (let pi = 0; pi < state.campanas[ci].conjuntos[cji].piezas.length; pi++) {
            const p = state.campanas[ci].conjuntos[cji].piezas[pi]
            const faltantes: string[] = []
            if (!p.modelo) faltantes.push("modelo")
            if (!p.tipoPieza) faltantes.push("tipo de pieza")
            if (!p.trafico) faltantes.push("tráfico")
            if (!p.angulo) faltantes.push("ángulo")
            if (!p.conciencia) faltantes.push("conciencia")
            if (!p.motivo) faltantes.push("motivo")
            if (!p.narrativa) faltantes.push("narrativa")
            if (!p.estructuraCopy) faltantes.push("estructura de copy")
            if (!p.formato) faltantes.push("formato")
            const esVideo = p.tipoPieza?.toLowerCase().includes("video")
            if (esVideo && !p.duracion) faltantes.push("duración")

            if (faltantes.length > 0)
              return {
                ok: false,
                error: `Campaña ${ci + 1} · Conjunto ${cji + 1} · Pieza ${pi + 1} incompleta — falta: ${faltantes.join(", ")}`,
              }
          }
        }
      }

      // Aviso de reserva (no bloquea)
      if (!state._avisoReservaMostrado) {
        for (let ci = 0; ci < state.campanas.length; ci++) {
          for (let cji = 0; cji < state.campanas[ci].conjuntos.length; cji++) {
            const hayReserva = state.campanas[ci].conjuntos[cji].piezas.some((p) => p.estado === "reserva")
            if (!hayReserva) {
              return {
                ok: false,
                error: `Campaña ${ci + 1} · Conjunto ${cji + 1} no tiene pieza de reserva. Se recomienda al menos 1.\n\nToca "Continuar" de nuevo para avanzar de todos modos.`,
                isWarning: true,
              }
            }
          }
        }
      }
      break
    }

    case 6:
      if (!state.presupuestoValor) return { ok: false, error: "Ingresa el presupuesto" }
      if (!state.fechaInicio) return { ok: false, error: "Ingresa la fecha de inicio" }
      if (!state.sinFechaFin && !state.fechaFin)
        return { ok: false, error: "Ingresa la fecha de fin o marca evergreen" }
      break

    case 7:
      // Paso informativo, sin validación obligatoria
      break
  }

  return { ok: true }
}
