// Cliente LOCAL: implementa la misma interfaz que usa la app (auth, tablas,
// rpc, mfa) pero contra el servidor local en /api. Sin nada en internet.
const API = ''
const KEY = 'bitacora_local_session'

function token() { try { return JSON.parse(localStorage.getItem(KEY))?.token || null } catch { return null } }
function setToken(t) { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (t) s.token = t; else delete s.token; localStorage.setItem(KEY, JSON.stringify(s)) }
function getSesion() { try { return JSON.parse(localStorage.getItem(KEY))?.session || null } catch { return null } }
function setSesion(s) { localStorage.setItem(KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(KEY) || '{}')), session: s })) }

async function api(ruta, body, metodo = 'POST') {
  const res = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: 'Bearer ' + token() } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

function notificar(evento, sesion) { listeners.forEach(cb => { try { cb(evento, sesion) } catch { } }) }
const listeners = []

export function mockClient() {
  const auth = {
    async getSession() { return { data: { session: getSesion() } } },
    onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() { listeners = listeners.filter(f => f !== cb) } } } } },
    async signInWithPassword({ email, password }) {
      const { status, json } = await api('/api/auth/signin', { email, password })
      if (status !== 200) return { data: { session: null }, error: { message: json.error || 'Error de acceso' } }
      if (json.needs_2fa) { setToken(json.temp_token); setSesion(null); return { data: { session: null }, error: null } }
      setToken(json.token)
      setSesion(json.session)
      notificar('SIGNED_IN', json.session)
      return { data: { session: json.session }, error: null }
    },
    async signOut() { setSesion(null); notificar('SIGNED_OUT', null) },
    async getUser() {
      const { status, json } = await api('/api/auth/me', null, 'GET')
      if (status !== 200) return { data: { user: null } }
      return { data: { user: json.user } }
    },
    mfa: {
      async listFactors() {
        const { status, json } = await api('/api/mfa/factors', null, 'POST')
        if (status !== 200) return { data: { totp: [] } }
        return { data: { totp: json.factors } }
      },
      async enroll() {
        const { status, json } = await api('/api/mfa/enroll', {})
        if (status !== 200) return { error: { message: json.error || 'Error' } }
        enrollPendiente = true
        return { data: { id: 'local', totp: { url: json.url, secret: json.secret } }, error: null }
      },
      async challenge() { challengeLogin = !enrollPendiente; return { data: { id: 'local' }, error: null } },
      async verify({ code }) {
        const ruta = enrollPendiente ? '/api/mfa/enroll/verify' : '/api/auth/mfa/verify'
        const { status, json } = await api(ruta, { code })
        if (status !== 200) return { error: { message: json.error || 'Código incorrecto' } }
        enrollPendiente = false
        if (json.session) {
          if (json.token) setToken(json.token)
          setSesion(json.session)
          notificar('SIGNED_IN', json.session)
        }
        return { data: { success: true }, error: null }
      },
      async unenroll() { await api('/api/mfa/unenroll', {}); return { data: {}, error: null } }
    }
  }

  function from(tabla) {
    const st = { filters: [], _select: '*', _order: null, _limit: null }
    const b = {
      select(s) { st._select = s || '*'; return b },
      eq(c, v) { st.filters.push({ col: c, val: v }); return b },
      gte(c, v) { st.filters.push({ col: c, val: v, op: 'gte' }); return b },
      lte(c, v) { st.filters.push({ col: c, val: v, op: 'lte' }); return b },
      in(c, vals) { st.filters.push({ col: c, val: { in: vals } }); return b },
      order(c, o = {}) { st._order = { col: c, asc: o.ascending !== false }; return b },
      limit(n) { st._limit = n; return b },
      maybeSingle() { st._maybe = true; return b },
      single() { st._single = true; return b },
      insert(row) {
        b._op = { op: 'insert', tabla, row }
        return { ...b, select() { return b }, single() { st._single = true; return b } }
      },
      upsert(row, opts) {
        b._op = { op: 'upsert', tabla, row, onConflict: (opts?.onConflict || 'id').split(',') }
        return { ...b }
      },
      update(cols) {
        b._op = { op: 'update', tabla, cols, filters: st.filters }
        return { ...b }
      },
      delete() {
        b._op = { op: 'delete', tabla, filters: st.filters }
        return { ...b }
      },
      then(resolve) {
        if (b._op) {
          api('/api/mutate', b._op).then(({ json }) => {
            const d = b._op.op === 'insert' ? json.data : null
            resolve({ data: (st._single || st._maybe) ? d : (d ? [d] : d), error: json.error })
          })
          return Promise.resolve()
        }
        api('/api/query', { tabla, filters: st.filters, order: st._order, limit: st._limit, single: st._single, maybe: st._maybe })
          .then(({ json }) => resolve(json))
        return Promise.resolve()
      }
    }
    return b
  }

  return {
    from,
    auth,
    async rpc(fn, args) {
      if (fn === 'cerrar_bitacora') {
        const { json } = await api('/api/rpc/cerrar_bitacora', { p_bitacora: args.p_bitacora })
        return { data: json.data, error: null }
      }
      return { data: null, error: { message: 'rpc no soportado' } }
    },
    functions: {
      async invoke(nombre, { body } = {}) {
        if (nombre === 'cloudinary-usage') {
          const { json } = await api('/api/storage', null, 'GET')
          return { data: json, error: null }
        }
        if (nombre === 'cloudinary-destroy') {
          await api('/api/fotos/delete', { public_id: body.public_id })
          return { data: { ok: true }, error: null }
        }
        return { error: { message: 'no disponible en local' } }
      }
    }
  }
}
let enrollPendiente = false
