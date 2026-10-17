import React, { useEffect, useRef, useState } from 'react'

// Modal de cámara en vivo (webcam en PC / cámara trasera en celular).
// onCaptura(blob) se llama con la foto capturada en JPEG.
export default function Camara({ onCaptura, onClose }) {
  const videoRef = useRef(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let stream = null
    let cancelado = false
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    }).then(s => {
      if (cancelado) { s.getTracks().forEach(t => t.stop()); return }
      stream = s
      if (videoRef.current) videoRef.current.srcObject = s
    }).catch(e => setErr(
      e.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Habilítalo en el candado 🔒 de la barra de direcciones y reintenta.'
        : 'No se pudo abrir la cámara: ' + (e.message || e.name)
    ))
    return () => { cancelado = true; stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  function capturar() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob(b => b && onCaptura(b), 'image/jpeg', 0.95)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 }}>
      {err ? (
        <div className="error-msg" style={{ maxWidth: 420 }}>{err}</div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted
          style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 12, background: '#000' }} />
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={capturar} disabled={!!err}>📸 Tomar foto</button>
        <button className="btn secondary" onClick={onClose}>Cancelar</button>
      </div>
      <div style={{ color: '#cbd5e1', fontSize: '.8rem' }}>La foto llevará el sello de fecha, hora y área automáticamente</div>
    </div>
  )
}
