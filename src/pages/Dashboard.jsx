import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { pctPonderado } from '../severidad.js'
import { exportarHistoricoCSV } from '../reporte.js'

export default function Dashboard() {
  const [rows, setRows] = useState([])
  const [seg, setSeg] = useState([])
  const [bitacoras, setBitacoras] = useState([])
  const [sel, setSel] = useState('todas')
  const [vista, setVista] = useState('area') // area | clasificacion

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: bs }, { data: rs }, { data: sg }] = await Promise.all([
      supabase.from('bitacoras').select('id, fecha, estado').order('fecha', { ascending: false }).limit(90),
      supabase.from('v_calificaciones').select('*'),
      supabase.from('v_seguimiento_lineamientos').select('*')
    ])
    setBitacoras(bs || [])
    setRows(rs || [])
    setSeg(sg || [])
  }

  const filtradas = sel === 'todas' ? rows : rows.filter(r => r.bitacora_id === sel)

  // Tendencia por día (ponderado)
  const porDia = (() => {
    const g = {}
    for (const r of filtradas) {
      const k = r.fecha
      g[k] = g[k] || { fecha: k, rows: [] }
      g[k].rows.push(r)
    }
    return Object.values(g).map(x => ({ fecha: x.fecha, pct: pctPonderado(x.rows) })).sort((a, b) => a.fecha.localeCompare(b.fecha))
  })()
  const ultima = porDia[porDia.length - 1]
  const previa = porDia[porDia.length - 2]

  // Agregado por área
  const porArea = (() => {
    const g = {}
    for (const r of filtradas) {
      const k = r.area
      g[k] = g[k] || { area: r.area, cumple: 0, evald: 0, fotos: 0, fechas: new Set(), rows: [] }
      g[k].rows.push(r)
      g[k].cumple += Number(r.cumple)
      g[k].evald += Number(r.cumple) + Number(r.no_cumple)
      g[k].fotos += Number(r.num_fotos)
      g[k].fechas.add(r.fecha)
    }
    return Object.values(g).map(x => ({ ...x, pct: x.evald ? Math.round((x.cumple / x.evald) * 100) : 0, pctw: pctPonderado(x.rows), dias: x.fechas.size }))
      .sort((a, b) => a.area.localeCompare(b.area))
  })()

  // Agregado área × clasificación
  const porClasif = (() => {
    const g = {}
    for (const r of filtradas) {
      const k = `${r.area}||${r.clasificacion}`
      g[k] = g[k] || { area: r.area, clasificacion: r.clasificacion, cumple: 0, evald: 0 }
      g[k].cumple += Number(r.cumple)
      g[k].evald += Number(r.cumple) + Number(r.no_cumple)
    }
    return Object.values(g).map(x => ({ ...x, pct: x.evald ? Math.round((x.cumple / x.evald) * 100) : 0 }))
  })()

  const total = porArea.reduce((s, a) => ({ cumple: s.cumple + a.cumple, evald: s.evald + a.evald }), { cumple: 0, evald: 0 })
  const pctTotal = pctPonderado(filtradas)

  // ===== Gráficas de seguimiento (menor cumplimiento primero) =====
  const peoresAreas = porArea.filter(a => a.evald > 0).sort((a, b) => a.pct - b.pct)
  const peoresClasif = [...porClasif].filter(c => c.evald > 0).sort((a, b) => a.pct - b.pct)
  const peoresLineamientos = seg
    .filter(s => s.evaluados > 0 && s.pct_cumplimiento != null)
    .sort((a, b) => a.pct_cumplimiento - b.pct_cumplimiento)
    .slice(0, 10)

  function Grafica({ titulo, items }) {
    if (!items.length) return null
    return (
      <div className="card">
        <h3>{titulo}</h3>
        {items.map((it, i) => {
          const pct = it.pctw ?? it.pct_cumplimiento ?? it.pct
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '.85rem' }}>
                <span style={{ minWidth: 0 }}>
                  {it.detalle && <b style={{ color: 'var(--gray)' }}>[{it.detalle}] </b>}
                  {it.etiqueta}
                </span>
                <b style={{ color: color(pct), whiteSpace: 'nowrap' }}>{pct}% ({it.cumple}/{it.evald ?? it.evaluados})</b>
              </div>
              <div className="progress" style={{ marginTop: 3 }}><div style={{ width: `${pct}%`, background: color(pct) }} /></div>
            </div>
          )
        })}
      </div>
    )
  }

  const color = p => p >= 90 ? 'var(--green)' : p >= 70 ? 'var(--amber)' : 'var(--red)'

  return (
    <>
      <div className="card">
        <h2>📊 Indicadores de cumplimiento</h2>        <div className="filters">
          <div>
            <label>Bitácora (día)</label>
            <select value={sel} onChange={e => setSel(e.target.value)}>
              <option value="todas">Todas / histórico</option>
              {bitacoras.map(b => <option key={b.id} value={b.id}>{b.fecha} {b.estado === 'cerrada' ? '🔒' : ''}</option>)}
            </select>
          </div>
          <div>
            <label>Vista</label>
            <select value={vista} onChange={e => setVista(e.target.value)}>
              <option value="area">Por Área</option>
              <option value="clasificacion">Por Área y Clasificación</option>
            </select>
          </div>
        </div>
        <div className="pill-row">
          <span className="badge ok" style={{ fontSize: '1rem' }}>Cumplimiento ponderado: {pctTotal}%</span>
          <span className="badge pend">Evaluados: {total.cumple}/{total.evald} cumplen</span>
          <button className="btn small" onClick={exportarHistoricoCSV}>📥 Exportar Excel (CSV)</button>
        </div>
        {porDia.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <b style={{ fontSize: '.9rem' }}>📈 Tendencia por día</b>
            {previa && ultima && (
              <span className="badge" style={{ marginLeft: 8, background: ultima.pct >= previa.pct ? '#dcfce7' : '#fee2e2', color: ultima.pct >= previa.pct ? '#166534' : '#991b1b' }}>
                {ultima.pct >= previa.pct ? '▲' : '▼'} {Math.abs(ultima.pct - previa.pct)} pts vs día anterior
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, marginTop: 8, overflowX: 'auto' }}>
              {porDia.map(d => (
                <div key={d.fecha} style={{ textAlign: 'center', minWidth: 34 }}>
                  <div style={{ height: `${Math.max(4, d.pct)}px`, width: 22, background: color(d.pct), borderRadius: '4px 4px 0 0', margin: '0 auto' }} title={`${d.fecha}: ${d.pct}%`} />
                  <div style={{ fontSize: '.58rem', color: 'var(--gray)' }}>{d.fecha.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {vista === 'area' ? (
        <div className="card">
          <h3>Calificación por Área</h3>
          <table>
            <thead><tr><th>Área</th><th>Días registrados</th><th className="num">Cumplen</th><th className="num">Evaluados</th><th className="bar-cell">%</th></tr></thead>
            <tbody>
              {porArea.map(a => (
                <tr key={a.area}>
                  <td><strong>{a.area}</strong></td>
                  <td>{a.dias}</td>
                  <td className="num">{a.cumple}</td>
                  <td className="num">{a.evald}</td>
                  <td className="bar-cell">
                    <div className="progress"><div style={{ width: `${a.pctw ?? a.pct}%`, background: color(a.pctw ?? a.pct) }} /></div>
                    <b style={{ color: color(a.pctw ?? a.pct) }}>{a.pctw ?? a.pct}%</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <h3>Calificación por Área y Clasificación</h3>
          {Object.entries(porClasif.reduce((g, r) => { (g[r.area] = g[r.area] || []).push(r); return g }, {})).map(([area, items]) => (
            <div key={area}>
              <div className="classif-head">{area}</div>
              <table>
                <thead><tr><th>Clasificación</th><th className="num">Cumplen</th><th className="num">Evaluados</th><th className="bar-cell">%</th></tr></thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r.clasificacion}>
                      <td>{r.clasificacion}</td>
                      <td className="num">{r.cumple}</td>
                      <td className="num">{r.evald}</td>
                      <td className="bar-cell">
                        <div className="progress"><div style={{ width: `${r.pct}%`, background: color(r.pct) }} /></div>
                        <b style={{ color: color(r.pct) }}>{r.pct}%</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ margin: '8px 4px' }}>📉 Seguimiento — lo que más urge corregir</h2>
      <Grafica titulo="🔴 Áreas con menor cumplimiento" items={peoresAreas.map(a => ({ etiqueta: a.area, pct: a.pctw ?? a.pct, cumple: a.cumple, evald: a.evald }))} />
      <Grafica titulo="🟠 Clasificaciones con menor cumplimiento" items={peoresClasif.map(c => ({ etiqueta: c.clasificacion, detalle: c.area, pct: c.pct, cumple: c.cumple, evald: c.evald }))} />
      <Grafica titulo="⚪ Lineamientos (subpuntos) con menor cumplimiento — top 10" items={peoresLineamientos.map(s => ({ etiqueta: s.lineamiento, detalle: `${s.area} · ${s.clasificacion}`, pct: s.pct_cumplimiento, cumple: s.cumple, evald: s.evaluados }))} />
    </>
  )
}
