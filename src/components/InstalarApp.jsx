import React, { useEffect, useState } from 'react'

// Tarjeta para instalar la app como aplicación (PWA) en PC, Android o iPhone.
export default function InstalarApp() {
  const [prompt, setPrompt] = useState(null)   // evento beforeinstallprompt (Android/PC)
  const [esIOS, setEsIOS] = useState(false)
  const [yaInstalada, setYaInstalada] = useState(false)
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    const h = e => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', h)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
    setYaInstalada(!!standalone)
    setEsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  if (oculto || yaInstalada) return null
  if (!prompt && !esIOS) return null // nada que ofrecer (navegador sin soporte)

  return (
    <div className="card" style={{ borderColor: 'var(--teal)', background: '#f0fdfa' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.6rem' }}>📲</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <b>Instalar como aplicación</b>
          {prompt ? (
            <div style={{ fontSize: '.85rem', color: 'var(--gray)' }}>En tu celular o computadora, con ícono propio y funcionamiento offline.</div>
          ) : (
            <div style={{ fontSize: '.85rem', color: 'var(--gray)' }}>
              En iPhone/iPad: toca el botón <b>Compartir ⬆️</b> del navegador y elige <b>"Agregar a pantalla de inicio"</b>.
            </div>
          )}
        </div>
        {prompt && (
          <button className="btn" onClick={async () => { prompt.prompt(); setOculto(true) }}>Instalar ahora</button>
        )}
        <button className="btn small secondary" onClick={() => setOculto(true)}>Ahora no</button>
      </div>
    </div>
  )
}
