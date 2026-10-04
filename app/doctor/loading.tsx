export default function Loading() {
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><div className="h-4 w-28 animate-pulse rounded bg-teal-100" /><div className="mt-4 h-10 w-64 animate-pulse rounded bg-slate-200" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div><div className="mt-8 h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" /></main>
}
