"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "@/_lib/prisma" 

interface GetBookingsProps {
  serviceId: string 
  date: Date
}


export const getBookings = async ({ date, serviceId }: GetBookingsProps) => {
  const bookings = await db.booking.findMany({
    select: { professionalId: true, date: true },
    where: {
      
      serviceId: serviceId, 
      date: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
  })

  return bookings
}
