import { beforeEach, expect, test, vi } from "vitest"

const m = vi.hoisted(() => ({
  session: vi.fn(),
  shop: vi.fn(),
  professional: vi.fn(),
  professionalCount: vi.fn(),
  createProfessional: vi.fn(),
  updateProfessional: vi.fn(),
  deleteProfessional: vi.fn(),
  service: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  booking: vi.fn(),
  bookingCount: vi.fn(),
  deleteBookings: vi.fn(),
  updateBookings: vi.fn(),
  hours: vi.fn(),
  transaction: vi.fn(),
}))
vi.mock("next-auth", () => ({ getServerSession: m.session }))
vi.mock("@/_lib/auth", () => ({ authOptions: {} }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/_lib/prisma", () => ({
  db: {
    $transaction: m.transaction,
    barbershop: { findUnique: m.shop },
    professional: {
      findFirst: m.professional,
      count: m.professionalCount,
      create: m.createProfessional,
      update: m.updateProfessional,
      delete: m.deleteProfessional,
    },
    barbershopService: {
      findUnique: m.service,
      create: m.createService,
      update: m.updateService,
      delete: m.deleteService,
    },
    booking: {
      findFirst: m.booking,
      count: m.bookingCount,
      deleteMany: m.deleteBookings,
      updateMany: m.updateBookings,
    },
    workingHours: { upsert: m.hours },
  },
}))
import { db } from "@/_lib/prisma"
import { requireBarbershopAccess } from "@/_lib/authorize-barbershop"
import { addService } from "@/_actions/add-service"
import { editService } from "@/_actions/edit-service"
import { deleteService } from "@/_actions/delete-service"
import { addProfessional } from "@/_actions/add-professional"
import { editProfessional } from "@/_actions/edit-professional"
import { deleteProfessional } from "@/_actions/delete-professional"
import { deleteBooking } from "@/_actions/delete-booking"
import { updateWorkingHours } from "@/_actions/update-working-hours"

const shopId = "b8888888-8888-4888-8888-888888888888"
function form(values: Record<string, string>) {
  const data = new FormData()
  Object.entries(values).forEach(([key, value]) => data.append(key, value))
  return data
}
const serviceForm = () =>
  form({
    id: "service",
    barbershopId: shopId,
    name: "Corte",
    description: "Corte de cabelo",
    price: "30",
    durationMinutes: "30",
    professionalIds: "professional",
  })
const profForm = () =>
  form({ id: "professional", barbershopId: shopId, name: "Barbeiro" })
const hoursForm = () =>
  form({
    barbershopId: shopId,
    dayOfWeek: "1",
    isOpen: "true",
    startTime: "09:00",
    endTime: "18:00",
  })
beforeEach(() => {
  vi.resetAllMocks()
  m.session.mockResolvedValue({
    user: { id: "owner", role: "BARBERSHOP_ADMIN" },
  })
  m.shop.mockResolvedValue({ id: shopId, ownerId: "owner" })
  m.professional.mockResolvedValue({ id: "professional", barbershopId: shopId })
  m.professionalCount.mockResolvedValue(1)
  m.service.mockResolvedValue({ barbershopId: shopId })
  m.bookingCount.mockResolvedValue(0)
  m.transaction.mockImplementation((fn) => fn(db))
})

const mutations = [
  ["addService", () => addService({ success: false }, serviceForm())],
  ["editService", () => editService({ success: false }, serviceForm())],
  ["deleteService", () => deleteService("service")],
  ["addProfessional", () => addProfessional(profForm())],
  [
    "editProfessional",
    () => editProfessional({ success: false, error: null }, profForm()),
  ],
  ["deleteProfessional", () => deleteProfessional("professional", shopId)],
  ["updateWorkingHours", () => updateWorkingHours(hoursForm())],
] as const

