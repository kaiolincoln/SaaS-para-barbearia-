"use client"

import {
  Barbershop,
  BarbershopService,
  Professional,
  WorkingHours,
} from "@prisma/client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useState } from "react"
import {
  availableBookingTimes,
  bookingDay,
  bookingInstant,
  bookingWeekday,
  calendarDay,
  calendarDate,
  freeProfessionals,
  type OccupiedSlot,
} from "@/_lib/booking-time"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createBooking } from "@/_actions/create-booking"
import { getDayBookings } from "@/_actions/get-day-bookings"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"
import { Loader2 } from "lucide-react"

interface ServiceItemProps {
  service: BarbershopService & {
    professionals: Professional[]
    barbershop: Barbershop & {
      professionals: Professional[]
      workingHours: WorkingHours[]
    }
  }
  isAuthenticated: boolean
}

const ServiceItem = ({ service, isAuthenticated }: ServiceItemProps) => {
  const router = useRouter()

  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [selectedProfessional, setSelectedProfessional] = useState<
    Professional | undefined
  >(undefined)
  const [availability, setAvailability] = useState<{
    day: string
    bookings: OccupiedSlot[]
  } | null>(null)
  const day = selectedDay ? calendarDay(selectedDay) : undefined

  useEffect(() => {
    if (!day) return
    let active = true
    getDayBookings({ barbershopId: service.barbershop.id, day })
      .then((bookings) => {
        if (active) setAvailability({ day, bookings })
      })
      .catch(() => {
        if (active) {
          setAvailability(null)
          toast.error(
            "Não foi possível consultar os horários. Selecione o dia novamente.",
          )
        }
      })
    return () => {
      active = false
    }
  }, [day, service.barbershop.id])

  const availableTimes =
    day && availability?.day === day
      ? availableBookingTimes(
          day,
          service.barbershop.workingHours,
          service.professionals,
          availability.bookings,
        )
      : []
  const selectedDate = useMemo(
    () => (day && selectedTime ? bookingInstant(day, selectedTime) : undefined),
    [day, selectedTime],
  )
  const availableProfessionals =
    selectedDate && availability && availability.day === day
      ? freeProfessionals(
          selectedDate,
          service.professionals,
          availability.bookings,
        )
      : []

  const resetBookingState = () => {
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setSelectedProfessional(undefined)
    setAvailability(null)
    setBookingSheetIsOpen(false)
  }

  const handleBookingClick = () => {
    if (isAuthenticated) {
      setBookingSheetIsOpen(true)
    } else {
      setSignInDialogIsOpen(true)
    }
  }

  const handleCreateBooking = async () => {
    if (
      !selectedDate ||
      !selectedProfessional ||
      !availableTimes.includes(selectedTime ?? "") ||
      !availableProfessionals.some((p) => p.id === selectedProfessional.id)
    )
      return
    setIsSubmitting(true)
    try {
      await createBooking({
        serviceId: service.id,
        professionalId: selectedProfessional.id,
        date: selectedDate,
      })
      resetBookingState()
      toast.success("Reserva criada com sucesso!", {
        action: {
          label: "Ver agendamentos",
          onClick: () => router.push("/bookings"),
        },
      })
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar reserva!",
      )
      setSelectedTime(undefined)
      setSelectedProfessional(undefined)
      if (day) {
        setAvailability(null)
        getDayBookings({ barbershopId: service.barbershop.id, day })
          .then((bookings) => setAvailability({ day, bookings }))
          .catch(() => {})
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          <div className="relative h-[110px] w-[110px] flex-shrink-0">
            <Image
              alt={service.name}
              src={service.imageUrl || ""}
              fill
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{service.name}</h3>
              <p className="text-sm text-gray-400">{service.description}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-bold text-primary">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>
              <Sheet
                open={bookingSheetIsOpen}
                onOpenChange={(open) => {
                  if (!open) resetBookingState()
                  else handleBookingClick()
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBookingClick}
                >
                  Reservar
                </Button>
                <SheetContent className="flex flex-col p-0">
                  <SheetHeader className="border-b px-5 py-4">
                    <SheetTitle>Fazer Reserva</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-5">
                      <Calendar
                        mode="single"
                        locale={ptBR}
                        selected={selectedDay}
                        onSelect={(date) => {
                          setSelectedDay(date)
                          setAvailability(null)
                          setSelectedTime(undefined)
                          setSelectedProfessional(undefined)
                        }}
                        today={calendarDate(bookingDay())}
                        defaultMonth={calendarDate(bookingDay())}
                        disabled={(date) => {
                          const dayLabel = calendarDay(date)
                          const dayOfWeek = bookingWeekday(dayLabel)
                          const workingHours =
                            service.barbershop.workingHours.find(
                              (wh) => wh.dayOfWeek === dayOfWeek,
                            )
                          return (
                            dayLabel < bookingDay() ||
                            !workingHours ||
                            !workingHours.isOpen
                          )
                        }}
                      />
                    </div>
                    {selectedDay && (
                      <div className="flex gap-3 overflow-x-auto border-t p-5 [&::-webkit-scrollbar]:hidden">
                        {availableTimes.length > 0 ? (
                          availableTimes.map((time) => (
                            <Button
                              key={time}
                              variant={
                                selectedTime === time ? "default" : "outline"
                              }
                              className="rounded-full"
                              onClick={() => {
                                setSelectedTime(time)
                                setSelectedProfessional(undefined)
                              }}
                            >
                              {time}
                            </Button>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400">
                            Não há horários disponíveis para este dia.
                          </p>
                        )}
                      </div>
                    )}
                    {selectedTime && (
                      <div className="border-t p-5">
                        <h3 className="mb-3 font-semibold">
                          Escolha o Profissional
                        </h3>
                        <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                          {availableProfessionals.length > 0 ? (
                            availableProfessionals.map((prof) => (
                              <Button
                                key={prof.id}
                                variant={
                                  selectedProfessional?.id === prof.id
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => setSelectedProfessional(prof)}
                                className="flex h-auto items-center gap-2 px-3 py-2"
                              >
                                <Image
                                  src={prof.imageUrl || ""}
                                  alt={prof.name}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                                <span>{prof.name}</span>
                              </Button>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400">
                              Nenhum profissional disponível para este horário.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedDate && selectedProfessional && (
                      <div className="border-t p-5">
                        <BookingSummary
                          service={service}
                          selectedDate={selectedDate}
                          professional={selectedProfessional}
                        />
                      </div>
                    )}
                  </div>
                  <SheetFooter className="border-t px-5 py-4">
                    <Button
                      onClick={handleCreateBooking}
                      disabled={
                        !selectedDate ||
                        !selectedProfessional ||
                        !availableTimes.includes(selectedTime ?? "") ||
                        !availableProfessionals.some(
                          (p) => p.id === selectedProfessional.id,
                        ) ||
                        isSubmitting
                      }
                      className="w-full"
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirmar Reserva
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={signInDialogIsOpen} onOpenChange={setSignInDialogIsOpen}>
        <DialogContent className="w-[90%]">
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceItem
