import { BarbershopService, Professional } from "@prisma/client"
import { formatBookingDate } from "@/_lib/booking-time"

interface BookingSummaryProps {
  service: BarbershopService
  selectedDate: Date
  professional?: Professional
}

const BookingSummary = ({
  service,
  selectedDate,
  professional,
}: BookingSummaryProps) => {
  return (
    <div className="space-y-3 rounded-lg border p-5">
      <div className="flex justify-between">
        <h3 className="font-semibold">{service.name}</h3>
        <p className="text-sm font-bold">
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(service.price))}
        </p>
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-gray-400">Data</p>
        <p className="text-sm">
          {formatBookingDate(selectedDate, "dd 'de' MMMM")}
        </p>
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-gray-400">Horário</p>
        <p className="text-sm">{formatBookingDate(selectedDate, "HH:mm")}</p>
      </div>
      {professional && (
        <div className="mt-3 flex justify-between border-t pt-3">
          <p className="text-sm text-gray-400">Barbeiro</p>
          <p className="text-sm font-semibold">{professional.name}</p>
        </div>
      )}
    </div>
  )
}

export default BookingSummary
