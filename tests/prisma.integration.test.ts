import { afterAll, beforeAll, describe, expect, test, vi } from "vitest"
import { randomUUID } from "node:crypto"

const session = vi.hoisted(() => vi.fn())
vi.mock("next-auth", () => ({ getServerSession: session }))
vi.mock("@/_lib/auth", () => ({ authOptions: {} }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/_lib/prisma", async () => {
  const { PrismaClient } = await import("@prisma/client")
  const url = process.env.TEST_DATABASE_URL
  if (url) {
    const parsed = new URL(url)
    if (
      !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
      parsed.pathname !== "/fsw_integration"
    ) {
      throw new Error(
        "Integration tests require a local disposable database named fsw_integration.",
      )
    }
  }
  return {
    db: new PrismaClient({
      datasourceUrl: url ?? "postgresql://unused:unused@localhost:1/unused",
    }),
  }
})
import { db } from "@/_lib/prisma"
import { createBooking } from "@/_actions/create-booking"
import { deleteProfessional } from "@/_actions/delete-professional"
import { bookingInstant } from "@/_lib/booking-time"

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL real: transactions and authorization",
  () => {
    const ownerId = randomUUID()
    const shopId = randomUUID()
    const professionalId = randomUUID()
    const serviceId = randomUUID()
    beforeAll(async () => {
      await db.user.create({
        data: {
          id: ownerId,
          name: "Test owner",
          email: `${ownerId}@example.test`,
          image: null,
        },
      })
      await db.barbershop.create({
        data: {
          id: shopId,
          ownerId,
          name: "Test shop",
          address: "Test",
          phones: [],
          description: "Test",
          imageUrl: "https://utfs.io/test.png",
        },
      })
      await db.professional.create({
        data: {
          id: professionalId,
          barbershopId: shopId,
          name: "Test professional",
        },
      })
      await db.barbershopService.create({
        data: {
          id: serviceId,
          barbershopId: shopId,
          name: "Test service",
          description: "Test service",
          imageUrl: "https://utfs.io/test.png",
          price: 30,
          professionals: { connect: { id: professionalId } },
        },
      })
      await db.workingHours.create({
        data: {
          barbershopId: shopId,
          dayOfWeek: 1,
          isOpen: true,
          startTime: "09:00",
          endTime: "18:00",
        },
      })
      session.mockResolvedValue({ user: { id: ownerId, role: "USER" } })
    })
    afterAll(async () => {
      await db.booking.deleteMany({ where: { userId: ownerId } })
      await db.barbershopService.deleteMany({ where: { barbershopId: shopId } })
      await db.professional.deleteMany({ where: { barbershopId: shopId } })
      await db.workingHours.deleteMany({ where: { barbershopId: shopId } })
      await db.barbershop.deleteMany({ where: { id: shopId } })
      await db.user.deleteMany({ where: { id: ownerId } })
      await db.$disconnect()
    })
    test("concurrent requests create only one reservation", async () => {
      const date = bookingInstant("2030-01-07", "09:00")
      const results = await Promise.allSettled([
        createBooking({ serviceId, professionalId, date }),
        createBooking({ serviceId, professionalId, date }),
      ])
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1)
      expect(await db.booking.count({ where: { professionalId, date } })).toBe(
        1,
      )
    })
    test("future bookings block deletion without losing past bookings", async () => {
      await db.booking.create({
        data: {
          serviceId,
          professionalId,
          userId: ownerId,
          date: new Date("2020-01-01T12:00:00Z"),
        },
      })
      expect(await deleteProfessional(professionalId, shopId)).toHaveProperty(
        "success",
        false,
      )
      expect(await db.booking.count({ where: { professionalId } })).toBe(2)
      expect(
        await db.professional.findUnique({ where: { id: professionalId } }),
      ).not.toBeNull()
    })
    test("other owner is denied; authorized deletion removes past bookings and resource", async () => {
      session.mockResolvedValue({
        user: { id: randomUUID(), role: "BARBERSHOP_ADMIN" },
      })
      expect(await deleteProfessional(professionalId, shopId)).toHaveProperty(
        "success",
        false,
      )
      expect(
        await db.professional.findUnique({ where: { id: professionalId } }),
      ).not.toBeNull()
      session.mockResolvedValue({ user: { id: ownerId, role: "USER" } })
      await db.booking.deleteMany({
        where: { professionalId, date: { gte: new Date() } },
      })
      expect(await deleteProfessional(professionalId, shopId)).toHaveProperty(
        "success",
        true,
      )
      expect(await db.booking.count({ where: { professionalId } })).toBe(0)
      expect(
        await db.professional.findUnique({ where: { id: professionalId } }),
      ).toBeNull()
    })
  },
)
