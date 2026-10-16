import React, { useState } from 'react'
import { supabase, IS_DEMO } from '../supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState('')
  const [needsTotp, setNeedsTotp] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (!needsTotp) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
        // ¿Tiene factores 2FA? => exigir challenge
        const { data: factors } = await supabase.auth.mfa.listFactors()
        if (factors?.totp?.length > 0) { setNeedsTotp(true); await supabase.auth.signOut(); setErr('Ingresa tu código de verificación en 2 pasos (2FA).') }
      } else {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const factorId = factors?.totp?.[0]?.id
        if (!factorId) throw new Error('No hay factor 2FA registrado.')
        const chall = await supabase.auth.mfa.challenge({ factorId })
        if (chall.error) throw chall.error
        const verify = await supabase.auth.mfa.verify({ factorId, challengeId: chall.data.id, code: code.replace(/\s/g, '') })
        if (verify.error) throw new Error('Código incorrecto. Intenta de nuevo.')
      }
    } catch (e2) { setErr(e2.message || String(e2)) } finally { setBusy(false) }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>📋 Bitácora de Cumplimiento</h1>
        <p className="sub">Evidencias fotográficas · Accel-VPC</p>
        {err && <div className="error-msg">{err}</div>}
        {IS_DEMO && <div className="ok-msg">🧪 Modo demo: escribe cualquier correo y contraseña para entrar.</div>}
        {!needsTotp ? (
          <>
            <label>Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required autoComplete="current-password" />
            <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Verificando…' : 'Iniciar sesión'}</button>
          </>
        ) : (
          <>
            <label>Código de 2 pasos (app autenticadora)</label>
            <input type="text" inputMode="numeric" placeholder="123 456" value={code}
              onChange={e => setCode(e.target.value)} autoFocus style={{ letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center' }} />
            <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Verificando…' : 'Verificar'}</button>
          </>
        )}
      </form>
    </div>
  )
}
