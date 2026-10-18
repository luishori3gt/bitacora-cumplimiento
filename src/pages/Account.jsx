import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../supabase.js'
import { SEV_TXT } from '../severidad.js'

export default function Account({ session }) {
  const [factors, setFactors] = useState([])
  const [enroll, setEnroll] = useState(null) // {id, qr, secret}
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  // extras v2
  const [areas, setAreas] = useState([])
  const [nuevaLin, setNuevaLin] = useState({ area_id: '', clasificacion: '', texto: '', severidad: 'mayor' })
  const [qrArea, setQrArea] = useState(null)
  const [horaRecordatorio, setHoraRecordatorio] = useState(localStorage.getItem('bitacora_recordatorio') || '09:00')
  const [notifEstado, setNotifEstado] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')

  useEffect(() => { load(); cargarAreas() }, [])

  async function cargarAreas() {
    const { data } = await supabase.from('areas').select('id, nombre, lineamientos(id, clasificacion, texto, severidad)').order('orden')
    setAreas(data || [])
  }

  // ===== Recordatorio diario =====
  async function activarRecordatorio() {
    let permiso = Notification.permission
    if (permiso !== 'granted') permiso = await Notification.requestPermission()
    setNotifEstado(permiso)
    if (permiso !== 'granted') { setErr('No se otorgó permiso de notificaciones.'); return }
    localStorage.setItem('bitacora_recordatorio', horaRecordatorio)
    setMsg(`✅ Recordatorio configurado a las ${horaRecordatorio} (suena mientras la app esté instalada/abierta ese día).`)
  }
  function probarRecordatorio() {
    if (Notification.permission === 'granted') new Notification('📋 Bitácora de Cumplimiento', { body: 'Es hora de realizar tu bitácora del día.' })
  }

  // ===== Respaldo completo =====
  async function respaldoJSON() {
    setMsg('Generando respaldo…')
    const [a, l, b, r, f, ac] = await Promise.all([
      supabase.from('areas').select('*'), supabase.from('lineamientos').select('*'),
      supabase.from('bitacoras').select('*'), supabase.from('respuestas').select('*'),
      supabase.from('fotos').select('*'), supabase.from('acciones').select('*')
    ])
    const dump = { generado: new Date().toISOString(), areas: a.data, lineamientos: l.data, bitacoras: b.data, respuestas: r.data, fotos: f.data, acciones: ac.data }
    const blob = new Blob([JSON.stringify(dump, null, 1)], { type: 'application/json' })
    const el = document.createElement('a')
    el.href = URL.createObjectURL(blob)
    el.download = `respaldo_bitacora_${new Date().toISOString().slice(0, 10)}.json`
    el.click()
    setMsg('✅ Respaldo descargado.')
  }

  // ===== Editor de catálogo =====
  async function agregarLineamiento() {
    if (!nuevaLin.area_id || !nuevaLin.clasificacion.trim() || !nuevaLin.texto.trim()) { setErr('Completa área, clasificación y texto.'); return }
    const { count } = await supabase.from('lineamientos').select('*', { count: 'exact', head: true }).eq('area_id', nuevaLin.area_id)
    await supabase.from('lineamientos').insert({ ...nuevaLin, orden: count || 0 })
    setNuevaLin({ area_id: '', clasificacion: '', texto: '', severidad: 'mayor' })
    setMsg('✅ Lineamiento agregado.'); cargarAreas()
  }
  async function borrarLineamiento(id) {
    if (!confirm('¿Eliminar este lineamiento del catálogo?')) return
    await supabase.from('lineamientos').delete().eq('id', id)
    cargarAreas()
  }

  async function mostrarQR(a) {
    const url = `${location.origin}${location.pathname}?areaId=${a.id}`
    const qr = await QRCode.toDataURL(url, { width: 240 })
    setQrArea({ nombre: a.nombre, qr })
  }

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.totp || [])
  }

  async function limpiarPendientes() {
    // Borra factores sin verificar (intentos de activación a medias)
    const { data } = await supabase.auth.mfa.listFactors()
    for (const f of data?.totp || []) {
      if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
  }

  async function iniciarEnrolamiento() {
    setErr(''); setMsg('')
    let { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Bitácora 2FA' })
    if (error && /already exists/i.test(error.message || '')) {
      // Quedó un factor pendiente de un intento anterior: limpiar y reintentar
      await limpiarPendientes()
      ({ data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Bitácora 2FA' }))
    }
    if (error) { setErr(error.message); return }
    const qr = await QRCode.toDataURL(data.totp.url, { width: 220 })
    setEnroll({ id: data.id, qr, secret: data.totp.secret })
  }

  async function verificar() {
    setErr('')
    const chall = await supabase.auth.mfa.challenge({ factorId: enroll.id })
    if (chall.error) { setErr(chall.error.message); return }
    const { error } = await supabase.auth.mfa.verify({ factorId: enroll.id, challengeId: chall.data.id, code: code.replace(/\s/g, '') })
    if (error) { setErr('Código incorrecto, intenta de nuevo.'); return }
    setMsg('✅ 2FA activado. Por seguridad, cerraremos sesión en unos segundos: vuelve a entrar con tu contraseña y el código de 6 dígitos.')
    setEnroll(null); setCode(''); load()
    setTimeout(() => supabase.auth.signOut(), 4000)
  }

  async function quitar(id) {
    if (!confirm('¿Desactivar este factor 2FA?')) return
    await supabase.auth.mfa.unenroll({ factorId: id })
    load()
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2>🔐 Seguridad · Verificación en 2 pasos (2FA)</h2>
      <p style={{ color: 'var(--gray)' }}>Usuario: <b>{session.user.email}</b></p>
      {msg && <div className="ok-msg">{msg}</div>}
      {err && <div className="error-msg">{err}</div>}

      <h3>Factores registrados</h3>
      {factors.filter(f => f.status === 'verified').length === 0 && (
        <p style={{ color: 'var(--amber)' }}>⚠️ No tienes 2FA activado. Actívalo para cumplir la política de TI.</p>
      )}
      <ul>
        {factors.map(f => (
          <li key={f.id} style={{ marginBottom: 8 }}>
            {f.friendly_name || 'Autenticador'} —{' '}
            {f.status === 'verified'
              ? <span className="badge ok">activo</span>
              : <span className="badge warn">pendiente de verificar</span>}{' '}
            <button className="btn small danger" onClick={() => quitar(f.id)}>
              {f.status === 'verified' ? 'Desactivar' : 'Descartar'}
            </button>
          </li>
        ))}
      </ul>

      {!enroll && <button className="btn" onClick={iniciarEnrolamiento}>+ Activar / agregar 2FA</button>}

      {enroll && (
        <div style={{ textAlign: 'center' }}>
          <p>1. Escanea este código con <b>Google Authenticator</b> o Microsoft Authenticator:</p>
          <img src={enroll.qr} alt="QR 2FA" style={{ borderRadius: 8 }} />
          <p style={{ fontSize: '.8rem', color: 'var(--gray)' }}>O ingresa la clave manual: <code>{enroll.secret}</code></p>
          <p>2. Ingresa el código de 6 dígitos de la app:</p>
          <input type="text" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)}
            placeholder="123456" style={{ letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center', width: 160 }} />
          <div><button className="btn" onClick={verificar}>Verificar y activar</button></div>
        </div>
      )}
      {/* ===== Recordatorio diario ===== */}
      <div className="card" style={{ maxWidth: 480, margin: '16px auto' }}>
        <h2>⏰ Recordatorio diario</h2>
        <p style={{ color: 'var(--gray)' }}>Recibe una notificación para no olvidar la bitácora del día.</p>
        <div className="filters">
          <div><label>Hora</label><input type="time" value={horaRecordatorio} onChange={e => setHoraRecordatorio(e.target.value)} /></div>
          <button className="btn" onClick={activarRecordatorio}>Activar recordatorio</button>
          {notifEstado === 'granted' && <button className="btn secondary" onClick={probarRecordatorio}>Probar</button>}
        </div>
      </div>

      {/* ===== Respaldo ===== */}
      <div className="card" style={{ maxWidth: 480, margin: '16px auto' }}>
        <h2>💾 Respaldo de datos</h2>
        <p style={{ color: 'var(--gray)' }}>Descarga todo el contenido (catálogo, bitácoras, evaluaciones y ligas de fotos) en un archivo JSON.</p>
        <button className="btn" onClick={respaldoJSON}>Descargar respaldo completo</button>
      </div>

      {/* ===== QR de áreas ===== */}
      <div className="card" style={{ maxWidth: 480, margin: '16px auto' }}>
        <h2>🔳 Códigos QR por área</h2>
        <p style={{ color: 'var(--gray)' }}>Imprime y pega el QR en cada área: al escanearlo se abre directo su checklist.</p>
        <div className="filters">
          <div>
            <label>Área</label>
            <select value={qrArea?.id || ''} onChange={e => mostrarQR(areas.find(a => a.id === e.target.value))}>
              <option value="">— Elige un área —</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>
        {qrArea && <div style={{ textAlign: 'center' }}><img src={qrArea.qr} alt={`QR ${qrArea.nombre}`} style={{ borderRadius: 8 }} /><p><b>{qrArea.nombre}</b></p></div>}
      </div>

      {/* ===== Editor de catálogo ===== */}
      <div className="card" style={{ maxWidth: 640, margin: '16px auto' }}>
        <h2>🛠 Editor de lineamientos</h2>
        <p style={{ color: 'var(--gray)' }}>Agrega o elimina lineamientos del catálogo (área → clasificación → texto → severidad).</p>
        <div className="filters">
          <div style={{ flex: 1, minWidth: 180 }}>
            <label>Área</label>
            <select value={nuevaLin.area_id} onChange={e => setNuevaLin(p => ({ ...p, area_id: e.target.value }))}>
              <option value="">— Elige —</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Clasificación</label>
            <input type="text" value={nuevaLin.clasificacion} onChange={e => setNuevaLin(p => ({ ...p, clasificacion: e.target.value }))} placeholder="Ej. Instalaciones" />
          </div>
        </div>
        <label>Lineamiento</label>
        <input type="text" value={nuevaLin.texto} onChange={e => setNuevaLin(p => ({ ...p, texto: e.target.value }))} placeholder="Texto del lineamiento a cumplir" />
        <div className="filters">
          <div>
            <label>Severidad</label>
            <select value={nuevaLin.severidad} onChange={e => setNuevaLin(p => ({ ...p, severidad: e.target.value }))}>
              {Object.entries(SEV_TXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn" onClick={agregarLineamiento}>+ Agregar lineamiento</button>
        </div>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600, margin: '10px 0' }}>Ver catálogo actual ({areas.reduce((s, a) => s + (a.lineamientos?.length || 0), 0)} lineamientos)</summary>
          {areas.map(a => (
            <div key={a.id} style={{ marginBottom: 10 }}>
              <div className="classif-head">{a.nombre}</div>
              {(a.lineamientos || []).map(l => (
                <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.8rem', padding: '3px 0' }}>
                  <span style={{ flex: 1 }}>{l.texto} <i style={{ color: 'var(--gray)' }}>({l.clasificacion} · {SEV_TXT[l.severidad] || l.severidad})</i></span>
                  <button className="btn small danger" onClick={() => borrarLineamiento(l.id)}>✕</button>
                </div>
              ))}
            </div>
          ))}
        </details>
      </div>
    </div>
  )
}
