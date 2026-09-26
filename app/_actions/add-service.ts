"use server";

import { z } from "zod";
import { db } from "@/_lib/prisma";
import { actionError, requireBarbershopAccess, requireShopProfessionals } from "@/_lib/authorize-barbershop";
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop";


const AddServiceSchema = z.object({
  barbershopId: z.string({ required_error: "ID da barbearia é obrigatório." }),
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").trim(),
  description: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres.").trim(),
  price: z.coerce.number().min(1, "O preço deve ser maior que zero."),
  imageUrl: z.string().url("A URL da imagem deve ser válida.").optional().or(z.literal('')),
  professionalIds: z.array(z.string()).optional(),
});


export type AddServiceFormState = {
  success: boolean;
  error?: string | null;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    price?: string[];
    imageUrl?: string[];
    professionalIds?: string[]; 
  } | null;
};

export const addService = async (
  _prevState: AddServiceFormState,
  formData: FormData
): Promise<AddServiceFormState> => {
  const rawData = {
    ...Object.fromEntries(formData),
    professionalIds: formData.getAll("professionalIds"),
  };

  const validatedFields = AddServiceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dados inválidos. Por favor, verifique os campos.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  
  const { professionalIds, ...serviceData } = validatedFields.data;

  try {
    await db.$transaction(async tx => {
    await requireBarbershopAccess(serviceData.barbershopId, tx);
    const professionals = await requireShopProfessionals(serviceData.barbershopId, professionalIds ?? [], tx);
    await tx.barbershopService.create({
      data: {
        ...serviceData,
        imageUrl: serviceData.imageUrl || "https://utfs.io/f/988646ea-dcb6-4f47-8a03-8d4586b7bc21-16v.png",
        professionals: {
          connect: professionals,
        },
      },
    });

    }, { isolationLevel: "Serializable" });
    revalidateBarbershop(serviceData.barbershopId);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: actionError(e),
    };
  }
};
