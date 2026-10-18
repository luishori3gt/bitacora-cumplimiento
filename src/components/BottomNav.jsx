import React from 'react'

// Barra de navegación inferior estilo app móvil (solo visible en pantallas pequeñas).
export default function BottomNav({ route, go }) {
  const items = [
    { page: 'home', icono: '📋', texto: 'Bitácora' },
    { page: 'acciones', icono: '✅', texto: 'Acciones' },
    { page: 'dashboard', icono: '📊', texto: 'Indicadores' },
    { page: 'historicos', icono: '🗂', texto: 'Históricos' },
    { page: 'account', icono: '🔐', texto: 'Cuenta' }
  ]
  return (
    <nav className="bottomnav">
      {items.map(it => (
        <button key={it.page} className={route.page === it.page ? 'active' : ''} onClick={() => go(it.page)}>
          <span style={{ fontSize: '1.2rem' }}>{it.icono}</span>
          <span>{it.texto}</span>
        </button>
      ))}
    </nav>
  )
}
