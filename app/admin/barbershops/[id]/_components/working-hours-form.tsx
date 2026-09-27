"use client"

import { useState } from "react"
import { WorkingHours } from "@prisma/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateWorkingHours } from "@/_actions/update-working-hours"
import { Loader2 } from "lucide-react"

interface WorkingHoursFormProps {
  barbershopId: string
  initialData: WorkingHours[] // Os dados que já existem no banco
}

// Componente para uma única linha do formulário (um dia da semana)
const DayRow = ({
  dayIndex,
  dayName,
  barbershopId,
  initialDayData,
}: {
  dayIndex: number
  dayName: string
  barbershopId: string
  initialDayData?: WorkingHours
}) => {
  const [isOpen, setIsOpen] = useState(initialDayData?.isOpen ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await updateWorkingHours(formData)

      if (result.success) {
        toast.success(`Horário de ${dayName} salvo com sucesso!`)
      } else {
        throw new Error(result.error || "Falha ao salvar.")
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Erro ao salvar horário de ${dayName}.`,
      )
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="grid grid-cols-1 items-end gap-4 border-t py-4 sm:grid-cols-[1fr_auto_auto]"
    >
      {/* Inputs ocultos para enviar dados fixos */}
      <input type="hidden" name="barbershopId" value={barbershopId} />
      <input type="hidden" name="dayOfWeek" value={dayIndex} />
      <input type="hidden" name="isOpen" value={String(isOpen)} />

      <div className="flex flex-1 items-center gap-3">
        <Checkbox
          id={`is-open-${dayIndex}`}
          checked={isOpen}
          onCheckedChange={(checked) => setIsOpen(Boolean(checked))}
        />
        <Label htmlFor={`is-open-${dayIndex}`} className="w-20 font-semibold">
          {dayName}
        </Label>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`start-time-${dayIndex}`} className="text-xs">
            Início
          </Label>
          <Input
            id={`start-time-${dayIndex}`}
            name="startTime"
            type="time"
            defaultValue={initialDayData?.startTime ?? "09:00"}
            disabled={!isOpen}
            required={isOpen}
            className="w-full min-w-0 sm:w-28"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`end-time-${dayIndex}`} className="text-xs">
            Fim
          </Label>
          <Input
            id={`end-time-${dayIndex}`}
            name="endTime"
            type="time"
            defaultValue={initialDayData?.endTime ?? "18:00"}
            disabled={!isOpen}
            required={isOpen}
            className="w-full min-w-0 sm:w-28"
          />
        </div>
      </div>

      <Button
        variant="outline"
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </Button>
    </form>
  )
}

// Componente principal que renderiza todas as linhas
export const WorkingHoursForm = ({
  barbershopId,
  initialData,
}: WorkingHoursFormProps) => {
  const daysOfWeek = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ]

  return (
    <div className="space-y-3">
      {daysOfWeek.map((dayName, index) => {
        const initialDayData = initialData.find((d) => d.dayOfWeek === index)
        return (
          <DayRow
            key={index}
            dayIndex={index}
            dayName={dayName}
            barbershopId={barbershopId}
            initialDayData={initialDayData}
          />
        )
      })}
    </div>
  )
}
