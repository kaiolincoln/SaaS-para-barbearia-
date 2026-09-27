import { bookingDay, bookingDayBounds, bookingWeekday } from "./booking-time"

export const paymentMethodLabels = {
  DINHEIRO: "Dinheiro",
  CARTAO_DEBITO: "Cartão de débito",
  CARTAO_CREDITO: "Cartão de crédito",
  PIX: "Pix",
  OUTRO: "Outro",
}
export const periodLabels = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  previous: "Mês anterior",
  custom: "Personalizado",
}
export type PeriodKey = keyof typeof periodLabels
export type FinancialPeriod = {
  key: PeriodKey
  start: string
  end: string
  gte: Date
  lt: Date
}
export function shiftDay(day: string, offset: number) {
  const date = new Date(day + "T12:00:00Z")
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}
export function financialPeriod(
  key = "month",
  start?: string,
  end?: string,
  now = new Date(),
): FinancialPeriod {
  if (!Object.hasOwn(periodLabels, key)) throw new Error("Período inválido.")
  const today = bookingDay(now)
  let from = today,
    to = today
  if (key === "week") {
    from = shiftDay(today, -((bookingWeekday(today) + 6) % 7))
    to = shiftDay(from, 6)
  } else if (key === "month" || key === "previous") {
    const month = new Date(today.slice(0, 7) + "-01T12:00:00Z")
    if (key === "previous") month.setUTCMonth(month.getUTCMonth() - 1)
    from = month.toISOString().slice(0, 10)
    month.setUTCMonth(month.getUTCMonth() + 1)
    to = shiftDay(month.toISOString().slice(0, 10), -1)
  } else if (key === "custom") {
    if (!start || !end) throw new Error("Informe início e fim do período.")
    from = start
    to = end
  }
  const gte = bookingDayBounds(from).gte
  const lt = bookingDayBounds(to).lt
  if (from > to || (lt.getTime() - gte.getTime()) / 86400000 > 3660)
    throw new Error("Use um período válido de até dez anos.")
  return { key: key as PeriodKey, start: from, end: to, gte, lt }
}
type Money = string | number | { toString(): string }
export function cents(value: Money) {
  const text = value.toString()
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(text))
    throw new Error("Valor monetário inválido.")
  const [whole, fraction = ""] = text.split(".")
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}
export function money(valueInCents: number) {
  return Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100)
}
export type FinancialBooking = {
  id: string
  date: Date
  status: string
  priceAtBooking: Money
  paidAmount: Money | null
  paidAt: Date | null
  service: { id: string; name: string }
  professional: { id: string; name: string }
}
export function inPeriod(date: Date, period: FinancialPeriod) {
  return date >= period.gte && date < period.lt
}
export function isPendingPayment(
  row: FinancialBooking,
  period: FinancialPeriod,
) {
  return (
    row.status === "COMPLETED" &&
    row.paidAt === null &&
    row.paidAmount === null &&
    inPeriod(row.date, period)
  )
}
export function summarizeFinance<T extends FinancialBooking>(
  rows: T[],
  period: FinancialPeriod,
) {
  let projected = 0,
    received = 0
  const pendingIds: string[] = []
  for (const row of rows) {
    if (row.status === "CANCELLED") continue
    if (row.status === "CONFIRMED" && inPeriod(row.date, period))
      projected += cents(row.priceAtBooking)
    if (
      row.status === "COMPLETED" &&
      row.paidAt &&
      row.paidAmount !== null &&
      inPeriod(row.paidAt, period)
    )
      received += cents(row.paidAmount)
    if (isPendingPayment(row, period)) pendingIds.push(row.id)
  }
  return {
    projected,
    received,
    conversion: projected === 0 ? null : (received / projected) * 100,
    pendingIds,
  }
}
export function financeSeries(
  rows: FinancialBooking[],
  period: FinancialPeriod,
  dimension = "date",
) {
  const days = Math.round(
    (period.lt.getTime() - period.gte.getTime()) / 86400000,
  )
  const grain = days <= 31 ? "day" : days <= 180 ? "week" : "month"
  const bucket = (day: string) =>
    grain === "day"
      ? day
      : grain === "month"
        ? day.slice(0, 7)
        : shiftDay(day, -((bookingWeekday(day) + 6) % 7))
  const groups = new Map<
    string,
    { key: string; label: string; projected: number; received: number }
  >()
  const ensure = (key: string, label: string) => {
    if (!groups.has(key))
      groups.set(key, { key, label, projected: 0, received: 0 })
    return groups.get(key)!
  }
  if (dimension === "date") {
    for (let day = period.start; day <= period.end; day = shiftDay(day, 1)) {
      const key = bucket(day)
      ensure(
        key,
        grain === "month"
          ? key.split("-").reverse().join("/")
          : key.split("-").reverse().join("/"),
      )
    }
  }
  for (const row of rows) {
    if (row.status === "CANCELLED") continue
    const groupFor = (date: Date) =>
      dimension === "professional"
        ? ensure(row.professional.id, row.professional.name)
        : dimension === "service"
          ? ensure(row.service.id, row.service.name)
          : ensure(
              bucket(bookingDay(date)),
              bucket(bookingDay(date)).split("-").reverse().join("/"),
            )
    if (row.status === "CONFIRMED" && inPeriod(row.date, period))
      groupFor(row.date).projected += cents(row.priceAtBooking)
    if (
      row.status === "COMPLETED" &&
      row.paidAt &&
      row.paidAmount !== null &&
      inPeriod(row.paidAt, period)
    )
      groupFor(row.paidAt).received += cents(row.paidAmount)
  }
  return { grain, points: [...groups.values()] }
}
