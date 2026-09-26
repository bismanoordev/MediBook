export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Admin area</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Clinic dashboard</h1>
      <p className="mt-3 text-slate-600">Your admin access is protected on the server. Dashboard features will be added in Phase 6.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Today’s appointments", "Pending", "Patients", "Doctors"].map((label) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </main>
  )
}
