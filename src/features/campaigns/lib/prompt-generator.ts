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

  // Contexto especial Primatón
  let contextoEspecial = ""
  if (evento && evento.includes("Primatón")) {
    contextoEspecial = `
CONTEXTO ESPECIAL · PRIMATÓN:
La Primatón aprovecha el pago legal de primas en Colombia (30 junio y 20 diciembre).
Los ángulos deben conectar con liquidez extra, darse el gusto merecido, aprovechar la prima.
`
  }

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

  // Modelos con precios
  const modelosConPrecios = state.modelosSeleccionados
    .map((m) => {
      const precio = state.preciosModelos[m] || {}
      const desc = state.modelosDescripcion[m] || ""
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
- Contexto de la campaña: ${state.contextoCampana || "(No especificado)"}
- Objetivo de la campaña: ${state.objetivoCampana || "(No especificado)"}
- Público objetivo: ${state.publicoObjetivo || "(No especificado)"}
- Insight / Mensaje clave: ${state.insightMensajeClave || "(No especificado)"}
- Propuestas de valor de la marca: ${state.propuestasValor || "(No especificado)"}
- Tono y estilo: ${state.tonoYestilo || "(No especificado)"}
- Llamada a la acción: ${state.llamadaAccion || "(No especificada)"}
- Qué NO hacer: ${state.queNOhacer || "(No especificado)"}

## 3 · OFERTA
- Tipo: ${ofertaDesc}
- Detalle de la oferta: ${state.contextoOferta || "(No especificado)"}
- Métodos de pago: ${state.ofertaMetodosPago || "(No especificado)"}
- Regalo incluido: ${state.ofertaRegalo || "(No aplica)"}
- Garantía: ${state.ofertaGarantia || "(No especificada)"}
- Cambios de producto: ${state.ofertaCambios || "(No especificados)"}
- Envío: ${state.ofertaEnvio || "(No especificado)"}
${contextoEspecial}
## 4 · MODELOS DISPONIBLES CON PRECIOS
${modelosConPrecios}

## 5 · ESTRUCTURA META ADS
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
        const modeloFinal = val(p.modelo, cu.modelo)
        const precio = state.preciosModelos[modeloFinal]
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
## 6 · PRESUPUESTO
- Modo: ${state.presupuestoModo}
- Valor ${state.presupuestoModo}: $${formatMoney(state.presupuestoValor)} COP
- Fecha inicio: ${state.fechaInicio || "No definida"}
- Fecha fin: ${state.sinFechaFin ? "SIN FECHA FIN (evergreen)" : state.fechaFin || "No definida"}

## 7 · EQUIPO
${state.equipo.filter((e) => e.rol && e.email).map((e) => `- ${e.rol}: ${e.email}`).join("\n")}

# ═══════════════════════════════════════════════════════════
# INSTRUCCIONES PARA CLAUDE
# ═══════════════════════════════════════════════════════════

Actúa como el director creativo y copywriter senior de ${state.empresa}.

## FORMATO DE ENTREGA: DOCUMENTO WORD (.docx)

Entrega el brief completo como un archivo Microsoft Word (.docx).

# ═══════════════════════════════════════════════════════════
# TEMPLATE FIJO DEL WORD · NO NEGOCIABLE
# ═══════════════════════════════════════════════════════════

Esta estructura del Word debe ser EXACTAMENTE la misma en cada ejecución del brief.
Solo varía el contenido creativo (guiones, copys, hooks). La ESTRUCTURA Y DISEÑO son fijos.

## ESPECIFICACIONES GLOBALES DEL WORD

- Tamaño: US Letter (12240 × 15840 DXA)
- Márgenes: 1 pulgada en todos los lados
- Tipografía: Arial en todo el documento
- Paleta obligatoria:
  * Grafito principal: #333333
  * Carbón: #4B4441
  * Crema (fondos suaves): #FAFAF9
  * Dorado (acentos): #C8A47E
  * Verde salvia (copy box): #8FA68E
  * Borde: #D8D4D0
  * Plata (footers): #BBB4B1

- Header (todas las páginas): "${state.empresa.toUpperCase()} · CAMPAIGN BRIEF" en color plata, letter-spacing 40, alineación derecha, 14pt.
- Footer (todas las páginas): "[Nombre campaña]  ·  Pág. X de Y" centrado, color plata, borde superior sutil.

## ESTRUCTURA DEL WORD · 12 SECCIONES EXACTAS

### PÁGINA 1 · PORTADA
1. Espaciado superior (before: 2400)
2. Logo centrado (200×120 px). Si no hay, espacio equivalente.
3. Texto "${state.empresa.toUpperCase()}" centrado, 20pt, color carbón, letter-spacing 80
4. Línea dorada como separador
5. Texto "CAMPAIGN BRIEF" centrado, 18pt, color plata, letter-spacing 60
6. Espaciado (after: 1440)
7. NOMBRE DE LA CAMPAÑA en 64pt bold, color grafito, centrado
8. Subtítulo "Brief creativo · Guiones · Copy para Meta Ads" en 24pt, italic, color carbón
9. Espaciado inferior (after: 2400)
10. NOMBRE EMPRESA en 16pt bold, color dorado, letter-spacing 100, centrado
11. "Generado el ${fecha}" en 18pt, color plata, centrado
12. Salto de página

### PÁGINA 2 · ÍNDICE
- Título "Contenido" en H1 (40pt bold)
- Separador dorado horizontal
- 10 líneas de índice con formato "  XX  ·  Nombre" en bold
- Salto de página

### SECCIÓN 01 · RESUMEN EJECUTIVO
- Label "SECCIÓN 01" en dorado 16pt bold uppercase
- Título "Resumen ejecutivo" H1
- Separador dorado
- Tabla 2 columnas con Campaña, Tipo, Objetivo Meta, Presupuesto, Periodo, Estructura, Modelos foco
- Salto de página

### SECCIÓN 02 · CONTEXTO Y OBJETIVOS
- Label + H1 + Separador dorado
- H3 "Contexto de la campaña" + párrafo
- H3 "Objetivo principal" + párrafo
- H3 "KPIs a monitorear" + 6 bullets
- Salto de página

### SECCIÓN 03 · OFERTA COMERCIAL
- Label + H1 + Separador dorado
- H3 "La oferta" + párrafo + bullets
- H3 "Condiciones importantes" + tabla
- H3 "Tabla de precios por modelo" + tabla con encabezado grafito
- Salto de página

### SECCIÓN 04 · PÚBLICO OBJETIVO
- Label + H1 + Separador dorado
- H3 "Perfil demográfico" + bullets
- H3 "Perfil psicográfico" + bullets
- H3 "Momento emocional clave" + párrafo
- Salto de página

### SECCIÓN 05 · INSIGHT Y MENSAJE CLAVE
- Label + H1 + Separador dorado
- H3 "El insight estratégico" + párrafo
- BLOCKQUOTE con barra lateral dorada #C8A47E, fondo crema, texto 24pt italic carbón
- H3 "Por qué funciona" + bullets
- Salto de página

### SECCIÓN 06 · PROPUESTA DE VALOR
- Label + H1 + Separador dorado
- H3 "Propuestas duras (funcionales)" + bullets
- H3 "Propuestas blandas (emocionales)" + bullets
- Salto de página

### SECCIÓN 07 · TONO Y LENGUAJE
- Label + H1 + Separador dorado
- H3 "Tono general" + párrafo
- H3 "Lenguaje que SÍ usamos" + bullets
- H3 "Lenguaje que NO usamos" + bullets
- Salto de página

### SECCIÓN 08 · ESTRUCTURA META ADS
- Label + H1 + Separador dorado
- H3 "Configuración general" + tabla
- Por cada campaña: H3 + tabla de conjuntos con Público, Piezas, Modelos, Ángulos
- Salto de página

### SECCIÓN 09 · GUIONES Y COPYS POR PIEZA
Por CADA PIEZA en orden exacto:

1. H2 "PIEZA [ID] · [Modelo] · [Tipo] · [Duración si video]"
2. H3 "Tabla de atributos" + tabla 2 col con 12 filas (Modelo, Tipo, Formato, Ángulo, Tráfico, Conciencia, Motivo, Narrativa, Estructura copy, Duración, Registro de voz, Tipo de hook)
3. H3 "Justificación del registro y hook" + 2 bullets
4. H3 "📹 Guion del video" (o "🖼️ Brief visual" si imagen/carrusel)
5. Si video: tabla timestamps (HOOK fondo dorado / Bloque 2 crema / Bloque 3 crema / CTA fondo grafito blanco)
6. Si imagen/carrusel: tabla brief visual
7. H3 "Estructura [X] aplicada" + 3 bullets
8. H3 "Indicaciones de producción" + bullets
9. H3 "📝 Copy del Ad (Meta Ads Manager)"
10. Label "Primary Text:" en dorado bold
11. CAJA CREMA con barra lateral verde salvia #8FA68E (4-6 párrafos del Primary Text)
12. Tabla 3 col: Headline 1 + conteo / Headline 2 (≤27 chars) / Descripción / CTA botón
13. H3 "🔍 Checklist de verificaciones" + 12 bullets
14. Salto de página después de cada pieza

### SECCIÓN 10 · ESPECIFICACIONES TÉCNICAS
- Label + H1 + Separador dorado
- H3 "Formatos de entrega" + tabla
- H3 "Requisitos Meta Ads Manager" + bullets
- H3 "Flujo de aprobación" + tabla
- Separador dorado final + crédito generador

## INSTRUCCIÓN ABSOLUTA

Esta estructura es NO NEGOCIABLE. La ESTRUCTURA debe ser IDÉNTICA en cada ejecución. Lo que varía es el contenido creativo únicamente.

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

## DIVERSIFICACIÓN DE REGISTROS DE VOZ

NO redactar todas las piezas con el mismo registro. Si hay 4+ piezas, asignar al menos 3 registros distintos:
- Juvenil Gen Z (22-30)
- Coloquial colombiano cálido (30-50)
- Formal-cálido (35-60)
- Neutro informativo
- Emotivo directo
- Cómplice/amiga

## REGLAS LEGALES Y ÉTICAS (NUNCA VIOLAR)

PROHIBIDO ABSOLUTO:
❌ "original", "originales"
❌ "triple A", "AAA"
❌ "importado", "importados"
❌ "réplica", "imitación", "copia", "fake"
❌ Mencionar marcas competidoras
❌ Inventar cifras sociales o reviews
❌ Prometer tiempos nacionales absolutos
❌ Denigrar al comprador

USAR EN SU LUGAR:
✅ "calidad garantizada"
✅ "materiales premium"
✅ "construcción duradera"
✅ "24-72h en ciudades principales"

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
☐ Headlines ≤27 caracteres
☐ Modismos coinciden con edad target
☐ Ángulo en primeros segundos
☐ Hook declarado y justificado

## PRINCIPIOS GENERALES
- Una pieza = una idea
- Mostrar, no contar
- Producto protagonista en Ventas
- Especificidad vende
- Tono colombiano natural ≠ slang forzado
- Cada pieza sobrevive sola

IMPORTANTE: Entrega TODO en un solo Word (.docx) siguiendo la estructura fija especificada arriba.

Empieza el trabajo.
`

  return prompt
}
