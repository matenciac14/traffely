export const EVENTOS_ESTACIONALES = [
  { mes: "Enero", nombre: "Reset del año" },
  { mes: "Febrero", nombre: "San Valentín" },
  { mes: "Marzo", nombre: "Día de la Mujer" },
  { mes: "Mayo", nombre: "Día de la Madre" },
  { mes: "Junio", nombre: "Día del Padre" },
  { mes: "Junio", nombre: "Mitad de año / Mid-Year Sale" },
  { mes: "Agosto", nombre: "Regreso a clase" },
  { mes: "Septiembre", nombre: "Amor y Amistad" },
  { mes: "Octubre", nombre: "Halloween" },
  { mes: "Noviembre", nombre: "Black Friday" },
  { mes: "Diciembre", nombre: "Fin de año / Year-End Sale" },
] as const

export const ANGULOS_BASE = [
  "Problema / Dolor",
  "Beneficios",
  "Prueba social",
  "Aspiracional / Funcional",
  "Confianza",
] as const

export const NARRATIVAS_BASE = [
  "Testimonio",
  "Problema-Solución",
  "Unboxing",
  "Antes-Después",
  "Oferta directa",
  "Tutorial / Cómo usar",
  "Founder story",
  "Reviews",
  "Modo de uso",
] as const

export const TIPOS_PIEZA = [
  "Video UGC",
  "Videos por nosotros",
  "Imagen estática",
  "Carrusel",
] as const

export const FORMATOS = ["9:16", "1:1", "4:5"] as const

export const ESTRUCTURAS_COPY = [
  { nombre: "PAS", icon: "🎯", desc: "Dolor → agitar → solución" },
  { nombre: "AIDA", icon: "🪄", desc: "Captar → enganchar → desear → acción" },
  { nombre: "FAB", icon: "⚙️", desc: "Qué tiene → qué permite → qué mejora" },
  { nombre: "BAB", icon: "🌉", desc: "Situación actual → deseada → puente" },
  { nombre: "4U", icon: "⚡", desc: "Cuatro cualidades presentes" },
  { nombre: "Storytelling", icon: "📖", desc: "Historia con personaje y transformación" },
] as const

export const OBJETIVOS_META = [
  { nombre: "Reconocimiento", desc: "Que te vean" },
  { nombre: "Tráfico", desc: "Clicks al sitio" },
  { nombre: "Interacción", desc: "Likes, comments" },
  { nombre: "Clientes potenciales", desc: "Leads / WhatsApp" },
  { nombre: "Promoción de la app", desc: "Instalar app" },
  { nombre: "Ventas", desc: "Comprar ahora" },
] as const

export const TIPOS_TRAFICO = [
  { nombre: "Frío", icon: "❄️", desc: "No conoce la marca" },
  { nombre: "Tibio", icon: "🌤️", desc: "Ya vio contenido" },
  { nombre: "Caliente", icon: "🔥", desc: "Cerca de comprar" },
] as const

export const NIVELES_CONCIENCIA = [
  { nombre: "Inconsciente", icon: "🌫️", desc: "No sabe del problema" },
  { nombre: "Problema", icon: "💭", desc: "Sabe del problema" },
  { nombre: "Solución", icon: "🔍", desc: "Busca solución" },
  { nombre: "Producto", icon: "🎯", desc: "Conoce tu producto" },
  { nombre: "Decisión", icon: "✅", desc: "Decidido a comprar" },
] as const

export const MOTIVOS = [
  { nombre: "Emocional", icon: "❤️", desc: "Apelar al sentir" },
  { nombre: "Racional", icon: "🧠", desc: "Apelar a la lógica" },
  { nombre: "Social", icon: "👥", desc: "Apelar al grupo" },
] as const

export const PUBLICOS = [
  "Segmentación abierta",
  "Advantage+",
  "Retargeting",
  "Públicos similares",
  "Intereses",
] as const

export const CHIPS_DETALLE_POR_OFERTA: Record<string, string[]> = {
  escalonada: [
    "Compra 1 envío gratis, 2 unidades -10%, 3+ -20%",
    "Compra 2 -15%, 3 -20%, 4+ -25%",
    "Desde la segunda unidad, -20% en toda la compra",
  ],
  descuento: [
    "20% OFF toda la tienda",
    "30% OFF seleccionados + 10% extra con cupón",
    "-15% primera compra",
  ],
  "2x1": [
    "Lleva 2 paga 1 (el de menor valor gratis)",
    "3x2 en artículos seleccionados",
    "Combo 2 unidades con descuento",
  ],
  envio: [
    "Envío gratis desde monto mínimo",
    "Envío gratis sin mínimo de compra",
    "Envío express sin costo adicional",
  ],
  financiacion: [
    "Hasta 4 cuotas sin interés",
    "12 meses de financiación",
    "Financiación + 10% OFF extra",
  ],
  "precio-plano": [
    "Todo a precio único",
    "Dos precios según categoría",
    "Precio plano en productos seleccionados",
  ],
  otra: ["Sorteo + descuento", "Preventa VIP", "Oferta flash 24h"],
}

