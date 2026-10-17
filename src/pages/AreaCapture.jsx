import React, { useEffect, useMemo, useState } from 'react'
import { supabase, CLOUDINARY, IS_DEMO } from '../supabase.js'
import { encolarFoto, flushCola, colaTam, onQueueChange } from '../photoQueue.js'
import Camara from '../components/Camara.jsx'
import Lightbox from '../components/Lightbox.jsx'

const MIN_FOTOS = 2

async function comprimir(file, maxSide = 1600, quality = 0.82, sello = null) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0, c.width, c.height)
  if (sello) {
    // Fecha/hora y contexto QUEMADOS en la imagen (no removibles con visor)
    const fs = Math.max(18, Math.round(c.width / 28))
    ctx.font = `bold ${fs}px monospace`
    const lines = sello.filter(Boolean)
    const pad = fs * 0.6
    const boxH = pad * 2 + fs * 1.35 * lines.length
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, c.height - boxH, c.width, boxH)
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    lines.forEach((t, i) => ctx.fillText(t, pad, c.height - boxH + pad + i * fs * 1.35))
  }
  return await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', quality))
}

function selloFoto(areaNombre, linTexto) {
  const f = new Date()
  const p = n => String(n).padStart(2, '0')
  const fecha = `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`
  const hora = `${p(f.getHours())}:${p(f.getMinutes())}:${p(f.getSeconds())}`
  return [`${fecha} ${hora}`, `Área: ${areaNombre}`, linTexto ? `Punto: ${linTexto.slice(0, 60)}` : null]
}

