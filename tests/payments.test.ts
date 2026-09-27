import { beforeEach, expect, test, vi } from "vitest"
const m = vi.hoisted(() => ({
  session: vi.fn(),
  shop: vi.fn(),
  booking: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}))
vi.mock("next-auth", () => ({ getServerSession: m.session }))
vi.mock("@/_lib/auth", () => ({ authOptions: {} }))
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }))
vi.mock("@/_lib/prisma", () => ({
  db: {
    $transaction: m.transaction,
    barbershop: { findUnique: m.shop },
    booking: { findUnique: m.booking, updateMany: m.update, findMany: m.list },
  },
}))
import { db } from "@/_lib/prisma"
import { registerPayment } from "@/_actions/register-payment"
import { getFinancialReport } from "@/_data/get-financial-report"
import { financialPeriod } from "@/_lib/financial"
const id = "a8888888-8888-4888-8888-888888888888"
function form() {
  const f = new FormData()
  f.set("bookingId", id)
  f.set("paidAmount", "45.50")
  f.set("paymentMethod", "PIX")
  return f
}
beforeEach(() => {
  vi.resetAllMocks()
  m.session.mockResolvedValue({ user: { id: "owner", role: "USER" } })
  m.shop.mockResolvedValue({ id: "shop", ownerId: "owner" })
  m.booking.mockResolvedValue({
    status: "COMPLETED",
    service: { barbershopId: "shop" },
  })
  m.update.mockResolvedValue({ count: 1 })
  m.list.mockResolvedValue([])
  m.transaction.mockImplementation((fn) => fn(db))
})
test.each(["CONFIRMED", "CANCELLED"])("payment rejects %s", async (status) => {
  m.booking.mockResolvedValue({ status, service: { barbershopId: "shop" } })
  expect(await registerPayment(form())).toHaveProperty("success", false)
  expect(m.update).not.toHaveBeenCalled()
})
test.each([null, { user: { id: "other", role: "BARBERSHOP_ADMIN" } }])(
  "payment and report reject unauthorized caller %j",
  async (session) => {
    m.session.mockResolvedValue(session)
    expect(await registerPayment(form())).toHaveProperty("success", false)
    await expect(
      getFinancialReport("shop", financialPeriod()),
    ).rejects.toThrow()
    expect(m.update).not.toHaveBeenCalled()
    expect(m.list).not.toHaveBeenCalled()
  },
)
test.each(["USER", "SUPER_ADMIN"])(
  "authorized %s records payment and revalidates",
  async (role) => {
    m.session.mockResolvedValue({
      user: { id: role === "USER" ? "owner" : "super", role },
    })
    expect(await registerPayment(form())).toHaveProperty("success", true)
    expect(m.update).toHaveBeenCalledWith({
      where: { id, status: "COMPLETED" },
      data: {
        paidAmount: "45.50",
        paymentMethod: "PIX",
        paidAt: expect.any(Date),
      },
    })
    expect(m.revalidate).toHaveBeenCalledWith("/admin/barbershops/shop")
  },
)
test.each(["-1", "1.001", "1e2", "100000000", "NaN", ""])(
  "invalid amount %s rejected",
  async (value) => {
    const f = form()
    f.set("paidAmount", value)
    expect(await registerPayment(f)).toHaveProperty("success", false)
    expect(m.update).not.toHaveBeenCalled()
  },
)
test("custom paidAt is interpreted in Sao Paulo; future rejected", async () => {
  const f = form()
  f.set("paidAt", "2020-01-07T23:50")
  expect(await registerPayment(f)).toHaveProperty("success", true)
  expect(m.update.mock.calls[0][0].data.paidAt.toISOString()).toBe(
    "2020-01-08T02:50:00.000Z",
  )
  f.set("paidAt", "2099-01-01T00:00")
  expect(await registerPayment(f)).toHaveProperty("success", false)
})
test("report scopes rows by shop, excludes contact data and shares summary calculation", async () => {
  const now = new Date("2030-01-08T12:00:00Z")
  m.list.mockResolvedValue([
    {
      id,
      status: "CONFIRMED",
      date: now,
      priceAtBooking: "40.05",
      paidAmount: null,
      paidAt: null,
      service: { id: "s", name: "Corte" },
      professional: { id: "p", name: "Profissional" },
      user: { name: "Cliente" },
    },
  ])
  const report = await getFinancialReport(
    "shop",
    financialPeriod("month", undefined, undefined, now),
    "date",
    now,
  )
  expect(report.summary.projected).toBe(4005)
  expect(report.monthSummary.projected).toBe(report.summary.projected)
  expect(m.list.mock.calls[0][0].where.service).toEqual({
    barbershopId: "shop",
  })
  expect(m.list.mock.calls[0][0].select.user).toEqual({
    select: { name: true },
  })
})
