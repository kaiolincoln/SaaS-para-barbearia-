/**
 * Fonte única da agenda: America/Sao_Paulo, independentemente do fuso do
 * navegador ou Node. Dias civis trafegam como YYYY-MM-DD; reservas são instantes.
 * O Date local do calendário representa somente o rótulo clicado, não um instante.
 * Conversões usam a base IANA via date-fns-tz; não fixar manualmente UTC-3.
 */
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { ptBR } from "date-fns/locale"

export const BOOKING_TIME_ZONE = "America/Sao_Paulo"
export const SLOT_MINUTES = 30
export type Schedule = {
  dayOfWeek: number
  isOpen: boolean
  startTime: string
  endTime: string
}
export type OccupiedSlot = { professionalId: string; date: Date; endsAt: Date }

export function formatBookingDate(date: Date | string, pattern: string) {
  return formatInTimeZone(date, BOOKING_TIME_ZONE, pattern, { locale: ptBR })
}
export function bookingDay(date = new Date()) {
  return formatBookingDate(date, "yyyy-MM-dd")
}
export function calendarDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function calendarDate(day: string) {
  assertDay(day)
  const [year, month, date] = day.split("-").map(Number)
  return new Date(year, month - 1, date, 12)
}
function assertDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Dia inválido.")
  const parsed = new Date(`${day}T12:00:00Z`)
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== day
  )
    throw new Error("Dia inválido.")
}
export function bookingInstant(day: string, time: string) {
  assertDay(day)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new Error("Horário inválido.")
  const date = fromZonedTime(`${day}T${time}:00`, BOOKING_TIME_ZONE)
  if (formatBookingDate(date, "yyyy-MM-dd HH:mm") !== `${day} ${time}`)
    throw new Error("Horário inexistente neste fuso.")
  return date
}
export function bookingDayBounds(day: string) {
  assertDay(day)
  const next = new Date(`${day}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return {
    gte: bookingInstant(day, "00:00"),
    lt: bookingInstant(next.toISOString().slice(0, 10), "00:00"),
  }
}
export function bookingWeekday(day: string) {
  assertDay(day)
  return new Date(`${day}T12:00:00Z`).getUTCDay()
}
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}
export function validateBookingTime(
  date: Date,
  hours: Schedule[],
  now = new Date(),
  durationMinutes = SLOT_MINUTES,
) {
  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime()) ||
    date <= now
  )
    throw new Error("Escolha uma data futura válida.")
  assertDuration(durationMinutes)
  const schedule = hours.find(
    (item) => item.dayOfWeek === bookingWeekday(bookingDay(date)),
  )
  const minutes = toMinutes(formatBookingDate(date, "HH:mm"))
  if (
    !schedule?.isOpen ||
    minutes < toMinutes(schedule.startTime) ||
    minutes + durationMinutes > toMinutes(schedule.endTime)
  )
    throw new Error("Horário fora do funcionamento da barbearia.")
  if (
    minutes % SLOT_MINUTES !== 0 ||
    date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0
  )
    throw new Error("Selecione um horário em intervalos de 30 minutos.")
}
export function freeProfessionals<T extends { id: string }>(
  date: Date,
  professionals: T[],
  bookings: OccupiedSlot[],
  durationMinutes = SLOT_MINUTES,
) {
  return professionals.filter(
    (professional) =>
      !bookings.some(
        (booking) =>
          booking.professionalId === professional.id &&
          intervalsOverlap(
            date,
            bookingEnd(date, durationMinutes),
            new Date(booking.date),
            new Date(booking.endsAt),
          ),
      ),
  )
}
export function availableBookingTimes(
  day: string,
  hours: Schedule[],
  professionals: { id: string }[],
  bookings: OccupiedSlot[],
  now = new Date(),
  durationMinutes = SLOT_MINUTES,
) {
  assertDuration(durationMinutes)
  const schedule = hours.find((item) => item.dayOfWeek === bookingWeekday(day))
  if (!schedule?.isOpen) return []
  const times: string[] = []
  for (
    let minutes =
      Math.ceil(toMinutes(schedule.startTime) / SLOT_MINUTES) * SLOT_MINUTES;
    minutes + durationMinutes <= toMinutes(schedule.endTime);
    minutes += SLOT_MINUTES
  ) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
    const date = bookingInstant(day, time)
    if (
      date > now &&
      freeProfessionals(date, professionals, bookings, durationMinutes).length
    )
      times.push(time)
  }
  return times
}

export function assertDuration(minutes: number) {
  if (
    !Number.isInteger(minutes) ||
    minutes < SLOT_MINUTES ||
    minutes > 720 ||
    minutes % SLOT_MINUTES !== 0
  )
    throw new Error("Duração deve ser múltipla de 30, entre 30 e 720 minutos.")
}
export function bookingEnd(date: Date, durationMinutes: number) {
  assertDuration(durationMinutes)
  return new Date(date.getTime() + durationMinutes * 60_000)
}
export function intervalsOverlap(
  start: Date,
  end: Date,
  otherStart: Date,
  otherEnd: Date,
) {
  return start < otherEnd && otherStart < end
}
