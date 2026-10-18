// Modo DEMO: se activa automáticamente cuando no hay variables VITE_SUPABASE_*.
// Simula Supabase + Cloudinary en el navegador (localStorage) para poder
// probar toda la app sin configurar nada.

import catalogo from './catalogo.json'
import { severidadPorClasificacion, PESOS } from './severidad.js'

const KEY = 'bitacora_demo_db_v5'

function db() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function save(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* cuota excedida: solo memoria */ }
}
function fresh() {
  const areas = [], lineamientos = []
  catalogo.forEach((a, i) => {
    const ls = a.items.map((it, j) => ({
      id: `l-${i}-${j}`, area_id: 'area-' + i,
      clasificacion: it.clasificacion, texto: it.lineamiento, orden: j,
      severidad: severidadPorClasificacion(it.clasificacion)
    }))
    lineamientos.push(...ls)
    areas.push({ id: 'area-' + i, nombre: a.area, orden: i, lineamientos: ls })
  })
  return { areas, lineamientos, bitacoras: [], respuestas: [], fotos: [], acciones: [], factors: [] }
}
function get() { let d = db(); if (!d || !d.areas) { d = fresh(); save(d) } return d }

function vCalifs(d) {
  const rows = []
  for (const b of d.bitacoras) {
    for (const a of d.areas) {
      const byClas = {}
      for (const l of a.lineamientos) {
        const r = d.respuestas.find(x => x.bitacora_id === b.id && x.lineamiento_id === l.id)
        const c = (byClas[l.clasificacion] = byClas[l.clasificacion] || { total: 0, cumple: 0, no_cumple: 0, no_revisado: 0 })
        c.total++
        const est = r?.estado || 'no_revisado'
        c[est]++
      }
      const nf = d.fotos.filter(f => f.bitacora_id === b.id && f.area_id === a.id).length
      const linMap = {}
      for (const l of a.lineamientos) linMap[l.id] = l
      for (const [clasificacion, c] of Object.entries(byClas)) {
        const evald = c.cumple + c.no_cumple
        const rowsClas = Object.entries(byClas).length // noop
        // ponderado por severidad dentro de esta clasificación
        let num = 0, den = 0, critNC = 0
        for (const l of a.lineamientos) {
          if (l.clasificacion !== clasificacion) continue
          const r = d.respuestas.find(x => x.bitacora_id === b.id && x.lineamiento_id === l.id)
          const est = r?.estado || 'no_revisado'
          if (est === 'cumple' || est === 'no_cumple') {
            const p = PESOS[l.severidad] || 0.75
            den += p
            if (est === 'cumple') num += p
            if (est === 'no_cumple' && l.severidad === 'critico') critNC++
          }
        }
        rows.push({
          bitacora_id: b.id, fecha: b.fecha, estado_bitacora: b.estado, sitio: b.sitio || 'Accel-VPC',
          area_id: a.id, area: a.nombre, clasificacion,
          total_lineamientos: c.total, cumple: c.cumple, no_cumple: c.no_cumple, no_revisado: c.no_revisado,
          criticos_no_cumple: critNC,
          pct_ponderado: den ? Math.round((num / den) * 1000) / 10 : null,
          pct_simple: evald ? Math.round((c.cumple / evald) * 1000) / 10 : null,
          num_fotos: nf
        })
      }
    }
  }
  return rows
}

function vSeg(d) {
  const rows = []
  for (const l of d.lineamientos) {
    const rs = d.respuestas.filter(x => x.lineamiento_id === l.id)
    const cum = rs.filter(x => x.estado === 'cumple').length
    const nc = rs.filter(x => x.estado === 'no_cumple').length
    const ev = cum + nc
    const a = d.areas.find(a => a.id === l.area_id)
    rows.push({
      area: a?.nombre, clasificacion: l.clasificacion, severidad: l.severidad, lineamiento: l.texto,
      cumple: cum, no_cumple: nc, evaluados: ev,
      pct_cumplimiento: ev ? Math.round((cum / ev) * 1000) / 10 : null
    })
  }
  return rows
}

function exec(table, st) {
  const d = get()
  let rows
  if (table === 'v_calificaciones') rows = vCalifs(d)
  else if (table === 'v_seguimiento_lineamientos') rows = vSeg(d)
  else rows = d[table] || []
  rows = JSON.parse(JSON.stringify(rows))
  for (const f of st.filters) rows = rows.filter(f)
  if (st._order) rows.sort((x, y) => (st._order.asc ? 1 : -1) * String(x[st._order.col]).localeCompare(String(y[st._order.col])))
  if (st._limit) rows = rows.slice(0, st._limit)
  if (st._select.includes('lineamientos(')) {
    const dd = get()
    for (const a of rows) a.lineamientos = (dd.areas.find(x => x.id === a.id)?.lineamientos || []).map(l => ({ id: l.id }))
  }
  if (st._single || st._maybe) {
    if (!rows.length) return st._single ? { data: null, error: { message: 'no rows' } } : { data: null, error: null }
    return { data: rows[0], error: null }
  }
  return { data: rows, error: null }
}

