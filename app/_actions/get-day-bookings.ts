"use server";

import { db } from "@/_lib/prisma";
import { endOfDay, startOfDay } from "date-fns";

interface GetDayBookingsParams {
  barbershopId: string;
  date: Date;
}

export const getDayBookings = async (params: GetDayBookingsParams) => {
  const bookings = await db.booking.findMany({
    select: { professionalId: true, date: true },
    where: {
      service: {
        barbershopId: params.barbershopId,
      },
      date: {
        gte: startOfDay(params.date),
        lte: endOfDay(params.date),
      },
    },
  });

  return bookings;
};