export const CHIPS_PAGO = [
  "Tarjeta de crédito",
  "Tarjeta débito",
  "Transferencia bancaria",
  "PSE",
  "Efectivo contra entrega",
  "Financiación disponible",
  "Pago en cuotas",
]

// Chips contextuales según tipo de producto
export const CHIPS_BY_TIPO = {
  fisico: {
    regalo: ["Muestra de producto gratis", "Empaque especial", "Accesorio de regalo", "Descuento en próxima compra", "Sin regalo"],
    garantia: ["30 días por defectos", "6 meses de garantía", "1 año de garantía", "Garantía de satisfacción", "Sin garantía"],
    cambios: ["Devolución en 8 días", "Cambio o devolución en 15 días", "Reembolso garantizado 30 días", "No aplica cambios en oferta"],
    envio: ["Envío gratis", "Envío gratis desde monto mínimo", "Envío express disponible", "Entrega en 24h", "Sin costo de envío"],
  },
  digital: {
    regalo: ["Demo gratuita 14 días", "Mes gratis al contratar", "Funciones premium incluidas", "Capacitación de onboarding", "Sin regalo"],
    garantia: ["30 días de prueba sin riesgo", "Garantía de satisfacción 30 días", "Soporte técnico incluido", "Sin garantía"],
    cambios: ["Cancelación en cualquier momento", "Reembolso en 30 días", "Cambio de plan disponible", "Sin reembolso"],
    envio: ["Acceso inmediato al comprar", "Entrega por email", "Activación instantánea", "Descarga disponible de inmediato"],
  },
  servicio: {
    regalo: ["Consulta inicial gratuita", "Análisis sin costo", "Sesión de diagnóstico gratis", "Auditoría gratuita", "Sin regalo"],
    garantia: ["Satisfacción garantizada", "Revisiones ilimitadas incluidas", "Resultados o devolvemos", "Sin garantía"],
    cambios: ["Ajustes sin costo adicional", "Revisiones hasta aprobar", "Cambios en 48h", "Sin cambios post-entrega"],
    envio: ["100% remoto", "Entregables digitales", "Reuniones por videollamada", "Trabajo asíncrono"],
  },
} as const

// Fallback genérico cuando no se ha definido tipo
export const CHIPS_REGALO = CHIPS_BY_TIPO.fisico.regalo
export const CHIPS_GARANTIA = CHIPS_BY_TIPO.fisico.garantia
export const CHIPS_CAMBIOS = CHIPS_BY_TIPO.fisico.cambios
export const CHIPS_ENVIO = CHIPS_BY_TIPO.fisico.envio

export const OFERTAS_CONFIG = [
  { val: "escalonada", titulo: "Escalonada por cantidad", desc: "1 par envío gratis · 2 pares -10% · 3 pares -15% · 4+ -20%", icon: "📊" },
  { val: "descuento", titulo: "Descuento fijo", desc: "Un porcentaje único para toda la colección", icon: "🏷️" },
  { val: "2x1", titulo: "2x1 o combos", desc: "Lleva 2 paga 1 u ofertas combinadas", icon: "🎁" },
  { val: "envio", titulo: "Envío gratis", desc: "Sin descuento, solo envío incluido", icon: "📦" },
  { val: "financiacion", titulo: "Financiación destacada", desc: "Cuotas con Addi o Sistecrédito", icon: "💳" },
  { val: "precio-plano", titulo: "Precio plano", desc: "Todo a un precio único (tipo PRIMATON)", icon: "🎯" },
  { val: "otra", titulo: "Otra oferta personalizada", desc: "Tú describes la promoción", icon: "✍️" },
] as const

export const EQUIPO_DEFAULT: { rol: string; email: string }[] = []

export const DURACIONES_VIDEO = ["15s", "20s", "30s", "45s", "60s"] as const

export const OFERTA_LABEL_MAP: Record<string, string> = {
  escalonada: "Escalonada por cantidad (1 par envío gratis · 2 pares -10% · 3 pares -15% · 4+ -20%)",
  descuento: "Descuento fijo porcentual",
  "2x1": "2x1 o combos",
  envio: "Envío gratis",
  financiacion: "Financiación destacada (Addi/Sistecrédito)",
  "precio-plano": "Precio plano único para toda la tienda",
}
