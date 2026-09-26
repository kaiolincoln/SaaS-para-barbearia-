"use server";

import { z } from "zod";
import { db } from "@/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/_lib/auth";
import { Role } from "@prisma/client";


const EditServiceSchema = z.object({
  id: z.string({ required_error: "ID do serviço é obrigatório." }),
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").trim(),
  description: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres.").trim(),
  price: z.coerce.number().min(1, "O preço deve ser maior que zero."),
  imageUrl: z.string().url("A URL da imagem deve ser válida.").optional().or(z.literal("")),
  professionalIds: z.array(z.string()).optional(),
});


export type FormState = {
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

export const editService = async (
  prevState: FormState,
  formData: FormData
): Promise<FormState> => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { success: false, error: "Não autenticado." };
  }

  const rawData = {
    ...Object.fromEntries(formData),
    professionalIds: formData.getAll("professionalIds"),
  };

  const validatedFields = EditServiceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dados inválidos. Por favor, verifique os campos.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, professionalIds, ...dataToUpdate } = validatedFields.data;

  try {
    const serviceToUpdate = await db.barbershopService.findUnique({
      where: { id: id },
      select: { barbershopId: true },
    });

    if (!serviceToUpdate) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const barbershop = await db.barbershop.findUnique({
      where: { id: serviceToUpdate.barbershopId },
      select: { ownerId: true },
    });

    if (!barbershop) {
      return { success: false, error: "Barbearia associada ao serviço não encontrada." };
    }

    if (session.user.role === Role.USER) {
      return { success: false, error: "Acesso negado. Permissão insuficiente." };
    }

    if (session.user.role === Role.BARBERSHOP_ADMIN && barbershop.ownerId !== session.user.id) {
      return { success: false, error: "Acesso negado. Você não é o proprietário desta barbearia." };
    }


    await db.barbershopService.update({
      where: {
        id: id,
      },
      data: {
        ...dataToUpdate,
        imageUrl: dataToUpdate.imageUrl || "https://utfs.io/f/988646ea-dcb6-4f47-8a03-8d4586b7bc21-16v.png",
        professionals: {
          set: professionalIds?.map((profId ) => ({ id: profId })) || [],
        },
      },
    });

    revalidatePath("/admin/.*", "layout");
    return { success: true };
  } catch (e) {
    console.error("Erro ao atualizar serviço:", e);
    return {
      success: false,
      error: "Ocorreu um erro no servidor ao tentar atualizar o serviço.",
    };
  }
};
