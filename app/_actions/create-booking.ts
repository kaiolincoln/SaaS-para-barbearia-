"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/_lib/auth";
import { validateBookingTime } from "@/_lib/booking-time";

interface CreateBookingParams {
  serviceId: string;
  professionalId: string;
  date: Date;
}

export const createBooking = async (params: CreateBookingParams) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Usuário não autenticado.");

  try {
    await db.$transaction(async transaction => {
      const service = await transaction.barbershopService.findUnique({
        where: { id: params.serviceId },
        include: { professionals: true, barbershop: { include: { workingHours: true } } },
      });
      if (!service) throw new Error("Serviço não encontrado.");
      if (!service.professionals.some(professional => professional.id === params.professionalId)) {
        throw new Error("Profissional inválido para este serviço.");
      }
      validateBookingTime(params.date, service.barbershop.workingHours);
      const existing = await transaction.booking.findFirst({
        where: {
          professionalId: params.professionalId,
          date: { gt: new Date(params.date.getTime() - 30 * 60_000), lt: new Date(params.date.getTime() + 30 * 60_000) },
        },
      });
      if (existing) throw new Error("Horário ocupado. Escolha outro horário.");
      await transaction.booking.create({ data: { ...params, userId: session.user.id } });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') {
      throw new Error("O horário mudou durante a reserva. Atualize e tente novamente.");
    }
    throw error;
  }
  revalidatePath("/");
  revalidatePath("/bookings");
};
