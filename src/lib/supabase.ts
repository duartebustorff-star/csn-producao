import { createClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    // Allow Next production build to evaluate route modules without hard-failing
    // when local env vars are not loaded in this shell context.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      if (name === "NEXT_PUBLIC_SUPABASE_URL") return "http://127.0.0.1:54321"
      return "build-placeholder-key"
    }
    throw new Error(`${name} is required.`)
  }
  return value
}

// Cliente público (frontend)
export function getClientSupabase() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Cliente com service role (backend only — nunca expor no frontend)
export function getServiceSupabase() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  return createClient(
    supabaseUrl,
    serviceRoleKey
  )
}
