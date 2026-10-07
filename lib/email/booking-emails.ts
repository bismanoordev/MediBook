import "server-only"

import nodemailer from "nodemailer"

import { siteUrl } from "@/lib/site"
import { createAdminClient } from "@/lib/supabase/admin"

type BookingEmailEvent =
  | "new-request"
  | "confirmed"
  | "declined"
  | "cancelled-by-patient"
  | "cancelled-by-doctor"
  | "cancelled-by-clinic"
  | "cancelled-by-clinic-to-doctor"

type EmailResult = { delivered: boolean; skipped?: boolean }

type BookingEmailContext = {
  id: string
  appointment_date: string
  start_time: string
  status: string
  reason: string | null
  cancel_reason: string | null
  patient_id: string
  patientName: string
  doctorName: string
  doctorUserId: string | null
  specialty: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character)
}

function formatVisit(date: string, time: string) {
  const visit = new Date(`${date}T${time.slice(0, 8)}+05:00`)
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(visit)
}

function bookingRows(context: BookingEmailContext, extras: Array<[string, string | null | undefined]> = []) {
  const rows: Array<[string, string | null | undefined]> = [
    ["Booking ID", context.id],
    ["Doctor", context.doctorName],
    ["Patient", context.patientName],
    ["Service", context.specialty],
    ["Appointment", formatVisit(context.appointment_date, context.start_time)],
    ...extras,
  ]

  return rows
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(value ?? "")}</td></tr>`)
    .join("")
}

function emailHtml(input: { title: string; greeting: string; body: string; rows: string; actionLabel: string; actionUrl: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><tr><td style="padding:24px 28px;background:#0f766e;color:#ffffff;font-size:20px;font-weight:700">MediBook</td></tr><tr><td style="padding:30px 28px"><h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a">${escapeHtml(input.title)}</h1><p style="margin:0 0 10px;font-size:16px;line-height:1.6">${escapeHtml(input.greeting)}</p><p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">${escapeHtml(input.body)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden">${input.rows}</table><p style="margin:28px 0 0"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#0f766e;border-radius:10px;padding:12px 18px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">${escapeHtml(input.actionLabel)}</a></p></td></tr><tr><td style="padding:18px 28px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5">MediBook · Your healthcare appointments, made simple.</td></tr></table></td></tr></table></body></html>`
}

async function loadContext(appointmentId: string): Promise<BookingEmailContext | null> {
  const admin = createAdminClient()
  if (!admin) {
    console.warn("Booking email skipped: SUPABASE_SERVICE_ROLE_KEY is not configured.", { appointmentId })
    return null
  }

  const { data, error } = await admin
    .from("appointments")
    .select("id,appointment_date,start_time,status,reason,cancel_reason,patient_id,doctors(full_name,user_id,specialties(name)),profiles!appointments_patient_id_fkey(full_name)")
    .eq("id", appointmentId)
    .maybeSingle()

  if (error || !data) {
    console.error("Booking email skipped: appointment lookup failed.", { appointmentId, code: error?.code })
    return null
  }

  const doctor = data.doctors as unknown as { full_name: string; user_id: string | null; specialties: { name: string } | null } | null
  const patient = data.profiles as unknown as { full_name: string | null } | null
  if (!doctor) {
    console.error("Booking email skipped: doctor lookup failed.", { appointmentId })
    return null
  }

  return {
    id: data.id,
    appointment_date: data.appointment_date,
    start_time: data.start_time,
    status: data.status,
    reason: data.reason,
    cancel_reason: data.cancel_reason,
    patient_id: data.patient_id,
    patientName: patient?.full_name?.trim() || "Patient",
    doctorName: doctor.full_name,
    doctorUserId: doctor.user_id,
    specialty: doctor.specialties?.name ?? "Clinic appointment",
  }
}

async function emailForUser(userId: string, appointmentId: string) {
  const admin = createAdminClient()
  if (!admin) return null
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data.user.email) {
    console.error("Booking email skipped: recipient email lookup failed.", { appointmentId, userId, code: error?.code })
    return null
  }
  return data.user.email
}

async function sendGmailEmail(input: { to: string; subject: string; html: string; text: string; appointmentId: string }): Promise<EmailResult> {
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
  const from = process.env.EMAIL_FROM
  const testMode = process.env.EMAIL_TEST_MODE === "true"
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT

  if (process.env.NODE_ENV !== "production" && !testMode) {
    console.info("Booking email suppressed outside production. Set EMAIL_TEST_MODE=true to deliver to a safe test inbox.", { appointmentId: input.appointmentId })
    return { delivered: false, skipped: true }
  }
  if (!gmailUser || !gmailAppPassword || !from) {
    console.warn("Booking email skipped: Gmail SMTP is not configured.", { appointmentId: input.appointmentId })
    return { delivered: false, skipped: true }
  }
  if (testMode && !testRecipient) {
    console.warn("Booking email skipped: EMAIL_TEST_RECIPIENT is required when EMAIL_TEST_MODE=true.", { appointmentId: input.appointmentId })
    return { delivered: false, skipped: true }
  }

  const recipient = testMode ? testRecipient! : input.to
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
    })
    await transporter.sendMail({ from, to: recipient, subject: input.subject, html: input.html, text: input.text })
    return { delivered: true }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : undefined
    console.error("Booking email delivery failed.", { appointmentId: input.appointmentId, error: error instanceof Error ? error.name : "unknown", code })
    return { delivered: false }
  }
}

