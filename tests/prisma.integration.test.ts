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
import { deleteBooking } from "@/_actions/delete-booking"
import { completeBooking } from "@/_actions/complete-booking"
import { createReview } from "@/_actions/create-review"
import { withRatings } from "@/_data/reviews"
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
      await db.review.deleteMany({ where: { userId: ownerId } })
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
          endsAt: new Date("2020-01-01T12:30:00Z"),
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
    test("history prevents deletion even after the appointment", async () => {
      session.mockResolvedValue({
        user: { id: randomUUID(), role: "BARBERSHOP_ADMIN" },
      })
      expect(await deleteProfessional(professionalId, shopId)).toHaveProperty(
        "success",
        false,
      )
      session.mockResolvedValue({ user: { id: ownerId, role: "USER" } })
      expect(await deleteProfessional(professionalId, shopId)).toHaveProperty(
        "success",
        false,
      )
      expect(await db.booking.count({ where: { professionalId } })).toBe(2)
    })
    test("cancellation frees availability and retains the record", async () => {
      const date = bookingInstant("2030-01-07", "09:00")
      const booking = await db.booking.findFirstOrThrow({
        where: { professionalId, date },
      })
      await deleteBooking(booking.id)
      expect(
        await db.booking.findUnique({ where: { id: booking.id } }),
      ).toHaveProperty("status", "CANCELLED")
      await expect(deleteBooking(booking.id)).rejects.toThrow()
      await createBooking({ serviceId, professionalId, date })
      expect(await db.booking.count({ where: { professionalId, date } })).toBe(
        2,
      )
    })
    test("duration snapshot survives edits; long overlapping appointments conflict", async () => {
      await db.barbershopService.update({
        where: { id: serviceId },
        data: { durationMinutes: 90 },
      })
      const date = bookingInstant("2030-01-07", "10:00")
      await createBooking({ serviceId, professionalId, date })
      await db.barbershopService.update({
        where: { id: serviceId },
        data: { durationMinutes: 30 },
      })
      await expect(
        createBooking({
          serviceId,
          professionalId,
          date: bookingInstant("2030-01-07", "11:00"),
        }),
      ).rejects.toThrow("ocupado")
      const saved = await db.booking.findFirstOrThrow({
        where: { professionalId, date },
      })
      expect(saved.durationMinutes).toBe(90)
      expect(saved.endsAt).toEqual(bookingInstant("2030-01-07", "11:30"))
      await createBooking({ serviceId, professionalId, date: saved.endsAt })
    })
    test("only completed booking holder reviews once; aggregate uses real reviews", async () => {
      const booking = await db.booking.findFirstOrThrow({
        where: { professionalId, date: { lt: new Date() } },
      })
      const form = new FormData()
      form.set("bookingId", booking.id)
      form.set("rating", "5")
      form.set("comment", "Muito bom")
      session.mockResolvedValue(null)
      expect(await createReview(form)).toHaveProperty("success", false)
      session.mockResolvedValue({ user: { id: ownerId, role: "USER" } })
      const future = await db.booking.findFirstOrThrow({
        where: {
          professionalId,
          status: "CONFIRMED",
          date: { gt: new Date() },
        },
      })
      expect(await completeBooking(future.id)).toHaveProperty("success", false)
      expect(await createReview(form)).toHaveProperty("success", false)
      session.mockResolvedValue({
        user: { id: randomUUID(), role: "BARBERSHOP_ADMIN" },
      })
      expect(await completeBooking(booking.id)).toHaveProperty("success", false)
      session.mockResolvedValue({ user: { id: ownerId, role: "USER" } })
      expect(await completeBooking(booking.id)).toHaveProperty("success", true)
      await expect(deleteBooking(booking.id)).rejects.toThrow()
      session.mockResolvedValue({
        user: { id: randomUUID(), role: "SUPER_ADMIN" },
      })
      expect(await createReview(form)).toHaveProperty("success", false)
      session.mockResolvedValue({ user: { id: ownerId, role: "USER" } })
      for (const rating of ["0", "6", "2.5", "abc"]) {
        form.set("rating", rating)
        expect(await createReview(form)).toHaveProperty("success", false)
      }
      form.set("rating", "5")
      const results = await Promise.all([
        createReview(form),
        createReview(form),
      ])
      expect(results.filter((r) => r.success)).toHaveLength(1)
      expect(await createReview(form)).toMatchObject({
        success: false,
        error: "Esta reserva já foi avaliada.",
      })
      expect(await db.review.count({ where: { bookingId: booking.id } })).toBe(
        1,
      )
      expect((await withRatings([{ id: shopId }]))[0]).toMatchObject({
        averageRating: 5,
        reviewCount: 1,
      })
      expect(await deleteProfessional(professionalId, shopId)).toHaveProperty(
        "success",
        false,
      )
    })
  },
)
