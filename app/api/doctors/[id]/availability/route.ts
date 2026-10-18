import { NextResponse } from "next/server"

import { BOOKING_WINDOW_DAYS, generateSlots, isoDate, pakistanBookingWindowEnd, pakistanMinutesNow, pakistanToday, workingHoursForDate } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"

function isIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00`)
  return !Number.isNaN(parsed.getTime()) && isoDate(parsed) === value
}

function datesBetween(from: string, to: string) {
  const dates: string[] = []
  const cursor = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  while (cursor <= end) {
    dates.push(isoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

async function withConcurrency<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>) {
  const result: R[] = new Array(items.length)
  let index = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++
      result[current] = await work(items[current])
    }
  }))
  return result
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)
  const requestedDate = url.searchParams.get("date")
  const today = pakistanToday()
  const start = isoDate(today)
  const end = isoDate(pakistanBookingWindowEnd())

  let from = start
  let to = end
  if (requestedDate) {
    if (!isIsoDate(requestedDate) || requestedDate < start || requestedDate > end) {
      return NextResponse.json({ error: `Choose a date within the next ${BOOKING_WINDOW_DAYS} days.` }, { status: 400 })
    }
    from = requestedDate
    to = requestedDate
  } else {
    const requestedFrom = url.searchParams.get("from")
    const requestedTo = url.searchParams.get("to")
    if ((requestedFrom && !isIsoDate(requestedFrom)) || (requestedTo && !isIsoDate(requestedTo))) {
      return NextResponse.json({ error: "Choose valid availability dates." }, { status: 400 })
    }
    from = requestedFrom && requestedFrom > start ? requestedFrom : start
    to = requestedTo && requestedTo < end ? requestedTo : end
    if (from > to) return NextResponse.json({ error: "Choose a valid availability range." }, { status: 400 })
    const fromDate = new Date(`${from}T12:00:00`)
    const toDate = new Date(`${to}T12:00:00`)
    if (fromDate.getFullYear() !== toDate.getFullYear() || fromDate.getMonth() !== toDate.getMonth()) {
      return NextResponse.json({ error: "Choose availability dates from one calendar month." }, { status: 400 })
    }
  }

  const supabase = await createClient()
  const [{ data: doctor, error: doctorError }, { data: schedules, error: schedulesError }, { data: timeOff, error: timeOffError }, { data: overrides, error: overridesError }] = await Promise.all([
    supabase.from("doctors").select("id").eq("id", id).eq("is_active", true).eq("approval_status", "approved").maybeSingle(),
    supabase.from("doctor_schedules").select("day_of_week,start_time,end_time,slot_minutes").eq("doctor_id", id),
    supabase.from("doctor_time_off").select("start_date,end_date").eq("doctor_id", id),
    supabase.from("doctor_availability_overrides").select("override_date,start_time,end_time,slot_minutes").eq("doctor_id", id).gte("override_date", from).lte("override_date", to),
  ])
  if (!doctor) return NextResponse.json({ error: "This doctor is not available for booking." }, { status: 404 })
  if (doctorError || schedulesError || timeOffError || overridesError) {
    console.error("Availability configuration lookup failed", { doctorError, schedulesError, timeOffError, overridesError })
    return NextResponse.json({ error: "We could not load availability. Please try again." }, { status: 500 })
  }

  const nowMinutes = pakistanMinutesNow()
  const availability = await withConcurrency(datesBetween(from, to), 5, async (date) => {
    const schedule = workingHoursForDate(date, schedules ?? [], overrides ?? [])
    const away = (timeOff ?? []).some((range) => range.start_date <= date && range.end_date >= date)
    if (!schedule || away) return { date, freeSlots: 0, slots: [] as string[] }

    const { data: booked, error } = await supabase.rpc("get_booked_slots", { p_doctor_id: id, p_date: date })
    if (error) throw error
    const taken = new Set((booked ?? []).map((item) => item.start_time))
    const slots = generateSlots(schedule.start_time, schedule.end_time, schedule.slot_minutes)
      .filter((time) => !taken.has(time) && (date !== start || Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) > nowMinutes))
    return { date, freeSlots: slots.length, slots }
  }).catch((error) => {
    console.error("Availability lookup failed", error)
    return null
  })

  if (!availability) return NextResponse.json({ error: "We could not load availability. Please try again." }, { status: 500 })
  const response = requestedDate
    ? { date: requestedDate, slots: availability[0]?.slots ?? [], freeSlots: availability[0]?.freeSlots ?? 0 }
    : { availability: availability.map(({ date, freeSlots }) => ({ date, freeSlots })) }
  return NextResponse.json(response, { headers: { "Cache-Control": "private, max-age=30" } })
}
