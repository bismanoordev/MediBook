type SkeletonProps = { className: string }

function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
}

function PageIntro({ labelWidth = "w-36", titleWidth = "w-64", copyWidth = "w-full max-w-96" }: { labelWidth?: string; titleWidth?: string; copyWidth?: string }) {
  return <div>
    <Skeleton className={`h-4 ${labelWidth} bg-teal-100`} />
    <Skeleton className={`mt-3 h-9 max-w-full ${titleWidth}`} />
    <Skeleton className={`mt-3 h-4 max-w-full ${copyWidth}`} />
  </div>
}

function CardRows({ count = 4 }: { count?: number }) {
  return <div className="mt-4 grid gap-3">
    {Array.from({ length: count }, (_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-5"><div className="min-w-0 flex-1"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="mt-3 h-3 w-56 max-w-full" /></div><Skeleton className="h-9 w-24 shrink-0" /></div></div>)}
  </div>
}

export function DashboardLoading({ doctor = false }: { doctor?: boolean }) {
  const statCount = doctor ? 4 : 5
  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9" aria-label="Loading dashboard">
    <PageIntro titleWidth="w-72" copyWidth="w-[28rem]" />
    <section className={`mt-7 grid gap-4 sm:grid-cols-2 ${doctor ? "xl:grid-cols-4" : "xl:grid-cols-5"}`}>
      {Array.from({ length: statCount }, (_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Skeleton className="size-10 rounded-xl bg-teal-100" /><Skeleton className="mt-5 h-3 w-28" /><Skeleton className="mt-2 h-8 w-16" /><Skeleton className="mt-3 h-3 w-24" /></div>)}
    </section>
    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.8fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><Skeleton className="h-5 w-48" /><Skeleton className="mt-3 h-3 w-72 max-w-full" /><CardRows count={3} /></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><Skeleton className="h-5 w-40" /><Skeleton className="mt-3 h-3 w-52" /><Skeleton className="mt-9 h-44 w-full" /></div>
    </section>
  </main>
}

export function DoctorsDirectoryLoading() {
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8" aria-label="Loading doctors">
    <PageIntro labelWidth="w-44" titleWidth="w-32" copyWidth="w-[26rem]" />
    <div className="mt-8 flex max-w-xl gap-2"><Skeleton className="h-10 min-w-0 flex-1" /><Skeleton className="h-10 w-24 bg-teal-100" /></div>
    <div className="mt-4 flex gap-2 overflow-hidden">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-9 w-28 shrink-0" />)}</div>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <article key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><Skeleton className="h-44 w-full rounded-none bg-teal-100" /><div className="p-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-3 h-3 w-28" /><Skeleton className="mt-5 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" /><div className="mt-6 flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-28 bg-teal-100" /></div></div></article>)}</div>
  </main>
}

export function ApplicationsLoading() {
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10" aria-label="Loading doctor applications">
    <PageIntro labelWidth="w-40" titleWidth="w-64" copyWidth="w-[29rem]" />
    <div className="mt-6 flex gap-2"><Skeleton className="h-10 w-28 bg-teal-100" /><Skeleton className="h-10 w-32" /></div>
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Skeleton className="h-10 w-full" /></div>
    <div className="mt-5 flex gap-2 overflow-hidden">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-10 w-28 shrink-0" />)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(18rem,.65fr)_minmax(0,1.35fr)]"><div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="grid gap-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-3 rounded-xl p-3"><Skeleton className="size-11 rounded-xl bg-teal-100" /><div className="flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-3 w-24" /></div></div>)}</div></div><div className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex gap-4"><Skeleton className="size-20 rounded-2xl bg-teal-100" /><div className="flex-1"><Skeleton className="h-7 w-52" /><Skeleton className="mt-3 h-4 w-28" /><Skeleton className="mt-3 h-4 w-44" /></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Skeleton className="h-5 w-52" /><Skeleton className="mt-4 h-16 w-full" /></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Skeleton className="h-5 w-28" /><Skeleton className="mt-4 h-20 w-full" /></div></div></div>
  </main>
}

export function AppointmentsLoading({ doctor = false, admin = false }: { doctor?: boolean; admin?: boolean }) {
  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9" aria-label="Loading appointments">
    <PageIntro labelWidth="w-40" titleWidth="w-48" copyWidth="w-[27rem]" />
    {doctor ? <div className="mt-6 flex gap-2 overflow-hidden">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-10 w-24 shrink-0" />)}</div> : admin ? <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div> : <div className="mt-7 flex w-48 gap-1 rounded-xl bg-slate-100 p-1"><Skeleton className="h-9 flex-1 bg-white" /><Skeleton className="h-9 flex-1 bg-slate-100" /></div>}
    <div className="mt-6 grid gap-4">{Array.from({ length: 4 }, (_, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-6 w-20" /></div><Skeleton className="mt-3 h-3 w-28 bg-teal-100" /><Skeleton className="mt-2 h-3 w-full max-w-md" /><Skeleton className="mt-2 h-3 w-52" /></div><div className="mt-4 flex gap-2 sm:mt-0"><Skeleton className="h-10 w-20 bg-teal-100" /><Skeleton className="h-10 w-20" /></div></article>)}</div>
  </main>
}

export function AvailabilityLoading() {
  return <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9" aria-label="Loading availability">
    <PageIntro labelWidth="w-44" titleWidth="w-full max-w-80" copyWidth="w-full max-w-[32rem]" />
    <div className="mt-8"><Skeleton className="h-5 w-40" /><Skeleton className="mt-2 h-4 w-full max-w-80" /><div className="mt-5 grid gap-3">{Array.from({ length: 7 }, (_, index) => <div key={index} className="flex h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Skeleton className="size-5" /><Skeleton className="h-4 w-24" /><Skeleton className="ml-auto h-10 w-44" /></div>)}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><Skeleton className="h-64 w-full border border-slate-200 bg-white" /><Skeleton className="h-64 w-full border border-slate-200 bg-white" /></div>
  </main>
}

export function ProfileLoading() {
  return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10" aria-label="Loading profile"><PageIntro labelWidth="w-28" titleWidth="w-52" copyWidth="w-full max-w-80" /><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex gap-4"><Skeleton className="size-20 rounded-2xl bg-teal-100" /><div className="flex-1"><Skeleton className="h-5 w-48" /><Skeleton className="mt-3 h-4 w-64" /></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}</div><Skeleton className="mt-4 h-28 w-full" /></div></main>
}

export function DocumentsLoading() {
  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9" aria-label="Loading documents"><PageIntro labelWidth="w-40" titleWidth="w-52" copyWidth="w-full max-w-[34rem]" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Skeleton className="size-10 rounded-xl bg-teal-100" /><Skeleton className="mt-4 h-3 w-24" /><Skeleton className="mt-2 h-7 w-12" /></article>)}</div><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="hidden grid-cols-[1.2fr_1fr_1fr_auto] gap-5 border-b border-slate-100 bg-slate-50 px-5 py-4 md:grid">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-3 w-20" />)}</div>{Array.from({ length: 3 }, (_, index) => <div key={index} className="grid gap-3 border-t border-slate-100 p-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"><div><Skeleton className="h-4 w-36" /><Skeleton className="mt-2 h-3 w-52 max-w-full" /></div><Skeleton className="h-7 w-24 bg-teal-100" /><Skeleton className="h-3 w-28" /><Skeleton className="h-10 w-24" /></div>)}</div></main>
}

export function PatientDirectoryLoading() {
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8" aria-label="Loading patient directory"><PageIntro labelWidth="w-36" titleWidth="w-32" copyWidth="w-0" /><div className="mt-6 flex max-w-lg gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-24 bg-teal-100" /></div><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{Array.from({ length: 6 }, (_, index) => <div key={index} className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-28" /></div>)}</div></main>
}

export function PatientDetailLoading() {
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8" aria-label="Loading patient"><Skeleton className="h-4 w-20 bg-teal-100" /><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Skeleton className="h-3 w-28 bg-teal-100" /><Skeleton className="mt-4 h-9 w-56 max-w-full" /><div className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></section><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Skeleton className="h-6 w-48" /><Skeleton className="mt-3 h-4 w-72 max-w-full" /><div className="mt-5 divide-y divide-slate-100">{Array.from({ length: 4 }, (_, index) => <div key={index} className="py-4"><Skeleton className="h-4 w-40" /><Skeleton className="mt-3 h-3 w-64 max-w-full" /></div>)}</div></section></main>
}

export function DoctorFormLoading() {
  return <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8" aria-label="Loading doctor form"><Skeleton className="h-4 w-20 bg-teal-100" /><Skeleton className="mt-6 h-9 w-72 max-w-full" /><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-5 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index}><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-11 w-full" /></div>)}</div><Skeleton className="mt-5 h-28 w-full" /><Skeleton className="mt-6 h-11 w-36 bg-teal-100" /></section></main>
}

export function DoctorDetailsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="mx-auto max-w-6xl px-5 py-8 pb-28 sm:px-8 sm:py-10 lg:pb-12" aria-label="Loading doctor details">
        <Skeleton className="h-4 w-28 bg-teal-100" />
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <Skeleton className="size-24 rounded-2xl bg-teal-100 sm:size-28" />
            <div className="min-w-0"><Skeleton className="h-6 w-28" /><Skeleton className="mt-3 h-9 w-64 max-w-full" /><Skeleton className="mt-3 h-4 w-full max-w-2xl" /><Skeleton className="mt-2 h-4 w-4/5 max-w-xl" /></div>
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3"><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-6 w-20" /></div>
          </div>
        </section>
        <section className="mt-8 grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:pb-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <Skeleton className="h-4 w-32 bg-teal-100" /><Skeleton className="mt-3 h-8 w-64 max-w-full" /><Skeleton className="mt-3 h-4 w-full max-w-lg" />
            <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)}</div>
            <div className="mt-7 border-t border-slate-100 pt-6"><Skeleton className="h-5 w-64 max-w-full" /><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-11 w-full rounded-xl" />)}</div></div>
          </div>
          <aside className="hidden rounded-2xl border border-teal-100 bg-teal-50/70 p-5 shadow-sm lg:block"><Skeleton className="h-4 w-36 bg-teal-100" /><Skeleton className="mt-5 h-4 w-full" /><Skeleton className="mt-2 h-4 w-4/5" /><Skeleton className="mt-6 h-11 w-full bg-teal-100" /></aside>
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"><div className="mx-auto flex max-w-xl items-center gap-3"><Skeleton className="h-4 flex-1" /><Skeleton className="h-11 w-28 shrink-0 bg-teal-100" /></div></div>
        </section>
      </main>
    </div>
  )
}

export function NotificationsLoading() {
  return <div className="min-h-screen bg-[#F8FAFC]"><main className="mx-auto max-w-4xl px-5 py-12 sm:px-8" aria-label="Loading notifications"><div className="flex justify-end"><Skeleton className="h-9 w-32" /></div><div className="mt-6"><Skeleton className="h-8 w-40" />{Array.from({ length: 5 }, (_, index) => <div key={index} className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Skeleton className="h-4 w-44" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/4" /></div>)}</div></main></div>
}
