// Constantes portadas 1:1 del prototipo Serrano Campaign Builder v3.7

export const MODELOS_BASE = [
  "NB 530",
  "NB 9060",
  "Nike V2K",
  "On Cloud",
  "Adidas Adizero",
  "Adidas Ultraboost",
  "Adidas Samba",
  "Nike Free Metcon",
  "Nike Zoom",
  "Asics",
] as const

export const EVENTOS_ESTACIONALES = [
  { mes: "Enero", nombre: "Reset del año" },
  { mes: "Febrero", nombre: "San Valentín" },
  { mes: "Marzo", nombre: "Día de la Mujer" },
  { mes: "Mayo", nombre: "Día de la Madre" },
  { mes: "Junio", nombre: "Día del Padre" },
  { mes: "Junio", nombre: "Primatón mitad de año" },
  { mes: "Agosto", nombre: "Regreso a clase" },
  { mes: "Septiembre", nombre: "Amor y Amistad" },
  { mes: "Octubre", nombre: "Halloween" },
  { mes: "Noviembre", nombre: "Black Friday" },
  { mes: "Diciembre", nombre: "Primatón fin de año" },
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
    "1 par envío gratis, 2 pares -10%, 3+ -20%",
    "Compra 2 -15%, 3 -20%, 4+ -25%",
    "Desde el par 2, -20% en toda la compra",
  ],
  descuento: [
    "20% OFF toda la tienda",
    "30% OFF seleccionados + 10% extra con cupón",
    "-15% primera compra",
  ],
  "2x1": [
    "Lleva 2 paga 1 (el de menor valor gratis)",
    "3x2 en running",
    "Combo 2 pares $295.000",
  ],
  envio: [
    "Envío gratis desde $150.000",
    "Envío gratis todo Colombia sin mínimo",
    "Envío gratis 24h Cali",
  ],
  financiacion: [
    "Addi hasta 4 cuotas sin interés",
    "Sistecrédito 12 meses",
    "Addi + 10% OFF extra",
  ],
  "precio-plano": [
    "Todo a $195.000",
    "Dos precios: $150.000 y $250.000",
    "Precio plano $180.000 modelos seleccionados",
  ],
  otra: ["Sorteo + descuento", "Preventa VIP", "Oferta flash 24h"],
}

export const CHIPS_PAGO = [
  "Addi",
  "Sistecrédito",
  "Transferencia Bancolombia",
  "PSE",
  "Efectivo contra entrega",
  "Tarjeta de crédito",
]

export const CHIPS_REGALO = [
  "Par de medias de regalo",
  "Bolso ecológico",
  "Cordones extra",
  "Sin regalo",
]

export const CHIPS_GARANTIA = [
  "30 días por defectos de fábrica",
  "6 meses de garantía",
  "1 año de garantía",
  "Sin garantía",
]

export const CHIPS_CAMBIOS = [
  "Cambio por talla en 8 días",
  "Cambio por talla o modelo en 15 días",
  "No aplica cambios en oferta",
]

export const CHIPS_ENVIO = [
  "Envío gratis toda Colombia",
  "Envío gratis desde $150.000",
  "Envío $12.000 Servientrega",
  "Envío 24h Cali / 48-72h resto",
]

export const OFERTAS_CONFIG = [
  { val: "escalonada", titulo: "Escalonada por cantidad", desc: "1 par envío gratis · 2 pares -10% · 3 pares -15% · 4+ -20%", icon: "📊" },
  { val: "descuento", titulo: "Descuento fijo", desc: "Un porcentaje único para toda la colección", icon: "🏷️" },
  { val: "2x1", titulo: "2x1 o combos", desc: "Lleva 2 paga 1 u ofertas combinadas", icon: "🎁" },
  { val: "envio", titulo: "Envío gratis", desc: "Sin descuento, solo envío incluido", icon: "📦" },
  { val: "financiacion", titulo: "Financiación destacada", desc: "Cuotas con Addi o Sistecrédito", icon: "💳" },
  { val: "precio-plano", titulo: "Precio plano", desc: "Todo a un precio único (tipo PRIMATON)", icon: "🎯" },
  { val: "otra", titulo: "Otra oferta personalizada", desc: "Tú describes la promoción", icon: "✍️" },
] as const

export const EQUIPO_DEFAULT = [
  { rol: "CEO", email: "Administrativo@tennispremiumcol.com" },
  { rol: "Dir. creativa", email: "creativo@tennispremiumcol.com" },
  { rol: "Diseñador", email: "diseno@tennispremiumcol.com" },
  { rol: "Trafficker", email: "Trafico@tennispremiumcol.com" },
  { rol: "Community", email: "Community@tennispremiumcol.com" },
]

export const DURACIONES_VIDEO = ["15s", "20s", "30s", "45s", "60s"] as const

export const OFERTA_LABEL_MAP: Record<string, string> = {
  escalonada: "Escalonada por cantidad (1 par envío gratis · 2 pares -10% · 3 pares -15% · 4+ -20%)",
  descuento: "Descuento fijo porcentual",
  "2x1": "2x1 o combos",
  envio: "Envío gratis",
  financiacion: "Financiación destacada (Addi/Sistecrédito)",
  "precio-plano": "Precio plano único para toda la tienda",
}
