"use server"

import { z } from "zod"
import { db } from "@/_lib/prisma"
import {
  AccessError,
  actionError,
  requireBarbershopAccess,
  requireShopProfessionals,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

const EditServiceSchema = z.object({
  id: z.string({ required_error: "ID do serviço é obrigatório." }),
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").trim(),
  description: z
    .string()
    .min(10, "A descrição deve ter no mínimo 10 caracteres.")
    .trim(),
  price: z.coerce.number().min(1, "O preço deve ser maior que zero."),
  imageUrl: z
    .string()
    .url("A URL da imagem deve ser válida.")
    .optional()
    .or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(30).max(720).multipleOf(30),
  professionalIds: z.array(z.string()).optional(),
})

export type FormState = {
  success: boolean
  error?: string | null
  fieldErrors?: {
    name?: string[]
    description?: string[]
    price?: string[]
    imageUrl?: string[]
    durationMinutes?: string[]
    professionalIds?: string[]
  } | null
}

export const editService = async (
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> => {
  const rawData = {
    ...Object.fromEntries(formData),
    professionalIds: formData.getAll("professionalIds"),
  }

  const validatedFields = EditServiceSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dados inválidos. Por favor, verifique os campos.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { id, professionalIds, ...dataToUpdate } = validatedFields.data

  try {
    const barbershopId = await db.$transaction(
      async (tx) => {
        const serviceToUpdate = await tx.barbershopService.findUnique({
          where: { id: id },
          select: { barbershopId: true },
        })

        if (!serviceToUpdate) {
          throw new AccessError("Serviço não encontrado.")
        }

        await requireBarbershopAccess(serviceToUpdate.barbershopId, tx)
        const professionals = await requireShopProfessionals(
          serviceToUpdate.barbershopId,
          professionalIds ?? [],
          tx,
        )

        await tx.barbershopService.update({
          where: {
            id: id,
          },
          data: {
            ...dataToUpdate,
            imageUrl:
              dataToUpdate.imageUrl ||
              "https://utfs.io/f/988646ea-dcb6-4f47-8a03-8d4586b7bc21-16v.png",
            professionals: {
              set: professionals,
            },
          },
        })

        return serviceToUpdate.barbershopId
      },
      { isolationLevel: "Serializable" },
    )
    revalidateBarbershop(barbershopId)
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: actionError(e),
    }
  }
}
