// Generación de Reporte Ejecutivo (imprimir/PDF) y exportación CSV.
import { supabase } from './supabase.js'
import { pctPonderado } from './severidad.js'

async function datosReporte(bitacoraId) {
  const [{ data: b }, { data: areas }, { data: cal }, { data: resp }, { data: fotos }, { data: acc }, { data: seg }] = await Promise.all([
    supabase.from('bitacoras').select('*').eq('id', bitacoraId).single(),
    supabase.from('areas').select('*').order('orden'),
    supabase.from('v_calificaciones').select('*').eq('bitacora_id', bitacoraId),
    supabase.from('respuestas').select('*, lineamientos(clasificacion, texto, severidad)').eq('bitacora_id', bitacoraId),
    supabase.from('fotos').select('*').eq('bitacora_id', bitacoraId),
    supabase.from('acciones').select('*').eq('bitacora_id', bitacoraId),
    supabase.from('v_seguimiento_lineamientos').select('*')
  ])
  return { b, areas: areas || [], cal: cal || [], resp: resp || [], fotos: fotos || [], acc: acc || [], seg: seg || [] }
}

export async function abrirReporte(bitacoraId) {
  const { b, areas, cal, resp, fotos, acc } = await datosReporte(bitacoraId)

  // ===== Agregados =====
  const porArea = {}
  for (const c of cal) {
    const a = (porArea[c.area] = porArea[c.area] || { rows: [], cumple: 0, evald: 0, criticos: 0, fotos: 0 })
    a.rows.push(c)
    a.cumple += Number(c.cumple)
    a.evald += Number(c.cumple) + Number(c.no_cumple)
    a.criticos += Number(c.criticos_no_cumple || 0)
    a.fotos = Math.max(a.fotos, Number(c.num_fotos) || 0)
  }
  for (const a of Object.values(porArea)) a.pct = pctPonderado(a.rows)

  const areasOrden = areas.map(a => ({ nombre: a.nombre, ...porArea[a.nombre] })).filter(a => a.rows)
  const pctTotal = pctPonderado(cal)
  const totalNC = cal.reduce((s, c) => s + Number(c.no_cumple), 0)
  const criticosNC = cal.reduce((s, c) => s + Number(c.criticos_no_cumple || 0), 0)

  const noCumplen = resp
    .filter(r => r.estado === 'no_cumple')
    .sort((a, b2) => (a.lineamientos?.clasificacion || '').localeCompare(b2.lineamientos?.clasificacion || ''))

  const fecha = new Date(b.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const peor = [...areasOrden].sort((a, b2) => a.pct - b2.pct)[0]
  const mejor = [...areasOrden].sort((a, b2) => b2.pct - a.pct)[0]

  const nivel = pctTotal >= 90 ? 'SATISFACTORIO' : pctTotal >= 70 ? 'CON OBSERVACIONES' : 'REQUIERE ATENCIÓN URGENTE'

  // Resumen ejecutivo en párrafos
  const parrafo1 = `El día ${fecha} se realizó la inspección de cumplimiento en el sitio ${b.sitio || 'Accel-VPC'}, cubriendo ${areasOrden.length} áreas operativas con un total de ${cal.reduce((s, c) => s + Number(c.total_lineamientos), 0)} lineamientos evaluables. La calificación general ponderada del día fue de ${pctTotal}% (nivel: ${nivel}).`
  const parrafo2 = `${peor ? `El área con menor cumplimiento fue "${peor.nombre}" con ${peor.pct}%, mientras que "${mejor?.nombre}" obtuvo el mejor resultado con ${mejor?.pct}%.` : ''} Se registraron ${totalNC} hallazgo(s) de incumplimiento, de los cuales ${criticosNC} corresponden a lineamientos CRÍTICOS de inocuidad (higiene, lavado de manos, control de contaminación cruzada o plagas) que requieren atención inmediata.`
  const parrafo3 = `Se generaron ${acc.filter(a => a.estatus === 'abierta').length} acción(es) correctiva(s) abierta(s) con responsable y fecha límite asignados, y se adjuntaron ${fotos.length} evidencia(s) fotográfica(s) con sello de fecha y hora. ${b.usuario_email ? `La bitácora fue iniciada por ${b.usuario_email}.` : ''}`

  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte Bitácora ${b.fecha}</title>
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;color:#0f172a;font-size:12px}
  .head{background:#0f766e;color:#fff;padding:22px 30px;display:flex;justify-content:space-between;align-items:center}
  .head h1{margin:0;font-size:20px} .head .sub{opacity:.85;font-size:12px;margin-top:4px}
  .head .score{background:#fff;color:#0f766e;border-radius:12px;padding:10px 18px;text-align:center}
  .head .score b{font-size:26px;display:block} .head .score span{font-size:10px}
  .wrap{padding:20px 30px}
  h2{font-size:14px;color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:4px;margin:22px 0 10px}
  p{line-height:1.55;text-align:justify;margin:6px 0}
  .nivel{display:inline-block;padding:3px 10px;border-radius:99px;font-weight:700;font-size:11px}
  .nv-ok{background:#dcfce7;color:#166534}.nv-warn{background:#fef3c7;color:#92400e}.nv-bad{background:#fee2e2;color:#991b1b}
  table{width:100%;border-collapse:collapse;margin:8px 0}
  th{background:#0f766e;color:#fff;text-align:left;padding:6px 8px;font-size:11px}
  td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  .pct-ok{color:#16a34a;font-weight:700}.pct-warn{color:#d97706;font-weight:700}.pct-bad{color:#dc2626;font-weight:700}
  .crit{background:#fee2e2;color:#991b1b;font-weight:700;padding:1px 6px;border-radius:4px;font-size:10px}
  .hallazgo{margin:6px 0;padding:6px 10px;border-left:3px solid #dc2626;background:#fef2f2;font-size:11px}
  .hallazgo b{color:#991b1b}
  .fotos{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
  .fotos img{width:150px;height:112px;object-fit:cover;border:1px solid #e2e8f0;border-radius:6px}
  .firma{margin-top:26px;display:flex;gap:60px}
  .firma div{flex:1;text-align:center;font-size:11px}
  .firma img{height:60px;object-fit:contain;display:block;margin:0 auto 4px}
  .pie{margin-top:24px;text-align:center;color:#64748b;font-size:10px;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{.noprint{display:none}}
  .noprint{margin:14px 30px}
  .noprint button{background:#0f766e;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:14px;cursor:pointer;margin-right:8px}
</style></head><body>
<div class="head">
  <div><h1>📋 Reporte de Bitácora de Cumplimiento</h1><div class="sub">Accel-VPC · ${esc(b.sitio || '')} · ${fecha}</div></div>
  <div class="score"><b>${pctTotal}%</b><span>CUMPLIMIENTO PONDERADO</span></div>
</div>
<div class="noprint"><button onclick="window.print()">🖨️ Guardar como PDF / Imprimir</button>
<button onclick="window.close()">Cerrar</button></div>
<div class="wrap">
  <h2>1. Resumen ejecutivo</h2>
  <p>${parrafo1}</p><p>${parrafo2}</p><p>${parrafo3}</p>
  <p>Nivel del día: <span class="nivel ${pctTotal >= 90 ? 'nv-ok' : pctTotal >= 70 ? 'nv-warn' : 'nv-bad'}">${nivel}</span></p>

  <h2>2. Calificación por área (ponderada por severidad)</h2>
  <table><tr><th>Área</th><th>Cumplen</th><th>No cumplen</th><th>Críticos ❗</th><th>Evaluados</th><th>Fotos</th><th>% Ponderado</th></tr>
  ${areasOrden.map(a => `<tr><td><b>${esc(a.nombre)}</b></td><td>${a.cumple}</td><td>${a.evald - a.cumple}</td>
    <td>${a.criticos ? `<span class="crit">${a.criticos} crítico(s)</span>` : '0'}</td><td>${a.evald}</td><td>${a.fotos}</td>
    <td class="${a.pct >= 90 ? 'pct-ok' : a.pct >= 70 ? 'pct-warn' : 'pct-bad'}">${a.pct}%</td></tr>`).join('')}
  </table>

  <h2>3. Calificación por clasificación</h2>
  <table><tr><th>Área</th><th>Clasificación</th><th>Cumplen</th><th>Evaluados</th><th>% Ponderado</th></tr>
  ${cal.map(c => `<tr><td>${esc(c.area)}</td><td>${esc(c.clasificacion)}</td><td>${c.cumple}</td>
    <td>${Number(c.cumple) + Number(c.no_cumple)}</td>
    <td class="${(c.pct_ponderado || 0) >= 90 ? 'pct-ok' : (c.pct_ponderado || 0) >= 70 ? 'pct-warn' : 'pct-bad'}">${c.pct_ponderado ?? '—'}%</td></tr>`).join('')}
  </table>

  ${noCumplen.length ? `<h2>4. Hallazgos (No cumple)</h2>
  ${noCumplen.map(r => `<div class="hallazgo"><b>[${esc(r.lineamientos?.clasificacion || '')}]</b> ${esc(r.lineamientos?.texto || '')}
    ${r.comentario ? `— ${esc(r.comentario)}` : ''}
    ${r.usuario_email ? ` · 👤 ${esc(r.usuario_email)}` : ''}</div>`).join('')}` : '<h2>4. Hallazgos</h2><p>Sin hallazgos: todos los lineamientos evaluados cumplen.</p>'}

  ${acc.length ? `<h2>5. Acciones correctivas</h2>
  <table><tr><th>Descripción</th><th>Responsable</th><th>Fecha límite</th><th>Estatus</th></tr>
  ${acc.map(a => `<tr><td>${esc(a.descripcion)}</td><td>${esc(a.responsable)}</td><td>${a.fecha_limite || '—'}</td><td>${esc(a.estatus)}</td></tr>`).join('')}
  </table>` : ''}

  <h2>6. Evidencia fotográfica</h2>
  ${fotos.length ? `<p>${fotos.length} fotografía(s) con sello de fecha y hora. Detalle completo disponible en la aplicación (módulo Históricos).</p>
  <div class="fotos">${fotos.slice(0, 24).map(f => `<img src="${f.url}">`).join('')}</div>` : '<p>Sin evidencias registradas.</p>'}

  <div class="firma">
    <div>${b.firma_capturista ? `<img src="${b.firma_capturista}">` : '<div style="height:60px"></div>'}_____________________<br>${esc(b.firma_nombre || 'Responsable de la bitácora')}${b.usuario_email ? `<br>${esc(b.usuario_email)}` : ''}</div>
    <div><div style="height:60px"></div>_____________________<br>Supervisor / Revisor</div>
  </div>
  <div class="pie">Generado por Bitácora de Cumplimiento · ${new Date().toLocaleString('es-MX')} · Documento con fines de control interno</div>
</div>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

// ===== REPORTE PERIÓDICO (semana / mes / rango personalizado) =====
export async function abrirReportePeriodo(inicio, fin, titulo) {
  const [{ data: bitacoras }, { data: calAll }, { data: accAll }, { data: segAll }] = await Promise.all([
    supabase.from('bitacoras').select('*').gte('fecha', inicio).lte('fecha', fin).order('fecha'),
    supabase.from('v_calificaciones').select('*'),
    supabase.from('acciones').select('*'),
    supabase.from('v_seguimiento_lineamientos').select('*')
  ])
  const bs = (bitacoras || [])
  const ids = bs.map(b => b.id)
  const cal = (calAll || []).filter(c => c.fecha >= inicio && c.fecha <= fin)
  const acc = (accAll || []).filter(a => (a.created_at || '').slice(0, 10) >= inicio && (a.created_at || '').slice(0, 10) <= fin)

  // respuestas y fotos del periodo
  let resp = [], fotos = []
  if (ids.length) {
    const [{ data: r }, { data: f }] = await Promise.all([
      supabase.from('respuestas').select('*, lineamientos(clasificacion, texto, severidad)').in('bitacora_id', ids),
      supabase.from('fotos').select('*').in('bitacora_id', ids)
    ])
    resp = r || []; fotos = f || []
  }

  const pctTotal = pctPonderado(cal)
  const diasRegistrados = bs.length
  const diasCerrados = bs.filter(b => b.estado === 'cerrada').length
  const sitios = [...new Set(bs.map(b => b.sitio).filter(Boolean))].join(', ') || '—'

  // Por área (ponderado)
  const porArea = {}
  for (const c of cal) {
    const a = (porArea[c.area] = porArea[c.area] || { rows: [], cumple: 0, evald: 0, criticos: 0 })
    a.rows.push(c); a.cumple += Number(c.cumple)
    a.evald += Number(c.cumple) + Number(c.no_cumple)
    a.criticos += Number(c.criticos_no_cumple || 0)
  }
  const areasOrden = Object.entries(porArea).map(([nombre, a]) => ({ nombre, ...a, pct: pctPonderado(a.rows) })).sort((a, b2) => a.pct - b2.pct)

  // Tendencia por día
  const porDia = {}
  for (const c of cal) (porDia[c.fecha] = porDia[c.fecha] || []).push(c)
  const dias = Object.entries(porDia).map(([fecha, rows]) => ({ fecha, pct: pctPonderado(rows) })).sort((a, b2) => a.fecha.localeCompare(b2.fecha))

  // Hallazgos: lineamientos más incumplidos en el periodo
  const conteoNC = {}
  for (const r of resp) {
    if (r.estado !== 'no_cumple' || !r.lineamientos) continue
    const k = r.lineamientos.texto
    conteoNC[k] = conteoNC[k] || { texto: k, clasificacion: r.lineamientos.clasificacion, severidad: r.lineamientos.severidad, veces: 0, areas: new Set() }
    conteoNC[k].veces++
  }
  const peoresLineamientos = Object.values(conteoNC).sort((a, b2) => b2.veces - a.veces).slice(0, 10)

  const totalNC = cal.reduce((s, c) => s + Number(c.no_cumple), 0)
  const criticosNC = cal.reduce((s, c) => s + Number(c.criticos_no_cumple || 0), 0)
  const accAbiertas = acc.filter(a => a.estatus === 'abierta').length
  const accResueltas = acc.filter(a => a.estatus === 'resuelta').length
  const peor = areasOrden[0], mejor = areasOrden[areasOrden.length - 1]
  const nivel = pctTotal >= 90 ? 'SATISFACTORIO' : pctTotal >= 70 ? 'CON OBSERVACIONES' : 'REQUIERE ATENCIÓN URGENTE'

  const fmt = f => new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const rangoTxt = `${fmt(inicio)} — ${fmt(fin)} de ${new Date(fin + 'T12:00:00').toLocaleDateString('es-MX', { year: 'numeric' })}`

  const p1 = `Durante el periodo ${rangoTxt} se registraron ${diasRegistrados} bitácora(s) de inspección (${diasCerrados} cerrada(s)) en ${esc(sitios)}, con un cumplimiento general ponderado de ${pctTotal}% (nivel: ${nivel}).`
  const p2 = `${peor ? `El área con menor desempeño del periodo fue "${peor.nombre}" con ${peor.pct}%, y la de mejor cumplimiento "${mejor.nombre}" con ${mejor.pct}%. ` : ''}Se registraron ${totalNC} hallazgo(s) de incumplimiento, de los cuales ${criticosNC} fueron críticos de inocuidad. El lineamiento más incumplido fue: "${peoresLineamientos[0]?.texto || '—'}" (${peoresLineamientos[0]?.veces || 0} ocasión(es)).`
  const p3 = `Se generaron ${acc.length} acción(es) correctiva(s): ${accAbiertas} permanecen abierta(s) y ${accResueltas} fueron resueltas. Se adjuntaron ${fotos.length} evidencia(s) fotográfica(s) con sello de fecha, hora y GPS.`

  const maxPct = Math.max(...dias.map(d => d.pct), 100)

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte ${titulo} ${inicio} a ${fin}</title>
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;color:#0f172a;font-size:12px}
  .head{background:#134e4a;color:#fff;padding:22px 30px;display:flex;justify-content:space-between;align-items:center}
  .head h1{margin:0;font-size:20px}.head .sub{opacity:.85;font-size:12px;margin-top:4px}
  .head .score{background:#fff;color:#134e4a;border-radius:12px;padding:10px 18px;text-align:center}
  .head .score b{font-size:26px;display:block}.head .score span{font-size:10px}
  .wrap{padding:20px 30px}
  h2{font-size:14px;color:#134e4a;border-bottom:2px solid #134e4a;padding-bottom:4px;margin:22px 0 10px}
  p{line-height:1.55;text-align:justify;margin:6px 0}
  .nivel{display:inline-block;padding:3px 10px;border-radius:99px;font-weight:700;font-size:11px}
  .nv-ok{background:#dcfce7;color:#166534}.nv-warn{background:#fef3c7;color:#92400e}.nv-bad{background:#fee2e2;color:#991b1b}
  table{width:100%;border-collapse:collapse;margin:8px 0}
  th{background:#134e4a;color:#fff;text-align:left;padding:6px 8px;font-size:11px}
  td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  .pct-ok{color:#16a34a;font-weight:700}.pct-warn{color:#d97706;font-weight:700}.pct-bad{color:#dc2626;font-weight:700}
  .crit{background:#fee2e2;color:#991b1b;font-weight:700;padding:1px 6px;border-radius:4px;font-size:10px}
  .barras .bar{display:flex;align-items:center;gap:8px;margin:3px 0}
  .barras .track{flex:1;background:#f1f5f9;border-radius:4px;height:14px;overflow:hidden}
  .barras .fill{height:100%;border-radius:4px}
  .noprint{margin:14px 30px}.noprint button{background:#134e4a;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:14px;cursor:pointer;margin-right:8px}
  @media print{.noprint{display:none}}
  .pie{margin-top:24px;text-align:center;color:#64748b;font-size:10px;border-top:1px solid #e2e8f0;padding-top:8px}
</style></head><body>
<div class="head">
  <div><h1>📊 Reporte ${esc(titulo)} de Cumplimiento</h1><div class="sub">Accel-VPC · Periodo: ${rangoTxt}</div></div>
  <div class="score"><b>${pctTotal}%</b><span>CUMPLIMIENTO PONDERADO</span></div>
</div>
<div class="noprint"><button onclick="window.print()">🖨️ Guardar como PDF / Imprimir</button><button onclick="window.close()">Cerrar</button></div>
<div class="wrap">
  <h2>1. Resumen ejecutivo del periodo</h2>
  <p>${p1}</p><p>${p2}</p><p>${p3}</p>
  <p>Nivel del periodo: <span class="nivel ${pctTotal >= 90 ? 'nv-ok' : pctTotal >= 70 ? 'nv-warn' : 'nv-bad'}">${nivel}</span></p>

  <h2>2. Ejecución de bitácoras</h2>
  <p>Días con bitácora registrada: <b>${diasRegistrados}</b> · Cerradas: <b>${diasCerrados}</b> · Sitio(s): <b>${esc(sitios)}</b></p>
  ${dias.length ? `<div class="barras">${dias.map(d => `<div class="bar"><span style="width:70px;font-size:10px">${fmt(d.fecha)}</span><div class="track"><div class="fill" style="width:${Math.max(2, (d.pct / maxPct) * 100)}%;background:${d.pct >= 90 ? '#16a34a' : d.pct >= 70 ? '#d97706' : '#dc2626'}"></div></div><b style="width:44px;text-align:right">${d.pct}%</b></div>`).join('')}</div>` : '<p>Sin registros en el periodo.</p>'}

  <h2>3. Calificación por área (ponderada, periodo completo)</h2>
  ${areasOrden.length ? `<table><tr><th>Área</th><th>Cumplen</th><th>No cumplen</th><th>Críticos ❗</th><th>% Ponderado</th></tr>
  ${areasOrden.map(a => `<tr><td><b>${esc(a.nombre)}</b></td><td>${a.cumple}</td><td>${a.evald - a.cumple}</td>
    <td>${a.criticos ? `<span class="crit">${a.criticos}</span>` : '0'}</td>
    <td class="${a.pct >= 90 ? 'pct-ok' : a.pct >= 70 ? 'pct-warn' : 'pct-bad'}">${a.pct}%</td></tr>`).join('')}</table>` : '<p>Sin datos.</p>'}

  <h2>4. Lineamientos más incumplidos del periodo (Top 10)</h2>
  ${peoresLineamientos.length ? `<table><tr><th>Lineamiento</th><th>Clasificación</th><th>Severidad</th><th>Veces No cumple</th></tr>
  ${peoresLineamientos.map(l => `<tr><td>${esc(l.texto)}</td><td>${esc(l.clasificacion)}</td><td>${esc(l.severidad)}</td><td><b>${l.veces}</b></td></tr>`).join('')}</table>` : '<p>Sin hallazgos recurrentes. 🎉</p>'}

  <h2>5. Acciones correctivas del periodo</h2>
  ${acc.length ? `<table><tr><th>Creada</th><th>Descripción</th><th>Responsable</th><th>Límite</th><th>Estatus</th></tr>
  ${acc.map(a => `<tr><td>${(a.created_at || '').slice(0, 10)}</td><td>${esc(a.descripcion)}</td><td>${esc(a.responsable)}</td><td>${a.fecha_limite || '—'}</td><td>${esc(a.estatus)}</td></tr>`).join('')}</table>` : '<p>Sin acciones correctivas en el periodo.</p>'}

  <h2>6. Evidencia fotográfica</h2>
  <p>${fotos.length} fotografía(s) registrada(s) en el periodo. Detalle por día en la aplicación (Históricos) y en los reportes diarios.</p>
  ${fotos.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${fotos.slice(0, 30).map(f => `<img src="${f.url}" style="width:140px;height:105px;object-fit:cover;border:1px solid #e2e8f0;border-radius:6px">`).join('')}</div>` : ''}

  <div class="pie">Generado por Bitácora de Cumplimiento · ${new Date().toLocaleString('es-MX')} · Documento con fines de control interno</div>
</div></body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}
function csv(nombre, filas) {
  const txt = filas.map(f => f.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + txt], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombre
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function exportarHistoricoCSV() {
  const [{ data: cal }, { data: seg }, { data: acc }] = await Promise.all([
    supabase.from('v_calificaciones').select('*'),
    supabase.from('v_seguimiento_lineamientos').select('*'),
    supabase.from('acciones').select('*')
  ])
  csv('bitacora_calificaciones.csv', [
    ['Fecha', 'Sitio', 'Área', 'Clasificación', 'Cumplen', 'No cumplen', 'No revisados', 'Críticos no cumplen', '% Ponderado', '% Simple', 'Fotos'],
    ...(cal || []).map(c => [c.fecha, c.sitio, c.area, c.clasificacion, c.cumple, c.no_cumple, c.no_revisado, c.criticos_no_cumple, c.pct_ponderado, c.pct_simple, c.num_fotos])
  ])
  csv('bitacora_seguimiento_lineamientos.csv', [
    ['Área', 'Clasificación', 'Severidad', 'Lineamiento', 'Cumplen', 'No cumplen', 'Evaluados', '% Cumplimiento'],
    ...(seg || []).map(s => [s.area, s.clasificacion, s.severidad, s.lineamiento, s.cumple, s.no_cumple, s.evaluados, s.pct_cumplimiento])
  ])
  csv('bitacora_acciones_correctivas.csv', [
    ['Creada', 'Descripción', 'Severidad', 'Responsable', 'Fecha límite', 'Estatus', 'Registró'],
    ...(acc || []).map(a => [a.created_at?.slice(0, 10), a.descripcion, a.severidad, a.responsable, a.fecha_limite, a.estatus, a.usuario_email])
  ])
}
