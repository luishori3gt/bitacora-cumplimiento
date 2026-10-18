// Severidad ponderada según criterio típico de auditorías de inocuidad
// alimentaria (estilo BRC/PrimusGFS): los hallazgos críticos pesan más.
export const PESOS = { critico: 1.0, mayor: 0.75, menor: 0.5 }

export function severidadPorClasificacion(clasificacion = '') {
  const c = clasificacion.toLowerCase()
  if (c.includes('lavado de manos')) return 'critico'
  if (c.includes('higiene')) return 'critico'
  if (c.includes('contaminaci')) return 'critico'
  if (c.includes('plagas')) return 'critico'
  if (c.includes('instalaciones')) return 'mayor'
  if (c.includes('orden y limpieza')) return 'menor'
  return 'mayor'
}

// rows: v_calificaciones (con severidad opcional). Si no viene severidad por
// row, se calcula con la clasificación.
export function pctPonderado(rows) {
  let num = 0, den = 0
  for (const r of rows) {
    const peso = PESOS[r.severidad] || PESOS[severidadPorClasificacion(r.clasificacion)]
    const c = Number(r.cumple) || 0
    const nc = Number(r.no_cumple) || 0
    if (c + nc === 0) continue
    den += peso * (c + nc)
    num += peso * c
  }
  return den ? Math.round((num / den) * 1000) / 10 : 0
}

export const SEV_COLOR = { critico: 'var(--red)', mayor: 'var(--amber)', menor: 'var(--gray)' }
export const SEV_TXT = { critico: 'Crítico', mayor: 'Mayor', menor: 'Menor' }
