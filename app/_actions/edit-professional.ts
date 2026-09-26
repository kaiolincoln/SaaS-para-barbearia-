"use server"

import { z } from "zod"
import { db } from "@/_lib/prisma"
import {
  AccessError,
  actionError,
  requireBarbershopAccess,
} from "@/_lib/authorize-barbershop"
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"

const editProfessionalSchema = z.object({
  id: z.string().min(1, "ID do profissional é obrigatório."),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  imageUrl: z
    .string()
    .url("URL da imagem inválida.")
    .optional()
    .or(z.literal("")),
  barbershopId: z.string().min(1, "ID da barbearia é obrigatório."),
})

export interface EditProfessionalFormState {
  success: boolean
  error: string | null
  fieldErrors?: {
    id?: string[]
    name?: string[]
    imageUrl?: string[]
    barbershopId?: string[]
  }
}

export const editProfessional = async (
  _prevState: EditProfessionalFormState,
  formData: FormData,
): Promise<EditProfessionalFormState> => {
  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = editProfessionalSchema.safeParse(rawData)

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors
    return {
      success: false,
      error: "Erro de validação. Por favor, verifique os campos.",
      fieldErrors,
    }
  }

  const { id, name, imageUrl, barbershopId } = validatedFields.data

  try {
    await requireBarbershopAccess(barbershopId)
    const professional = await db.professional.findFirst({
      where: { id, barbershopId },
    })
    if (!professional)
      throw new AccessError("Profissional não encontrado nesta barbearia.")

    await db.professional.update({
      where: {
        id: id,
        barbershopId,
      },
      data: {
        name,
        imageUrl,
      },
    })

    revalidateBarbershop(barbershopId)

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: actionError(error),
    }
  }
}
