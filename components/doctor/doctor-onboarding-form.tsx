"use client"

import { ChangeEvent, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Check,
  CircleAlert,
  FileBadge2,
  FileText,
  BadgeCheck,
  Clock3,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OnboardingField } from "@/components/doctor/onboarding-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"

type DocumentType = "cnic" | "pmdc_license" | "degree"
type Document = {
  doc_type: DocumentType
  file_name: string
  status: "pending" | "verified" | "needs_action"
  reviewer_note: string | null
}
type Qualification = { degree: string; institution: string; year: string }

const steps = ["Personal information", "Documents", "Qualifications", "Languages and practice", "Fee and review"]
const stepDetails = ["Photo and bio", "CNIC and PMDC", "Experience and degrees", "Specialty and clinic", "Final check"]
const languageOptions = ["English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi"]
const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm"

type Props = {
  userId: string
  doctor: Tables<"doctors">
  fullName: string
  phone: string
  specialties: { id: number; name: string }[]
  documents: Document[]
}

export function DoctorOnboardingForm({
  userId,
  doctor,
  fullName,
  phone,
  specialties,
  documents,
}: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [step, setStep] = useState(Math.min(Math.max(doctor.onboarding_step, 1), 5))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [docs, setDocs] = useState(documents)
  const [data, setData] = useState({
    name: doctor.full_name || fullName,
    phone,
    city: doctor.city ?? "",
    bio: doctor.bio ?? "",
    photo: doctor.photo_url ?? "",
    experience: doctor.experience_years?.toString() ?? "",
    pmdc: doctor.pmdc_number ?? "",
    languages: doctor.languages.join(", "),
    specialty: doctor.specialty_id?.toString() ?? "",
    clinic: doctor.clinic_name ?? "",
    fee: doctor.fee?.toString() ?? "",
  })
  const [qualifications, setQualifications] = useState<Qualification[]>(
    Array.isArray(doctor.qualifications)
      ? (doctor.qualifications as unknown as Qualification[])
      : []
  )

  function setField(key: keyof typeof data, value: string) {
    setData((current) => ({ ...current, [key]: value }))
  }

  async function save(nextStep: number) {
    setSaving(true)
    setError("")
    const [profileResult, doctorResult] = await Promise.all([
      supabase
        .from("profiles")
        .update({ full_name: data.name.trim(), phone: data.phone.trim() || null })
        .eq("id", userId),
      supabase
        .from("doctors")
        .update({
          full_name: data.name.trim(),
          city: data.city.trim() || null,
          bio: data.bio.trim() || null,
          photo_url: data.photo || null,
          experience_years: data.experience ? Number(data.experience) : null,
          pmdc_number: data.pmdc.trim() || null,
          qualifications,
          languages: data.languages
            .split(",")
            .map((language) => language.trim())
            .filter(Boolean),
          specialty_id: data.specialty ? Number(data.specialty) : null,
          clinic_name: data.clinic.trim() || null,
          fee: data.fee ? Number(data.fee) : 0,
          onboarding_step: nextStep,
        })
        .eq("id", doctor.id),
    ])
    setSaving(false)

    if (profileResult.error || doctorResult.error) {
      setError("We couldn't save your progress. Please try again.")
      return false
    }
    return true
  }

  function stepIsComplete() {
    if (step === 1) return Boolean(data.name.trim() && data.phone.trim() && data.city.trim() && data.bio.trim() && data.photo)
    if (step === 3) return Boolean(data.experience && data.pmdc.trim() && qualifications.length)
    if (step === 4) return Boolean(data.specialty && data.languages.trim())
    if (step === 5) return Number(data.fee) > 0
    return true
  }

  async function continueStep() {
    if (!stepIsComplete()) {
      setError("Please complete every required field before continuing.")
      return
    }
    const nextStep = Math.min(step + 1, 5)
    if (await save(nextStep)) {
      setStep(nextStep)
      toast.success("Progress saved.")
    }
  }

  async function uploadDocument(type: DocumentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 5_242_880) {
      setError("Use a JPG, PNG, or PDF document smaller than 5 MB.")
      return
    }

    const extension = file.name.split(".").pop() || "file"
    // eslint-disable-next-line react-hooks/purity -- timestamp is generated only after a user file selection.
    const filePath = `${userId}/${type}-${Date.now()}.${extension}`
    setSaving(true)
    setError("")
    const uploadResult = await supabase.storage.from("doctor-documents").upload(filePath, file)
    if (uploadResult.error) {
      setSaving(false)
      setError("Your document couldn't be uploaded. Please try again.")
      return
    }
    const rowResult = await supabase.from("doctor_documents").upsert(
      {
        doctor_id: doctor.id,
        doc_type: type,
        file_path: filePath,
        file_name: file.name,
        status: "pending",
      },
      { onConflict: "doctor_id,doc_type" }
    )
    setSaving(false)
    if (rowResult.error) {
      setError("Your document couldn't be saved. Please try again.")
      return
    }
    setDocs((current) => [
      ...current.filter((document) => document.doc_type !== type),
      { doc_type: type, file_name: file.name, status: "pending", reviewer_note: null },
    ])
    toast.success("Document uploaded.")
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5_242_880) {
      setError("Use a JPG, PNG, or WebP photo smaller than 5 MB.")
      return
    }
    const image = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    image.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject()
    }).catch(() => undefined)
    URL.revokeObjectURL(objectUrl)
    if (image.width < 600 || image.height < 600 || image.width !== image.height) {
      setError("Use a square photo at least 600 × 600 pixels.")
      return
    }

    setSaving(true)
    const filePath = `${userId}/${Date.now()}-${file.name}`
    const uploadResult = await supabase.storage.from("doctor-photos").upload(filePath, file)
    setSaving(false)
    if (uploadResult.error) {
      setError("Your photo couldn't be uploaded. Please try again.")
      return
    }
    setField("photo", supabase.storage.from("doctor-photos").getPublicUrl(filePath).data.publicUrl)
    toast.success("Photo uploaded. It will be saved with this step.")
  }

  async function submit() {
    if (!stepIsComplete()) {
      setError("Please enter a positive consultation fee before submitting.")
      return
    }
    if (!(await save(5))) return
    setSaving(true)
    const result = await supabase.rpc("submit_doctor_application")
    setSaving(false)
    if (result.error) {
      setError(
        result.error.message.toLowerCase().includes("document")
          ? "Please upload your CNIC and PMDC license before submitting."
          : "Please complete the required information before submitting."
      )
      return
    }
    toast.success("Your application was submitted for review.")
    router.push("/doctor")
  }

  function documentCard(type: DocumentType, label: string, required = false) {
    const document = docs.find((item) => item.doc_type === type)
    const status = document?.status ?? "missing"
    const statusConfig = status === "verified" ? { label: "Verified", Icon: BadgeCheck, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" } : status === "pending" ? { label: "Pending", Icon: Clock3, className: "bg-amber-50 text-amber-800 ring-amber-200" } : status === "needs_action" ? { label: "Needs action", Icon: CircleAlert, className: "bg-red-50 text-red-700 ring-red-200" } : { label: "Missing", Icon: CircleAlert, className: "bg-slate-100 text-slate-600 ring-slate-200" }
    const Icon = type === "cnic" ? CreditCard : type === "pmdc_license" ? FileBadge2 : FileText
    const StatusIcon = statusConfig.Icon
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><Icon className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{label}</p><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${required ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{required ? "Required" : "Optional"}</span></div><p className="mt-1 truncate text-sm text-slate-600">{document?.file_name ?? "Not uploaded yet"}</p><p className="mt-1 text-xs text-slate-500">JPG, PNG or PDF, max 5 MB</p></div></div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusConfig.className}`}><StatusIcon className="size-3.5" />{statusConfig.label}</span>
          {document?.status !== "verified" ? (
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-teal-200 bg-white px-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-within:ring-2 focus-within:ring-[#0F766E]">
              <Upload className="size-4" />
              {document ? "Replace" : "Upload"}
              <input className="sr-only" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => void uploadDocument(type, event)} />
            </label>
          ) : null}</div>
        </div>
        {document?.reviewer_note ? <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800"><span className="font-semibold">Reviewer note: </span>{document.reviewer_note}</p> : null}
      </article>
    )
  }

  const fieldGrid = "grid gap-x-4 gap-y-5 md:grid-cols-2"

  return (
    <main data-doctor-onboarding className="relative overflow-hidden bg-[#F8FAFC] px-5 py-7 sm:px-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(204,251,241,0.8),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(204,251,241,0.45),_transparent_34%)]" />
      <div className="mx-auto max-w-6xl"><section className="mb-7 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Doctor onboarding</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Welcome, Dr. {data.name.trim().split(" ")[0] || "there"}</h1><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Complete your profile so patients can book you. It takes about 5 minutes.</p></section>
      {(doctor.approval_status === "rejected" || doctor.approval_status === "changes_requested") && doctor.rejection_reason ? <div role="status" className={`mb-5 rounded-2xl border p-4 text-sm ${doctor.approval_status === "rejected" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}><span className="font-semibold">{doctor.approval_status === "rejected" ? "Your application needs attention. " : "Changes requested. "}</span>{doctor.rejection_reason}</div> : null}
      <div className="mb-5 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm lg:hidden"><div className="flex items-center justify-between"><p className="font-semibold text-slate-900">Step {step} of 5</p><span className="font-bold text-[#0F766E]">{Math.round(step / 5 * 100)}%</span></div><ol className="mt-4 flex items-center">{steps.map((item, index) => <li key={item} className="flex flex-1 items-center last:flex-none" aria-current={step === index + 1 ? "step" : undefined}><span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${index + 1 < step ? "bg-[#0F766E] text-white" : step === index + 1 ? "border-2 border-[#0F766E] text-[#0F766E]" : "bg-slate-100 text-slate-500"}`}>{index + 1 < step ? <Check className="size-4" /> : index + 1}</span>{index < 4 ? <span className={`mx-1 h-px flex-1 ${index + 1 < step ? "bg-[#0F766E]" : "bg-slate-200"}`} /> : null}</li>)}</ol></div>
      <div className="grid gap-6 lg:grid-cols-[15.5rem_1fr] lg:items-start">
        <aside className="sticky top-6 hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
          <div className="flex items-center gap-3"><div className="relative grid size-16 place-items-center"><svg className="size-16 -rotate-90" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="#CCFBF1" strokeWidth="4" /><circle cx="22" cy="22" r="18" fill="none" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={113 - 113 * step / 5} /></svg><span className="absolute text-sm font-bold text-[#0F766E]">{Math.round(step / 5 * 100)}%</span></div><p className="text-sm font-semibold text-slate-900">Step {step} of 5</p></div>
          <ol className="mt-6 grid gap-1">{steps.map((item, index) => <li key={item} aria-current={step === index + 1 ? "step" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${step === index + 1 ? "bg-teal-50" : ""}`}><span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${index + 1 < step ? "bg-[#0F766E] text-white" : step === index + 1 ? "border-2 border-[#0F766E] text-[#0F766E]" : "bg-slate-100 text-slate-500"}`}>{index + 1 < step ? <Check className="size-4" /> : index + 1}</span><span><span className="block text-sm font-semibold text-slate-800">{item}</span><span className="text-xs text-slate-500">{stepDetails[index]}</span></span></li>)}</ol>
        </aside>
        <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Doctor onboarding</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{steps[step - 1]}</h2>
          <p className="mt-2 text-sm text-slate-600">Your progress is saved when you continue to the next step.</p>
          {step === 1 ? <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 p-4 sm:flex-row sm:items-center"><div className="grid size-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-teal-100 text-lg font-bold text-[#0F766E] shadow-sm">{data.photo ? <Image src={data.photo} alt="Profile preview" width={80} height={80} unoptimized className="size-full object-cover" /> : data.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">Professional photo <span className="text-red-600">*</span></p><p className="mt-1 text-sm text-slate-600">Square image, at least 600 × 600 px, JPG, PNG or WebP, max 5 MB. Your face should be clearly visible.</p><label className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:ring-offset-2"><Upload className="size-4" />{saving ? <Loader2 className="size-4 animate-spin" /> : data.photo ? "Change photo" : "Upload photo"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadPhoto(event)} /></label></div></div> : null}
          {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <div key={step} className="mt-7 space-y-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2">
            {step === 1 ? <div className={fieldGrid}><OnboardingField label="Full name" htmlFor="onboarding-name" required><Input id="onboarding-name" className={inputClass} value={data.name} onChange={(event) => setField("name", event.target.value)} /></OnboardingField><OnboardingField label="Phone" htmlFor="onboarding-phone" required><Input id="onboarding-phone" type="tel" inputMode="tel" className={inputClass} value={data.phone} onChange={(event) => setField("phone", event.target.value)} /></OnboardingField><OnboardingField label="City" htmlFor="onboarding-city" required><Input id="onboarding-city" className={inputClass} value={data.city} onChange={(event) => setField("city", event.target.value)} /></OnboardingField><OnboardingField label="Short bio" htmlFor="onboarding-bio" required><textarea id="onboarding-bio" className="min-h-28 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-base outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E] sm:text-sm" value={data.bio} onChange={(event) => setField("bio", event.target.value)} /></OnboardingField></div> : null}
            {step === 2 ? <>{documentCard("cnic", "CNIC", true)}{documentCard("pmdc_license", "PMDC license", true)}{documentCard("degree", "Degree certificate")}</> : null}
            {step === 3 ? <><label>Years of experience *<Input className={inputClass} type="number" min="0" value={data.experience} onChange={(event) => setField("experience", event.target.value)} /></label><label>PMDC number *<Input className={inputClass} value={data.pmdc} onChange={(event) => setField("pmdc", event.target.value)} /></label><Button type="button" variant="outline" onClick={() => setQualifications((current) => [...current, { degree: "", institution: "", year: "" }])} className="mt-3 h-11 w-full rounded-xl border-teal-200 bg-white text-sm font-semibold text-[#0F766E] hover:bg-teal-50 sm:w-fit"><Plus className="size-4" />Add degree</Button>{qualifications.map((qualification, index) => <div key={index} className="grid gap-2 sm:grid-cols-3"><Input placeholder="Degree" value={qualification.degree} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, degree: event.target.value } : item))} /><Input placeholder="Institution" value={qualification.institution} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, institution: event.target.value } : item))} /><div className="flex gap-2"><Input placeholder="Year" value={qualification.year} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, year: event.target.value } : item))} /><button type="button" aria-label="Remove qualification" onClick={() => setQualifications((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="text-red-600" /></button></div></div>)}</> : null}
            {step === 4 ? <><label htmlFor="onboarding-specialty" className="block text-sm font-semibold text-slate-700">Specialty <span className="text-red-600">*</span><Select items={specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name }))} value={data.specialty} onValueChange={(value) => setField("specialty", value ?? "")}><SelectTrigger id="onboarding-specialty" className="mt-2 h-11 w-full rounded-xl border-slate-200 px-3 shadow-sm focus-visible:border-[#0F766E] focus-visible:ring-teal-100"><SelectValue placeholder="Choose specialty" /></SelectTrigger><SelectContent alignItemWithTrigger={false} className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">{specialties.map((specialty) => <SelectItem key={specialty.id} value={String(specialty.id)} className="rounded-lg px-3 py-2.5 text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-medium data-[selected]:text-[#0F766E]">{specialty.name}</SelectItem>)}</SelectContent></Select></label><fieldset><legend className="text-sm font-semibold text-slate-700">Languages <span className="text-red-600">*</span></legend><p className="mt-1 text-xs text-slate-500">Choose all languages you can comfortably use with patients.</p><div className="mt-3 flex flex-wrap gap-2">{languageOptions.map((language) => { const selected = data.languages.split(",").map((item) => item.trim()).includes(language); return <button key={language} type="button" aria-pressed={selected} onClick={() => { const current = data.languages.split(",").map((item) => item.trim()).filter(Boolean); setField("languages", selected ? current.filter((item) => item !== language).join(", ") : [...current, language].join(", ")) }} className={`min-h-10 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${selected ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-teal-100 bg-teal-50 text-[#0F766E]"}`}>{selected ? <Check className="mr-1 inline size-3.5" /> : null}{language}</button> })}</div></fieldset><label className="block text-sm font-semibold text-slate-700">Clinic or hospital name <span className="text-xs font-normal text-slate-500">(optional)</span><Input className={inputClass} value={data.clinic} onChange={(event) => setField("clinic", event.target.value)} /></label></> : null}
            {step === 5 ? <><label>Consultation fee (Rs.) *<Input className={inputClass} type="number" min="1" value={data.fee} onChange={(event) => setField("fee", event.target.value)} /></label><div className="rounded-xl bg-teal-50 p-4 text-sm"><p className="font-semibold text-[#0F766E]">Review your application</p><p className="mt-2">{data.name} · {specialties.find((specialty) => specialty.id === Number(data.specialty))?.name ?? "No specialty"}</p><p className="mt-1">Required documents: {docs.some((document) => document.doc_type === "cnic") && docs.some((document) => document.doc_type === "pmdc_license") ? "Uploaded" : "Missing"}</p></div></> : null}
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between"><Button type="button" variant="outline" disabled={step === 1 || saving} onClick={() => setStep((current) => current - 1)} className="h-11 rounded-xl px-4"><ChevronLeft />Back</Button>{step === 5 ? <Button type="button" disabled={saving} onClick={() => void submit()} className="h-11 rounded-xl bg-[#0F766E] px-5 text-white hover:bg-[#0D5F59]">{saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Submit for review</Button> : <Button type="button" disabled={saving} onClick={() => void continueStep()} className="h-11 rounded-xl bg-[#0F766E] px-5 text-white hover:bg-[#0D5F59]">{saving ? <Loader2 className="animate-spin" /> : null}Continue<ChevronRight /></Button>}</div>
        </section>
      </div></div>
    </main>
  )
}