for (const [name, mutate] of mutations) {
  test.each(["anonymous", "other-owner", "unknown-role"])(
    `${name} rejects %s without writes`,
    async (scenario) => {
      m.session.mockResolvedValue(
        scenario === "anonymous"
          ? null
          : {
              user: {
                id: scenario === "other-owner" ? "other" : "owner",
                role:
                  scenario === "unknown-role" ? "INVALID" : "BARBERSHOP_ADMIN",
              },
            },
      )
      expect(await mutate()).toHaveProperty("error")
      for (const write of [
        m.createService,
        m.updateService,
        m.deleteService,
        m.createProfessional,
        m.updateProfessional,
        m.deleteProfessional,
        m.deleteBookings,
        m.hours,
      ])
        expect(write).not.toHaveBeenCalled()
    },
  )
  test(`${name} accepts owner`, async () => {
    expect(await mutate()).toHaveProperty("success", true)
  })
}
test.each(["USER", "BARBERSHOP_ADMIN"])(
  "owner with role %s has access",
  async (role) => {
    m.session.mockResolvedValue({ user: { id: "owner", role } })
    expect(await requireBarbershopAccess(shopId)).toHaveProperty(
      "ownerId",
      "owner",
    )
  },
)
test("super admin may access another owner's shop, but not a missing shop", async () => {
  m.session.mockResolvedValue({ user: { id: "super", role: "SUPER_ADMIN" } })
  await expect(requireBarbershopAccess(shopId)).resolves.toHaveProperty(
    "id",
    shopId,
  )
  m.shop.mockResolvedValue(null)
  await expect(requireBarbershopAccess(shopId)).rejects.toThrow()
})
test.each(["anonymous", "other", "super"])(
  "deleteBooking rejects %s",
  async (scenario) => {
    m.session.mockResolvedValue(
      scenario === "anonymous"
        ? null
        : { user: { id: scenario, role: "SUPER_ADMIN" } },
    )
    m.booking.mockResolvedValue(null)
    await expect(deleteBooking("booking")).rejects.toThrow()
    expect(m.deleteBookings).not.toHaveBeenCalled()
  },
)
test("deleteBooking scopes lookup and deletion to the session user", async () => {
  m.booking.mockResolvedValue({ service: { barbershopId: shopId } })
  m.updateBookings.mockResolvedValue({ count: 1 })
  await deleteBooking("booking")
  expect(m.booking).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id: "booking", userId: "owner" } }),
  )
  expect(m.updateBookings).toHaveBeenCalledWith({
    where: { id: "booking", userId: "owner", status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  })
  expect(m.deleteBookings).not.toHaveBeenCalled()
})
test("professional from another shop cannot be edited or deleted", async () => {
  m.professional.mockResolvedValue(null)
  expect(
    await editProfessional({ success: false, error: null }, profForm()),
  ).toHaveProperty("success", false)
  expect(await deleteProfessional("professional", shopId)).toHaveProperty(
    "success",
    false,
  )
  expect(m.professional).toHaveBeenCalledWith({
    where: { id: "professional", barbershopId: shopId },
  })
  expect(m.updateProfessional).not.toHaveBeenCalled()
  expect(m.deleteProfessional).not.toHaveBeenCalled()
})
test("cross-shop service links are rejected on creation and edit", async () => {
  m.professionalCount.mockResolvedValue(0)
  expect(await addService({ success: false }, serviceForm())).toHaveProperty(
    "success",
    false,
  )
  expect(await editService({ success: false }, serviceForm())).toHaveProperty(
    "success",
    false,
  )
  expect(m.createService).not.toHaveBeenCalled()
  expect(m.updateService).not.toHaveBeenCalled()
})
test.each(["professional", "service"])(
  "future bookings block deletion of %s",
  async (kind) => {
    m.bookingCount.mockResolvedValue(1)
    const result =
      kind === "professional"
        ? await deleteProfessional("professional", shopId)
        : await deleteService("service")
    expect(result).toHaveProperty("success", false)
    expect(m.deleteBookings).not.toHaveBeenCalled()
    expect(m.deleteProfessional).not.toHaveBeenCalled()
    expect(m.deleteService).not.toHaveBeenCalled()
  },
)
test("resource deletion preserves booking history", async () => {
  m.bookingCount.mockResolvedValue(1)
  expect(await deleteProfessional("professional", shopId)).toHaveProperty(
    "success",
    false,
  )
  expect(m.bookingCount).toHaveBeenCalledWith({
    where: { professionalId: "professional" },
  })
  expect(m.deleteBookings).not.toHaveBeenCalled()
})

test("dia fechado sem horários pode ser salvo preservando horários anteriores", async () => {
  const data = form({ barbershopId: shopId, dayOfWeek: "1", isOpen: "false" })
  expect(await updateWorkingHours(data)).toHaveProperty("success", true)
  expect(m.hours).toHaveBeenCalledWith(
    expect.objectContaining({
      update: { isOpen: false, startTime: undefined, endTime: undefined },
      create: {
        barbershopId: shopId,
        dayOfWeek: 1,
        isOpen: false,
        startTime: "09:00",
        endTime: "18:00",
      },
    }),
  )
})
test.each([
  { dayOfWeek: "1.5" },
  { dayOfWeek: "7" },
  { dayOfWeek: "-1" },
  { startTime: "18:00", endTime: "09:00" },
  { endTime: "09:00" },
  { startTime: "" },
  { endTime: "" },
  { isOpen: "invalid" },
])("expediente inválido não é salvo: %j", async (change) => {
  const data = hoursForm()
  Object.entries(change).forEach(([key, value]) => data.set(key, value))
  expect(await updateWorkingHours(data)).toHaveProperty("error")
  expect(m.hours).not.toHaveBeenCalled()
})

test.each(["0", "15", "45", "-30", "30.5", "750", "abc"])(
  "service rejects invalid duration %s",
  async (duration) => {
    const data = serviceForm()
    data.set("durationMinutes", duration)
    expect(await addService({ success: false }, data)).toHaveProperty(
      "success",
      false,
    )
    expect(await editService({ success: false }, data)).toHaveProperty(
      "success",
      false,
    )
    expect(m.createService).not.toHaveBeenCalled()
    expect(m.updateService).not.toHaveBeenCalled()
  },
)
