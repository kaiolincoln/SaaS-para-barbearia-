import { getFinancialReport } from "@/_data/get-financial-report"
import { financialPeriod, money } from "@/_lib/financial"
import FinancialReport from "./_components/financial-report"
import PaymentControl from "./_components/payment-control"
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
  searchParams?: {
    period?: string
    start?: string
    end?: string
    dimension?: string
    pending?: string
  }
  params: {
    id?: string
  }
}

const BarbershopDetailsPage = async ({
  params,
  searchParams = {},
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
  let period
  let periodError: string | undefined
  try {
    period = financialPeriod(
      searchParams.period,
      searchParams.start,
      searchParams.end,
    )
  } catch {
    period = financialPeriod()
    periodError = "Período inválido: confira as datas (máximo dez anos)."
  }
  const dimension = ["date", "professional", "service"].includes(
    searchParams.dimension ?? "",
  )
    ? searchParams.dimension!
    : "date"
  const report = await getFinancialReport(barbershop.id, period, dimension)
  const pendingIds = new Set(report.summary.pendingIds)
  const visibleBookings =
    searchParams.pending === "1"
      ? allBookings.filter((booking) => pendingIds.has(booking.id))
      : allBookings
  const basePath = `/admin/barbershops/${barbershop.id}`
  const clearQuery = new URLSearchParams({
    period: period.key,
    start: period.start,
    end: period.end,
    dimension,
  })

  return (
    <main className="studio-shell admin-workspace">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin">
          <ChevronLeftIcon size={16} className="mr-2" />
          Todas as barbearias
        </Link>
      </Button>

      <h1 className="studio-title mb-4">{barbershop.name}</h1>
      <p className="mb-6 text-muted-foreground">
        Aqui você pode gerenciar os serviços e informações da sua barbearia.
      </p>

      <nav
        className="mb-8 flex flex-wrap gap-2 border-b pb-5"
        aria-label="Seções da barbearia"
      >
        {[
          ["expediente", "Expediente"],
          ["equipe", "Equipe"],
          ["servicos", "Serviços"],
          ["agenda", "Agenda"],
          ["financeiro", "Financeiro"],
        ].map(([id, label]) => (
          <Button key={id} asChild variant="secondary">
            <a href={`#${id}`}>{label}</a>
          </Button>
        ))}
        <Button asChild variant="outline">
          <Link href={`/barbershops/${barbershop.id}`}>Ver página pública</Link>
        </Button>
      </nav>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="admin-panel">
          <p className="text-sm text-muted-foreground">
            Receita prevista (mês atual)
          </p>
          <p className="mt-3 text-3xl font-medium tabular-nums">
            {money(report.monthSummary.projected)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Projeção das confirmadas do mês, não receita recebida.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-4 h-auto whitespace-normal"
          >
            <Link href={`${basePath}?period=month#financeiro`}>
              Ver relatório completo
            </Link>
          </Button>
        </div>
        <div className="admin-panel">
          <p className="text-sm text-muted-foreground">Agendamentos futuros</p>
          <p className="mt-3 text-3xl font-medium tabular-nums">
            {futureBookings.length}
          </p>
        </div>
      </div>

      <section id="expediente" className="admin-panel scroll-mt-6">
        <h2 className="mb-4 text-lg font-semibold">
          Horários de funcionamento
        </h2>
        <WorkingHoursForm
          barbershopId={barbershop.id}
          initialData={barbershop.workingHours}
        />
      </section>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div id="equipe" className="scroll-mt-6">
            <ProfessionalList
              professionals={barbershop.professionals}
              barbershopId={barbershop.id}
            />
          </div>

          <div id="servicos" className="admin-panel scroll-mt-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Serviços</h2>
              <AddServiceSheet
                barbershopId={barbershop.id}
                professionals={barbershop.professionals}
              />
            </div>
            <div className="space-y-2">
              {barbershop.services.length === 0 && (
                <p className="py-6 text-sm text-muted-foreground">
                  Nenhum serviço cadastrado.
                </p>
              )}
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

        <div id="agenda" className="min-w-0 flex-1 scroll-mt-6">
          <div className="admin-panel">
            <h2 className="mb-4 text-lg font-semibold">
              Agendamentos e histórico
            </h2>
            <div className="space-y-1">
              {searchParams.pending === "1" && (
                <p className="py-3 text-sm">
                  Pagamentos pendentes de{" "}
                  {period.start.split("-").reverse().join("/")} a{" "}
                  {period.end.split("-").reverse().join("/")}.{" "}
                  <Link
                    href={`${basePath}?${clearQuery}#agenda`}
                    className="underline"
                  >
                    Ver toda a agenda
                  </Link>
                </p>
              )}
              {visibleBookings.length === 0 && (
                <p className="py-8 text-sm text-muted-foreground">
                  Os agendamentos aparecerão aqui quando houver reservas.
                </p>
              )}
              {visibleBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-start justify-between gap-4 border-t py-5"
                >
                  <div className="flex min-w-0 flex-col items-start gap-2">
                    <p className="font-semibold">{booking.service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.user.name}
                    </p>
                    <Badge variant="secondary">
                      {bookingStatusLabels[booking.status]}
                    </Badge>
                    {booking.status === "COMPLETED" && (
                      <PaymentControl
                        bookingId={booking.id}
                        price={booking.priceAtBooking.toString()}
                        paidAmount={booking.paidAmount?.toString() ?? null}
                        paymentMethod={booking.paymentMethod}
                        paidAt={
                          booking.paidAt
                            ? formatBookingDate(
                                booking.paidAt,
                                "yyyy-MM-dd'T'HH:mm",
                              )
                            : ""
                        }
                      />
                    )}
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
      <FinancialReport
        report={report}
        period={period}
        basePath={basePath}
        dimension={dimension}
        periodError={periodError}
      />
    </main>
  )
}

export default BarbershopDetailsPage
