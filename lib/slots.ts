export const PAKISTAN_TIME_ZONE = "Asia/Karachi"
/** The last selectable day is this many calendar days after today in Pakistan. */
export const BOOKING_WINDOW_DAYS = 60
export const MAX_UPCOMING_PER_DOCTOR = 3

export type WeeklyScheduleHours = { day_of_week: number; start_time: string; end_time: string; slot_minutes: number }
export type SpecificDateHours = { override_date: string; start_time: string; end_time: string; slot_minutes: number }

/** A date-specific entry replaces the regular weekly hours for that date. */
export function workingHoursForDate(date: string, schedules: WeeklyScheduleHours[], overrides: SpecificDateHours[]) {
  const override = overrides.find((item) => item.override_date === date)
  if (override) return override
  return schedules.find((item) => item.day_of_week === new Date(`${date}T12:00:00`).getDay()) ?? null
}

function formattedParts(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PAKISTAN_TIME_ZONE,
    ...options,
  }).formatToParts(new Date())
}

export function pakistanToday() {
  const parts = formattedParts({ year: "numeric", month: "2-digit", day: "2-digit" })
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "01"
  return new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00`)
}

export function pakistanMinutesNow() {
  const parts = formattedParts({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0")
  return value("hour") * 60 + value("minute")
}

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function pakistanBookingWindowEnd() {
  const end = pakistanToday()
  end.setDate(end.getDate() + BOOKING_WINDOW_DAYS)
  return end
}

export function generateSlots(start: string, end: string, minutes: number) {
  const [startHour, startMinute] = start.slice(0, 5).split(":").map(Number)
  const [endHour, endMinute] = end.slice(0, 5).split(":").map(Number)
  const result: string[] = []
  for (let value = startHour * 60 + startMinute; value + minutes <= endHour * 60 + endMinute; value += minutes) {
    result.push(`${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}:00`)
  }
  return result
}

export function isCancellationAllowed(date: string, time: string, now = new Date()) {
  const appointment = new Date(`${date}T${time.slice(0, 8)}+05:00`)
  return appointment.getTime() - now.getTime() > 2 * 60 * 60 * 1000
}
