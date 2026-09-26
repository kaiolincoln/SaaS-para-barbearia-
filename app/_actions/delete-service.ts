"use server"
import { db } from "@/_lib/prisma"
import {
  AccessError,
  actionError,
  requireBarbershopAccess,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

export const deleteService = async (serviceId: string) => {
  try {
    const shopId = await db.$transaction(
      async (tx) => {
        const resource = await tx.barbershopService.findUnique({
          where: { id: serviceId },
          select: { barbershopId: true },
        })
        if (!resource) throw new AccessError("Serviço não encontrado.")
        await requireBarbershopAccess(resource.barbershopId, tx)
        if (await tx.booking.count({ where: { serviceId } })) {
          throw new AccessError(
            "Serviço com histórico de agendamentos não pode ser removido.",
          )
        }
        await tx.barbershopService.delete({ where: { id: serviceId } })
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
