import type { NextConfig } from "next"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const remotePattern = supabaseUrl
  ? (() => {
      const url = new URL(supabaseUrl)
      return { protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, port: url.port, pathname: "/storage/v1/object/public/doctor-photos/**" }
    })()
  : undefined

const nextConfig: NextConfig = {
  images: remotePattern ? { remotePatterns: [remotePattern] } : undefined,
}

export default nextConfig
