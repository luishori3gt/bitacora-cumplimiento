// ============================================================
// SERVIDOR LOCAL — Bitácora de Cumplimiento (100% offline)
// Corre en la red interna: node server/index.js
// Datos y fotos en ./data · Respaldos diarios a BACKUP_DIR
// ============================================================
import express from 'express'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'
import catalogo from '../src/catalogo.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '..', 'data')
const FOTOS = path.join(DATA, 'fotos')
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(DATA, 'respaldos')
const BACKUP_TIME = process.env.BACKUP_TIME || '20:00'
const PORT = process.env.PORT || 8080
const DB_FILE = path.join(DATA, 'db.json')

for (const d of [DATA, FOTOS, BACKUP_DIR]) fs.mkdirSync(d, { recursive: true })

// ---------------- Base de datos (JSON atómico) ----------------
function fresh() {
  const areas = [], lineamientos = []
  catalogo.forEach((a, i) => {
    const ls = a.items.map((it, j) => ({
      id: 'l' + i + '-' + j, area_id: 'area-' + i, clasificacion: it.clasificacion,
      texto: it.lineamiento, orden: j, severidad: sevDe(it.clasificacion)
    }))
    lineamientos.push(...ls)
    areas.push({ id: 'area-' + i, nombre: a.area, orden: i, lineamientos: undefined })
  })
  return {
    usuarios: [], areas, lineamientos, bitacoras: [], respuestas: [], fotos: [], acciones: [], factors: [], fotos_meta: []
  }
}
function sevDe(c = '') {
  c = c.toLowerCase()
  if (c.includes('lavado de manos') || c.includes('higiene') || c.includes('contaminaci') || c.includes('plagas')) return 'critico'
  if (c.includes('orden y limpieza')) return 'menor'
  return 'mayor'
}
let db
function load() {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch { db = fresh() }
  if (!db.usuarios) db = fresh()
}
function save() {
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db))
  fs.renameSync(tmp, DB_FILE)
}
load()
const uid = () => crypto.randomUUID()

// ---------------- Passwords (scrypt) ----------------
const hashPass = (p, salt = crypto.randomBytes(16).toString('hex')) =>
  [salt, crypto.scryptSync(p, salt, 32).toString('hex')].join(':')
const checkPass = (p, stored) => {
  const [salt, h] = stored.split(':')
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(p, salt, 32))
}

// usuario inicial
if (!db.usuarios.length) {
  db.usuarios.push({
    id: uid(), email: process.env.ADMIN_EMAIL || 'admin@local',
    pass: hashPass(process.env.ADMIN_PASSWORD || 'cambiar123'), nombre: 'Administrador'
  })
  save()
  console.log('Usuario inicial: ' + (process.env.ADMIN_EMAIL || 'admin@local') + ' / ' + (process.env.ADMIN_PASSWORD || 'cambiar123') + '  (CÁMBIALA)')
}

// ---------------- Sesiones (token firmado) ----------------
const SECRET_FILE = path.join(DATA, 'secret.key')
if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'))
const SECRET = fs.readFileSync(SECRET_FILE, 'utf8')
const sign = t => crypto.createHmac('sha256', SECRET).update(t).digest('hex')
function makeToken(payload, horas = 12) {
  const body = JSON.stringify({ ...payload, exp: Date.now() + horas * 3600e3 })
  return Buffer.from(body).toString('base64url') + '.' + sign(body)
}
function readToken(tok) {
  try {
    const [b64, sig] = tok.split('.')
    const body = Buffer.from(b64, 'base64url').toString()
    if (sign(body) !== sig) return null
    const p = JSON.parse(body)
    return p.exp > Date.now() ? p : null
  } catch { return null }
}
function userDeReq(req) {
  const tok = (req.headers.authorization || '').replace('Bearer ', '')
  const p = readToken(tok)
  return p ? db.usuarios.find(u => u.id === p.uid) : null
}

// ---------------- TOTP (2FA) ----------------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function b32encode(buf) { let bits = 0, val = 0, out = ''
  for (const b of buf) { val = (val << 8) | b; bits += 8
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5 } }
  if (bits) out += B32[(val << (5 - bits)) & 31]
  return out }
function b32decode(s) { let bits = 0, val = 0, out = []
  for (const ch of s.toUpperCase()) { const i = B32.indexOf(ch); if (i < 0) continue
    val = (val << 5) | i; bits += 5
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8 } }
  return Buffer.from(out) }
function totpCode(secretB32, t = Math.floor(Date.now() / 30000)) {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(t))
  const h = crypto.createHmac('sha1', b32decode(secretB32)).update(buf).digest()
  const off = h[19] & 15
  const num = ((h[off] & 127) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(num % 1e6).padStart(6, '0')
}
function totpVerify(secretB32, code) {
  const t = Math.floor(Date.now() / 30000)
  for (const tt of [t, t - 1, t + 1]) if (totpCode(secretB32, tt) === code.replace(/\s/g, '')) return true
  return false
}

