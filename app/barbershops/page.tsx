import { withRatings } from "@/_data/reviews"
import BarbershopItem from "@/_components/ui/barbershop-item"
import Header from "@/_components/ui/header"
import Search from "@/_components/ui/search"
import { db } from "@/_lib/prisma"

interface BarbershopsPageProps {
  searchParams: {
    title?: string
    service?: string
  }
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const barbershops = await withRatings(
    await db.barbershop.findMany({
      where: {
        OR: [
          searchParams?.title
            ? {
                name: {
                  contains: searchParams?.title,
                  mode: "insensitive",
                },
              }
            : {},
          searchParams.service
            ? {
                services: {
                  some: {
                    name: {
                      contains: searchParams.service,
                      mode: "insensitive",
                    },
                  },
                },
              }
            : {},
        ],
      },
    }),
  )

  return (
    <div>
      <Header />
      <div className="mx-auto my-8 max-w-6xl px-5">
        <Search />
      </div>
      <div className="studio-shell">
        <h2 className="studio-title mb-8">
          Resultados para &quot;{searchParams?.title || searchParams?.service}
          &quot;
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BarbershopsPage
