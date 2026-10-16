import React from 'react'
import { createClient } from '@supabase/supabase-js'
import { mockClient } from './mock.js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sin credenciales => modo DEMO (datos simulados en el navegador)
export const IS_DEMO = !url || !anon

export const supabase = IS_DEMO ? mockClient() : createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
})

export const CLOUDINARY = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
}
