"use server"

import { bookingDayBounds } from "@/_lib/booking-time"
import { db } from "@/_lib/prisma"

interface GetBookingsProps {
  serviceId: string
  day: string
}

export const getBookings = async ({ day, serviceId }: GetBookingsProps) => {
  const bounds = bookingDayBounds(day)
  const bookings = await db.booking.findMany({
    select: { professionalId: true, date: true, endsAt: true },
    where: {
      status: "CONFIRMED",
      serviceId: serviceId,
      date: { lt: bounds.lt },
      endsAt: { gt: bounds.gte },
    },
  })

  return bookings
}
