import { z } from "zod";
import { db } from "@/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/_lib/auth";
import { Role } from "@prisma/client";


const editProfessionalSchema = z.object({
  id: z.string().min(1, "ID do profissional é obrigatório."),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  imageUrl: z.string().url("URL da imagem inválida.").optional().or(z.literal("")),
  barbershopId: z.string().min(1, "ID da barbearia é obrigatório."),
});


export interface EditProfessionalFormState {
  success: boolean;
  error: string | null;
  fieldErrors?: {
    id?: string[];
    name?: string[];
    imageUrl?: string[];
    barbershopId?: string[];
  };
}

export const editProfessional = async (
  prevState: EditProfessionalFormState, 
  formData: FormData
): Promise<EditProfessionalFormState> => { 
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { success: false, error: "Não autenticado." };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = editProfessionalSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Erro de validação. Por favor, verifique os campos.",
      fieldErrors,
    };
  }

  const { id, name, imageUrl, barbershopId } = validatedFields.data;

  try {
    // Buscar a barbearia para verificar o proprietário
    const barbershop = await db.barbershop.findUnique({
      where: { id: barbershopId },
      select: { ownerId: true },
    });

    if (!barbershop) {
      return { success: false, error: "Barbearia não encontrada." };
    }

    // Lógica de autorização
    if (session.user.role === Role.USER) {
      return { success: false, error: "Acesso negado. Permissão insuficiente." };
    }

    if (session.user.role === Role.BARBERSHOP_ADMIN && barbershop.ownerId !== session.user.id) {
      return { success: false, error: "Acesso negado. Você não é o proprietário desta barbearia." };
    }

    // SUPER_ADMIN tem acesso total, então não precisa de verificação adicional aqui.

    await db.professional.update({
      where: {
        id: id,
      },
      data: {
        name,
        imageUrl,
      },
    });

    revalidatePath(`/admin/barbershops/${barbershopId}`);
    revalidatePath("/");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Erro ao editar profissional:", error);
    return {
      success: false,
      error: "Ocorreu um erro no servidor ao tentar editar o profissional.",
    };
  }
};