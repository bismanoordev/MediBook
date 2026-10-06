"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationLink as NavigationLinkType } from "@/lib/navigation"
export function NavigationLink({ link, className }: { link: NavigationLinkType; className: string }) { const pathname = usePathname(); const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`); return <Link href={link.href} aria-current={active ? "page" : undefined} className={`${className}${active ? " text-[#0F766E]" : ""}`}>{link.label}</Link> }
