"use server"

import { bookingDayBounds } from "@/_lib/booking-time"
import { db } from "@/_lib/prisma" 

interface GetBookingsProps {
  serviceId: string 
  day: string
}


export const getBookings = async ({ day, serviceId }: GetBookingsProps) => {
  const bookings = await db.booking.findMany({
    select: { professionalId: true, date: true },
    where: {
      
      serviceId: serviceId, 
      date: bookingDayBounds(day),
    },
  })

  return bookings
}
