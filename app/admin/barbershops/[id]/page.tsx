import { Badge } from "@/components/ui/badge"
import { bookingStatusLabels } from "@/_lib/booking-status"
import CompleteBookingButton from "@/_components/ui/complete-booking-button"
import { requireBarbershopAccess } from "@/_lib/authorize-barbershop"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatBookingDate } from "@/_lib/booking-time"
import { ChevronLeftIcon } from "lucide-react"

import { db } from "@/_lib/prisma"
import { Button } from "@/components/ui/button"
import { ServiceListItem } from "./_components/service-list-item"
import { AddServiceSheet } from "./_components/add-service-sheet"
import { WorkingHoursForm } from "./_components/working-hours-form"
import { ProfessionalList } from "./_components/professional-list"

interface BarbershopDetailsPageProps {
  params: {
    id?: string
  }
}

const BarbershopDetailsPage = async ({
  params,
}: BarbershopDetailsPageProps) => {
  if (!params.id) return redirect("/")
  try {
    await requireBarbershopAccess(params.id)
  } catch {
    return redirect("/")
  }

  const barbershop = await db.barbershop.findUnique({
    where: {
      id: params.id,
    },
    include: {
      services: {
        include: {
          professionals: true,
          bookings: {
            include: {
              user: { select: { name: true } },
              service: true,
            },
            orderBy: {
              date: "asc",
            },
          },
        },
      },
      workingHours: true,
      professionals: true,
    },
  })

  if (!barbershop) {
    return redirect("/admin")
  }

  const allBookings = barbershop.services.flatMap((s) => s.bookings ?? [])
  const futureBookings = allBookings.filter(
    (b) => b.status === "CONFIRMED" && b.date >= new Date(),
  )
  const totalRevenue = futureBookings.reduce(
    (sum, booking) =>
      sum + (booking.service ? Number(booking.service.price) : 0),
    0,
  )

  return (
    <div className="p-5 lg:p-10">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin">
          <ChevronLeftIcon size={16} className="mr-2" />
          Voltar para o Dashboard
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">{barbershop.name} - Gerenciamento</h1>
      <p className="mb-6 text-gray-400">
        Aqui você pode gerenciar os serviços e informações da sua barbearia.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-400">Faturamento (Futuro)</p>
          <p className="text-2xl font-bold">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-400">Agendamentos Futuros</p>
          <p className="text-2xl font-bold">{futureBookings.length}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">
          Horários de Funcionamento
        </h2>
        <WorkingHoursForm
          barbershopId={barbershop.id}
          initialData={barbershop.workingHours}
        />
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <ProfessionalList
            professionals={barbershop.professionals}
            barbershopId={barbershop.id}
          />

          <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Serviços Cadastrados</h2>
              <AddServiceSheet
                barbershopId={barbershop.id}
                professionals={barbershop.professionals}
              />
            </div>
            <div className="space-y-2">
              {barbershop.services.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  barbershopProfessionals={barbershop.professionals}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">
              Agendamentos e histórico
            </h2>
            <div className="space-y-3">
              {allBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-md border bg-secondary p-3"
                >
                  <div className="flex flex-col">
                    <p className="font-semibold">{booking.service.name}</p>
                    <p className="text-sm text-gray-400">{booking.user.name}</p>
                    <Badge variant="secondary">
                      {bookingStatusLabels[booking.status]}
                    </Badge>
                    {booking.status === "CONFIRMED" &&
                      booking.endsAt <= new Date() && (
                        <CompleteBookingButton bookingId={booking.id} />
                      )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {formatBookingDate(
                        new Date(booking.date),
                        "dd 'de' MMMM",
                      )}
                    </p>
                    <p className="text-sm font-bold">
                      {formatBookingDate(new Date(booking.date), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarbershopDetailsPage
