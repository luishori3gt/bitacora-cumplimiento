import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

function fmt(bytes) {
  if (!bytes && bytes !== 0) return '—'
  const gb = bytes / 1024 ** 3
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB`
}

export default function StorageBar() {
  const [u, setU] = useState(null)

  useEffect(() => {
    let alive = true
    async function tick() {
      try {
        const { data, error } = await supabase.functions.invoke('cloudinary-usage')
        if (!error && alive) setU(data)
      } catch { /* función no desplegada aún */ }
    }
    tick()
    const t = setInterval(tick, 5 * 60 * 1000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  if (!u) return null
  const pct = Math.min(100, u.pct ?? 0)
  const cls = pct > 90 ? 'danger' : pct > 70 ? 'warn' : ''
  const restante = Math.max(0, u.limit_bytes - u.used_bytes)

  return (
    <div className="storage-wrap">
      <span>💾 Almacenamiento:</span>
      <div className="storage-track"><div className={`storage-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
      <span><b>{pct.toFixed(1)}%</b> · usado {fmt(u.used_bytes)} · disponible {fmt(restante)} de {fmt(u.limit_bytes)}</span>
    </div>
  )
}
