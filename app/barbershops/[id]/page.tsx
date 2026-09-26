// CAMINHO: app/barbershops/[id]/page.tsx

import { db } from "@/_lib/prisma";
import { notFound } from "next/navigation";
import BarbershopInfo from "./_components/barbershop-info";

import ServiceItem from  "@/_components/ui/service-item"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/_lib/auth";

interface BarbershopPageProps {
  params: {
    id?: string;
  };
}

const BarbershopPage = async ({ params }: BarbershopPageProps) => {
  const session = await getServerSession(authOptions);

  if (!params.id) {
    return notFound();
  }

  const barbershop = await db.barbershop.findUnique({
    where: {
      id: params.id,
    },
    include: {
      services: {
        include: {
          professionals: true, 
        },
      },
      workingHours: true,
      professionals: true, 
    },
  });

  if (!barbershop) {
    return notFound();
  }

  return (
    <div>
      <BarbershopInfo barbershop={barbershop} />

      <div className="px-5 py-6 flex flex-col gap-4">
        {barbershop.services.map((service) => (
          <ServiceItem
            key={service.id}
            service={{
              ...service,
              barbershop: barbershop,
            }}
            isAuthenticated={!!session?.user}
          />
        ))}
      </div>
    </div>
  );
};

export default BarbershopPage;
