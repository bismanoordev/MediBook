"use client"

import { useTransition } from "react"
import { Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"

import { signOut } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const [isSigningOut, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const result = await signOut()

      if (result.error) {
        toast.error(result.error)
      }
    })
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
