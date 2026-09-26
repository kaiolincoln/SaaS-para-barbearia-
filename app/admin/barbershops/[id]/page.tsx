import { requireBarbershopAccess } from "@/_lib/authorize-barbershop";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeftIcon } from "lucide-react";

import { db } from "@/_lib/prisma";
import { Button } from "@/components/ui/button";
import { ServiceListItem } from "./_components/service-list-item";
import { AddServiceSheet } from "./_components/add-service-sheet";
import { WorkingHoursForm } from "./_components/working-hours-form";
import { ProfessionalList } from "./_components/professional-list";

interface BarbershopDetailsPageProps {
  params: {
    id?: string;
  };
}

const BarbershopDetailsPage = async ({
  params,
}: BarbershopDetailsPageProps) => {
  if (!params.id) return redirect("/");
  try {
    await requireBarbershopAccess(params.id);
  } catch {
    return redirect("/");
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
            where: { date: { gte: new Date() } },
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
  });

  if (!barbershop) {
    return redirect("/admin");
  }

  const allBookings = barbershop.services.flatMap((s) => s.bookings ?? []);
  const totalRevenue = allBookings.reduce(
    (sum, booking) => sum + (booking.service ? Number(booking.service.price) : 0),
    0
  );

  return (
    <div className="p-5 lg:p-10">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin">
          <ChevronLeftIcon size={16} className="mr-2" />
          Voltar para o Dashboard
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">{barbershop.name} - Gerenciamento</h1>
      <p className="text-gray-400 mb-6">
        Aqui você pode gerenciar os serviços e informações da sua barbearia.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-400">Faturamento (Futuro)</p>
          <p className="text-2xl font-bold">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalRevenue)}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-400">Agendamentos Futuros</p>
          <p className="text-2xl font-bold">{allBookings.length}</p>
        </div>
      </div>

      <div className="border rounded-lg p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Horários de Funcionamento
        </h2>
        <WorkingHoursForm
          barbershopId={barbershop.id}
          initialData={barbershop.workingHours}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <div className="flex-1 flex flex-col gap-6">
          <ProfessionalList
            professionals={barbershop.professionals}
            barbershopId={barbershop.id}
          />

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
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
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">
              Próximos Agendamentos
            </h2>
            <div className="space-y-3">
              {allBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex justify-between items-center p-3 border rounded-md bg-secondary"
                >
                  <div className="flex flex-col">
                    <p className="font-semibold">{booking.service.name}</p>
                    <p className="text-sm text-gray-400">
                      {booking.user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {format(new Date(booking.date), "dd 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </p>
                    <p className="text-sm font-bold">
                      {format(new Date(booking.date), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarbershopDetailsPage;