export default function AreaCapture({ go, params }) {
  const area = params.area
  const bitacoraId = params.bitacoraId
  const [lineamientos, setLineamientos] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [fotos, setFotos] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [colaN, setColaN] = useState(0)
  const [camara, setCamara] = useState(null) // null | {linId, linTexto}
  const [zoom, setZoom] = useState(null)

  const slug = useMemo(() => area.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'), [area])

  useEffect(() => {
    load() // cargar lineamientos/respuestas/fotos al entrar al área
    setColaN(colaTam())
    const un = onQueueChange(() => { setColaN(colaTam()); load() })
    const alVolver = () => flushCola()
    window.addEventListener('online', alVolver)
    const t = setInterval(() => { if (colaTam() > 0) flushCola() }, 30000)
    flushCola()
    return () => { un(); window.removeEventListener('online', alVolver); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area.id, bitacoraId])

  async function load() {
    const [{ data: lins }, { data: resp }, { data: fts }] = await Promise.all([
      supabase.from('lineamientos').select('*').eq('area_id', area.id).order('orden'),
      supabase.from('respuestas').select('*, lineamientos(clasificacion, texto)').eq('bitacora_id', bitacoraId),
      supabase.from('fotos').select('*').eq('bitacora_id', bitacoraId).eq('area_id', area.id).order('created_at')
    ])
    setLineamientos(lins || [])
    const map = {}
    for (const r of resp || []) map[r.lineamiento_id] = r
    setRespuestas(map)
    setFotos(fts || [])
  }

  async function setEstado(linId, estado) {
    setRespuestas(p => ({ ...p, [linId]: { ...p[linId], lineamiento_id: linId, estado } }))
    await supabase.from('respuestas').upsert(
      { bitacora_id: bitacoraId, lineamiento_id: linId, estado, actualizado_por: (await supabase.auth.getUser()).data.user.id },
      { onConflict: 'bitacora_id,lineamiento_id' }
    )
  }
  async function setComentario(linId, comentario) {
    setRespuestas(p => ({ ...p, [linId]: { ...p[linId], lineamiento_id: linId, comentario } }))
    clearTimeout(setComentario._t?.[linId])
    setComentario._t = setComentario._t || {}
    setComentario._t[linId] = setTimeout(() =>
      supabase.from('respuestas').upsert(
        { bitacora_id: bitacoraId, lineamiento_id: linId, comentario },
        { onConflict: 'bitacora_id,lineamiento_id' }
      ), 600)
  }

  // Procesa una foto ya capturada (desde cámara o archivo): comprime, sella y encola
  async function procesarFoto(blob, linId = null, linTexto = null) {
    const sello = selloFoto(area.nombre, linTexto)
    const urlObj = URL.createObjectURL(blob)
    const comp = await comprimir(urlObj, 1200, 0.75, sello)
    URL.revokeObjectURL(urlObj)
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result); r.onerror = rej
      r.readAsDataURL(comp)
    })
    encolarFoto({ dataUrl, bitacoraId, areaId: area.id, linId, areaSlug: slug })
  }

  async function onFotos(e, linId = null, linTexto = null) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setBusy(true); setMsg('')
    try {
      for (const f of files) await procesarFoto(f, linId, linTexto)
      await flushCola()
      await load()
      const n = colaTam()
      if (n > 0) setMsg(`⏳ Sin conexión: ${n} foto(s) guardadas en el teléfono. Se subirán automáticamente al regresar el internet.`)
    } catch (e2) { setMsg('⚠️ ' + e2.message) } finally { setBusy(false); e.target.value = '' }
  }

  async function onCapturaCamara(blob) {
    const { linId, linTexto } = camara || {}
    setCamara(null)
    setBusy(true); setMsg('')
    try {
      await procesarFoto(blob, linId, linTexto)
      await flushCola()
      await load()
      const n = colaTam()
      if (n > 0) setMsg(`⏳ Sin conexión: ${n} foto(s) en cola. Se subirán automáticamente al regresar el internet.`)
    } catch (e2) { setMsg('⚠️ ' + e2.message) } finally { setBusy(false) }
  }

  async function borrarFoto(f) {
    if (!confirm('¿Eliminar esta foto?')) return
    setBusy(true)
    try {
      // En producción el borrado de Cloudinary se hace firmado desde el servidor
      if (!IS_DEMO && !f.public_id.startsWith('demo-')) {
        const { error } = await supabase.functions.invoke('cloudinary-destroy', { body: { public_id: f.public_id } })
        if (error) console.warn('No se pudo borrar de Cloudinary (la foto se quitó de la app):', error.message)
      }
      const { error: err2 } = await supabase.from('fotos').delete().eq('id', f.id)
      if (err2) throw err2
      setFotos(p => p.filter(x => x.id !== f.id))
    } catch (e2) { setMsg('⚠️ No se pudo borrar: ' + e2.message) } finally { setBusy(false) }
  }

  const porClasif = useMemo(() => {
    const g = {}
    for (const l of lineamientos) (g[l.clasificacion] = g[l.clasificacion] || []).push(l)
    return g
  }, [lineamientos])

  const evaluados = lineamientos.filter(l => respuestas[l.id]?.estado && respuestas[l.id].estado !== 'no_revisado').length
  const cumple = lineamientos.filter(l => respuestas[l.id]?.estado === 'cumple').length
  const pct = evaluados ? Math.round((cumple / evaluados) * 100) : 0
  const completo = evaluados === lineamientos.length && fotos.length >= MIN_FOTOS

  return (
    <>
      <div className="card">
        <button className="btn secondary small" onClick={() => go('home')}>← Volver</button>
        <h2 style={{ marginTop: 10 }}>{area.nombre} <span className="badge pend">{bitacoraId ? '' : ''}</span></h2>
        <div className="pill-row" style={{ marginBottom: 8 }}>
          <span className="badge pend">{evaluados}/{lineamientos.length} evaluados</span>
          <span className={(fotos.length) >= MIN_FOTOS ? 'badge ok' : 'badge blocked'}>📷 {fotos.length}/{MIN_FOTOS} fotos mínimas</span>
          <span className="badge ok">{pct}% cumplimiento</span>
          {completo && <span className="badge ok">✔ Área completa</span>}
        </div>
        <div className="progress"><div style={{ width: `${(evaluados / Math.max(1, lineamientos.length)) * 100}%` }} /></div>
        {msg && <div className="error-msg" style={{ marginTop: 10 }}>{msg}</div>}
      </div>

      <div className="card">
        <h3>📷 Fotos generales del área (mínimo {MIN_FOTOS} — obligatorias para cerrar el área)</h3>
        <div className="pill-row" style={{ marginBottom: 8 }}>
          <button className="btn small" onClick={() => setCamara({ linId: null, linTexto: null })} disabled={busy}>📸 Tomar foto con la cámara</button>
          <label className="btn small secondary" style={{ margin: 0 }}>
            📎 Subir archivo(s)
            <input type="file" accept="image/*" capture="environment" multiple hidden onChange={e => onFotos(e)} disabled={busy} />
          </label>
          {busy && <span className="badge pend">Procesando…</span>}
        </div>
        {colaN > 0 && (
          <div className="pill-row">
            <span className="badge warn">⏳ {colaN} foto(s) en cola por subir (se envían solas al haber internet)</span>
            <button className="btn small secondary" onClick={async () => { setBusy(true); await flushCola(); await load(); setBusy(false) }}>Reintentar ahora</button>
          </div>
        )}
        {busy && <p>Subiendo…</p>}
        <div className="fotos-grid">
          {fotos.filter(f => !f.lineamiento_id).map(f => (
            <div key={f.id} className="foto-thumb" style={{ cursor: 'zoom-in' }} onClick={() => setZoom(f.url)}>
              <img src={f.url} alt="evidencia general" loading="lazy" />
              <button onClick={ev => { ev.stopPropagation(); borrarFoto(f) }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {Object.entries(porClasif).map(([clasif, lins]) => (
        <div key={clasif}>
          <div className="classif-head">{clasif}</div>
          {lins.map(l => {
            const r = respuestas[l.id] || {}
            const fotosLin = fotos.filter(f => f.lineamiento_id === l.id)
            return (
              <div key={l.id} className="lin">
                <div className="texto">{l.texto}</div>
                <div className="opts">
                  <button className={'opt cumple' + (r.estado === 'cumple' ? ' sel' : '')} onClick={() => setEstado(l.id, 'cumple')}>✔ Cumple</button>
                  <button className={'opt no_cumple' + (r.estado === 'no_cumple' ? ' sel' : '')} onClick={() => setEstado(l.id, 'no_cumple')}>✘ No cumple</button>
                  <button className={'opt no_revisado' + ((!r.estado || r.estado === 'no_revisado') ? ' sel' : '')} onClick={() => setEstado(l.id, 'no_revisado')}>— No revisado</button>
                  <button className={'opt foto-btn' + (fotosLin.length ? ' con-foto' : '')}
                    onClick={() => setCamara({ linId: l.id, linTexto: l.texto })}
                    title="Abrir cámara para este punto">
                    📷 Foto{fotosLin.length ? ` (${fotosLin.length})` : ''}
                  </button>
                  <label className="opt" style={{ fontSize: '.75rem' }} title="O subir desde archivo">
                    📎
                    <input type="file" accept="image/*" capture="environment" multiple hidden onChange={e => onFotos(e, l.id, l.texto)} />
                  </label>
                </div>
                {fotosLin.length > 0 && (
                  <div className="fotos-grid">
                    {fotosLin.map(f => (
                      <div key={f.id} className="foto-thumb" style={{ cursor: 'zoom-in' }} onClick={() => setZoom(f.url)}>
                        <img src={f.url} alt="evidencia" loading="lazy" />
                        <button onClick={ev => { ev.stopPropagation(); borrarFoto(f) }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea placeholder="Hallazgo / comentario…" value={r.comentario || ''} onChange={e => setComentario(l.id, e.target.value)} />
              </div>
            )
          })}
        </div>
      ))}

      <div className="card" style={{ textAlign: 'center' }}>
        <button className="btn" disabled={!completo} onClick={() => go('home')}>
          {completo ? '✔ Guardar y regresar' : `Falta: ${lineamientos.length - evaluados} lineamiento(s) por evaluar${fotos.length < MIN_FOTOS ? ` y ${MIN_FOTOS - fotos.length} foto(s)` : ''}`}
        </button>
      </div>
      {camara && <Camara onCaptura={onCapturaCamara} onClose={() => setCamara(null)} />}
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </>
  )
}