// ---------------- Consultas estilo tabla ----------------
function vistaCalificaciones(filtros = {}) {
  const rows = []
  for (const b of db.bitacoras) {
    if (filtros.bitacora_id && b.id !== filtros.bitacora_id) continue
    for (const a of db.areas) {
      const byClas = {}
      for (const l of db.lineamientos.filter(l => l.area_id === a.id)) {
        const r = db.respuestas.find(x => x.bitacora_id === b.id && x.lineamiento_id === l.id)
        const c = (byClas[l.clasificacion] = byClas[l.clasificacion] || { total: 0, cumple: 0, no_cumple: 0, no_revisado: 0 })
        c.total++; const est = r?.estado || 'no_revisado'; c[est]++
      }
      const nf = db.fotos.filter(f => f.bitacora_id === b.id && f.area_id === a.id).length
      for (const [clasificacion, c] of Object.entries(byClas)) {
        let num = 0, den = 0, critNC = 0
        for (const l of db.lineamientos.filter(l => l.area_id === a.id && l.clasificacion === clasificacion)) {
          const r = db.respuestas.find(x => x.bitacora_id === b.id && x.lineamiento_id === l.id)
          const est = r?.estado || 'no_revisado'
          if (est === 'cumple' || est === 'no_cumple') {
            const p = l.severidad === 'critico' ? 1 : l.severidad === 'menor' ? 0.5 : 0.75
            den += p; if (est === 'cumple') num += p
            if (est === 'no_cumple' && l.severidad === 'critico') critNC++
          }
        }
        const evald = c.cumple + c.no_cumple
        rows.push({
          bitacora_id: b.id, fecha: b.fecha, estado_bitacora: b.estado, sitio: b.sitio || 'Accel-VPC',
          area_id: a.id, area: a.nombre, clasificacion,
          total_lineamientos: c.total, cumple: c.cumple, no_cumple: c.no_cumple, no_revisado: c.no_revisado,
          criticos_no_cumple: critNC,
          pct_ponderado: den ? Math.round(num / den * 1000) / 10 : null,
          pct_simple: evald ? Math.round(c.cumple / evald * 1000) / 10 : null, num_fotos: nf
        })
      }
    }
  }
  return rows
}
function vistaSeguimiento() {
  return db.lineamientos.map(l => {
    const rs = db.respuestas.filter(x => x.lineamiento_id === l.id)
    const cum = rs.filter(x => x.estado === 'cumple').length, nc = rs.filter(x => x.estado === 'no_cumple').length
    const ev = cum + nc
    const a = db.areas.find(a => a.id === l.area_id)
    return { area: a?.nombre, clasificacion: l.clasificacion, severidad: l.severidad, lineamiento: l.texto,
      cumple: cum, no_cumple: nc, evaluados: ev, pct_cumplimiento: ev ? Math.round(cum / ev * 1000) / 10 : null }
  })
}
function tabla(nombre) {
  if (nombre === 'v_calificaciones') return vistaCalificaciones()
  if (nombre === 'v_seguimiento_lineamientos') return vistaSeguimiento()
  if (nombre === 'areas') return db.areas.map(a => ({ ...a, lineamientos: db.lineamientos.filter(l => l.area_id === a.id).map(l => ({ id: l.id })) }))
  return db[nombre] || []
}

// ---------------- App ----------------
const app = express()
app.use(express.json({ limit: '25mb' }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  res.setHeader('Access-Control-Allow-Methods', '*')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})
app.use('/fotos', express.static(FOTOS))
const DIST = path.join(__dirname, '..', 'dist')
app.use(express.static(DIST))

