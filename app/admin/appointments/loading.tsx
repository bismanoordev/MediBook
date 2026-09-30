export default function Loading() {
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8"><div className="h-4 w-36 animate-pulse rounded bg-teal-100" /><div className="mt-4 h-9 w-56 animate-pulse rounded bg-slate-200" /><div className="mt-8 grid gap-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div></main>
}
