import type { CampaignWizardState } from "../types"
import { formatMoney } from "./money"
import { OFERTA_LABEL_MAP } from "../constants/campaign-data"

function val(piezaVal: string, customVal?: string): string {
  if (piezaVal === "__custom__") return customVal || "(sin especificar)"
  return piezaVal || "(sin especificar)"
}

export function generarPromptMaestro(state: CampaignWizardState): string {
  const fecha = new Date().toLocaleDateString("es-CO")
  const tipoCamp = state.tipoCampana === "evergreen" ? "EVERGREEN" : "ESTACIONAL"
  const evento = state.eventoEstacional === "__custom__" ? state.eventoCustom : state.eventoEstacional

  const ofertaDesc =
    state.tipoOferta === "otra"
      ? state.otraOferta
      : OFERTA_LABEL_MAP[state.tipoOferta] || "No definida"

  // Contexto de evento especial (viene del nombre del evento, no hardcodeado)
  const contextoEspecial = ""

  // Detectar si hay videos
  let hayVideos = false
  state.campanas.forEach((c) =>
    c.conjuntos.forEach((cj) =>
      cj.piezas.forEach((p) => {
        const tp = val(p.tipoPieza, p._customs?.tipoPieza)
        if (tp.toLowerCase().includes("video")) hayVideos = true
      })
    )
  )

  // Productos con precios
  const modelosConPrecios = state.productosSeleccionados
    .map((m) => {
      const precio = state.preciosProductos[m] || {}
      const desc = state.productosDescripcion[m] || ""
      let linea = ""
      if (precio.antes || precio.ahora) {
        const antes = precio.antes ? `$${formatMoney(precio.antes)}` : ""
        const ahora = precio.ahora ? `$${formatMoney(precio.ahora)}` : ""
        if (antes && ahora) linea = `- ${m}: ${ahora} (antes ${antes})`
        else if (ahora) linea = `- ${m}: ${ahora}`
        else linea = `- ${m}: ${antes}`
      } else {
        linea = `- ${m}: (sin precio definido)`
      }
      if (desc.trim()) linea += `\n  · Descripción: ${desc.trim()}`
      return linea
    })
    .join("\n")

  let prompt = `# BRIEF DE CAMPAÑA · ${state.empresa.toUpperCase()}
# Generado: ${fecha}
# ═══════════════════════════════════════════════════════════

## 1 · IDENTIFICACIÓN
- Empresa: ${state.empresa}
- Campaña: ${state.nombreCampana}
- Tipo: ${tipoCamp}${evento ? ` · ${evento}` : ""}

## 2 · CONTEXTO DEL BRIEF
${state.empresaId
  ? `(Identidad de la empresa disponible en el contexto del sistema — tono, público base, propuestas de valor y restricciones ya incluidos.)`
  : ""}
- Contexto de la campaña: ${state.contextoCampana || "(No especificado)"}
- Objetivo de la campaña: ${state.objetivoCampana || "(No especificado)"}
- Público objetivo para esta campaña: ${state.publicoObjetivo || (state.empresaId ? "(usar perfil de empresa)" : "(No especificado)")}
- Insight / Mensaje clave: ${state.insightMensajeClave || "(No especificado)"}
- Llamada a la acción: ${state.llamadaAccion || "(No especificada)"}${
  !state.empresaId ? `
- Propuestas de valor de la marca: ${state.propuestasValor || "(No especificado)"}
- Tono y estilo: ${state.tonoYestilo || "(No especificado)"}
- Qué NO hacer: ${state.queNOhacer || "(No especificado)"}` : `${
  state.tonoYestilo ? `\n- Tono para esta campaña (override): ${state.tonoYestilo}` : ""
}${
  state.propuestasValor ? `\n- Propuestas de valor destacadas en esta campaña: ${state.propuestasValor}` : ""
}${
  state.queNOhacer ? `\n- Restricciones adicionales para esta campaña: ${state.queNOhacer}` : ""
}`
}

## 3 · OFERTA
- Tipo: ${ofertaDesc}
- Detalle de la oferta: ${state.contextoOferta || "(No especificado)"}
- Métodos de pago: ${state.ofertaMetodosPago || "(No especificado)"}
- Regalo incluido: ${state.ofertaRegalo || "(No aplica)"}
- Garantía: ${state.ofertaGarantia || "(No especificada)"}
- Cambios de producto: ${state.ofertaCambios || "(No especificados)"}
- Envío: ${state.ofertaEnvio || "(No especificado)"}
${contextoEspecial}
## 4 · PRODUCTOS DISPONIBLES CON PRECIOS
${modelosConPrecios}

## 5 · CONCEPTOS CREATIVOS SELECCIONADOS
${(() => {
    const seleccionados = (state.conceptos ?? []).filter(c => c.isSelected)
    if (seleccionados.length === 0) return "(Ningún concepto seleccionado — generación libre)"
    return seleccionados.map((c, i) =>
      `### Concepto ${i + 1}: ${c.nombre}\n- Hipótesis: ${c.hipotesis || "(sin hipótesis)"}\n- Ángulo: ${c.anguloMensajeria || "(sin ángulo)"}\n- Framework: ${c.frameworkCopy || "(sin framework)"}\n- Dirección visual: ${c.direccionVisual || "(sin dirección)"}`
    ).join("\n\n")
  })()}

