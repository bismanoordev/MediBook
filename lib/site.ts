const defaultSiteUrl = "https://medi-book-chi-eight.vercel.app"

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl).replace(/\/$/, "")
