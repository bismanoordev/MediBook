export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center bg-[#F8FAFC]">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="size-5 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        Loading MediBook…
      </div>
    </div>
  )
}
