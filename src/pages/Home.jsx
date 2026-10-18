import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import InstalarApp from '../components/InstalarApp.jsx'
import { abrirReporte } from '../reporte.js'
import { pctPonderado } from '../severidad.js'

function hoy() { return new Date().toISOString().slice(0, 10) }

// Modal de firma en pantalla (canvas táctil/ratón)
function FirmaModal({ onGuardar, onCerrar }) {
  const ref = React.useRef(null)
  const dibujando = React.useRef(false)
  const [nombre, setNombre] = useState('')

  function pos(e) {
    const r = ref.current.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return [t.clientX - r.left, t.clientY - r.top]
  }
  function inicio(e) { dibujando.current = true; const c = ref.current.getContext('2d'); const [x, y] = pos(e); c.beginPath(); c.moveTo(x, y) }
  function mueve(e) {
    if (!dibujando.current) return
    e.preventDefault()
    const c = ref.current.getContext('2d'); const [x, y] = pos(e)
    c.lineWidth = 2.2; c.lineCap = 'round'; c.strokeStyle = '#0f172a'; c.lineTo(x, y); c.stroke()
  }
  function fin() { dibujando.current = false }

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <h3>✍️ Firma de cierre de bitácora</h3>
        <label>Nombre de quien firma</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" />
        <canvas ref={ref} width={440} height={160} style={{ border: '1px dashed var(--gray)', borderRadius: 8, width: '100%', touchAction: 'none', background: '#fff' }}
          onMouseDown={inicio} onMouseMove={mueve} onMouseUp={fin} onMouseLeave={fin}
          onTouchStart={inicio} onTouchMove={mueve} onTouchEnd={fin} />
        <div className="pill-row" style={{ marginTop: 10 }}>
          <button className="btn" disabled={!nombre.trim()} onClick={() => onGuardar(ref.current.toDataURL('image/png'), nombre.trim())}>✔ Firmar y cerrar</button>
          <button className="btn secondary" onClick={() => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height) }}>Limpiar</button>
          <button className="btn secondary" onClick={onCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function Home({ go }) {
  const [areas, setAreas] = useState([])
  const [bitacora, setBitacora] = useState(null)
  const [stats, setStats] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [sitio, setSitio] = useState('Accel-VPC')
  const [firmaAbrir, setFirmaAbrir] = useState(false)

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
      st[a.id] = { pct: evald ? Math.round((cum / evald) * 100) : null, pctw: pctPonderado(rows), evald, total: a.lineamientos.length, fotos: nf, listo: evald === a.lineamientos.length && nf >= 2 }
    }
    setStats(st)
  }

  async function iniciar() {
    setBusy(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('bitacoras').insert({ fecha: hoy(), usuario_email: user?.email || null, sitio }).select().single()
    setBusy(false)
    if (error) { setMsg('No se pudo iniciar: ' + error.message); return }
    // Pre-crear respuestas en 'no_revisado' para todos los lineamientos
    const rows = areas.flatMap(a => a.lineamientos.map(l => ({ bitacora_id: data.id, lineamiento_id: l.id })))
    if (rows.length) await supabase.from('respuestas').upsert(rows, { onConflict: 'bitacora_id,lineamiento_id' })
    setBitacora(data)
  }

  async function cerrar() {
    setFirmaAbrir(true)
  }

  async function confirmarCierre(firma, nombreFirma) {
    setFirmaAbrir(false)
    setBusy(true)
    await supabase.from('bitacoras').update({ firma_capturista: firma, firma_nombre: nombreFirma }).eq('id', bitacora.id)
    const { data, error } = await supabase.rpc('cerrar_bitacora', { p_bitacora: bitacora.id })
    setBusy(false)
    if (error || !data?.startsWith('OK')) { setMsg(data || error.message); return }
    setMsg('✅ Bitácora cerrada correctamente. Puedes generar el reporte en PDF abajo.')
    load()
  }

  const totalAreas = areas.length
  const areasListas = areas.filter(a => stats[a.id]?.listo).length

  return (
    <>
      <InstalarApp />
      {firmaAbrir && <FirmaModal onGuardar={confirmarCierre} onCerrar={() => setFirmaAbrir(false)} />}
      <div className="card">
        <h2>Bitácora del día — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
        <p style={{ color: 'var(--gray)', marginTop: -6 }}>La fecha se asigna automáticamente al iniciar la actividad.</p>
        {msg && <div className={msg.startsWith('ERROR') ? 'error-msg' : 'ok-msg'}>{msg}</div>}
        {!bitacora ? (
          <>
            <div className="filters">
              <div>
                <label>Sitio / almacén</label>
                <input type="text" value={sitio} onChange={e => setSitio(e.target.value)} placeholder="Ej. Accel-VPC" style={{ minWidth: 220 }} />
              </div>
              <button className="btn" onClick={iniciar} disabled={busy}>▶ Iniciar bitácora de hoy</button>
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--gray)' }}>La fecha se registra automáticamente al iniciar.</p>
          </>
        ) : (
          <div className="pill-row">
            <span className="badge ok">Bitácora abierta · {bitacora.fecha}</span>
            {bitacora.usuario_email && <span className="badge pend">👤 Iniciada por: {bitacora.usuario_email}</span>}
            <span className={areasListas === totalAreas ? 'badge ok' : 'badge pend'}>Áreas completas: {areasListas}/{totalAreas}</span>
            {bitacora.estado === 'abierta' && <button className="btn small danger" onClick={cerrar} disabled={busy}>🔒 Cerrar bitácora del día</button>}
            {bitacora.estado === 'cerrada' && <span className="badge ok">🔒 CERRADA</span>}
            <button className="btn small secondary" onClick={() => abrirReporte(bitacora.id)}>📄 Reporte PDF</button>
          </div>
        )}
        {bitacora?.estado === 'cerrada' && (
          <div className="pill-row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => abrirReporte(bitacora.id)}>📄 Generar reporte del día (PDF)</button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Áreas (toca una para evaluar)</h3>
        {!bitacora && <p>Inicia la bitácora para habilitar las áreas.</p>}
        <div className="grid-areas">
          {areas.map(a => {
            const s = stats[a.id] || {}
            const pct = s.pctw ?? s.pct
            return (
              <button key={a.id} className="area-btn" disabled={!bitacora || bitacora.estado === 'cerrada'} onClick={() => go('area', { area: a, bitacoraId: bitacora?.id })}>
                <strong>{a.nombre}</strong>
                {bitacora?.estado === 'cerrada' && <span className="badge ok">🔒 cerrada</span>}
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
