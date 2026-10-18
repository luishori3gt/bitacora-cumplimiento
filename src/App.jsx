import React, { useEffect, useState } from 'react'
import { supabase, IS_DEMO } from './supabase.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import AreaCapture from './pages/AreaCapture.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Account from './pages/Account.jsx'
import Historicos from './pages/Historicos.jsx'
import StorageBar from './components/StorageBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Acciones from './pages/Acciones.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tiene2FA, setTiene2FA] = useState(null) // null = desconocido
  const [route, setRoute] = useState({ page: 'home', params: {} })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        const { data: f } = await supabase.auth.mfa.listFactors()
        setTiene2FA((f?.totp || []).some(x => x.status === 'verified'))
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) setTiene2FA(null) })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Recordatorio diario local
  useEffect(() => {
    const t = setInterval(() => {
      const hora = localStorage.getItem('bitacora_recordatorio')
      if (!hora || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const ahora = new Date().toTimeString().slice(0, 5)
      const marcado = localStorage.getItem('bitacora_notif_' + new Date().toDateString())
      if (ahora >= hora && !marcado) {
        localStorage.setItem('bitacora_notif_' + new Date().toDateString(), '1')
        new Notification('📋 Bitácora de Cumplimiento', { body: 'Recuerda realizar la bitácora del día.' })
      }
    }, 60000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <div className="center"><p>Cargando…</p></div>
  if (!session) return <Login onLoggedIn={() => {}} />

  const aal2 = (session.mfa?.assuranceLevel || '').toUpperCase() === 'AAL2'
  const go = (page, params = {}) => setRoute({ page, params })

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => go('home')}>
          <span className="logo">📋</span> Bitácora de Cumplimiento
        </div>
        <nav>
          <button className={route.page === 'home' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('home')}>Bitácora</button>
          <button className={route.page === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('dashboard')}>Indicadores</button>
          <button className={route.page === 'acciones' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('acciones')}>✅ Acciones</button>
          <button className={route.page === 'historicos' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('historicos')}>🗂 Históricos</button>
          <button className={route.page === 'account' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('account')}>Cuenta / 2FA</button>
        </nav>
        <div className="topbar-right">
          <button className="nav-btn" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>
      {aal2 === false && tiene2FA === false && (
        <div className="banner-warn">🔐 Por política de TI debes activar tu <b>verificación en 2 pasos</b>. Ve a <b>Cuenta / 2FA</b> y escanea el código QR con tu celular.</div>
      )}
      {aal2 === false && tiene2FA === true && (
        <div className="banner-warn">🔐 Tu 2FA ya está activo. <b>Cierra sesión y vuelve a entrar</b> con tu contraseña + el código de 6 dígitos para verificar este dispositivo.</div>
      )}
      {IS_DEMO && (
        <div className="banner-warn">🧪 <b>Modo demostración</b> — datos simulados en este navegador. Configura el archivo .env para conectar Supabase y Cloudinary en producción.</div>
      )}
      <StorageBar />
      <main>
        {route.page === 'home' && <Home go={go} />}
        {route.page === 'area' && <AreaCapture go={go} params={route.params} />}
        {route.page === 'dashboard' && <Dashboard />}
        {route.page === 'acciones' && <Acciones />}
        {route.page === 'historicos' && <Historicos />}
        {route.page === 'account' && <Account session={session} />}
      </main>
      <BottomNav route={route} go={go} />
      <footer className="footer">Bitácora de Cumplimiento · Accel-VPC · v1.0</footer>
    </div>
  )
}