async function sendBookingEmailInternal(event: BookingEmailEvent, appointmentId: string): Promise<EmailResult> {
  const context = await loadContext(appointmentId)
  if (!context) return { delivered: false, skipped: true }

  const commonText = `Booking ID: ${context.id}\nDoctor: ${context.doctorName}\nPatient: ${context.patientName}\nService: ${context.specialty}\nAppointment: ${formatVisit(context.appointment_date, context.start_time)}`
  let recipientId: string | null = null
  let subject = "MediBook booking update"
  let title = "Booking update"
  let greeting = "Hello,"
  let body = "There is an update to your appointment."
  let actionLabel = "Open appointment"
  let actionUrl = `${siteUrl}/appointments`
  let extras: Array<[string, string | null | undefined]> = [["Status", context.status]]

  if (event === "new-request") {
    recipientId = context.doctorUserId
    subject = "New Booking Request Received"
    title = "New booking request"
    greeting = `Hello Dr. ${context.doctorName},`
    body = "A new appointment request is waiting for your review."
    actionLabel = "Review request"
    actionUrl = `${siteUrl}/doctor/appointments`
    extras = [["Status", "Pending"], ["Patient note", context.reason]]
  } else if (event === "confirmed") {
    recipientId = context.patient_id
    subject = "Your Booking Has Been Confirmed"
    title = "Your appointment is confirmed"
    greeting = `Hello ${context.patientName},`
    body = `Dr. ${context.doctorName} has confirmed your appointment.`
    extras = [["Status", "Confirmed"]]
  } else if (event === "declined") {
    recipientId = context.patient_id
    subject = "Booking Request Update"
    title = "Your appointment request was declined"
    greeting = `Hello ${context.patientName},`
    body = `Dr. ${context.doctorName} is unable to accept this appointment request. You can browse other available doctors on MediBook.`
    actionLabel = "Find a doctor"
    actionUrl = `${siteUrl}/doctors`
    extras = [["Status", "Declined"], ["Reason", context.cancel_reason]]
  } else if (event === "cancelled-by-patient") {
    recipientId = context.doctorUserId
    subject = "Booking Cancelled"
    title = "Appointment cancelled"
    greeting = `Hello Dr. ${context.doctorName},`
    body = `${context.patientName} cancelled this appointment.`
    actionLabel = "View appointments"
    actionUrl = `${siteUrl}/doctor/appointments`
    extras = [["Status", "Cancelled"], ["Cancelled by", context.patientName], ["Reason", context.cancel_reason]]
  } else if (event === "cancelled-by-clinic-to-doctor") {
    recipientId = context.doctorUserId
    subject = "Booking Cancelled"
    title = "Appointment cancelled"
    greeting = `Hello Dr. ${context.doctorName},`
    body = "The clinic cancelled this appointment."
    actionLabel = "View appointments"
    actionUrl = `${siteUrl}/doctor/appointments`
    extras = [["Status", "Cancelled"], ["Cancelled by", "The clinic"], ["Reason", context.cancel_reason]]
  } else {
    recipientId = context.patient_id
    const cancelledBy = event === "cancelled-by-clinic" ? "the clinic" : `Dr. ${context.doctorName}`
    subject = "Booking Cancelled"
    title = "Appointment cancelled"
    greeting = `Hello ${context.patientName},`
    body = `${cancelledBy} cancelled this appointment.`
    extras = [["Status", "Cancelled"], ["Cancelled by", cancelledBy], ["Reason", context.cancel_reason]]
  }

  if (!recipientId) {
    console.warn("Booking email skipped: the recipient does not have a linked login account.", { appointmentId, event })
    return { delivered: false, skipped: true }
  }
  const recipient = await emailForUser(recipientId, appointmentId)
  if (!recipient) return { delivered: false, skipped: true }

  return sendGmailEmail({
    to: recipient,
    subject,
    html: emailHtml({ title, greeting, body, rows: bookingRows(context, extras), actionLabel, actionUrl }),
    text: `${title}\n\n${greeting}\n${body}\n\n${commonText}\n${extras.filter(([, value]) => Boolean(value)).map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${actionLabel}: ${actionUrl}`,
    appointmentId,
  })
}

/**
 * Email delivery is deliberately best-effort. A provider, network, or lookup
 * failure must not turn a completed appointment mutation into an application
 * failure or cause a client retry that creates duplicate booking side effects.
 */
export async function sendBookingEmail(event: BookingEmailEvent, appointmentId: string): Promise<EmailResult> {
  try {
    return await sendBookingEmailInternal(event, appointmentId)
  } catch (error) {
    console.error("Booking email delivery failed unexpectedly.", {
      appointmentId,
      event,
      error: error instanceof Error ? error.name : "unknown",
    })
    return { delivered: false }
  }
}

export const sendNewBookingRequestEmail = (appointmentId: string) => sendBookingEmail("new-request", appointmentId)
export const sendBookingAcceptedEmail = (appointmentId: string) => sendBookingEmail("confirmed", appointmentId)
export const sendBookingRejectedEmail = (appointmentId: string) => sendBookingEmail("declined", appointmentId)
export const sendBookingCancelledByPatientEmail = (appointmentId: string) => sendBookingEmail("cancelled-by-patient", appointmentId)
export const sendBookingCancelledByDoctorEmail = (appointmentId: string) => sendBookingEmail("cancelled-by-doctor", appointmentId)
export const sendBookingCancelledByClinicEmail = (appointmentId: string) => sendBookingEmail("cancelled-by-clinic", appointmentId)
export const sendBookingCancelledByClinicToDoctorEmail = (appointmentId: string) => sendBookingEmail("cancelled-by-clinic-to-doctor", appointmentId)
