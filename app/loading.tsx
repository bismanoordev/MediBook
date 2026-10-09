"use client"

import { usePathname } from "next/navigation"

import { MediBookLoadingScreen } from "@/components/medibook-loading-screen"

const fullScreenLoadingRoutes = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password"])

export default function Loading() {
  const pathname = usePathname()
  return fullScreenLoadingRoutes.has(pathname) ? <MediBookLoadingScreen /> : null
}