function mockClient() {
  const listeners = []
  let session = null
  const user = () => ({ id: 'demo-user', email: session?.email || 'demo@demo.mx' })

  function from(table) {
    const st = { filters: [], _select: '*' }
    const b = {
      select(s) { st._select = s || '*'; return b },
      eq(c, v) { st.filters.push(r => r[c] === v); return b },
      order(c, o = {}) { st._order = { col: c, asc: o.ascending !== false }; return b },
      limit(n) { st._limit = n; return b },
      maybeSingle() { st._maybe = true; return b },
      single() { st._single = true; return b },
      insert(rows) {
        b._write = d => {
          const arr = Array.isArray(rows) ? rows : [rows]
          const created = arr.map(r => ({ id: crypto.randomUUID?.() || String(Math.random()), ...r }))
          d[table].push(...created)
          return created
        }
        return { ...b, select() { return b }, single() { st._single = true; return b } }
      },
      upsert(rows) {
        b._write = d => {
          const arr = Array.isArray(rows) ? rows : [rows]
          for (const r of arr) {
            const i = d[table].findIndex(x => x.bitacora_id === r.bitacora_id && x.lineamiento_id === r.lineamiento_id)
            if (i >= 0) Object.assign(d[table][i], r)
            else d[table].push({ id: crypto.randomUUID?.() || String(Math.random()), ...r })
          }
          return arr
        }
        return { ...b }
      },
      delete() {
        b._write = d => { d[table] = d[table].filter(r => st.filters.every(f => f(r))); return [] }
        return { ...b }
      },
      update(cols) {
        b._write = d => {
          for (const r of d[table]) if (st.filters.every(f => f(r))) Object.assign(r, cols)
          return []
        }
        return { ...b }
      },
      then(resolve) {
        let out
        if (b._write) {
          const d = get()
          const created = b._write(d)
          save(d)
          out = { data: (st._single || st._maybe) ? (created[0] ?? null) : created, error: null }
        } else {
          out = exec(table, st)
        }
        return Promise.resolve(out).then(resolve)
      }
    }
    return b
  }

  async function rpc(fn, args) {
    const d = get()
    if (fn === 'cerrar_bitacora') {
      const b = d.bitacoras.find(x => x.id === args.p_bitacora)
      for (const a of d.areas) {
        const nf = d.fotos.filter(f => f.bitacora_id === b.id && f.area_id === a.id).length
        if (nf < 2) return { data: `ERROR: El área "${a.nombre}" tiene ${nf} foto(s). Se requieren mínimo 2.`, error: null }
        const sinEval = a.lineamientos.filter(l => {
          const r = d.respuestas.find(x => x.bitacora_id === b.id && x.lineamiento_id === l.id)
          return !r || r.estado === 'no_revisado'
        }).length
        if (sinEval) return { data: `ERROR: El área "${a.nombre}" tiene ${sinEval} lineamiento(s) sin evaluar.`, error: null }
      }
      b.estado = 'cerrada'; save(d)
      return { data: 'OK', error: null }
    }
    return { data: null, error: { message: 'rpc no soportado en demo' } }
  }

  const auth = {
    async getSession() { return { data: { session } } },
    onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() { } } } } },
    async signInWithPassword({ email }) {
      session = { user: { id: 'demo-user', email }, mfa: { assuranceLevel: 'AAL2' } }
      listeners.forEach(cb => cb('SIGNED_IN', session))
      return { data: { session }, error: null }
    },
    async signOut() { session = null; listeners.forEach(cb => cb('SIGNED_OUT', null)) },
    async getUser() { return { data: { user: session ? user() : null } } },
    mfa: {
      async listFactors() { return { data: { totp: get().factors } } },
      async enroll() {
        const f = { id: 'f1', friendly_name: 'Demo 2FA', factor_type: 'totp' }
        const d = get(); if (!d.factors.length) d.factors.push(f); save(d)
        return { data: { id: f.id, totp: { url: 'otpauth://totp/Demo', secret: 'DEMODEMODEMODEM' } }, error: null }
      },
      async challenge() { return { data: { id: 'c1' }, error: null } },
      async verify({ code }) {
        if (!/^\d{6}$/.test((code || '').replace(/\s/g, ''))) return { error: { message: 'código inválido' } }
        return { data: { success: true }, error: null }
      },
      async unenroll() { const d = get(); d.factors = []; save(d); return { data: {}, error: null } }
    }
  }

  return {
    from, rpc, auth,
    functions: {
      async invoke(name) {
        if (name === 'cloudinary-usage') {
          const used = 6.4 * 1024 ** 3, limit = 25 * 1024 ** 3
          return { data: { used_bytes: used, limit_bytes: limit, pct: (used / limit) * 100 }, error: null }
        }
        return { error: { message: 'no demo' } }
      }
    }
  }
}
export { mockClient }
