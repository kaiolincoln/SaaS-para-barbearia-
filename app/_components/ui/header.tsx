// CAMINHO: app/_components/ui/header.tsx

import Link from "next/link"
import { getServerSession } from "next-auth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon, UserIcon } from "lucide-react"
import SidebarSheet from "./sidebar-sheet"
import { authOptions } from "@/_lib/auth"
import { db } from "@/_lib/prisma"

const Header = async () => {
  const session = await getServerSession(authOptions)
  let isAdmin = false

  if (session?.user) {
    const userIsAdmin = await db.barbershop.findFirst({
      where: {
        ownerId: session.user.id,
      },
    })
    isAdmin = session.user.role === "SUPER_ADMIN" || !!userIsAdmin
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-5">
        {/* LOGO */}
        <Link href="/">
          <span className="text-xl font-black tracking-tighter">
            FSW BARBER
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* BOTÃO ADMIN CONDICIONAL */}
          {isAdmin && (
            <Button asChild variant="outline">
              <Link href="/admin">
                <UserIcon size={16} className="mr-2" />
                Admin
              </Link>
            </Button>
          )}

          {/* MENU HAMBÚRGUER */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <MenuIcon size={16} />
              </Button>
            </SheetTrigger>
            <SidebarSheet />
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
