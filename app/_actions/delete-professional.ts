"use server"
import { db } from "@/_lib/prisma"
import {
  AccessError,
  actionError,
  requireBarbershopAccess,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

export const deleteProfessional = async (
  professionalId: string,
  barbershopId: string,
) => {
  try {
    const shopId = await db.$transaction(
      async (tx) => {
        await requireBarbershopAccess(barbershopId, tx)
        const resource = await tx.professional.findFirst({
          where: { id: professionalId, barbershopId },
        })
        if (!resource)
          throw new AccessError("Profissional não encontrado nesta barbearia.")
        if (
          await tx.booking.count({
            where: { professionalId },
          })
        ) {
          throw new AccessError(
            "Profissional com histórico de agendamentos não pode ser removido.",
          )
        }
        await tx.professional.delete({ where: { id: professionalId } })
        return resource.barbershopId
      },
      { isolationLevel: "Serializable" },
    )
    revalidateBarbershop(shopId)
    return { success: true }
  } catch (error) {
    return { success: false, error: actionError(error) }
  }
}
