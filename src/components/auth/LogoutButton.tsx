'use client'
// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] Logout button that signs out and redirects to /login
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-[#5c5880] hover:text-[#a09cc0] transition"
    >
      Log out
    </button>
  )
}
