import React, { useEffect } from 'react'

// Visor a pantalla completa con carrusel:
// ‹ › o flechas del teclado para navegar, Escape para salir.
export default function Lightbox({ srcs = [], index = 0, onIndex, onClose }) {
  const src = srcs[index]

  useEffect(() => {
    if (src == null) return
    const h = e => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && index < srcs.length - 1) onIndex(index + 1)
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [src, index, srcs.length, onClose, onIndex])

  if (src == null) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 16
    }}>
      <img src={src} alt="evidencia ampliada" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,.6)' }} />

      {srcs.length > 1 && index > 0 && (
        <button onClick={e => { e.stopPropagation(); onIndex(index - 1) }} title="Anterior (←)" style={{
          position: 'fixed', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)',
          color: '#fff', border: 0, borderRadius: 10, fontSize: 28, padding: '10px 16px', cursor: 'pointer'
        }}>‹</button>
      )}
      {srcs.length > 1 && index < srcs.length - 1 && (
        <button onClick={e => { e.stopPropagation(); onIndex(index + 1) }} title="Siguiente (→)" style={{
          position: 'fixed', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)',
          color: '#fff', border: 0, borderRadius: 10, fontSize: 28, padding: '10px 16px', cursor: 'pointer'
        }}>›</button>
      )}
      {srcs.length > 1 && (
        <div style={{ position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)', color: '#cbd5e1', fontSize: '.85rem' }}>
          {index + 1} / {srcs.length}
        </div>
      )}
      <button onClick={onClose} title="Cerrar (Esc)" style={{
        position: 'fixed', top: 12, right: 16, background: 'rgba(255,255,255,.15)', color: '#fff',
        border: 0, borderRadius: 8, fontSize: 20, padding: '6px 12px', cursor: 'pointer'
      }}>✕</button>
    </div>
  )
}
