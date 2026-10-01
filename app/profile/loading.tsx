export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12" aria-label="Loading profile">
        <div className="h-4 w-32 animate-pulse rounded bg-teal-100" />
        <div className="mt-3 h-10 w-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-8 h-40 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        <div className="mt-6 h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </main>
    </div>
  )
}
