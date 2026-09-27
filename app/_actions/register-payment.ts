"use server"

import { z } from "zod"
import { PaymentMethod } from "@prisma/client"
import { db } from "@/_lib/prisma"
import {
  AccessError,
  actionError,
  requireBarbershopAccess,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"
import { bookingInstant } from "@/_lib/booking-time"

const schema = z.object({
  bookingId: z.string().uuid(),
  paidAmount: z
    .string()
    .regex(
      /^\d{1,8}(\.\d{1,2})?$/,
      "Informe valor não negativo com até duas casas decimais.",
    ),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paidAt: z.string().optional(),
})
export async function registerPayment(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success)
    return {
      success: false,
      error: "Verifique valor, reserva e forma de pagamento.",
    }
  try {
    let paidAt = new Date()
    if (parsed.data.paidAt) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(parsed.data.paidAt))
        throw new AccessError("Data de pagamento inválida.")
      const [day, time] = parsed.data.paidAt.split("T")
      paidAt = bookingInstant(day, time)
    }
    if (paidAt > new Date())
      throw new AccessError("O pagamento recebido não pode ter data futura.")
    const shopId = await db.$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: parsed.data.bookingId },
          select: { status: true, service: { select: { barbershopId: true } } },
        })
        if (!booking) throw new AccessError("Reserva não encontrada.")
        await requireBarbershopAccess(booking.service.barbershopId, tx)
        if (booking.status !== "COMPLETED")
          throw new AccessError(
            "Somente reservas finalizadas podem receber pagamento.",
          )
        const result = await tx.booking.updateMany({
          where: { id: parsed.data.bookingId, status: "COMPLETED" },
          data: {
            paidAmount: parsed.data.paidAmount,
            paymentMethod: parsed.data.paymentMethod,
            paidAt,
          },
        })
        if (!result.count)
          throw new AccessError("A reserva mudou. Atualize a página.")
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
