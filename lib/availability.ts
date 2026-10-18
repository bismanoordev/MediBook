export type AvailabilityResult = { error?: string; success?: true; added?: number; skipped?: number }

export type AvailabilityDateInput = {
  startDate: string
  endDate: string
  weekdays: number[]
  start: string
  end: string
  minutes: number
}

export type AvailabilityUpdateInput = {
  id: number
  date: string
  start: string
  end: string
  minutes: number
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` === value
}

export function availabilityDates(input: AvailabilityDateInput, minDate: string, maxDate: string) {
  const startDate = input.startDate.trim()
  const endDate = input.endDate.trim()
  const weekdays = [...new Set(input.weekdays)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate < minDate || endDate > maxDate || endDate < startDate || !/^\d{2}:\d{2}$/.test(input.start) || !/^\d{2}:\d{2}$/.test(input.end) || ![15, 20, 30, 60].includes(input.minutes) || input.end <= input.start || !weekdays.length) return null

  const dates: string[] = []
  const cursor = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates.length ? dates : null
}

export function validAvailabilityUpdate(input: AvailabilityUpdateInput, minDate: string, maxDate: string) {
  return Number.isInteger(input.id) && input.id > 0 && isIsoDate(input.date) && input.date >= minDate && input.date <= maxDate && /^\d{2}:\d{2}$/.test(input.start) && /^\d{2}:\d{2}$/.test(input.end) && input.end > input.start && [15, 20, 30, 60].includes(input.minutes)
}

export function friendlyAvailabilityError(message: string, fallback: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("do not fit these hours")) return "You already have appointments outside these hours on this date. Cancel them first."
  if (normalized.includes("already have appointments on this date")) return "You already have appointments on this date. Cancel them first."
  return fallback
}
