"use server";

import { z } from "zod";
import { db } from "@/_lib/prisma";
import { actionError, requireBarbershopAccess } from "@/_lib/authorize-barbershop";
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop";

const AddProfessionalSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").trim(),
  imageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  barbershopId: z.string(),
});

export const addProfessional = async (formData: FormData) => {
  const validatedFields = AddProfessionalSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return { error: "Dados inválidos." };
  }

  try {
    await requireBarbershopAccess(validatedFields.data.barbershopId);
    await db.professional.create({
      data: {
        ...validatedFields.data,
        imageUrl: validatedFields.data.imageUrl || "https://utfs.io/f/988646ea-dcb6-4f47-8a03-8d4586b7bc21-16v.png",
      },
    } );

    revalidateBarbershop(validatedFields.data.barbershopId);
    return { success: true };
  } catch (e) {
    return { error: actionError(e) };
  }
};
