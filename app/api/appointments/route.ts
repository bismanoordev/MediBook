import { NextResponse } from "next/server"

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Please log in before booking an appointment." }, { status: 401 })
  }

  const { error } = await supabase.from("appointments").insert({
    patient_id: user.id,
    doctor_id: body.doctorId,
    appointment_date: body.date,
    start_time: body.time,
    reason: body.reason?.trim().slice(0, 300) || null,
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes("duplicate key") || message.includes("double booking")) {
      return NextResponse.json({ error: "That slot was just booked. Please select another time." }, { status: 409 })
    }
    if (message.includes("past")) {
      return NextResponse.json({ error: "That time has already passed. Please select another slot." }, { status: 400 })
    }
    if (message.includes("valid slot") || message.includes("does not work") || message.includes("not available")) {
      return NextResponse.json({ error: "That slot is no longer available. Please select another time." }, { status: 409 })
    }

    return NextResponse.json({ error: "We could not save your appointment. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
