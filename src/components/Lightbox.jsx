import React from 'react'

// Visor a pantalla completa para ampliar una foto. Clic en cualquier parte (o ✕) para cerrar.
export default function Lightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 16
    }}>
      <img src={src} alt="evidencia ampliada" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,.6)' }} />
      <button onClick={onClose} style={{
        position: 'fixed', top: 12, right: 16, background: 'rgba(255,255,255,.15)', color: '#fff',
        border: 0, borderRadius: 8, fontSize: 20, padding: '6px 12px', cursor: 'pointer'
      }}>✕</button>
    </div>
  )
}
