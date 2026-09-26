"use server";

import { db } from "@/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/_lib/auth";
import { Role } from "@prisma/client";

export const deleteService = async (serviceId: string) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { success: false, error: "Não autenticado." };
  }

  try {
    // Buscar o serviço para verificar a barbearia e o proprietário
    const serviceToDelete = await db.barbershopService.findUnique({
      where: { id: serviceId },
      select: { barbershopId: true },
    });

    if (!serviceToDelete) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const barbershop = await db.barbershop.findUnique({
      where: { id: serviceToDelete.barbershopId },
      select: { ownerId: true },
    });

    if (!barbershop) {
      return { success: false, error: "Barbearia associada ao serviço não encontrada." };
    }

    // Lógica de autorização
    if (session.user.role === Role.USER) {
      return { success: false, error: "Acesso negado. Permissão insuficiente." };
    }

    if (session.user.role === Role.BARBERSHOP_ADMIN && barbershop.ownerId !== session.user.id) {
      return { success: false, error: "Acesso negado. Você não é o proprietário desta barbearia." };
    }

    // SUPER_ADMIN tem acesso total, então não precisa de verificação adicional aqui.

    const futureBookingsCount = await db.booking.count({
      where: {
        serviceId: serviceId,
        date: {
          gte: new Date(), 
        },
      },
    });

    if (futureBookingsCount > 0) {
      return {
        success: false,
        error: `Não é possível remover. Existem ${futureBookingsCount} agendamentos futuros para este serviço.`,
      };
    }

    await db.booking.deleteMany({
      where: {
        serviceId: serviceId,
      },
    });

    await db.barbershopService.delete({
      where: {
        id: serviceId,
      },
    });

    revalidatePath("/admin/.*", "layout");
    return { success: true };

  } catch (error) {
    console.error("Erro ao deletar serviço:", error);
    return {
      success: false,
      error: "Ocorreu um erro no servidor ao tentar remover o serviço.",
    };
  }
};