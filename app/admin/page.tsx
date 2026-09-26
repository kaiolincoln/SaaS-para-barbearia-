// DENTRO DE: app/admin/page.tsx

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { db } from "@/_lib/prisma"
import { authOptions } from "@/_lib/auth"
import { Button } from "@/components/ui/button"
import { MapPinIcon } from "lucide-react"

const AdminPage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return redirect("/")
  }

  const barbershops = await db.barbershop.findMany({
    where:
      session.user.role === "SUPER_ADMIN" ? {} : { ownerId: session.user.id },
  })

  return (
    <div className="p-5 lg:p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-400">Bem-vindo de volta, {session.user.name}!</p>

      {/* 4. Verifica se o usuário é dono de alguma barbearia */}
      {barbershops.length > 0 ? (
        <>
          <h2 className="mt-6 text-lg font-semibold">Suas Barbearias</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 5. Lista as barbearias do usuário */}
            {barbershops.map((barbershop) => (
              <div
                key={barbershop.id}
                className="overflow-hidden rounded-lg border"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={barbershop.imageUrl}
                    alt={barbershop.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold">{barbershop.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <MapPinIcon size={14} />
                    {barbershop.address}
                  </div>
                  {/* Futuramente, você pode adicionar mais informações aqui */}
                  <Button variant="secondary" className="mt-4 w-full" asChild>
                    {/* O link para a página de gerenciamento detalhada */}
                    <Link href={`/admin/barbershops/${barbershop.id}`}>
                      Gerenciar
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-10 text-center">
          <h2 className="text-xl font-semibold">
            Nenhuma barbearia encontrada.
          </h2>
          <p className="mt-2 text-gray-400">
            Você ainda não cadastrou nenhuma barbearia.
          </p>
          <Button className="mt-4">Cadastrar minha barbearia</Button>
        </div>
      )}
    </div>
  )
}

export default AdminPage
