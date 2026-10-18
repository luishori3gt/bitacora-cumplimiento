import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase.js'
import Lightbox from '../components/Lightbox.jsx'
import { abrirReporte } from '../reporte.js'

const ESTADO_BADGE = { cumple: 'ok', no_cumple: 'blocked', no_revisado: 'pend' }
const ESTADO_TXT = { cumple: '✔ Cumple', no_cumple: '✘ No cumple', no_revisado: '— No revisado' }

export default function Historicos() {
  const [bitacoras, setBitacoras] = useState([])
  const [sel, setSel] = useState('')           // bitacora_id
  const [areas, setAreas] = useState([])       // resumen por área de esa bitácora
  const [selArea, setSelArea] = useState(null) // {id, nombre}
  const [lineamientos, setLineamientos] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [fotos, setFotos] = useState([])
  const [zoom, setZoom] = useState(null) // {urls:[], idx}
  const [fArea, setFArea] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fUsuario, setFUsuario] = useState('')

  useEffect(() => { (async () => {
    const { data: bs } = await supabase.from('bitacoras').select('id, fecha, estado').order('fecha', { ascending: false }).limit(180)
    setBitacoras(bs || [])
  })() }, [])

  useEffect(() => {
    if (!sel) { setAreas([]); setSelArea(null); return }
    setSelArea(null)
    ;(async () => {
      const [{ data: ar }, { data: cal }, { data: fts }] = await Promise.all([
        supabase.from('areas').select('id, nombre, lineamientos(id)').order('orden'),
        supabase.from('v_calificaciones').select('*').eq('bitacora_id', sel),
        supabase.from('fotos').select('id, area_id, lineamiento_id, url').eq('bitacora_id', sel)
      ])
      setAreas((ar || []).map(a => {
        const rows = (cal || []).filter(c => c.area_id === a.id)
        const cum = rows.reduce((s, r) => s + Number(r.cumple), 0)
        const ev = rows.reduce((s, r) => s + Number(r.cumple) + Number(r.no_cumple), 0)
        return { ...a, pct: ev ? Math.round((cum / ev) * 100) : null, fotos: (fts || []).filter(f => f.area_id === a.id).length }
      }))
    })()
  }, [sel])

  useEffect(() => {
    if (!sel || !selArea) { setLineamientos([]); setFotos([]); return }
    ;(async () => {
      const [{ data: lins }, { data: resp }, { data: fts }] = await Promise.all([
        supabase.from('lineamientos').select('*').eq('area_id', selArea.id).order('orden'),
        supabase.from('respuestas').select('lineamiento_id, estado, comentario, usuario_email, updated_at').eq('bitacora_id', sel),
        supabase.from('fotos').select('*').eq('bitacora_id', sel).eq('area_id', selArea.id).order('created_at')
      ])
      setLineamientos(lins || [])
      const map = {}
      for (const r of resp || []) map[r.lineamiento_id] = r
      setRespuestas(map)
      setFotos(fts || [])
    })()
  }, [sel, selArea])

  const porClasif = useMemo(() => {
    let lins = lineamientos
    if (fArea) lins = lins // filtro de área ya se aplica al elegir el área
    const g = {}
    for (const l of lins) {
      const r = respuestas[l.id] || {}
      if (fEstado && (r.estado || 'no_revisado') !== fEstado) continue
      if (fUsuario && (r.usuario_email || '') !== fUsuario) continue
      ;(g[l.clasificacion] = g[l.clasificacion] || []).push(l)
    }
    return g
  }, [lineamientos, respuestas, fEstado, fUsuario])

  const usuarios = useMemo(() => {
    return [...new Set(Object.values(respuestas).map(r => r.usuario_email).filter(Boolean))]
  }, [respuestas])

  const bitacora = bitacoras.find(b => b.id === sel)

  return (
    <>
      <div className="card">
        <h2>🗂 Históricos — evidencias y evaluaciones</h2>
        <div className="filters">
          <div>
            <label>Bitácora (día)</label>
            <select value={sel} onChange={e => setSel(e.target.value)}>
              <option value="">— Elige una fecha —</option>
              {bitacoras.map(b => <option key={b.id} value={b.id}>{b.fecha} {b.estado === 'cerrada' ? '🔒' : '(abierta)'}</option>)}
            </select>
          </div>
        {selArea && (
            <button className="btn secondary small" onClick={() => setSelArea(null)}>← Todas las áreas</button>
          )}
          {sel && (
            <>
              <div>
                <label>Solo estado</label>
                <select value={fEstado} onChange={e => setFEstado(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="cumple">✔ Cumplen</option>
                  <option value="no_cumple">✘ No cumplen</option>
                  <option value="no_revisado">— No revisados</option>
                </select>
              </div>
              <div>
                <label>Evaluó</label>
                <select value={fUsuario} onChange={e => setFUsuario(e.target.value)}>
                  <option value="">Cualquiera</option>
                  {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button className="btn" onClick={() => abrirReporte(sel)}>📄 Reporte PDF del día</button>
            </>
          )}
        </div>
        {bitacora && <div className="pill-row">
          <span className="badge pend">Fecha: {bitacora.fecha}</span>
          <span className={bitacora.estado === 'cerrada' ? 'badge ok' : 'badge warn'}>{bitacora.estado === 'cerrada' ? '🔒 Cerrada' : 'Abierta (puede estar en captura)'}</span>
        </div>}
      </div>

      {/* Nivel 1: áreas de esa bitácora */}
      {sel && !selArea && (
        <div className="card">
          <h3>Áreas de la bitácora</h3>
          <div className="grid-areas">
            {areas.map(a => (
              <button key={a.id} className="area-btn" onClick={() => setSelArea(a)}>
                <strong>{a.nombre}</strong>
                <div className="pill-row">
                  {a.pct != null && <span className="badge ok">{a.pct}%</span>}
                  <span className={a.fotos >= 2 ? 'badge ok' : 'badge pend'}>📷 {a.fotos} fotos</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nivel 2: subpuntos del área con sus fotos */}
      {sel && selArea && (
        <>
          <div className="card">
            <h3>{selArea.nombre}</h3>
            <p style={{ color: 'var(--gray)', margin: 0 }}>
              {lineamientos.length} lineamientos · {fotos.length} fotos en esta área
            </p>
          </div>
          {Object.entries(porClasif).map(([clasif, lins]) => (
            <div key={clasif}>
              <div className="classif-head">{clasif}</div>
              {lins.map(l => {
                const r = respuestas[l.id] || {}
                const fotosLin = fotos.filter(f => f.lineamiento_id === l.id)
                const ftsGenerales = fotos.filter(f => !f.lineamiento_id)
                return (
                  <div key={l.id} className="lin">
                    <div className="texto" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span>{l.texto}</span>
                      <span className={'badge ' + (ESTADO_BADGE[r.estado || 'no_revisado'])} style={{ whiteSpace: 'nowrap' }}>
                        {ESTADO_TXT[r.estado || 'no_revisado']}
                      </span>
                    </div>
                    {r.comentario && (
                      <div style={{ background: '#fef3c7', color: '#92400e', borderRadius: 8, padding: '6px 10px', fontSize: '.85rem', margin: '6px 0' }}>
                        💬 {r.comentario}
                      </div>
                    )}
                    {(r.usuario_email || r.updated_at) && (
                      <div style={{ fontSize: '.72rem', color: 'var(--gray)', marginTop: 4 }}>
                        👤 Evaluó: {r.usuario_email || '—'}{r.updated_at ? ` · ${new Date(r.updated_at).toLocaleString('es-MX')}` : ''}
                      </div>
                    )}
                    {fotosLin.length > 0 && (
                      <>
                        <div className="pill-row" style={{ marginTop: 4 }}>
                          <span className="badge pend">📷 Evidencia del punto</span>
                          {fotosLin.some(f => f.usuario_email) && (
                            <span className="badge pend">👤 {fotosLin.find(f => f.usuario_email)?.usuario_email}</span>
                          )}
                        </div>
                        <div className="fotos-grid">
                          {fotosLin.map(f => (
                            <div key={f.id} className="foto-thumb" style={{ cursor: 'zoom-in' }}
                              onClick={() => setZoom({ urls: fotosLin.map(x => x.url), idx: fotosLin.indexOf(f) })}>
                              <img src={f.url} alt="evidencia" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {!fotosLin.length && <div style={{ color: 'var(--gray)', fontSize: '.8rem', marginTop: 4 }}>Sin fotos específicas de este punto</div>}
                  </div>
                )
              })}
              {/* fotos generales del área, al final de la última clasificación */}
            </div>
          ))}
          {fotos.some(f => !f.lineamiento_id) && (
            <div className="card">
              <h3>📷 Fotos generales del área</h3>
              <div className="fotos-grid">
                {fotos.filter(f => !f.lineamiento_id).map(f => (
                  <div key={f.id} className="foto-thumb" style={{ cursor: 'zoom-in' }}
                    onClick={() => setZoom({ urls: fotos.filter(x => !x.lineamiento_id).map(x => x.url), idx: fotos.filter(x => !x.lineamiento_id).indexOf(f) })}>
                    <img src={f.url} alt="evidencia general" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!sel && <div className="card"><p>Selecciona una fecha para ver lo evaluado y sus evidencias.</p></div>}
      <Lightbox srcs={zoom?.urls || []} index={zoom?.idx || 0} onIndex={i => setZoom(z => ({ ...z, idx: i }))} onClose={() => setZoom(null)} />
    </>
  )
}
