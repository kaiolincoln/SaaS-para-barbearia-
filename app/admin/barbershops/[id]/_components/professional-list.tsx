"use client"

import { useState } from "react"
import { Professional } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addProfessional } from "@/_actions/add-professional"
import { toast } from "sonner"
import { ProfessionalListItem } from "./professional-list-item"

interface ProfessionalListProps {
  professionals: Professional[]
  barbershopId: string
}

export const ProfessionalList = ({
  professionals,
  barbershopId,
}: ProfessionalListProps) => {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = await addProfessional(formData)

    if (result.success) {
      toast.success("Profissional adicionado com sucesso!")
      setIsAddSheetOpen(false)
    } else {
      toast.error(result.error || "Erro ao adicionar profissional.")
    }
  }

  return (
    <div className="rounded-md border p-4">
      {/* --- Seção para Adicionar Profissional (Mantida) --- */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profissionais Cadastrados</h2>
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button>Adicionar Profissional</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="mb-6">
              <SheetTitle>Adicionar Novo Profissional</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <input type="hidden" name="barbershopId" value={barbershopId} />
              <div>
                <Label htmlFor="name">Nome do Profissional</Label>
                <Input id="name" name="name" type="text" required />
              </div>
              <div>
                <Label htmlFor="imageUrl">URL da Foto (Opcional)</Label>
                <Input id="imageUrl" name="imageUrl" type="url" />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* --- Seção para Listar os Profissionais (Corrigida) --- */}
      <div className="space-y-3">
        {professionals.length > 0 ? (
          professionals.map((professional) => (
            <ProfessionalListItem
              key={professional.id}
              professional={professional}
              barbershopId={barbershopId}
            />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum profissional cadastrado.
          </p>
        )}
      </div>
    </div>
  )
}
