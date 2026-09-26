"use server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { db } from "@/_lib/prisma"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

// Cancelamento exclusivo do titular, inclusive quando o solicitante é administrador.
export const deleteBooking = async (bookingId: string) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Usuário não autenticado.")
  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
    select: { service: { select: { barbershopId: true } } },
  })
  if (!booking) throw new Error("Reserva não encontrada ou acesso negado.")
  const result = await db.booking.deleteMany({ where: { id: bookingId, userId: session.user.id } })
  if (!result.count) throw new Error("Reserva não encontrada ou acesso negado.")
  revalidateBarbershop(booking.service.barbershopId)
}
