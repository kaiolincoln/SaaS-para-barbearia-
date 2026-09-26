// CAMINHO: app/admin/barbershops/[id]/_components/add-service-form.tsx

"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Professional } from "@prisma/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" // Usar Textarea para descrição
import { Checkbox } from "@/components/ui/checkbox" // Importar Checkbox
import { addService, AddServiceFormState } from "@/_actions/add-service"

interface AddServiceFormProps {
  barbershopId: string
  professionals: Professional[] // Aceitar a lista de profissionais
  onClose: () => void
}

const SubmitButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Serviço
    </Button>
  )
}

export const AddServiceForm = ({
  barbershopId,
  professionals,
  onClose,
}: AddServiceFormProps) => {
  const initialState: AddServiceFormState = { success: false }
  const [state, formAction] = useFormState(addService, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Serviço adicionado com sucesso!")
      onClose()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, onClose])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="barbershopId" value={barbershopId} />

      {/* Campos do formulário */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Serviço</Label>
        <Input id="name" name="name" type="text" />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" />
        {state.fieldErrors?.description && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preço</Label>
        <Input id="price" name="price" type="number" step="0.01" />
        {state.fieldErrors?.price && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.price[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="durationMinutes">Duração (minutos)</Label>
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={30}
          max={720}
          step={30}
          defaultValue={30}
          required
        />
        {state.fieldErrors?.durationMinutes && (
          <p className="text-xs text-foreground">
            {state.fieldErrors.durationMinutes[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL da Imagem (Opcional)</Label>
        <Input id="imageUrl" name="imageUrl" type="url" />
        {state.fieldErrors?.imageUrl && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.imageUrl[0]}
          </p>
        )}
      </div>

      {/* ✅ NOVA SEÇÃO: Seleção de Profissionais */}
      <div className="space-y-3">
        <Label>Profissionais que realizam este serviço</Label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
          {professionals.length > 0 ? (
            professionals.map((prof) => (
              <div key={prof.id} className="flex items-center gap-2">
                <Checkbox
                  id={`prof-${prof.id}`}
                  name="professionalIds"
                  value={prof.id}
                />
                <Label htmlFor={`prof-${prof.id}`} className="font-normal">
                  {prof.name}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum profissional cadastrado.
            </p>
          )}
        </div>
        {state.fieldErrors?.professionalIds && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.professionalIds[0]}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}
