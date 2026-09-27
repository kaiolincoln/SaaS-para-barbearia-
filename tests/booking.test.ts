import { beforeEach, expect, test, vi } from "vitest"
import { validateBookingTime } from "../app/_lib/booking-time"
import {
  availableBookingTimes,
  bookingDay,
  bookingDayBounds,
  bookingInstant,
  calendarDay,
  calendarDate,
  formatBookingDate,
} from "../app/_lib/booking-time"

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  service: vi.fn(),
  existing: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
}))
vi.mock("next-auth", () => ({ getServerSession: mocks.session }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("@/_lib/auth", () => ({ authOptions: {} }))
vi.mock("@/_lib/prisma", () => ({
  db: {
    $transaction: mocks.transaction,
    booking: {
      findFirst: mocks.existing,
      updateMany: mocks.update,
      findMany: mocks.list,
      deleteMany: mocks.remove,
    },
  },
}))
import { createBooking } from "../app/_actions/create-booking"

const hours = [
  { dayOfWeek: 1, isOpen: true, startTime: "09:00", endTime: "18:00" },
]
const date = new Date("2030-01-07T12:00:00Z")
beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.mockResolvedValue({ user: { id: "user" } })
  mocks.service.mockResolvedValue({
    price: "45.50",
    durationMinutes: 30,
    barbershopId: "shop",
    professionals: [{ id: "professional", barbershopId: "shop" }],
    barbershop: { workingHours: hours },
  })
  mocks.existing.mockResolvedValue(null)
  mocks.transaction.mockImplementation((callback) =>
    callback({
      barbershopService: { findUnique: mocks.service },
      booking: { findFirst: mocks.existing, create: mocks.create },
    }),
  )
})
test("horário respeita fuso, funcionamento, data futura e intervalos", () => {
  const now = new Date("2029-01-01")
  expect(() => validateBookingTime(date, hours, now)).not.toThrow()
  expect(() => validateBookingTime(new Date("invalid"), hours, now)).toThrow()
  expect(() =>
    validateBookingTime(date, hours, new Date("2031-01-01")),
  ).toThrow()
  expect(() =>
    validateBookingTime(date, [{ ...hours[0], isOpen: false }], now),
  ).toThrow()
  expect(() =>
    validateBookingTime(new Date("2030-01-07T21:00:00Z"), hours, now),
  ).toThrow()
  expect(() =>
    validateBookingTime(new Date("2030-01-07T12:15:00Z"), hours, now),
  ).toThrow()
})
test("agendamento exige autenticação", async () => {
  mocks.session.mockResolvedValue(null)
  await expect(
    createBooking({
      serviceId: "service",
      professionalId: "professional",
      date,
    }),
  ).rejects.toThrow("autenticado")
  expect(mocks.create).not.toHaveBeenCalled()
})
test("profissional deve atender ao serviço escolhido", async () => {
  await expect(
    createBooking({ serviceId: "service", professionalId: "other", date }),
  ).rejects.toThrow("Profissional")
  expect(mocks.create).not.toHaveBeenCalled()
})
test("reserva conflitante impede gravação", async () => {
  mocks.existing.mockResolvedValue({ id: "existing" })
  await expect(
    createBooking({
      serviceId: "service",
      professionalId: "professional",
      date,
    }),
  ).rejects.toThrow("ocupado")
  expect(mocks.create).not.toHaveBeenCalled()
})
test("reserva válida usa o usuário da sessão e transação serializável", async () => {
  await createBooking({
    serviceId: "service",
    professionalId: "professional",
    date,
  })
  expect(mocks.create).toHaveBeenCalledWith({
    data: {
      serviceId: "service",
      professionalId: "professional",
      date,
      userId: "user",
      priceAtBooking: "45.50",
      durationMinutes: 30,
      endsAt: new Date(date.getTime() + 30 * 60000),
      status: "CONFIRMED",
    },
  })
  expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
    isolationLevel: "Serializable",
  })
})

test("dia brasileiro cruza meia-noite UTC e exclui o início do dia seguinte", () => {
  expect(bookingDay(new Date("2030-01-08T01:00:00Z"))).toBe("2030-01-07")
  expect(bookingDayBounds("2030-01-07")).toEqual({
    gte: new Date("2030-01-07T03:00:00Z"),
    lt: new Date("2030-01-08T03:00:00Z"),
  })
  expect(() => bookingDayBounds("2030-02-30")).toThrow()
})

