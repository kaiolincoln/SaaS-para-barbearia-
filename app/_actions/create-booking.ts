"use server"

import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"
import { db } from "@/_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { bookingEnd, validateBookingTime } from "@/_lib/booking-time"

interface CreateBookingParams {
  serviceId: string
  professionalId: string
  date: Date
}

export const createBooking = async (params: CreateBookingParams) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Usuário não autenticado.")

  let barbershopId: string
  try {
    barbershopId = await db.$transaction(
      async (transaction) => {
        const service = await transaction.barbershopService.findUnique({
          where: { id: params.serviceId },
          include: {
            professionals: true,
            barbershop: { include: { workingHours: true } },
          },
        })
        if (!service) throw new Error("Serviço não encontrado.")
        if (
          !service.professionals.some(
            (professional) =>
              professional.id === params.professionalId &&
              professional.barbershopId === service.barbershopId,
          )
        ) {
          throw new Error("Profissional inválido para este serviço.")
        }
        validateBookingTime(
          params.date,
          service.barbershop.workingHours,
          new Date(),
          service.durationMinutes,
        )
        const endsAt = bookingEnd(params.date, service.durationMinutes)
        const existing = await transaction.booking.findFirst({
          where: {
            professionalId: params.professionalId,
            status: "CONFIRMED",
            date: { lt: endsAt },
            endsAt: { gt: params.date },
          },
        })
        if (existing) throw new Error("Horário ocupado. Escolha outro horário.")
        await transaction.booking.create({
          data: {
            serviceId: params.serviceId,
            professionalId: params.professionalId,
            date: params.date,
            endsAt,
            durationMinutes: service.durationMinutes,
            userId: session.user.id,
            status: "CONFIRMED",
          },
        })
        return service.barbershopId
      },
      { isolationLevel: "Serializable" },
    )
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2034"
    ) {
      throw new Error(
        "O horário mudou durante a reserva. Atualize e tente novamente.",
      )
    }
    throw error
  }
  revalidateBarbershop(barbershopId)
}
