function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
}

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-7 pb-36 sm:px-8 sm:py-9 lg:pb-9" aria-label="Loading appointment details">
      <Skeleton className="h-11 w-52 bg-teal-100" />
      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-3 p-5 sm:p-6"><Skeleton className="size-12 shrink-0 rounded-full bg-teal-100" /><div className="min-w-0 flex-1"><Skeleton className="h-6 w-48 max-w-full" /><Skeleton className="mt-2 h-4 w-52 max-w-full" /></div><Skeleton className="h-7 w-24 shrink-0 rounded-full" /></div>
          <div className="border-t border-slate-100 p-5 sm:p-6"><Skeleton className="h-5 w-full max-w-64" /><Skeleton className="mt-3 h-4 w-32" /></div>
          <div className="border-t border-slate-100 p-5 sm:p-6"><Skeleton className="h-3 w-28" /><Skeleton className="mt-4 h-4 w-full" /><Skeleton className="mt-3 h-4 w-4/5" /><Skeleton className="mt-3 h-4 w-3/5" /></div>
          <div className="border-t border-slate-100 p-5 sm:p-6"><Skeleton className="h-3 w-28" /><Skeleton className="mt-4 h-5 w-56 max-w-full" /></div>
        </section>
        <aside className="hidden lg:block"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Skeleton className="h-6 w-48" /><Skeleton className="mt-3 h-4 w-full" /><Skeleton className="mt-5 h-11 w-full bg-teal-100" /><Skeleton className="mt-2 h-10 w-full" /><Skeleton className="mt-5 h-px w-full" /><div className="mt-5 flex gap-3"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div></section></aside>
      </div>
    </main>
  )
}
