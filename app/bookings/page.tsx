import { getServerSession } from "next-auth"
import Header from "../_components/ui/header"
import { authOptions } from "../_lib/auth"
import { notFound } from "next/navigation"
import BookingItem from "../_components/ui/booking-item"
import { getConfirmedBookings } from "../_data/get-confirmed-bookings"
import { getConcludedBookings } from "../_data/get-concluded-bookings"

import { getCancelledBookings } from "../_data/get-cancelled-bookings"

const Bookings = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    // TODO: mostrar pop-up de login
    return notFound()
  }
  const confirmedBookings = await getConfirmedBookings()
  const concludedBookings = await getConcludedBookings()
  const cancelledBookings = await getCancelledBookings()

  return (
    <>
      <Header />
      <div className="studio-shell space-y-3">
        <h1 className="studio-title mb-8">Agendamentos</h1>
        {confirmedBookings.length === 0 &&
          concludedBookings.length === 0 &&
          cancelledBookings.length === 0 && (
            <p className="text-muted-foreground">Você não tem agendamentos.</p>
          )}
        {confirmedBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xl font-medium text-foreground">
              Confirmados
            </h2>
            {confirmedBookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={JSON.parse(JSON.stringify(booking))}
              />
            ))}
          </>
        )}
        {concludedBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xl font-medium text-foreground">
              Finalizados
            </h2>
            {concludedBookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={JSON.parse(JSON.stringify(booking))}
              />
            ))}
          </>
        )}
        {cancelledBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xl font-medium text-foreground">
              Cancelados
            </h2>
            {cancelledBookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={JSON.parse(JSON.stringify(booking))}
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}

export default Bookings
