"use client"

import { Prisma } from "@prisma/client"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { isFuture } from "date-fns"
import { formatBookingDate } from "@/_lib/booking-time"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"
import PhoneItem from "./phone-item"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"
import { deleteBooking } from "../../_actions/delete-booking"
import { toast } from "sonner"
import { useState } from "react"
import BookingSummary from "./booking-summary"
import { Loader2 } from "lucide-react" // ✅ Importar ícone de loading

interface BookingItemProps {
  booking: Prisma.BookingGetPayload<{
    include: {
      service: {
        include: {
          barbershop: true
        }
      }
    }
  }>
}

const BookingItem = ({ booking }: BookingItemProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false) // ✅ Adicionar estado de loading
  const {
    service: { barbershop },
  } = booking
  const isConfirmed = isFuture(booking.date)

  const handleCancelBooking = async () => {
    setIsDeleteLoading(true) // ✅ Ativar loading
    try {
      await deleteBooking(booking.id)
      setIsSheetOpen(false)
      toast.success("Reserva cancelada com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao cancelar reserva. Tente novamente.")
    } finally {
      setIsDeleteLoading(false) // ✅ Desativar loading
    }
  }

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen)
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger className="w-full min-w-[90%]">
        <Card className="min-w-[90%]">
          <CardContent className="flex justify-between p-0">
            <div className="flex flex-col gap-2 py-5 pl-5">
              <Badge
                className="w-fit"
                variant={isConfirmed ? "default" : "secondary"}
              >
                {isConfirmed ? "Confirmado" : "Finalizado"}
              </Badge>
              <h3 className="font-semibold">{booking.service.name}</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={booking.service.barbershop.imageUrl} />
                </Avatar>
                <p className="text-sm">{booking.service.barbershop.name}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
              <p className="text-sm capitalize">
                {formatBookingDate(booking.date, "MMMM")}
              </p>
              <p className="text-2xl">
                {formatBookingDate(booking.date, "dd")}
              </p>
              <p className="text-sm">
                {formatBookingDate(booking.date, "HH:mm")}
              </p>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      {/* ✅ INÍCIO DA CORREÇÃO DO LAYOUT */}
      <SheetContent className="flex w-[85%] flex-col p-0">
        <SheetHeader className="border-b border-solid border-secondary px-5 py-6 text-left">
          <SheetTitle>Informações da Reserva</SheetTitle>
        </SheetHeader>

        {/* Área de Scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative mt-6 h-[180px] w-full">
            <Image
              alt={`Mapa da barbearia ${booking.service.barbershop.name}`}
              src="/map.png"
              fill
              className="object-cover"
            />
          </div>

          <div className="px-5">
            <Card className="relative z-10 -mt-5 w-full rounded-xl">
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar>
                  <AvatarImage src={barbershop.imageUrl} />
                </Avatar>
                <div>
                  <h3 className="font-bold">{barbershop.name}</h3>
                  <p className="text-xs">{barbershop.address}</p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Badge
                className="w-fit"
                variant={isConfirmed ? "default" : "secondary"}
              >
                {isConfirmed ? "Confirmado" : "Finalizado"}
              </Badge>

              <div className="mb-3 mt-6">
                <BookingSummary
                  service={booking.service}
                  selectedDate={booking.date}
                />
              </div>

              <div className="space-y-3">
                {barbershop.phones.map((phone, index) => (
                  <PhoneItem key={index} phone={phone} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <SheetFooter className="border-t border-solid border-secondary px-5 py-6">
          <div className="flex w-full items-center gap-3">
            <SheetClose asChild>
              <Button variant="outline" className="w-full">
                Voltar
              </Button>
            </SheetClose>
            {isConfirmed && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Cancelar Reserva
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90%]">
                  <DialogHeader>
                    <DialogTitle>Deseja cancelar a reserva?</DialogTitle>
                    <DialogDescription>
                      Esta ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-row gap-3">
                    <DialogClose asChild>
                      <Button variant="secondary" className="mt-0 w-full">
                        Voltar
                      </Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleCancelBooking}
                      className="w-full"
                      disabled={isDeleteLoading}
                    >
                      {isDeleteLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirmar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
      {/* ✅ FIM DA CORREÇÃO DO LAYOUT */}
    </Sheet>
  )
}

export default BookingItem
