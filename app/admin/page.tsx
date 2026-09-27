// DENTRO DE: app/admin/page.tsx

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import DuotonePhoto from "@/_components/ui/duotone-photo"
import Link from "next/link"
import { db } from "@/_lib/prisma"
import { authOptions } from "@/_lib/auth"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ChevronLeft, MapPinIcon } from "lucide-react"

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
    <main className="studio-shell">
      <nav
        className="mb-10 flex items-center justify-between border-b pb-5"
        aria-label="Navegação administrativa"
      >
        <Link href="/" className="text-xl font-black tracking-tighter">
          FSW BARBER
        </Link>
        <Button asChild variant="ghost">
          <Link href="/">
            <ChevronLeft size={16} />
            Voltar ao site
          </Link>
        </Button>
      </nav>
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="studio-title mb-4">Seu estúdio</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {session.user.name}!
          </p>
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          {barbershops.length}{" "}
          {barbershops.length === 1
            ? "barbearia para gerenciar"
            : "barbearias para gerenciar"}
        </p>
      </div>
      {/* 4. Verifica se o usuário é dono de alguma barbearia */}
      {barbershops.length > 0 ? (
        <>
          <h2 className="border-t pt-6 text-xl font-medium">Suas barbearias</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {/* 5. Lista as barbearias do usuário */}
            {barbershops.map((barbershop) => (
              <div
                key={barbershop.id}
                className="barbershop-card flex flex-col overflow-hidden rounded-md"
              >
                <div className="relative aspect-[16/10] w-full">
                  <DuotonePhoto
                    src={barbershop.imageUrl}
                    alt={barbershop.name}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 380px"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="card-name w-fit text-2xl font-semibold">
                    {barbershop.name}
                  </h3>
                  <div className="mb-6 mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPinIcon size={16} className="mt-0.5 shrink-0" />
                    {barbershop.address}
                  </div>
                  {/* Futuramente, você pode adicionar mais informações aqui */}
                  <Button
                    variant="default"
                    className="mt-auto w-full justify-between"
                    asChild
                  >
                    {/* O link para a página de gerenciamento detalhada */}
                    <Link href={`/admin/barbershops/${barbershop.id}`}>
                      Gerenciar <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-md border border-dashed bg-card px-5 py-12 text-center">
          <h2 className="text-xl font-semibold">
            Nenhuma barbearia encontrada.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Você ainda não cadastrou nenhuma barbearia.
          </p>
          <Button className="mt-4">Cadastrar minha barbearia</Button>
        </div>
      )}
    </main>
  )
}

export default AdminPage
