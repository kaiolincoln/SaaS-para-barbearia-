"use client"
import type { RatingSummary } from "@/_data/reviews"

import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import SidebarSheet from "@/_components/ui/sidebar-sheet"
import { Barbershop } from "@prisma/client"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import DuotonePhoto from "@/_components/ui/duotone-photo"
import Link from "next/link"

interface BarbershopInfoProps {
  barbershop: Barbershop & RatingSummary
}

const BarbershopInfo = ({ barbershop }: BarbershopInfoProps) => {
  return (
    <div>
      {/* Imagem da Barbearia */}
      <div className="relative h-[320px] w-full sm:h-[480px]">
        <Button
          aria-label="Voltar"
          size="icon"
          variant="secondary"
          className="absolute left-4 top-4 z-50"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Abrir menu"
              size="icon"
              variant="outline"
              className="absolute right-4 top-4 z-50"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>

        <DuotonePhoto
          alt={barbershop.name}
          src={barbershop.imageUrl}
          sizes="100vw"
          fill
          className="object-cover"
        />
      </div>

      {/* Informações da Barbearia */}
      <div className="studio-shell border-b">
        <h1 className="studio-title mb-6">{barbershop.name}</h1>
        <div className="mb-2 flex items-center gap-2">
          <MapPinIcon className="text-muted-foreground" size={18} />
          <p className="text-sm">{barbershop.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <StarIcon className="fill-foreground text-foreground" size={18} />
          <p className="text-sm">
            {barbershop.averageRating?.toFixed(1).replace(".", ",") ??
              "Sem avaliações"}{" "}
            ({barbershop.reviewCount} avaliações)
          </p>
        </div>
      </div>
    </div>
  )
}

export default BarbershopInfo
