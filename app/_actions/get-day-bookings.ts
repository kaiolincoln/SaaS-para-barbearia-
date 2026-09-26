"use server"

import { db } from "@/_lib/prisma"
import { bookingDayBounds } from "@/_lib/booking-time"

interface GetDayBookingsParams {
  barbershopId: string
  day: string
}

export const getDayBookings = async (params: GetDayBookingsParams) => {
  const bookings = await db.booking.findMany({
    select: { professionalId: true, date: true },
    where: {
      service: {
        barbershopId: params.barbershopId,
      },
      date: bookingDayBounds(params.day),
    },
  })

  return bookings
}
