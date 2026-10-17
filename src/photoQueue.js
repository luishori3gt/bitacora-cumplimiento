// Cola de fotos offline: si no hay conexión, las fotos comprimidas y con sello
// se guardan en el teléfono (localStorage) y se suben automáticamente al
// regresar la señal (evento 'online', reintento cada 30 s o al abrir el área).
import { supabase, CLOUDINARY, IS_DEMO } from './supabase.js'

const KEY = 'bitacora_foto_cola_v1'
let listeners = []
let flushing = false

const notify = () => listeners.forEach(cb => { try { cb() } catch { /* noop */ } })

export function onQueueChange(cb) {
  listeners.push(cb)
  return () => { listeners = listeners.filter(f => f !== cb) }
}

export function colaTam() {
  try { return (JSON.parse(localStorage.getItem(KEY)) || []).length } catch { return 0 }
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
function save(q) {
  try { localStorage.setItem(KEY, JSON.stringify(q)) } catch { /* cuota llena: se mantiene en memoria de esta sesión */ }
  notify()
}

// entry: { dataUrl, bitacoraId, areaId, linId, areaSlug }
export function encolarFoto(entry) {
  const q = load()
  q.push({
    id: 'q' + Date.now() + Math.random().toString(36).slice(2, 6),
    intentos: 0,
    ...entry
  })
  save(q)
  flushCola() // intento inmediato (suele haber conexión)
}

export async function flushCola() {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const q = load()
    if (!q.length) return
    const restantes = []
    for (const item of q) {
      try {
        // Solo subir si la bitácora sigue abierta
        const { data: b } = await supabase.from('bitacoras').select('estado').eq('id', item.bitacoraId).maybeSingle()
        if (!b || b.estado === 'cerrada') continue // se descarta (registro ya cerrado)
        const url = await subir(item)
        const { error } = await supabase.from('fotos').insert({
          bitacora_id: item.bitacoraId,
          area_id: item.areaId,
          lineamiento_id: item.linId,
          url,
          public_id: item.publicId,
          usuario_email: item.usuarioEmail || null
        })
        if (error) throw error
      } catch (e) {
        console.warn('Foto en cola: reintento pendiente', e?.message || e)
        restantes.push({ ...item, intentos: (item.intentos || 0) + 1 })
      }
    }
    save(restantes)
  } finally {
    flushing = false
  }
}

async function subir(item) {
  const blob = await (await fetch(item.dataUrl)).blob()
  if (IS_DEMO) {
    item.publicId = 'demo-' + Date.now()
    return item.dataUrl
  }
  item.publicId = `bitacora/${item.bitacoraId}/${item.areaSlug}/${item.id}`
  const fd = new FormData()
  fd.append('file', blob, item.id + '.jpg')
  fd.append('upload_preset', CLOUDINARY.uploadPreset)
  fd.append('public_id', item.publicId)
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error('Cloudinary respondió ' + r.status)
  return (await r.json()).secure_url
}
