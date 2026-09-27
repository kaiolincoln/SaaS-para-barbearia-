"use client"

import { useState } from "react"
import { BarbershopService, Professional } from "@prisma/client"
import { toast } from "sonner"
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
import { deleteService } from "@/_actions/delete-service"
import { Loader2 } from "lucide-react"
import { EditServiceForm } from "./edit-service-form"

interface ServiceListItemProps {
  service: BarbershopService & {
    professionals?: Professional[]
  }
  barbershopProfessionals: Professional[]
}

export const ServiceListItem = ({
  service,
  barbershopProfessionals,
}: ServiceListItemProps) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const handleDeleteClick = async () => {
    setIsDeleteLoading(true)
    try {
      const result = await deleteService(service.id)

      if (result.success) {
        toast.success("Serviço removido com sucesso!")
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.")
      console.error(error)
    } finally {
      setIsDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t py-4">
      <div>
        <p className="font-semibold">{service.name}</p>
        <p className="text-sm text-muted-foreground">
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(service.price))}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {service.durationMinutes} minutos
        </p>
      </div>
      <div className="flex gap-2">
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </SheetTrigger>
          <SheetContent className="p-5">
            <SheetHeader className="mb-6">
              <SheetTitle>Editar Serviço</SheetTitle>
            </SheetHeader>
            <EditServiceForm
              service={service}
              barbershopProfessionals={barbershopProfessionals}
              onClose={() => setIsEditSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleteLoading}>
              Remover
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%]">
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Serviço</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o serviço &quot;{service.name}
                &quot;? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="mt-0 w-full">
                Voltar
              </AlertDialogCancel>
              <AlertDialogAction
                className="w-full"
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
