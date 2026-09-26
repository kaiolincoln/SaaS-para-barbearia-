"use client"
import type { RatingSummary } from "@/_data/reviews"

import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import SidebarSheet from "@/_components/ui/sidebar-sheet"
import { Barbershop } from "@prisma/client"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface BarbershopInfoProps {
  barbershop: Barbershop & RatingSummary
}

const BarbershopInfo = ({ barbershop }: BarbershopInfoProps) => {
  return (
    <div>
      {/* Imagem da Barbearia */}
      <div className="relative h-[250px] w-full">
        <Button
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
              size="icon"
              variant="outline"
              className="absolute right-4 top-4 z-50"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>

        <Image
          alt={barbershop.name}
          src={barbershop.imageUrl}
          fill
          className="object-cover opacity-75"
        />
      </div>

      {/* Informações da Barbearia */}
      <div className="border-b border-solid px-5 py-3">
        <h1 className="mb-2 text-xl font-bold">{barbershop.name}</h1>
        <div className="mb-2 flex items-center gap-2">
          <MapPinIcon className="text-primary" size={18} />
          <p className="text-sm">{barbershop.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <StarIcon className="fill-primary text-primary" size={18} />
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
