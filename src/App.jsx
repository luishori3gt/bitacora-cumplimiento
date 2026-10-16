import React, { useEffect, useState } from 'react'
import { supabase, IS_DEMO } from './supabase.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import AreaCapture from './pages/AreaCapture.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Account from './pages/Account.jsx'
import Historicos from './pages/Historicos.jsx'
import StorageBar from './components/StorageBar.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState({ page: 'home', params: {} })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="center"><p>Cargando…</p></div>
  if (!session) return <Login onLoggedIn={() => {}} />

  const mfaCompleted = session.mfa?.assuranceLevel === 'AAL2' || session.mfa?.assuranceLevel === 'AAL1'
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
          <button className={route.page === 'historicos' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('historicos')}>🗂 Históricos</button>
          <button className={route.page === 'account' ? 'nav-btn active' : 'nav-btn'} onClick={() => go('account')}>Cuenta / 2FA</button>
        </nav>
        <div className="topbar-right">
          <button className="nav-btn" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>
      {mfaCompleted === false && (
        <div className="banner-warn">⚠️ Verifica tu segundo factor (2FA) para continuar. Ve a <b>Cuenta / 2FA</b>.</div>
      )}
      {IS_DEMO && (
        <div className="banner-warn">🧪 <b>Modo demostración</b> — datos simulados en este navegador. Configura el archivo .env para conectar Supabase y Cloudinary en producción.</div>
      )}
      <StorageBar />
      <main>
        {route.page === 'home' && <Home go={go} />}
        {route.page === 'area' && <AreaCapture go={go} params={route.params} />}
        {route.page === 'dashboard' && <Dashboard />}
        {route.page === 'historicos' && <Historicos />}
        {route.page === 'account' && <Account session={session} />}
      </main>
      <footer className="footer">Bitácora de Cumplimiento · Accel-VPC · v1.0</footer>
    </div>
  )
}
