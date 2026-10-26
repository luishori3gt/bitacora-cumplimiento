import { createClient } from '@supabase/supabase-js'
import { mockClient } from './mock.js'
import { mockClient as localClient } from './localApi.js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
const modo = import.meta.env.VITE_MODE

// Modo LOCAL: servidor propio en la red (VITE_MODE=local) — nada en internet
export const IS_LOCAL = modo === 'local'
// Sin credenciales => modo DEMO (datos simulados)
export const IS_DEMO = !IS_LOCAL && (!url || !anon)

export const supabase = IS_LOCAL ? localClient()
  : IS_DEMO ? mockClient()
  : createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    })

export const CLOUDINARY = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
}
