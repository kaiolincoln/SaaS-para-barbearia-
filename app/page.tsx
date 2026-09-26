import { withRatings, comparePopularity } from "@/_data/reviews"
import Header from "@/_components/ui/header"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { db } from "./_lib/prisma"
import BarbershopItem from "@/_components/ui/barbershop-item"
import { quickSearchOptions } from "./_constants/search"
import BookingItem from "@/_components/ui/booking-item"
import Search from "@/_components/ui/search"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { formatBookingDate } from "@/_lib/booking-time"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"

const Home = async () => {
  const session = await getServerSession(authOptions)
  const barbershops = await withRatings(await db.barbershop.findMany({}))
  const popularBarbershops = [...barbershops].sort(comparePopularity)
  const confirmedBookings = await getConfirmedBookings()

  return (
    <div>
      {/* header */}
      <Header />
      <div className="studio-shell">
        {/* TEXTO */}
        <h2 className="studio-title mb-5 max-w-3xl">
          Olá, {session?.user ? session.user.name : "bem vindo"}!
        </h2>
        <p>
          <span className="capitalize">
            {formatBookingDate(new Date(), "EEEE, dd")}
          </span>
          <span>&nbsp;de&nbsp;</span>
          <span className="capitalize">
            {formatBookingDate(new Date(), "MMMM")}
          </span>
        </p>

        {/* BUSCA */}
        <div className="mt-6">
          <Search />
        </div>

        {/* BUSCA RÁPIDA */}
        <div className="mt-6 flex gap-3 overflow-x-scroll [&::-webkit-scrollbar]:hidden">
          {quickSearchOptions.map((option) => (
            <Button
              className="gap-2"
              variant="secondary"
              key={option.title}
              asChild
            >
              <Link href={`/barbershops?service=${option.title}`}>
                {
                  <Image
                    src={option.imageUrl}
                    width={16}
                    height={16}
                    alt={option.title}
                  />
                }
                {option.title}
              </Link>
            </Button>
          ))}
        </div>

        {confirmedBookings.length > 0 && (
          <>
            <h2 className="studio-section mb-5 text-xl font-medium text-foreground">
              Agendamentos
            </h2>

            {/* AGENDAMENTO */}
            <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                />
              ))}
            </div>
          </>
        )}

        <h2 className="studio-section mb-5 text-xl font-medium text-foreground">
          Recomendados
        </h2>
        <div className="grid auto-cols-[80%] grid-flow-col gap-6 overflow-x-auto pb-4 sm:auto-cols-[40%] lg:auto-cols-[30%]">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>

        <h2 className="studio-section mb-5 text-xl font-medium text-foreground">
          Populares
        </h2>
        <div className="grid auto-cols-[80%] grid-flow-col gap-6 overflow-x-auto pb-4 sm:auto-cols-[40%] lg:auto-cols-[30%]">
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
