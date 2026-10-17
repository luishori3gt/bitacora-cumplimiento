import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../supabase.js'

export default function Account({ session }) {
  const [factors, setFactors] = useState([])
  const [enroll, setEnroll] = useState(null) // {id, qr, secret}
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { load() }, [])

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
    </div>
  )
}
