"use server"

import { db } from "@/_lib/prisma"
import {
  AccessError,
  actionError,
  requireBarbershopAccess,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

export async function completeBooking(bookingId: string) {
  try {
    const shopId = await db.$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          select: { service: { select: { barbershopId: true } } },
        })
        if (!booking) throw new AccessError("Reserva não encontrada.")
        await requireBarbershopAccess(booking.service.barbershopId, tx)
        const updated = await tx.booking.updateMany({
          where: {
            id: bookingId,
            status: "CONFIRMED",
            endsAt: { lte: new Date() },
          },
          data: { status: "COMPLETED" },
        })
        if (!updated.count)
          throw new AccessError(
            "Somente reservas confirmadas cujo horário terminou podem ser finalizadas.",
          )
        return booking.service.barbershopId
      },
      { isolationLevel: "Serializable" },
    )
    revalidateBarbershop(shopId)
    return { success: true }
  } catch (error) {
    return { success: false, error: actionError(error) }
  }
}
