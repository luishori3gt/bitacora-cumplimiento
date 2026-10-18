import React from 'react'

// Red de seguridad: si un error de render ocurre, muestra un mensaje claro
// en lugar de una pantalla gris, con opción de recargar.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Error de interfaz:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>😕</div>
          <h2 style={{ margin: 0 }}>Algo salió mal en la pantalla</h2>
          <p style={{ color: 'var(--gray)', maxWidth: 420 }}>
            Tus datos están a salvo. Recarga la aplicación para continuar; si el problema persiste, comparte este detalle:
          </p>
          <code style={{ background: '#f1f5f9', padding: 8, borderRadius: 8, fontSize: '.75rem', maxWidth: 500, wordBreak: 'break-word' }}>
            {String(this.state.error?.message || this.state.error)}
          </code>
          <button className="btn" onClick={() => location.reload()}>Recargar aplicación</button>
        </div>
      )
    }
    return this.props.children
  }
}
