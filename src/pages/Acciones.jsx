import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { SEV_TXT, SEV_COLOR } from '../severidad.js'

const ESTATUS = ['abierta', 'en_proceso', 'resuelta', 'cancelada']
const EST_TXT = { abierta: 'Abierta', en_proceso: 'En proceso', resuelta: 'Resuelta', cancelada: 'Cancelada' }
const EST_BADGE = { abierta: 'blocked', en_proceso: 'warn', resuelta: 'ok', cancelada: 'pend' }

export default function Acciones() {
  const [acciones, setAcciones] = useState([])
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('acciones').select('*').order('created_at', { ascending: false }).limit(300)
    setAcciones(data || [])
  }

  async function actualizar(id, campo, valor) {
    const patch = { [campo]: valor }
    if (campo === 'estatus' && (valor === 'resuelta' || valor === 'cancelada')) patch.cerrada_at = new Date().toISOString()
    await supabase.from('acciones').update(patch).eq('id', id)
    load()
  }

  const visibles = filtro === 'todas' ? acciones : acciones.filter(a => a.estatus === filtro)
  const abiertas = acciones.filter(a => a.estatus === 'abierta').length
  const criticas = acciones.filter(a => a.estatus !== 'resuelta' && a.estatus !== 'cancelada' && a.severidad === 'critico').length

  return (
    <>
      <div className="card">
        <h2>✅ Acciones correctivas</h2>
        <p style={{ color: 'var(--gray)', marginTop: -6 }}>Cada "No cumple" genera una acción con responsable y fecha límite. Ciérralas aquí al corregirse.</p>
        <div className="pill-row" style={{ marginBottom: 10 }}>
          <span className={abiertas ? 'badge blocked' : 'badge ok'}>{abiertas} abierta(s)</span>
          {criticas > 0 && <span className="badge blocked">❗ {criticas} crítica(s) sin resolver</span>}
          <span className="badge pend">{acciones.filter(a => a.estatus === 'resuelta').length} resueltas</span>
        </div>
        <div className="filters">
          <div>
            <label>Filtrar por estatus</label>
            <select value={filtro} onChange={e => setFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {ESTATUS.map(e => <option key={e} value={e}>{EST_TXT[e]}</option>)}
            </select>
          </div>
        </div>
      </div>

      {visibles.length === 0 && <div className="card"><p>No hay acciones en esta vista. 🎉</p></div>}
      {visibles.map(a => {
        const vencida = a.fecha_limite && a.estatus === 'abierta' && a.fecha_limite < new Date().toISOString().slice(0, 10)
        return (
          <div key={a.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
              <span className="badge" style={{ background: SEV_COLOR[a.severidad] === 'var(--red)' ? '#fee2e2' : SEV_COLOR[a.severidad] === 'var(--amber)' ? '#fef3c7' : '#e2e8f0', color: '#334155' }}>
                {SEV_TXT[a.severidad] || a.severidad}
              </span>
              <span className={'badge ' + EST_BADGE[a.estatus]}>{EST_TXT[a.estatus]}</span>
              {vencida && <span className="badge blocked">⏰ Vencida</span>}
              {a.usuario_email && <span className="badge pend">👤 {a.usuario_email}</span>}
              {a.created_at && <span className="badge pend">{a.created_at.slice(0, 10)}</span>}
            </div>
            <div style={{ fontWeight: 600 }}>{a.descripcion}</div>
            <div className="filters" style={{ marginBottom: 0, marginTop: 8 }}>
              <div>
                <label>Responsable</label>
                <input type="text" defaultValue={a.responsable || ''} onBlur={e => { if (e.target.value !== (a.responsable || '')) actualizar(a.id, 'responsable', e.target.value) }} placeholder="¿Quién corrige?" />
              </div>
              <div>
                <label>Fecha límite</label>
                <input type="date" defaultValue={a.fecha_limite || ''} onChange={e => actualizar(a.id, 'fecha_limite', e.target.value)} />
              </div>
              <div>
                <label>Estatus</label>
                <select value={a.estatus} onChange={e => actualizar(a.id, 'estatus', e.target.value)}>
                  {ESTATUS.map(e => <option key={e} value={e}>{EST_TXT[e]}</option>)}
                </select>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
