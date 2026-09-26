"use server"

import { db } from "@/_lib/prisma"
import { bookingDayBounds } from "@/_lib/booking-time"

interface GetDayBookingsParams {
  barbershopId: string
  day: string
}

export const getDayBookings = async (params: GetDayBookingsParams) => {
  const bounds = bookingDayBounds(params.day)
  const bookings = await db.booking.findMany({
    select: { professionalId: true, date: true, endsAt: true },
    where: {
      status: "CONFIRMED",
      service: {
        barbershopId: params.barbershopId,
      },
      date: { lt: bounds.lt },
      endsAt: { gt: bounds.gte },
    },
  })

  return bookings
}