test("interface, consulta e validação concordam em São Paulo, não em UTC", () => {
  const now = new Date("2029-01-01T00:00:00Z")
  const professionals = [{ id: "professional" }]
  const slots = availableBookingTimes(
    "2030-01-07",
    hours,
    professionals,
    [],
    now,
  )
  // 09:00 UTC seriam 06:00 em São Paulo, fora do expediente.
  expect(() =>
    validateBookingTime(new Date("2030-01-07T09:00:00Z"), hours, now),
  ).toThrow()
  expect(bookingInstant("2030-01-07", "09:00")).toEqual(
    new Date("2030-01-07T12:00:00Z"),
  )
  expect(slots[0]).toBe("09:00")
  expect(slots.at(-1)).toBe("17:30")
  for (const time of slots) {
    const instant = bookingInstant("2030-01-07", time)
    expect(() => validateBookingTime(instant, hours, now)).not.toThrow()
    expect(formatBookingDate(instant, "HH:mm")).toBe(time)
    expect(
      instant >= bookingDayBounds("2030-01-07").gte &&
        instant < bookingDayBounds("2030-01-07").lt,
    ).toBe(true)
  }
  const busy = [
    {
      professionalId: "professional",
      date: bookingInstant("2030-01-07", "09:00"),
      endsAt: bookingInstant("2030-01-07", "09:30"),
    },
  ]
  expect(
    availableBookingTimes("2030-01-07", hours, professionals, busy, now),
  ).not.toContain("09:00")
  expect(
    availableBookingTimes("2030-01-07", hours, professionals, busy, now),
  ).toContain("09:30")
  expect(calendarDay(calendarDate("2030-01-07"))).toBe("2030-01-07")
})

test("horários respeitam minutos de abertura, dia fechado e instante atual", () => {
  const schedule = [{ ...hours[0], startTime: "09:15", endTime: "10:15" }]
  expect(
    availableBookingTimes(
      "2030-01-07",
      schedule,
      [{ id: "p" }],
      [],
      new Date("2029-01-01"),
    ),
  ).toEqual(["09:30"])
  expect(
    availableBookingTimes(
      "2030-01-07",
      [{ ...hours[0], isOpen: false }],
      [{ id: "p" }],
      [],
    ),
  ).toEqual([])
  expect(
    availableBookingTimes(
      "2030-01-07",
      hours,
      [{ id: "p" }],
      [],
      bookingInstant("2030-01-07", "17:30"),
    ),
  ).toEqual([])
})

test("profissional vinculado de outra barbearia também é rejeitado", async () => {
  mocks.service.mockResolvedValue({
    durationMinutes: 30,
    barbershopId: "shop",
    professionals: [{ id: "professional", barbershopId: "other" }],
    barbershop: { workingHours: hours },
  })
  await expect(
    createBooking({
      serviceId: "service",
      professionalId: "professional",
      date,
    }),
  ).rejects.toThrow("Profissional")
})

test("cancelamento preserva registro e consultas excluem canceladas", async () => {
  const { deleteBooking } = await import("../app/_actions/delete-booking")
  const { getConfirmedBookings } = await import(
    "../app/_data/get-confirmed-bookings"
  )
  mocks.existing.mockResolvedValue({ service: { barbershopId: "shop" } })
  mocks.update.mockResolvedValue({ count: 1 })
  await deleteBooking("booking")
  expect(mocks.remove).not.toHaveBeenCalled()
  expect(mocks.update).toHaveBeenCalledWith({
    where: { id: "booking", userId: "user", status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  })
  await getConfirmedBookings()
  expect(mocks.list).toHaveBeenCalledWith(
    expect.objectContaining({ where: { userId: "user", status: "CONFIRMED" } }),
  )
  for (const path of ["/", "/bookings", "/admin/barbershops/shop"])
    expect(mocks.revalidate).toHaveBeenCalledWith(path)
})

test("durações diferentes respeitam sobreposição e limite do expediente", () => {
  const now = new Date("2029-01-01")
  const professionals = [{ id: "p" }]
  const busy = [
    {
      professionalId: "p",
      date: bookingInstant("2030-01-07", "10:00"),
      endsAt: bookingInstant("2030-01-07", "11:30"),
    },
  ]
  const short = availableBookingTimes(
    "2030-01-07",
    hours,
    professionals,
    busy,
    now,
    30,
  )
  const long = availableBookingTimes(
    "2030-01-07",
    hours,
    professionals,
    busy,
    now,
    90,
  )
  expect(short).toContain("09:30")
  expect(short).not.toContain("11:00")
  expect(short).toContain("11:30")
  expect(long).not.toContain("09:00")
  expect(long).not.toContain("11:00")
  expect(long).toContain("11:30")
  expect(long.at(-1)).toBe("16:30")
  expect(() =>
    validateBookingTime(bookingInstant("2030-01-07", "17:00"), hours, now, 90),
  ).toThrow()
  expect(() => validateBookingTime(date, hours, now, 45)).toThrow()
})
