import type { BookingStatus } from "@prisma/client"

export const bookingStatusLabels: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
}
