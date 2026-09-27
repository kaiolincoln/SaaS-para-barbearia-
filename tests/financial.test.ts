import { expect, test } from "vitest"
import {
  financialPeriod,
  summarizeFinance,
  financeSeries,
  cents,
  type FinancialBooking,
} from "../app/_lib/financial"

const period = financialPeriod("custom", "2030-01-01", "2030-01-31")
const base: FinancialBooking = {
  id: "confirmed",
  date: new Date("2030-01-08T12:00:00Z"),
  status: "CONFIRMED",
  priceAtBooking: "100.10",
  paidAmount: null,
  paidAt: null,
  service: { id: "s", name: "Corte" },
  professional: { id: "p", name: "Profissional" },
}
const rows: FinancialBooking[] = [
  base,
  {
    ...base,
    id: "paid",
    status: "COMPLETED",
    paidAmount: "80.05",
    paidAt: new Date("2030-01-10T12:00:00Z"),
  },
  { ...base, id: "pending", status: "COMPLETED" },
  {
    ...base,
    id: "cancelled",
    status: "CANCELLED",
    paidAmount: "999.99",
    paidAt: new Date("2030-01-10T12:00:00Z"),
  },
  {
    ...base,
    id: "outside",
    status: "COMPLETED",
    date: new Date("2029-12-10T12:00:00Z"),
    paidAmount: "20.05",
    paidAt: new Date("2030-01-10T12:00:00Z"),
  },
  {
    ...base,
    id: "paid-elsewhere",
    status: "COMPLETED",
    paidAmount: "50",
    paidAt: new Date("2029-12-10T12:00:00Z"),
  },
]
test("projection uses snapshot; received uses payment date; cancelled never contributes", () => {
  expect(summarizeFinance(rows, period)).toEqual({
    projected: 10010,
    received: 10010,
    conversion: 100,
    pendingIds: ["pending"],
  })
  expect(
    summarizeFinance(
      rows.filter((r) => r.status !== "CONFIRMED"),
      period,
    ).conversion,
  ).toBeNull()
  expect(cents("0.10") + cents("0.20")).toBe(30)
})
test("Sao Paulo boundaries include 23:50 local and exclude next local midnight", () => {
  const day = financialPeriod(
    "today",
    undefined,
    undefined,
    new Date("2030-01-08T01:00:00Z"),
  )
  expect(day.start).toBe("2030-01-07")
  expect(day.gte.toISOString()).toBe("2030-01-07T03:00:00.000Z")
  const entries = [
    { ...base, date: new Date("2030-01-08T02:50:00Z") },
    { ...base, date: new Date("2030-01-08T03:00:00Z") },
  ]
  expect(summarizeFinance(entries, day).projected).toBe(10010)
  expect(
    summarizeFinance(
      [
        {
          ...base,
          status: "COMPLETED",
          paidAmount: "10",
          paidAt: new Date("2030-01-08T02:50:00Z"),
        },
      ],
      day,
    ).received,
  ).toBe(1000)
})
test("calendar periods and invalid custom ranges", () => {
  const now = new Date("2030-01-08T01:00:00Z")
  expect(financialPeriod("week", undefined, undefined, now)).toMatchObject({
    start: "2030-01-07",
    end: "2030-01-13",
  })
  expect(financialPeriod("previous", undefined, undefined, now)).toMatchObject({
    start: "2029-12-01",
    end: "2029-12-31",
  })
  expect(() => financialPeriod("custom", "2030-02-30", "2030-03-01")).toThrow()
  expect(() => financialPeriod("custom", "2030-03-01", "2030-01-01")).toThrow()
  expect(() => financialPeriod("toString")).toThrow()
})
test.each(["date", "professional", "service"])(
  "chart %s reconciles with totals",
  (dimension) => {
    const series = financeSeries(rows, period, dimension)
    expect(series.points.reduce((n, p) => n + p.projected, 0)).toBe(10010)
    expect(series.points.reduce((n, p) => n + p.received, 0)).toBe(10010)
  },
)
test("longer periods use weeks then months", () => {
  expect(
    financeSeries(rows, financialPeriod("custom", "2030-01-01", "2030-03-01"))
      .grain,
  ).toBe("week")
  expect(
    financeSeries(rows, financialPeriod("custom", "2030-01-01", "2030-12-31"))
      .grain,
  ).toBe("month")
})