INSTRUCCIÓN: Cada pieza DEBE alinearse con alguno de los conceptos seleccionados arriba. El concepto define el ángulo, el framework de copy y la dirección visual — el copy generado debe ser fiel a él.

## 6 · ESTRUCTURA META ADS
- Objetivo del brief: ${state.objetivo}
- Tipo de presupuesto: ${state.tipoPresupuesto} ${state.tipoPresupuesto === "ABO" ? "(presupuesto por conjunto — manual)" : "(presupuesto global — Meta optimiza)"}

`

  state.campanas.forEach((c, ci) => {
    prompt += `### CAMPAÑA ${ci + 1}: ${c.nombre}\n\n`
    c.conjuntos.forEach((conj, cji) => {
      const publicoFinal = conj.publico === "__custom__" ? conj.publicoCustom : conj.publico
      prompt += `#### CONJUNTO ${cji + 1}: ${conj.nombre}\n`
      prompt += `- Público: ${publicoFinal || "(no definido)"}\n`
      if (state.tipoPresupuesto === "ABO") prompt += `- % presupuesto: ${conj.porcentaje}%\n`
      prompt += `- Piezas: ${conj.piezas.length}\n\n`

      conj.piezas.forEach((p, pi) => {
        const cu = p._customs || {}
        const modeloFinal = val(p.producto, cu.producto)
        const precio = state.preciosProductos[modeloFinal]
        let precioStr = ""
        if (precio && (precio.antes || precio.ahora)) {
          if (precio.antes && precio.ahora)
            precioStr = ` · $${formatMoney(precio.ahora)} (antes $${formatMoney(precio.antes)})`
          else if (precio.ahora) precioStr = ` · $${formatMoney(precio.ahora)}`
          else precioStr = ` · $${formatMoney(precio.antes)}`
        }

        prompt += `##### PIEZA ${pi + 1} · ${p.id} · ${p.estado.toUpperCase()}\n`
        prompt += `- Modelo: ${modeloFinal}${precioStr}\n`
        prompt += `- Tipo de pieza: ${val(p.tipoPieza, cu.tipoPieza)}${p.tipoPieza === "Carrusel" ? ` (${p.carruselSlides} slides)` : ""}\n`
        prompt += `- Formato / medidas: ${val(p.formato, cu.formato)}\n`
        if (p.duracion) prompt += `- Duración sugerida: ${p.duracion}\n`
        prompt += `- Ángulo: ${val(p.angulo, cu.angulo)}\n`
        prompt += `- Tráfico: ${val(p.trafico, cu.trafico)}\n`
        prompt += `- Nivel conciencia: ${val(p.conciencia, cu.conciencia)}\n`
        prompt += `- Motivo: ${val(p.motivo, cu.motivo)}\n`
        prompt += `- Narrativa: ${val(p.narrativa, cu.narrativa)}\n`
        prompt += `- Estructura del copy: ${p.estructuraCopy || "(No especificada)"}\n\n`
      })
    })
  })

  prompt += `
## 7 · PRESUPUESTO
- Modo: ${state.presupuestoModo}
- Valor ${state.presupuestoModo}: $${formatMoney(state.presupuestoValor)} COP
- Fecha inicio: ${state.fechaInicio || "No definida"}
- Fecha fin: ${state.sinFechaFin ? "SIN FECHA FIN (evergreen)" : state.fechaFin || "No definida"}

# ═══════════════════════════════════════════════════════════
# INSTRUCCIONES PARA CLAUDE
# ═══════════════════════════════════════════════════════════

Actúas como el director creativo y copywriter senior de ${state.empresa}.

## FORMATO DE SALIDA: JSON ESTRUCTURADO

Devuelve EXCLUSIVAMENTE un objeto JSON válido. Cero texto antes o después del JSON.
El JSON debe ser parseable: sin comas trailing, sin comentarios, caracteres especiales correctamente escapados.

Estructura exacta:

{
  "resumen": {
    "objetivo": "<objetivo principal de la campaña en 1 oración clara>",
    "insight": "<el insight central que conecta con el público objetivo>",
    "estrategia": "<enfoque creativo global y por qué funcionará, 2-3 oraciones>",
    "totalPiezas": <número entero>,
    "totalCopys": <número entero — igual a totalPiezas>
  },
  "piezas": [
    {
      "id": "<ID exacto de la pieza del brief, ej: P-01-A-01>",
      "modelo": "<nombre del modelo/producto>",
      "tipoPieza": "<Video / Imagen / Carrusel>",
      "angulo": "<ángulo asignado en el brief>",
      "hookTipo": "<tipo de hook seleccionado de la lista>",
      "hookApertura": "<las primeras palabras exactas del hook — lo que abre la pieza>",
      "framework": "<PAS / AIDA / FAB / BAB / Storytelling>",
      "registroVoz": "<Juvenil Gen Z / Coloquial colombiano / Formal-cálido / Neutro informativo / Emotivo directo / Cómplice>",
      "primaryText": "<copy completo y real del Primary Text para Meta Ads, listo para publicar — máximo 125 caracteres óptimo>",
      "headline": "<headline principal, máximo 40 caracteres, gancho en primeras 3 palabras>",
      "descripcion": "<descripción del ad, máximo 30 caracteres>",
      "varianteB_primaryText": "<segunda variante de primary text con distinto ángulo o registro de voz — máximo 125 caracteres>",
      "varianteB_headline": "<headline alternativo, máximo 40 caracteres>",
      "guionResumen": "<para video: guión condensado en 3-4 líneas con tiempos (HOOK 0-5s / Desarrollo / CTA). Para imagen/carrusel: brief visual de lo que debe verse>",
      "imageBrief": "<prompt de generación de imagen/video: composición, colores hex, mood, metáfora visual, safe zones (máx 80 palabras, sin texto ni nombres de fuentes)>",
      "justificacion": "<por qué este ángulo, hook y framework son los correctos para esta pieza específica, 1-2 oraciones>"
    }
  ]
}

# ═══════════════════════════════════════════════════════════
# MÓDULO DE REDACCIÓN PROFESIONAL
# ═══════════════════════════════════════════════════════════

## REGLA ESTRUCTURAL OBLIGATORIA

Cada pieza: DOS bloques separados:
1. GUION (video/imagen/carrusel)
2. COPY DEL AD (Primary Text, Headlines, Descripción, CTA)

Ambos siguen la misma estructura (PAS/AIDA/FAB/BAB/4U/Storytelling).

Referencia:
- PAS: Problema → Agitación → Solución + CTA
- AIDA: Atención → Interés → Deseo → Acción
- FAB: Features → Advantages → Benefits
- BAB: Before → After → Bridge
- 4U: Útil + Urgente + Único + Específico
- Storytelling: Personaje + conflicto + transformación + CTA
- Star-Story-Solution: Presenta al protagonista (Star) → Narra el conflicto (Story) → Revela la solución (Solution) + CTA

## DIVERSIFICACIÓN DE REGISTROS DE VOZ

NO redactar todas las piezas con el mismo registro. Si hay 4+ piezas, asignar al menos 3 registros distintos:
- Juvenil (18-30)
- Coloquial cálido (30-50)
- Formal-cálido (35-60)
- Neutro informativo
- Emotivo directo
- Cómplice/cercano

El registro exacto y el dialecto regional se define en el perfil de tono de la empresa.

## REGLAS LEGALES Y ÉTICAS

Las restricciones específicas de la industria vienen del perfil de la empresa (system prompt).
Reglas universales:
- No mencionar marcas competidoras
- No inventar cifras, reviews ni testimonios
- No hacer promesas absolutas sin respaldo
- No denigrar al comprador

## DIVERSIDAD OBLIGATORIA ENTRE PIEZAS

PROHIBIDO: Repetir hooks, frases de cierre, CTAs literales, estructura de apertura entre piezas.

## DURACIÓN DE VIDEOS
${
  hayVideos
    ? `Los videos varían entre 15-60s según lo indicado en cada pieza:
