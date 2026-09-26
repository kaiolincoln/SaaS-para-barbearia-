import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { db } from "./prisma"
import { Prisma, Role } from "@prisma/client"

export class AccessError extends Error {}

// Avaliações são ações do cliente: exigem titularidade do atendimento concluído,
// não propriedade administrativa da barbearia. Mantém a autorização centralizada.
export async function requireCompletedBookingAccess(
  bookingId: string,
  client: Prisma.TransactionClient = db,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new AccessError("Usuário não autenticado.")
  const booking = await client.booking.findFirst({
    where: { id: bookingId, userId: session.user.id, status: "COMPLETED" },
    select: {
      id: true,
      userId: true,
      service: { select: { barbershopId: true } },
    },
  })
  if (!booking)
    throw new AccessError(
      "Avaliação exige um atendimento finalizado da sua conta.",
    )
  return booking
}

// Propriedade autoriza também USER; SUPER_ADMIN é a única exceção.
export async function requireBarbershopAccess(
  barbershopId: string,
  client: Prisma.TransactionClient = db,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new AccessError("Usuário não autenticado.")
  if (!Object.values(Role).includes(session.user.role))
    throw new AccessError("Acesso negado.")
  const barbershop = await client.barbershop.findUnique({
    where: { id: barbershopId },
  })
  if (
    !barbershop ||
    (session.user.role !== Role.SUPER_ADMIN &&
      barbershop.ownerId !== session.user.id)
  ) {
    throw new AccessError("Acesso negado à barbearia.")
  }
  return barbershop
}

export async function requireShopProfessionals(
  barbershopId: string,
  professionalIds: string[],
  client: Prisma.TransactionClient = db,
) {
  const ids = [...new Set(professionalIds)]
  const count = await client.professional.count({
    where: { id: { in: ids }, barbershopId },
  })
  if (count !== ids.length)
    throw new AccessError("Profissional não pertence à barbearia.")
  return ids.map((id) => ({ id }))
}

export function actionError(error: unknown) {
  if (error instanceof AccessError) return error.message
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2034"
  ) {
    return "Os dados mudaram durante a operação. Atualize e tente novamente."
  }
  console.error(error)
  return "Não foi possível concluir a operação."
}
