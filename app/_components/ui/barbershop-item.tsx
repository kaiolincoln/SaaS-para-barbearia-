import type { RatingSummary } from "@/_data/reviews"
import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import DuotonePhoto from "./duotone-photo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"

interface BarbershopItemProps {
  barbershop: Barbershop & RatingSummary
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
  return (
    <Card className="w-full min-w-[220px] border-0 bg-transparent shadow-none">
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
        </div>

        {/* TEXTO */}
        <div className="px-1 py-3">
          <h3 className="truncate font-semibold">{barbershop.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {barbershop.address}
          </p>
          <Button variant="secondary" className="mt-3 w-full" asChild>
            <Link href={`/barbershops/${barbershop.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
