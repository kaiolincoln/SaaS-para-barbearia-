import { BarbershopService, Professional } from "@prisma/client"
import { formatBookingDate } from "@/_lib/booking-time"

interface BookingSummaryProps {
  service: BarbershopService
  selectedDate: Date
  priceAtBooking?: string
  durationMinutes?: number
  professional?: Professional
}

const BookingSummary = ({
  service,
  selectedDate,
  professional,
  durationMinutes = service.durationMinutes,
  priceAtBooking,
}: BookingSummaryProps) => {
  return (
    <div className="space-y-3 rounded-md border p-5">
      <div className="flex justify-between">
        <h3 className="font-semibold">{service.name}</h3>
        <p className="text-sm font-bold">
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(priceAtBooking ?? service.price))}
        </p>
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Data</p>
        <p className="text-sm">
          {formatBookingDate(selectedDate, "dd 'de' MMMM")}
        </p>
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Horário</p>
        <p className="text-sm">{formatBookingDate(selectedDate, "HH:mm")}</p>
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Duração</p>
        <p className="text-sm">{durationMinutes} min</p>
      </div>
      {professional && (
        <div className="mt-3 flex justify-between border-t pt-3">
          <p className="text-sm text-muted-foreground">Barbeiro</p>
          <p className="text-sm font-semibold">{professional.name}</p>
        </div>
      )}
    </div>
  )
}

export default BookingSummary
