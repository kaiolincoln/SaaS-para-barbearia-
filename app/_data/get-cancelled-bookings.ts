"use server"

import { getServerSession } from "next-auth"
import { db } from "../_lib/prisma"
import { authOptions } from "../_lib/auth"

export const getCancelledBookings = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []
  return db.booking.findMany({
    where: {
      userId: session.user.id,
      status: "CANCELLED",
    },
    include: {
      review: { select: { id: true } },
      service: {
        include: {
          barbershop: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })
}
