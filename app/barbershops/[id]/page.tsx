import { withRatings } from "@/_data/reviews"
import { formatBookingDate } from "@/_lib/booking-time"
// CAMINHO: app/barbershops/[id]/page.tsx

import { db } from "@/_lib/prisma"
import { notFound } from "next/navigation"
import BarbershopInfo from "./_components/barbershop-info"

import ServiceItem from "@/_components/ui/service-item"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"

interface BarbershopPageProps {
  params: {
    id?: string
  }
}

const BarbershopPage = async ({ params }: BarbershopPageProps) => {
  const session = await getServerSession(authOptions)

  if (!params.id) {
    return notFound()
  }

  const barbershop = await db.barbershop.findUnique({
    where: {
      id: params.id,
    },
    include: {
      services: {
        include: {
          professionals: true,
        },
      },
      workingHours: true,
      professionals: true,
    },
  })

  if (!barbershop) {
    return notFound()
  }

  const [ratedShop] = await withRatings([barbershop])
  const reviews = await db.review.findMany({
    where: { barbershopId: barbershop.id },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div>
      <BarbershopInfo barbershop={ratedShop} />

      <section className="studio-shell space-y-4">
        <h2 className="font-bold">Avaliações recentes</h2>
        {reviews.length === 0 && <p>Ainda não há avaliações.</p>}
        {reviews.map((review) => (
          <article key={review.id} className="rounded-md border p-3">
            <p>
              {review.user.name} · {review.rating}/5
            </p>
            <p className="text-sm text-muted-foreground">
              {formatBookingDate(review.createdAt, "dd/MM/yyyy")}
            </p>
            {review.comment && (
              <p className="whitespace-pre-wrap break-words">
                {review.comment}
              </p>
            )}
          </article>
        ))}
        {ratedShop.reviewCount > 50 && (
          <p>Exibindo as 50 avaliações mais recentes.</p>
        )}
      </section>
      <div className="studio-shell grid gap-4 lg:grid-cols-2">
        {barbershop.services.map((service) => (
          <ServiceItem
            key={service.id}
            service={{
              ...service,
              barbershop: barbershop,
            }}
            isAuthenticated={!!session?.user}
          />
        ))}
      </div>
    </div>
  )
}

export default BarbershopPage
