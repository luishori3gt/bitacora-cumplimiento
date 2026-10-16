import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

function hoy() { return new Date().toISOString().slice(0, 10) }

export default function Home({ go }) {
  const [areas, setAreas] = useState([])
  const [bitacora, setBitacora] = useState(null)
  const [stats, setStats] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: ar }, { data: b }] = await Promise.all([
      supabase.from('areas').select('*, lineamientos(id)').order('orden'),
      supabase.from('bitacoras').select('*').eq('fecha', hoy()).maybeSingle()
    ])
    let bit = b
    setAreas(ar || [])
    if (!bit) { setBitacora(null); return }
    setBitacora(bit)
    const { data: cal } = await supabase.from('v_calificaciones').select('*').eq('bitacora_id', bit.id)
    const { data: fotos } = await supabase.from('fotos').select('area_id').eq('bitacora_id', bit.id)
    const st = {}
    for (const a of ar || []) {
      const rows = (cal || []).filter(c => c.area_id === a.id)
      const cum = rows.reduce((s, r) => s + Number(r.cumple), 0)
      const evald = rows.reduce((s, r) => s + Number(r.cumple) + Number(r.no_cumple), 0)
      const nf = (fotos || []).filter(f => f.area_id === a.id).length
      st[a.id] = { pct: evald ? Math.round((cum / evald) * 100) : null, evald, total: a.lineamientos.length, fotos: nf, listo: evald === a.lineamientos.length && nf >= 2 }
    }
    setStats(st)
  }

  async function iniciar() {
    setBusy(true); setMsg('')
    const { data, error } = await supabase.from('bitacoras').insert({ fecha: hoy() }).select().single()
    setBusy(false)
    if (error) { setMsg('No se pudo iniciar: ' + error.message); return }
    // Pre-crear respuestas en 'no_revisado' para todos los lineamientos
    const rows = areas.flatMap(a => a.lineamientos.map(l => ({ bitacora_id: data.id, lineamiento_id: l.id })))
    if (rows.length) await supabase.from('respuestas').upsert(rows, { onConflict: 'bitacora_id,lineamiento_id' })
    setBitacora(data)
  }

  async function cerrar() {
    if (!confirm('¿Cerrar la bitácora de hoy? No podrá modificarse después de revisión.')) return
    setBusy(true)
    const { data, error } = await supabase.rpc('cerrar_bitacora', { p_bitacora: bitacora.id })
    setBusy(false)
    if (error || !data?.startsWith('OK')) { setMsg(data || error.message); return }
    setMsg('✅ Bitácora cerrada correctamente. Puedes consultarla en Indicadores.')
    load()
  }

  const totalAreas = areas.length
  const areasListas = areas.filter(a => stats[a.id]?.listo).length

  return (
    <>
      <div className="card">
        <h2>Bitácora del día — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
        <p style={{ color: 'var(--gray)', marginTop: -6 }}>La fecha se asigna automáticamente al iniciar la actividad.</p>
        {msg && <div className={msg.startsWith('ERROR') ? 'error-msg' : 'ok-msg'}>{msg}</div>}
        {!bitacora ? (
          <button className="btn" onClick={iniciar} disabled={busy}>▶ Iniciar bitácora de hoy</button>
        ) : (
          <div className="pill-row">
            <span className="badge ok">Bitácora abierta · {bitacora.fecha}</span>
            <span className={areasListas === totalAreas ? 'badge ok' : 'badge pend'}>Áreas completas: {areasListas}/{totalAreas}</span>
            {bitacora.estado === 'abierta' && <button className="btn small danger" onClick={cerrar} disabled={busy}>🔒 Cerrar bitácora del día</button>}
            {bitacora.estado === 'cerrada' && <span className="badge ok">🔒 CERRADA</span>}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Áreas (toca una para evaluar)</h3>
        {!bitacora && <p>Inicia la bitácora para habilitar las áreas.</p>}
        <div className="grid-areas">
          {areas.map(a => {
            const s = stats[a.id] || {}
            const pct = s.pct
            return (
              <button key={a.id} className="area-btn" disabled={!bitacora} onClick={() => go('area', { area: a, bitacoraId: bitacora?.id })}>
                <strong>{a.nombre}</strong>
                <div className="progress"><div style={{ width: `${pct ?? 0}%` }} /></div>
                <div className="pill-row">
                  <span className="badge pend">{s.evald || 0}/{s.total} evaluados</span>
                  <span className={(s.fotos || 0) >= 2 ? 'badge ok' : 'badge blocked'}>📷 {s.fotos || 0}/2</span>
                  {pct != null && <span className="badge ok">{pct}%</span>}
                  {s.listo && <span className="badge ok">✔ Completa</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
