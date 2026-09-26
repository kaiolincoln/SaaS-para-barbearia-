import { expect, test, vi } from "vitest"
const find = vi.hoisted(() => vi.fn().mockResolvedValue([]))
vi.mock("@/_lib/prisma", () => ({ db: { booking: { findMany: find } } }))
import { getDayBookings } from "@/_actions/get-day-bookings"
import { getBookings } from "@/_actions/get-bookings"

test("consultas públicas limitam campos e usam limites do dia em São Paulo", async () => {
  await getDayBookings({ day: "2030-01-07", barbershopId: "shop" })
  await getBookings({ day: "2030-01-07", serviceId: "service" })
  expect(find).toHaveBeenCalledTimes(2)
  for (const [args] of find.mock.calls) {
    expect(args.select).toEqual({ professionalId: true, date: true })
    expect(args.where.date).toEqual({
      gte: new Date("2030-01-07T03:00:00Z"),
      lt: new Date("2030-01-08T03:00:00Z"),
    })
  }
})
