"use client"

import { Professional } from "@prisma/client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { deleteProfessional } from "@/_actions/delete-professional"
import { EditProfessionalForm } from "./edit-professional-form"

interface ProfessionalListItemProps {
  professional: Professional
  barbershopId: string
}

export const ProfessionalListItem = ({
  professional,
  barbershopId,
}: ProfessionalListItemProps) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const handleDeleteClick = async () => {
    setIsDeleteLoading(true)
    try {
      // ✅ 2. Usar o barbershopId recebido via props
      const result = await deleteProfessional(professional.id, barbershopId)

      if (result.success) {
        toast.success("Profissional removido com sucesso!")
      } else {
        toast.error(result.error || "Erro ao remover profissional.")
      }
    } catch {
      toast.error(
        "Ocorreu um erro inesperado ao tentar remover o profissional.",
      )
    } finally {
      setIsDeleteLoading(false)
    }
  }

  // O resto do seu JSX continua o mesmo...
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Image
          src={professional.imageUrl || "/user-placeholder.png"}
          alt={professional.name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <span className="font-semibold">{professional.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="mb-6">
              <SheetTitle>Editar Profissional</SheetTitle>
            </SheetHeader>
            <EditProfessionalForm
              professional={professional}
              onClose={() => setIsEditSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Remover
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Profissional</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover &quot;{professional.name}&quot;?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClick}
                disabled={isDeleteLoading}
              >
                {isDeleteLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