// ---- auth ----
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body
  const u = db.usuarios.find(u => u.email.toLowerCase() === String(email).toLowerCase())
  if (!u || !checkPass(password || '', u.pass)) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
  if (u.totp_secret) {
    const tmp = makeToken({ uid: u.id, pend: '2fa' }, 0.25)
    return res.json({ session: null, temp_token: tmp, needs_2fa: true })
  }
  const session = makeToken({ uid: u.id })
  res.json({ session: { user: { id: u.id, email: u.email }, mfa: { assuranceLevel: 'aal1' } }, token: session, temp_token: null, needs_2fa: false })
})
function requerir(req, res) {
  const u = userDeReq(req)
  if (!u) { res.status(401).json({ error: 'no autenticado' }); return null }
  return u
}
app.post('/api/auth/mfa/verify', (req, res) => {
  const p = readToken((req.headers.authorization || '').replace('Bearer ', ''))
  const u = p && db.usuarios.find(x => x.id === p.uid)
  if (!u || !totpVerify(u.totp_secret, req.body.code)) return res.status(401).json({ error: 'Código incorrecto' })
  const token = makeToken({ uid: u.id })
  res.json({ session: { user: { id: u.id, email: u.email }, mfa: { assuranceLevel: 'aal2' } }, token })
})
app.get('/api/auth/me', (req, res) => {
  const u = requerir(req, res); if (!u) return
  res.json({ user: { id: u.id, email: u.email }, mfa: { assuranceLevel: (req.headers['x-aal'] || 'aal2') } })
})
app.post('/api/auth/cambiar-password', (req, res) => {
  const u = requerir(req, res); if (!u) return
  if (!checkPass(req.body.actual || '', u.pass)) return res.status(403).json({ error: 'Contraseña actual incorrecta' })
  u.pass = hashPass(req.body.nueva); save(); res.json({ ok: true })
})

// ---- MFA (compatibles con el flujo de la app) ----
app.post('/api/mfa/factors', (req, res) => {
  const tok = (req.headers.authorization || '').replace('Bearer ', '')
  let p = readToken(tok)
  if (!p) return res.status(401).json({ error: 'no autenticado' })
  const u = db.usuarios.find(x => x.id === p.uid)
  const factors = u.totp_secret ? [{ id: u.id, friendly_name: 'Bitácora 2FA', status: 'verified', factor_type: 'totp' }] : []
  res.json({ factors, temp_token: p.pend === '2fa' ? tok : null })
})
app.post('/api/mfa/enroll', (req, res) => {
  const u = requerir(req, res); if (!u) return
  const secret = b32encode(crypto.randomBytes(20))
  u._pend_secret = secret; save()
  const url = `otpauth://totp/Bitacora:${encodeURIComponent(u.email)}?secret=${secret}&issuer=Bitacora`
  QRCode.toDataURL(url, { width: 240 }).then(qr => res.json({ secret, url, qr }))
})
app.post('/api/mfa/enroll/verify', (req, res) => {
  const u = requerir(req, res); if (!u) return
  if (!totpVerify(u._pend_secret, req.body.code)) return res.status(401).json({ error: 'Código incorrecto' })
  u.totp_secret = u._pend_secret; delete u._pend_secret; save(); res.json({ ok: true })
})
app.post('/api/mfa/unenroll', (req, res) => {
  const u = requerir(req, res); if (!u) return
  delete u.totp_secret; save(); res.json({ ok: true })
})

// ---- consulta genérica ----
app.post('/api/query', (req, res) => {
  if (!requerir(req, res)) return
  const { tabla: nombreTabla, filters = [], order, limit, single, maybe } = req.body
  let rows = tabla(nombreTabla)
  for (const f of filters) {
    if (f.val && typeof f.val === 'object' && Array.isArray(f.val.in)) {
      rows = rows.filter(r => f.val.in.map(String).includes(String(r[f.col])))
    } else if (f.op === 'gte') {
      rows = rows.filter(r => String(r[f.col] ?? '') >= String(f.val))
    } else if (f.op === 'lte') {
      rows = rows.filter(r => String(r[f.col] ?? '') <= String(f.val))
    } else {
      rows = rows.filter(r => String(r[f.col]) === String(f.val))
    }
  }
  if (order) rows = [...rows].sort((x, y) => (order.asc ? 1 : -1) * String(x[order.col] ?? '').localeCompare(String(y[order.col] ?? '')))
  if (limit) rows = rows.slice(0, limit)
  if (single || maybe) return res.json({ data: rows[0] ?? null, error: null })
  res.json({ data: rows, error: null })
})
app.post('/api/mutate', (req, res) => {
  const u = requerir(req, res); if (!u) return
  const { op, tabla, row, cols, filters, onConflict } = req.body
  if (op === 'insert') {
    const creado = { id: uid(), ...row }
    db[tabla].push(creado); save()
    return res.json({ data: creado, error: null })
  }
  if (op === 'upsert') {
    const arr = Array.isArray(row) ? row : [row]
    for (const r of arr) {
      const i = db[tabla].findIndex(x => onConflict.every(c => String(x[c]) === String(r[c])))
      if (i >= 0) db[tabla][i] = { ...db[tabla][i], ...r }
      else db[tabla].push({ id: uid(), ...r })
    }
    save(); return res.json({ data: null, error: null })
  }
  if (op === 'update') {
    for (const r of db[tabla]) if (filters.every(f => String(r[f.col]) === String(f.val))) Object.assign(r, cols)
    save(); return res.json({ data: null, error: null })
  }
  if (op === 'delete') {
    db[tabla] = db[tabla].filter(r => !filters.every(f => String(r[f.col]) === String(f.val)))
    save(); return res.json({ data: null, error: null })
  }
  res.status(400).json({ error: 'op inválida' })
})

