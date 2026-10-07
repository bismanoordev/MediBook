"use client"

import Image from "next/image"
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react"
import { ChangeEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { submitDoctorProfileChanges, withdrawDoctorProfileChange } from "@/app/doctor/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"

type Qualification = { degree: string; institution: string; year: string }
type PendingChange = { id: string; created_at: string }
type Props = { userId: string; phone: string; doctor: Tables<"doctors">; specialties: { id: number; name: string }[]; pendingChange: PendingChange | null }

const languages = ["English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi"]
const field = "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
const selectItemClass = "rounded-lg px-3 py-2.5 text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-semibold data-[selected]:text-[#0F766E]"

export function DoctorProfileForm({ userId, phone, doctor, specialties, pendingChange }: Props) {
  const [data, setData] = useState({ fullName: doctor.full_name, phone, bio: doctor.bio ?? "", fee: String(doctor.fee), photoUrl: doctor.photo_url ?? "", specialtyId: doctor.specialty_id ? String(doctor.specialty_id) : "", experienceYears: doctor.experience_years === null ? "" : String(doctor.experience_years), languages: doctor.languages, clinicName: doctor.clinic_name ?? "", city: doctor.city ?? "" })
  const [qualifications, setQualifications] = useState<Qualification[]>(Array.isArray(doctor.qualifications) ? doctor.qualifications as unknown as Qualification[] : [])
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const disabled = Boolean(pendingChange) || pending || uploading
  const set = (key: keyof typeof data, value: string | string[]) => setData((current) => ({ ...current, [key]: value } as typeof current))

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_242_880) { setError("Use a JPG, PNG, or WebP photo smaller than 5 MB."); return }
    setUploading(true); setError("")
    const extension = file.name.split(".").pop() || "jpg"
    const path = `${userId}/profile-${crypto.randomUUID()}.${extension}`
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage.from("doctor-photos").upload(path, file)
    setUploading(false)
    if (uploadError) { setError("Your photo couldn't be uploaded. Please try again."); return }
    set("photoUrl", supabase.storage.from("doctor-photos").getPublicUrl(path).data.publicUrl)
    toast.success("Photo ready to send for review.")
  }

  function submit() {
    setError("")
    if (!data.fullName.trim() || !data.phone.trim() || !data.fee || Number(data.fee) < 0) { setError("Enter your name, phone number, and a valid consultation fee."); return }
    startTransition(async () => {
      const result = await submitDoctorProfileChanges({ ...data, qualifications })
      if (result.error) { setError(result.error); return }
      toast.success("Your profile changes were sent for review.")
      router.refresh()
    })
  }

  function withdraw() {
    if (!pendingChange) return
    startTransition(async () => {
      const result = await withdrawDoctorProfileChange(pendingChange.id)
      if (result.error) { setError(result.error); return }
      toast.success("Profile changes withdrawn.")
      router.refresh()
    })
  }

  if (pendingChange) return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[.16em] text-amber-800">Changes waiting for review</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Your public profile is unchanged for now.</h1>
      <p className="mt-2 text-sm leading-6 text-slate-700">The clinic received your changes on {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(pendingChange.created_at))}. You can withdraw them while the review is pending.</p>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button type="button" disabled={pending} onClick={withdraw} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"><X className="size-4" />{pending ? "Withdrawing…" : "Withdraw changes"}</button>
    </section>
  )

  return (
    <form onSubmit={(event) => { event.preventDefault(); submit() }} className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Public profile</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Keep your professional details current</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your updates are sent to the clinic for review. Your current public profile stays visible until approval.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-teal-50 font-semibold text-[#0F766E]">{data.photoUrl ? <Image src={data.photoUrl} alt="Profile preview" width={80} height={80} unoptimized className="size-20 object-cover" /> : data.fullName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
          <label className="text-sm font-medium">Profile photo <span className="block text-xs font-normal text-slate-500">JPG, PNG, or WebP · max 5 MB</span><span className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0F766E] hover:bg-teal-50"><Upload className="size-4" />{uploading ? "Uploading…" : "Choose photo"}<input type="file" disabled={disabled} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void uploadPhoto(event)} /></span></label>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Full name<Input value={data.fullName} disabled={disabled} onChange={(event) => set("fullName", event.target.value)} /></label>
          <label className="text-sm font-medium">Phone number <span className="text-xs font-normal text-slate-500">Saved directly to your account</span><Input value={data.phone} disabled={disabled} onChange={(event) => set("phone", event.target.value)} /></label>
          <div className="text-sm font-medium"><label htmlFor="doctor-profile-specialty">Specialty</label><Select items={[{ value: "", label: "Choose specialty" }, ...specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name }))]} value={data.specialtyId} disabled={disabled} onValueChange={(value) => set("specialtyId", value ?? "")}><SelectTrigger id="doctor-profile-specialty" className="mt-1 h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-teal-100"><SelectValue placeholder="Choose specialty" /></SelectTrigger><SelectContent alignItemWithTrigger={false} className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"><SelectItem value="" className={selectItemClass}>Choose specialty</SelectItem>{specialties.map((specialty) => <SelectItem key={specialty.id} value={String(specialty.id)} className={selectItemClass}>{specialty.name}</SelectItem>)}</SelectContent></Select></div>
          <label className="text-sm font-medium">Consultation fee (Rs.)<input className={field} type="number" min="0" value={data.fee} disabled={disabled} onChange={(event) => set("fee", event.target.value)} /></label>
          <label className="text-sm font-medium">Years of experience<input className={field} type="number" min="0" value={data.experienceYears} disabled={disabled} onChange={(event) => set("experienceYears", event.target.value)} /></label>
          <label className="text-sm font-medium">Clinic or hospital<input className={field} value={data.clinicName} disabled={disabled} onChange={(event) => set("clinicName", event.target.value)} /></label>
          <label className="text-sm font-medium sm:col-span-2">City<input className={field} value={data.city} disabled={disabled} onChange={(event) => set("city", event.target.value)} /></label>
          <label className="text-sm font-medium sm:col-span-2">Bio<textarea className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100" value={data.bio} disabled={disabled} onChange={(event) => set("bio", event.target.value)} /></label>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Languages and qualifications</h2>
        <fieldset className="mt-5"><legend className="text-sm font-medium">Languages</legend><div className="mt-2 flex flex-wrap gap-2">{languages.map((language) => { const selected = data.languages.includes(language); return <button key={language} type="button" disabled={disabled} aria-pressed={selected} onClick={() => set("languages", selected ? data.languages.filter((item) => item !== language) : [...data.languages, language])} className={`rounded-full px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${selected ? "bg-[#0F766E] text-white" : "bg-teal-50 text-[#0F766E] hover:bg-teal-100"}`}>{language}</button> })}</div></fieldset>
        <div className="mt-6"><div className="flex items-center justify-between"><h3 className="text-sm font-medium">Qualifications</h3><button type="button" disabled={disabled} onClick={() => setQualifications((current) => [...current, { degree: "", institution: "", year: "" }])} className="text-sm font-semibold text-[#0F766E] hover:underline"><Plus className="mr-1 inline size-4" />Add qualification</button></div><div className="mt-3 grid gap-3">{qualifications.length ? qualifications.map((qualification, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]"><input className={field} placeholder="Degree" value={qualification.degree} disabled={disabled} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, degree: event.target.value } : item))} /><input className={field} placeholder="Institution" value={qualification.institution} disabled={disabled} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, institution: event.target.value } : item))} /><input className={field} placeholder="Year" value={qualification.year} disabled={disabled} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, year: event.target.value } : item))} /><button type="button" aria-label="Remove qualification" disabled={disabled} onClick={() => setQualifications((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-1 rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 className="size-4" /></button></div>) : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No qualifications added yet.</p>}</div></div>
      </section>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <div><button type="submit" disabled={disabled} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : null}Send for review</button></div>
    </form>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`${field} ${props.className ?? ""}`} /> }
