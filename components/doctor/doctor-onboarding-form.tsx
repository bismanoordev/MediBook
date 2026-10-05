"use client"

import { ChangeEvent, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
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

const steps = [
  "Personal information",
  "Documents",
  "Qualifications",
  "Languages and practice",
  "Fee and review",
]
const languageOptions = ["English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi"]
const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"

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
    const status = document?.status === "needs_action" ? "Changes requested" : document?.status ?? "Missing"
    return (
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{label}{required ? " *" : ""}</p>
            <p className="text-sm text-slate-500">{document?.file_name ?? "Not uploaded"}</p>
            {document?.reviewer_note ? <p className="mt-1 text-sm text-red-700">{document.reviewer_note}</p> : null}
          </div>
          <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-[#0F766E]">{status}</span>
          {document?.status !== "verified" ? (
            <label className="cursor-pointer text-sm font-semibold text-[#0F766E]">
              <Upload className="mr-1 inline size-4" />
              {document ? "Replace" : "Upload"}
              <input className="sr-only" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => void uploadDocument(type, event)} />
            </label>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-7 lg:grid-cols-[14rem_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mx-auto grid size-20 place-items-center rounded-full border-8 border-[#CCFBF1] text-xl font-bold text-[#0F766E]">{step}/5</div>
          <ol className="mt-6 grid gap-2">{steps.map((item, index) => <li key={item} className={`rounded-lg px-3 py-2 text-sm ${step === index + 1 ? "bg-teal-50 font-semibold text-[#0F766E]" : "text-slate-500"}`}>{index + 1}. {item}</li>)}</ol>
        </aside>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Doctor onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{steps[step - 1]}</h1>
          <p className="mt-2 text-sm text-slate-600">Your progress is saved when you continue to the next step.</p>
          {step === 1 ? <div className="mt-5 flex items-center gap-3"><div className="grid size-14 place-items-center overflow-hidden rounded-full bg-teal-100 font-semibold text-[#0F766E]">{data.photo ? <Image src={data.photo} alt="Profile preview" width={56} height={56} unoptimized className="size-full object-cover" /> : data.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div><p className="text-sm text-slate-600">Add your professional photo to continue.</p></div> : null}
          {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <div className="mt-7 space-y-4">
            {step === 1 ? <><label>Full name *<Input className={inputClass} value={data.name} onChange={(event) => setField("name", event.target.value)} /></label><label>Phone *<Input className={inputClass} value={data.phone} onChange={(event) => setField("phone", event.target.value)} /></label><label>City *<Input className={inputClass} value={data.city} onChange={(event) => setField("city", event.target.value)} /></label><label>Short bio *<textarea className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#0F766E]" value={data.bio} onChange={(event) => setField("bio", event.target.value)} /></label><label>Profile photo * <span className="text-xs text-slate-500">Required · square, at least 600 × 600, JPG/PNG/WebP, max 5 MB</span><input className="mt-1 block" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadPhoto(event)} /></label></> : null}
            {step === 2 ? <>{documentCard("cnic", "CNIC", true)}{documentCard("pmdc_license", "PMDC license", true)}{documentCard("degree", "Degree certificate")}</> : null}
            {step === 3 ? <><label>Years of experience *<Input className={inputClass} type="number" min="0" value={data.experience} onChange={(event) => setField("experience", event.target.value)} /></label><label>PMDC number *<Input className={inputClass} value={data.pmdc} onChange={(event) => setField("pmdc", event.target.value)} /></label><button type="button" onClick={() => setQualifications((current) => [...current, { degree: "", institution: "", year: "" }])} className="text-sm font-semibold text-[#0F766E]"><Plus className="mr-1 inline size-4" />Add degree</button>{qualifications.map((qualification, index) => <div key={index} className="grid gap-2 sm:grid-cols-3"><Input placeholder="Degree" value={qualification.degree} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, degree: event.target.value } : item))} /><Input placeholder="Institution" value={qualification.institution} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, institution: event.target.value } : item))} /><div className="flex gap-2"><Input placeholder="Year" value={qualification.year} onChange={(event) => setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, year: event.target.value } : item))} /><button type="button" aria-label="Remove qualification" onClick={() => setQualifications((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="text-red-600" /></button></div></div>)}</> : null}
            {step === 4 ? <><label>Specialty *<select className={inputClass} value={data.specialty} onChange={(event) => setField("specialty", event.target.value)}><option value="">Choose specialty</option>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label><fieldset><legend className="text-sm font-medium">Languages *</legend><div className="mt-2 flex flex-wrap gap-2">{languageOptions.map((language) => { const selected = data.languages.split(",").map((item) => item.trim()).includes(language); return <button key={language} type="button" aria-pressed={selected} onClick={() => { const current = data.languages.split(",").map((item) => item.trim()).filter(Boolean); setField("languages", selected ? current.filter((item) => item !== language).join(", ") : [...current, language].join(", ")) }} className={`rounded-full px-3 py-1.5 text-sm ${selected ? "bg-[#0F766E] text-white" : "bg-teal-50 text-[#0F766E]"}`}>{language}</button> })}</div></fieldset><label>Clinic or hospital name<Input className={inputClass} value={data.clinic} onChange={(event) => setField("clinic", event.target.value)} /></label></> : null}
            {step === 5 ? <><label>Consultation fee (Rs.) *<Input className={inputClass} type="number" min="1" value={data.fee} onChange={(event) => setField("fee", event.target.value)} /></label><div className="rounded-xl bg-teal-50 p-4 text-sm"><p className="font-semibold text-[#0F766E]">Review your application</p><p className="mt-2">{data.name} · {specialties.find((specialty) => specialty.id === Number(data.specialty))?.name ?? "No specialty"}</p><p className="mt-1">Required documents: {docs.some((document) => document.doc_type === "cnic") && docs.some((document) => document.doc_type === "pmdc_license") ? "Uploaded" : "Missing"}</p></div></> : null}
          </div>
          <div className="mt-8 flex justify-between"><Button type="button" variant="outline" disabled={step === 1 || saving} onClick={() => setStep((current) => current - 1)}><ChevronLeft />Back</Button>{step === 5 ? <Button type="button" disabled={saving} onClick={() => void submit()}>{saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Submit for review</Button> : <Button type="button" disabled={saving} onClick={() => void continueStep()}>{saving ? <Loader2 className="animate-spin" /> : null}Continue<ChevronRight /></Button>}</div>
        </section>
      </div>
    </main>
  )
}
