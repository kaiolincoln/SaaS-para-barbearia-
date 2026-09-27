import type { RatingSummary } from "@/_data/reviews"
import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import DuotonePhoto from "./duotone-photo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"

interface BarbershopItemProps {
  featured?: boolean
  barbershop: Barbershop & RatingSummary
}

const BarbershopItem = ({
  barbershop,
  featured = false,
}: BarbershopItemProps) => {
  return (
    <Card
      className={`barbershop-card w-full min-w-0 shadow-none ${featured ? "col-span-2" : ""}`}
    >
      <CardContent className="p-0 px-1 pt-1">
        {/* IMAGEM */}
        <div className="relative h-[240px] w-full">
          <DuotonePhoto
            alt={barbershop.name}
            fill
            sizes="(max-width: 640px) 80vw, 320px"
            className="rounded-md object-cover"
            src={barbershop.imageUrl}
          />

          {barbershop.reviewCount > 0 && (
            <Badge
              className="absolute left-2 top-2 space-x-1"
              variant="secondary"
            >
              <StarIcon size={12} className="fill-foreground text-foreground" />
              <p className="text-xs font-semibold">
                {barbershop.averageRating?.toFixed(1).replace(".", ",") ??
                  "Sem avaliações"}{" "}
                ({barbershop.reviewCount})
              </p>
            </Badge>
          )}
        </div>

        {/* TEXTO */}
        <div className="px-1 py-3">
          <h3
            className={`card-name max-w-full font-semibold ${featured ? "text-2xl" : "text-lg"}`}
          >
            {barbershop.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {barbershop.address}
          </p>
          <Button variant="default" className="mt-3 w-full px-2" asChild>
            <Link href={`/barbershops/${barbershop.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
