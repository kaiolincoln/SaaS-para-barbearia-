"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { completeBooking } from "@/_actions/complete-booking"

export default function CompleteBookingButton({
  bookingId,
}: {
  bookingId: string
}) {
  const [pending, setPending] = useState(false)
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        try {
          const result = await completeBooking(bookingId)
          if (result.success) toast.success("Reserva finalizada.")
          else toast.error(result.error)
        } catch {
          toast.error("Não foi possível finalizar a reserva.")
        } finally {
          setPending(false)
        }
      }}
    >
      {pending ? "Finalizando..." : "Finalizar atendimento"}
    </Button>
  )
}
