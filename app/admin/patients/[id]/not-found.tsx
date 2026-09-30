import Link from "next/link"

export default function PatientNotFound() { return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h1 className="text-xl font-semibold">Patient not found</h1><p className="mt-2 text-sm text-slate-500">This patient does not exist or is no longer available.</p><Link href="/admin/patients" className="mt-5 inline-flex rounded-xl bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D5F59]">Back to patients</Link></div></main> }
