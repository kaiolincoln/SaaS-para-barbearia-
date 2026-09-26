"use client";

import { Barbershop, BarbershopService, Booking, Professional, WorkingHours } from "@prisma/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { format, isPast, isToday, set } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBooking } from "@/_actions/create-booking";
import { getDayBookings } from "@/_actions/get-day-bookings";
import SignInDialog from "./sign-in-dialog";
import BookingSummary from "./booking-summary";
import { Loader2 } from "lucide-react";

interface ServiceItemProps {
  service: BarbershopService & {
    professionals: Professional[]; 
    barbershop: Barbershop & {
      professionals: Professional[];
      workingHours: WorkingHours[];
    };
  };
  isAuthenticated: boolean;
}

const ServiceItem = ({ service, isAuthenticated }: ServiceItemProps) => {
  const router = useRouter();

  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false);
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | undefined>(undefined);
  const [dayBookings, setDayBookings] = useState<Pick<Booking, "professionalId" | "date">[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDay) return;

    const fetchBookings = async () => {
      const bookings = await getDayBookings({
        barbershopId: service.barbershop.id,
        date: selectedDay,
      });
      setDayBookings(bookings);
    };
    fetchBookings();
  }, [selectedDay, service.barbershop.id]);

  useEffect(() => {
    if (!selectedDay) {
      setAvailableTimes([]);
      return;
    }

    const workingHours = service.barbershop.workingHours.find(
      (wh) => wh.dayOfWeek === selectedDay.getDay()
    );

    if (!workingHours || !workingHours.isOpen) {
      setAvailableTimes([]);
      return;
    }

    const toMinutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
    const timeList: string[] = [];
    for (let minutes = Math.ceil(toMinutes(workingHours.startTime) / 30) * 30; minutes + 30 <= toMinutes(workingHours.endTime); minutes += 30) {
      timeList.push(String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'));
    }

    const filteredTimes = timeList.filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const timeDate = set(selectedDay, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });

      if (isPast(timeDate) && isToday(selectedDay)) return false;

      const bookingsForTime = dayBookings.filter(
        (booking) =>
          booking.date.getHours() === hour &&
          booking.date.getMinutes() === minute
      );

      return service.professionals.some(professional => !bookingsForTime.some(booking => booking.professionalId === professional.id));
    });

    setAvailableTimes(filteredTimes);
  }, [selectedDay, dayBookings, service.barbershop.workingHours, service.professionals]);

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return undefined;
    return set(selectedDay, {
      hours: Number(selectedTime.split(":")[0]),
      minutes: Number(selectedTime.split(":")[1]),
      seconds: 0,
      milliseconds: 0,
    });
  }, [selectedDay, selectedTime]);

  const availableProfessionals = useMemo(() => {
    if (!selectedTime || !selectedDate) return [];

    const bookedProfessionals = dayBookings
      .filter(
        (booking) =>
          booking.date.getHours() === selectedDate.getHours() &&
          booking.date.getMinutes() === selectedDate.getMinutes()
      )
      .map((booking) => booking.professionalId);


    return service.professionals.filter(
      (prof) => !bookedProfessionals.includes(prof.id)
    );
  }, [selectedTime, selectedDate, dayBookings, service.professionals]); 

  const resetBookingState = () => {
    setSelectedDay(undefined);
    setSelectedTime(undefined);
    setSelectedProfessional(undefined);
    setDayBookings([]);
    setBookingSheetIsOpen(false);
  };

  const handleBookingClick = () => {
    if (isAuthenticated) {
      setBookingSheetIsOpen(true);
    } else {
      setSignInDialogIsOpen(true);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedProfessional) return;
    setIsSubmitting(true);
    try {
      await createBooking({
        serviceId: service.id,
        professionalId: selectedProfessional.id,
        date: selectedDate,
      });
      resetBookingState();
      toast.success("Reserva criada com sucesso!", {
        action: {
          label: "Ver agendamentos",
          onClick: () => router.push("/bookings"),
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar reserva!");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(service.price))}
              </p>
              <Sheet open={bookingSheetIsOpen} onOpenChange={setBookingSheetIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm" onClick={handleBookingClick}>
                    Reservar
                  </Button>
                </SheetTrigger>
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
                          setSelectedDay(date);
                          setSelectedTime(undefined);
                          setSelectedProfessional(undefined);
                        }}
                        fromDate={new Date()}
                        disabled={(date) => {
                          const dayOfWeek = date.getDay();
                          const workingHours = service.barbershop.workingHours.find(
                            (wh) => wh.dayOfWeek === dayOfWeek
                          );
                          return !workingHours || !workingHours.isOpen;
                        }}
                      />
                    </div>
                    {selectedDay && (
                      <div className="flex gap-3 overflow-x-auto border-t p-5 [&::-webkit-scrollbar]:hidden">
                        {availableTimes.length > 0 ? (
                          availableTimes.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              className="rounded-full"
                              onClick={() => {
                                setSelectedTime(time);
                                setSelectedProfessional(undefined);
                              }}
                            >
                              {time}
                            </Button>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400">Não há horários disponíveis para este dia.</p>
                        )}
                      </div>
                    )}
                    {selectedTime && (
                      <div className="border-t p-5">
                        <h3 className="mb-3 font-semibold">Escolha o Profissional</h3>
                        <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                          {availableProfessionals.length > 0 ? (
                            availableProfessionals.map((prof) => (
                              <Button
                                key={prof.id}
                                variant={selectedProfessional?.id === prof.id ? "default" : "outline"}
                                onClick={() => setSelectedProfessional(prof)}
                                className="flex items-center gap-2 px-3 py-2 h-auto"
                              >
                                <Image src={prof.imageUrl || ""} alt={prof.name} width={32} height={32} className="rounded-full" />
                                <span>{prof.name}</span>
                              </Button>
                            ))
                          ) : (
                             <p className="text-xs text-gray-400">Nenhum profissional disponível para este horário.</p>
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
                      disabled={!selectedDate || !selectedProfessional || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
  );
};

export default ServiceItem;
