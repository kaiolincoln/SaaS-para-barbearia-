import DuotonePhoto from "@/_components/ui/duotone-photo"
import Carousel from "@/_components/ui/carousel"
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
  // Reviews já existem. Sem notas, usamos o desempate estável do ranking;
  // Barbershop não possui createdAt. Não inventar recência nem alterar o schema.
  const featuredShop = popularBarbershops[0]
  const recommendedShops = featuredShop
    ? [
        featuredShop,
        ...barbershops.filter((shop) => shop.id !== featuredShop.id),
      ]
    : []
  const confirmedBookings = await getConfirmedBookings()

  return (
    <div>
      {/* header */}
      <Header />
      <div className="studio-shell">
        {featuredShop && (
          <Link
            href={`/barbershops/${featuredShop.id}`}
            className="studio-hero relative mb-6 block h-[28vh] min-h-[220px] overflow-hidden rounded-md sm:h-[40vh] sm:min-h-[320px]"
            aria-label={`Conhecer ${featuredShop.name}`}
          >
            <DuotonePhoto
              src={featuredShop.imageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <h1 className="studio-title max-w-4xl break-words">
                <span className="bg-background/80 box-decoration-clone px-1">
                  {featuredShop.name}
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base">
                <span className="bg-background/80 box-decoration-clone px-1">
                  {featuredShop.address}
                </span>
              </p>
            </div>
          </Link>
        )}
        {/* TEXTO */}
        <h2 className="mb-2 text-lg font-normal">
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
        <div className="mt-6">
          <Carousel label="Categorias" className="flex gap-3">
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
          </Carousel>
        </div>

        {confirmedBookings.length > 0 && (
          <>
            <h2 className="studio-section mb-5 text-xl font-medium text-foreground">
              Agendamentos
            </h2>

            {/* AGENDAMENTO */}
            <Carousel label="Agendamentos" className="flex gap-3">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                />
              ))}
            </Carousel>
          </>
        )}

        <h2 className="studio-section mb-5 text-xl font-medium text-foreground">
          Recomendados
        </h2>
        <Carousel
          label="Recomendados"
          className="grid auto-cols-[40%] grid-flow-col gap-4 sm:auto-cols-[28%] lg:auto-cols-[24%]"
        >
          {recommendedShops.map((barbershop, index) => (
            <BarbershopItem
              key={barbershop.id}
              barbershop={barbershop}
              featured={index === 0}
            />
          ))}
        </Carousel>

        <h2 className="studio-section mb-5 text-xl font-medium text-foreground">
          Populares
        </h2>
        <Carousel
          label="Populares"
          className="grid auto-cols-[80%] grid-flow-col gap-6 sm:auto-cols-[40%] lg:auto-cols-[30%]"
        >
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </Carousel>
      </div>
    </div>
  )
}

export default Home
