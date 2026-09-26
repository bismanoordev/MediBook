"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleLogout() {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <LogOut aria-hidden="true" />
      )}
      {isSigningOut ? "Signing out..." : "Log out"}
    </Button>
  )
}
