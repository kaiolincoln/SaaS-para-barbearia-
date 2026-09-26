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
        const now = new Date()
        if (
          await tx.booking.count({
            where: { professionalId, date: { gte: now } },
          })
        ) {
          throw new AccessError(
            "Profissional com agendamentos futuros não pode ser removido.",
          )
        }
        // Relação obrigatória: remove histórico passado atomicamente com o recurso.
        await tx.booking.deleteMany({
          where: { professionalId, date: { lt: now } },
        })
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
