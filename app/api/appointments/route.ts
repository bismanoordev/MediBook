import { NextResponse } from "next/server"

import { sendNewBookingRequestEmail } from "@/lib/email/booking-emails"
import { BOOKING_WINDOW_DAYS, MAX_UPCOMING_PER_DOCTOR, isoDate, pakistanToday } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"

type BookingRequest = {
  doctorId?: unknown
  date?: unknown
  time?: unknown
  reason?: unknown
}

export async function POST(request: Request) {
  let body: BookingRequest

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid booking request." }, { status: 400 })
  }

  if (
    typeof body.doctorId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.doctorId) ||
    typeof body.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
    typeof body.time !== "string" ||
    !/^\d{2}:\d{2}:\d{2}$/.test(body.time) ||
    (body.reason !== undefined && typeof body.reason !== "string")
  ) {
    return NextResponse.json({ error: "Invalid booking details." }, { status: 400 })
  }
  if (typeof body.reason === "string" && body.reason.trim().length > 300) {
    return NextResponse.json({ error: "Reason for visit must be 300 characters or fewer." }, { status: 400 })
  }

  const requestedDate = new Date(`${body.date}T12:00:00`)
  const today = pakistanToday()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + BOOKING_WINDOW_DAYS)
  if (Number.isNaN(requestedDate.getTime()) || isoDate(requestedDate) !== body.date || requestedDate < today) {
    return NextResponse.json({ error: "You cannot book an appointment in the past." }, { status: 400 })
  }
  if (requestedDate > maxDate) {
    return NextResponse.json({ error: `You can book up to ${BOOKING_WINDOW_DAYS} days ahead.` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Please log in before booking an appointment." }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "patient") {
    return NextResponse.json({ error: "Only patient accounts can book appointments." }, { status: 403 })
  }

  const { count: upcomingCount, error: upcomingError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", user.id)
    .eq("doctor_id", body.doctorId)
    .in("status", ["pending", "confirmed"])
    .gte("appointment_date", isoDate(today))

  if (upcomingError) {
    console.error("Could not check upcoming appointment limit", upcomingError)
    return NextResponse.json({ error: "We could not check your upcoming appointments. Please try again." }, { status: 500 })
  }
  if ((upcomingCount ?? 0) >= MAX_UPCOMING_PER_DOCTOR) {
    return NextResponse.json({ error: `You already have ${MAX_UPCOMING_PER_DOCTOR} upcoming appointments with this doctor.` }, { status: 400 })
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: user.id,
      doctor_id: body.doctorId,
      appointment_date: body.date,
      start_time: body.time,
      reason: body.reason?.trim() || null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Appointment booking failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    })

    const message = error.message.toLowerCase()
    if (message.includes("duplicate key") || message.includes("double booking")) {
      return NextResponse.json({ error: "That slot was just booked. Please select another time." }, { status: 409 })
    }
    if (message.includes("past")) {
      return NextResponse.json({ error: "That time has already passed. Please select another slot." }, { status: 400 })
    }
    if (message.includes("not available on this day")) {
      return NextResponse.json({ error: "The doctor is away on this day. Please choose another date." }, { status: 409 })
    }
    if (message.includes("does not work on this day")) {
      return NextResponse.json({ error: "This date is no longer available. Please choose another date." }, { status: 409 })
    }
    if (message.includes("valid slot") || message.includes("does not work") || message.includes("not available")) {
      return NextResponse.json({ error: "That slot is no longer available. Please select another time." }, { status: 409 })
    }
    if (error.code === "23503") {
      return NextResponse.json({ error: "Your account is not ready for booking yet. Please sign out and sign in again, then try once more." }, { status: 409 })
    }
    if (error.code === "42501") {
      return NextResponse.json({ error: "You do not have permission to book this appointment. Please sign in again and try once more." }, { status: 403 })
    }

    return NextResponse.json({ error: "We could not save your appointment. Please try again." }, { status: 500 })
  }

  // Delivery failures must never undo a valid booking. The server-only helper
  // logs a safe error without exposing SMTP details to the browser.
  await sendNewBookingRequestEmail(appointment.id)

  return NextResponse.json({ ok: true }, { status: 201 })
}
