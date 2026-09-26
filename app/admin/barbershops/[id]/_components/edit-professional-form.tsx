"use client"

import { Professional } from "@prisma/client"
import { useFormState, useFormStatus } from "react-dom"
import { useEffect } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  editProfessional,
  EditProfessionalFormState,
} from "@/_actions/edit-professional"

interface EditProfessionalFormProps {
  professional: Professional
  onClose: () => void
}

const SubmitButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Alterações
    </Button>
  )
}

export const EditProfessionalForm = ({
  professional,
  onClose,
}: EditProfessionalFormProps) => {
  const initialState: EditProfessionalFormState = {
    success: false,
    error: null,
    fieldErrors: {},
  }

  const [state, formAction] = useFormState(editProfessional, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Profissional atualizado com sucesso!")
      onClose()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, onClose])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={professional.id} />
      <input
        type="hidden"
        name="barbershopId"
        value={professional.barbershopId}
      />

      <div>
        <Label htmlFor="name">Nome do Profissional</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={professional.name}
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="imageUrl">URL da Imagem (Opcional)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={professional.imageUrl ?? ""}
        />
        {state.fieldErrors?.imageUrl && (
          <p className="mt-1 text-xs text-foreground">
            {state.fieldErrors.imageUrl[0]}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
