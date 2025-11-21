import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceRoleKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseServiceRoleKey?.length || 0
  })
  throw new Error('Missing Supabase environment variables')
}

// Validate URL format
try {
  const url = new URL(supabaseUrl)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Invalid URL protocol')
  }
} catch (urlError) {
  console.error('Invalid Supabase URL format:', {
    url: supabaseUrl,
    error: urlError.message
  })
  throw new Error(`Invalid Supabase URL format: ${urlError.message}`)
}

// Server-side client with service_role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