- 15-20s: Óptima para feed y Reels
- 21-30s: Público frío que necesita contexto
- 31-45s: Solo si narrativa lo justifica
- 46-60s: Casos específicos (storytelling profundo)

Principios:
- Hook: máximo primer tercio
- Re-enganche cada 7-10s
- Precio visible antes del 50% del tiempo
- CTA en el último 20%
- Último frame estático con logo + CTA + oferta`
    : "(No hay piezas de video en este brief)"
}

## TIPOS DE HOOK (elegir según ángulo y público)
1. Hook de producto · 2. Hook de problema · 3. Hook de pregunta directa
4. Hook de declaración polémica · 5. Hook de estadística (solo verificable)
6. Hook de escena cotidiana · 7. Hook de resultado/transformación primero
8. Hook de testimonio inmediato (UGC) · 9. Hook de contraste visual
10. Hook de celebridad/referente · 11. Hook de pattern interrupt
12. Hook de confesión/vulnerabilidad (UGC) · 13. Hook de lista numerada
14. Hook de urgencia temporal · 15. Hook de objeción anticipada

## 12 VERIFICACIONES FINALES POR PIEZA
☐ Estructura declarada se cumple en guion Y copy
☐ Registro de voz distinto de piezas previas
☐ Sin palabras prohibidas
☐ Sin mencionar competidores
☐ Cifras verificables
☐ Precio real del cliente
☐ Tiempos matizados
☐ CTA corresponde al objetivo
☐ Headlines ≤40 caracteres
☐ Modismos coinciden con edad target
☐ Ángulo en primeros segundos
☐ Hook declarado y justificado

## PRINCIPIOS GENERALES
- Una pieza = una idea
- Mostrar, no contar
- Producto protagonista en Ventas
- Especificidad vende
- El registro de voz específico del mercado viene del tono de la empresa (system prompt)
- Cada pieza sobrevive sola

IMPORTANTE: El primaryText y guionResumen deben ser contenido REAL y completo — no placeholders ni ejemplos.
El JSON debe cubrir TODAS las piezas listadas en el brief.

Empieza el JSON ahora.
`

  return prompt
}
