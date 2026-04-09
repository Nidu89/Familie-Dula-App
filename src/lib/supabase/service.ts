import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use ONLY in server-side cron jobs and admin operations.
 * Never expose this client to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL")
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
