"use server";

import { db } from "@/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/_lib/auth";    

export const deleteProfessional = async (professionalId: string, barbershopId: string) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { role, barbershopId: adminBarbershopId } = session.user;

    const professional = await db.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      return { success: false, error: "Profissional não encontrado." };
    }

    // Checagem de permissões
    if (role === "SUPER_ADMIN") {
      // pode tudo
    } else if (role === "BARBERSHOP_ADMIN") {
      if (adminBarbershopId !== professional.barbershopId) {
        return {
          success: false,
          error: "Você não tem permissão para excluir este profissional.",
        };
      }
    } else {
      return { success: false, error: "Permissão negada." };
    }

    // Deletar
    await db.professional.delete({
      where: { id: professionalId },
    });

    // Revalida paths
    revalidatePath(`/admin/barbershops/${barbershopId}`);
    revalidatePath(`/barbershops/${barbershopId}`);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao deletar o profissional." };
  }
};
