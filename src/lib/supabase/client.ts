// [CYCL:26fe9375-ce70-438c-ac62-b766909bba7b] Browser-side Supabase client singleton using @supabase/ssr
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
