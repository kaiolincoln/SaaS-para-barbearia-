"use server"

import { z } from "zod"
import { db } from "@/_lib/prisma"
import {
  actionError,
  requireCompletedBookingAccess,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

const schema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
})
export async function createReview(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success)
    return {
      success: false,
      error:
        "Informe uma nota inteira de 1 a 5 e comentário de até 1000 caracteres.",
    }
  try {
    const shopId = await db.$transaction(
      async (tx) => {
        const booking = await requireCompletedBookingAccess(
          parsed.data.bookingId,
          tx,
        )
        await tx.review.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            barbershopId: booking.service.barbershopId,
            rating: parsed.data.rating,
            comment: parsed.data.comment || null,
          },
        })
        return booking.service.barbershopId
      },
      { isolationLevel: "Serializable" },
    )
    revalidateBarbershop(shopId)
    return { success: true }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    )
      return { success: false, error: "Esta reserva já foi avaliada." }
    return { success: false, error: actionError(error) }
  }
}
