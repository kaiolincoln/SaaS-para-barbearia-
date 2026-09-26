"use client";

import { useEffect } from "react";
import { BarbershopService, Professional } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { editService, FormState } from "@/_actions/edit-service";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface EditServiceFormProps {
  service: BarbershopService & {
    professionals?: Professional[]; 
  };
  barbershopProfessionals: Professional[]; 
  onClose: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Alterações
    </Button>
  );
}

export const EditServiceForm = ({ service, barbershopProfessionals, onClose }: EditServiceFormProps) => {
  const initialState: FormState = { success: false };
  const [state, formAction] = useFormState(editService, initialState);

  const associatedProfessionalIds = new Set(
    service.professionals?.map((p) => p.id) || []
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Serviço atualizado com sucesso!");
      onClose();
    } else if (state.error) {
      toast.error(state.error, {
        description: state.fieldErrors
          ? Object.values(state.fieldErrors).flat().join("\n")
          : undefined,
      });
    }
  }, [state, onClose]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={service.id} />

      {/* Campos de texto existentes */}
      <div>
        <Label htmlFor="name">Nome do Serviço</Label>
        <Input id="name" name="name" type="text" defaultValue={service.name} />
        {state.fieldErrors?.name && (
          <p className="text-red-500 text-xs mt-1">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={service.description} />
        {state.fieldErrors?.description && (
          <p className="text-red-500 text-xs mt-1">{state.fieldErrors.description[0]}</p>
        )}
      </div>
      <div>
        <Label htmlFor="price">Preço</Label>
        <Input id="price" name="price" type="number" step="0.01" defaultValue={Number(service.price)} />
        {state.fieldErrors?.price && (
          <p className="text-red-500 text-xs mt-1">{state.fieldErrors.price[0]}</p>
        )}
      </div>
      <div>
        <Label htmlFor="imageUrl">URL da Imagem</Label>
        <Input id="imageUrl" name="imageUrl" type="url" defaultValue={service.imageUrl} />
        {state.fieldErrors?.imageUrl && (
          <p className="text-red-500 text-xs mt-1">{state.fieldErrors.imageUrl[0]}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Profissionais que realizam este serviço</Label>
        <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
          {barbershopProfessionals.length > 0 ? (
            barbershopProfessionals.map((prof) => (
              <div key={prof.id} className="flex items-center gap-2">
                <Checkbox
                  id={`edit-prof-${prof.id}`}
                  name="professionalIds"
                  value={prof.id}
                  defaultChecked={associatedProfessionalIds.has(prof.id)}
                />
                <Label htmlFor={`edit-prof-${prof.id}`} className="font-normal">
                  {prof.name}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">Nenhum profissional cadastrado.</p>
          )}
        </div>
        {state.fieldErrors?.professionalIds && (
          <p className="text-red-500 text-xs mt-1">{state.fieldErrors.professionalIds[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
};