// ---- rpc cerrar_bitácora ----
app.post('/api/rpc/cerrar_bitacora', (req, res) => {
  requerir(req, res); if (!res.writableEnded) {
    const b = db.bitacoras.find(x => x.id === req.body.p_bitacora)
    if (!b) return res.json({ data: 'ERROR: bitácora no encontrada' })
    for (const a of db.areas) {
      const nf = db.fotos.filter(f => f.bitacora_id === b.id && f.area_id === a.id).length
      if (nf < 2) return res.json({ data: `ERROR: El área "${a.nombre}" tiene ${nf} foto(s). Se requieren mínimo 2.` })
      const sinEval = db.lineamientos.filter(l => l.area_id === a.id && !db.respuestas.find(x => x.bitacora_id === b.id && x.lineamiento_id === l.id && x.estado !== 'no_revisado')).length
      if (sinEval) return res.json({ data: `ERROR: El área "${a.nombre}" tiene ${sinEval} lineamiento(s) sin evaluar.` })
    }
    b.estado = 'cerrada'; b.cerrada_at = new Date().toISOString(); save()
    res.json({ data: 'OK' })
  }
})

// ---- subida de fotos (disco local) ----
app.post('/api/fotos/upload', (req, res) => {
  const u = requerir(req, res); if (!u) return
  const { bitacoraId, areaId, linId, dataUrl } = req.body
  const b = db.bitacoras.find(x => x.id === bitacoraId)
  if (!b || b.estado === 'cerrada') return res.status(400).json({ error: 'La bitácora está cerrada' })
  const b64 = String(dataUrl).split(',')[1]
  const id = uid()
  const file = path.join(FOTOS, id + '.jpg')
  fs.writeFileSync(file, Buffer.from(b64, 'base64'))
  const row = { id, bitacora_id: bitacoraId, area_id: areaId, lineamiento_id: linId || null,
    url: `/fotos/${id}.jpg`, public_id: id, usuario_email: u.email, created_at: new Date().toISOString() }
  db.fotos.push(row); save()
  res.json({ data: row, error: null })
})
app.post('/api/fotos/delete', (req, res) => {
  const u = requerir(req, res); if (!u) return
  const { id } = req.body
  const f = db.fotos.find(x => x.id === id)
  if (f) { try { fs.unlinkSync(path.join(FOTOS, f.public_id + '.jpg')) } catch {} }
  db.fotos = db.fotos.filter(x => x.id !== id); save(); res.json({ ok: true })
})

// ---- barra de almacenamiento (disco local) ----
app.get('/api/storage', (req, res) => {
  let used = 0
  for (const f of db.fotos) { try { used += fs.statSync(path.join(FOTOS, f.public_id + '.jpg')).size } catch {} }
  let libre = 0
  try { const s = fs.statfsSync(DATA); libre = s.bavail * s.bsize } catch { libre = 0 }
  const limite = used + libre
  res.json({ used_bytes: used, limit_bytes: limite || 1, pct: limite ? used / limite * 100 : 0 })
})

// ---- respaldo diario automático ----
function respaldar() {
  const d = new Date().toISOString().slice(0, 10)
  const dest = path.join(BACKUP_DIR, `bitacora-respaldo-${d}`)
  fs.mkdirSync(dest, { recursive: true })
  fs.copyFileSync(DB_FILE, path.join(dest, 'db.json'))
  const fotosDest = path.join(dest, 'fotos'); fs.mkdirSync(fotosDest, { recursive: true })
  for (const f of fs.readdirSync(FOTOS)) fs.copyFileSync(path.join(FOTOS, f), path.join(fotosDest, f))
  console.log('💾 Respaldo diario hecho en', dest)
}
let ultimoRespaldo = ''
setInterval(() => {
  const ahora = new Date().toTimeString().slice(0, 5)
  const hoy = new Date().toDateString()
  if (ahora >= BACKUP_TIME && ultimoRespaldo !== hoy) { ultimoRespaldo = hoy; respaldar() }
}, 60000)
app.post('/api/backup/ahora', (req, res) => { requerir(req, res); if (!res.writableEnded) { respaldar(); res.json({ ok: true, dest: BACKUP_DIR }) } })

// ---- SPA fallback ----
app.get(/^\/(?!api|fotos).*/, (req, res) => res.sendFile(path.join(DIST, 'index.html')))

app.listen(PORT, () => {
  console.log(`✅ Bitácora local corriendo en http://0.0.0.0:${PORT}`)
  console.log(`   Datos: ${DATA}`)
  console.log(`   Respaldo diario automático a las ${BACKUP_TIME} en: ${BACKUP_DIR}`)
})
