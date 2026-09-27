"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerPayment } from "@/_actions/register-payment"
import { paymentMethodLabels } from "@/_lib/financial"

export default function PaymentControl({
  bookingId,
  price,
  paidAmount,
  paymentMethod,
  paidAt = "",
}: {
  bookingId: string
  price: string
  paidAmount: string | null
  paymentMethod: string | null
  paidAt?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const paid = paidAmount !== null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        className={
          paid
            ? "bg-secondary text-foreground/75"
            : "bg-primary text-xl font-bold text-primary-foreground"
        }
      >
        {paid ? "Pago" : "Pagamento pendente"}
      </Badge>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={paid ? "outline" : "default"}
            className="h-auto whitespace-normal"
          >
            {paid ? "Corrigir pagamento" : "Registrar pagamento"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {paid ? "Corrigir pagamento" : "Registrar pagamento"}
            </DialogTitle>
            <DialogDescription>
              {paid
                ? "Você está substituindo o registro existente. Valor, forma e data anteriores serão sobrescritos."
                : "Registre o valor efetivamente recebido. Este formulário não realiza uma cobrança."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              setPending(true)
              try {
                const result = await registerPayment(data)
                if (result.success) {
                  toast.success("Pagamento registrado.")
                  setOpen(false)
                  router.refresh()
                } else toast.error(result.error)
              } catch {
                toast.error("Não foi possível registrar o pagamento.")
              } finally {
                setPending(false)
              }
            }}
          >
            <input type="hidden" name="bookingId" value={bookingId} />
            <div className="space-y-2">
              <Label htmlFor={`amount-${bookingId}`}>Valor recebido (R$)</Label>
              <Input
                id={`amount-${bookingId}`}
                name="paidAmount"
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                defaultValue={paidAmount ?? price}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`method-${bookingId}`}>Forma de pagamento</Label>
              <select
                id={`method-${bookingId}`}
                name="paymentMethod"
                defaultValue={paymentMethod ?? ""}
                required
                className="h-11 w-full rounded-md border bg-card px-3"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`paid-at-${bookingId}`}>
                Data e hora em São Paulo
              </Label>
              <Input
                id={`paid-at-${bookingId}`}
                name="paidAt"
                type="datetime-local"
                defaultValue={paidAt}
              />
              <p className="text-sm text-foreground/75">
                Deixe vazio para usar o momento do registro.
              </p>
            </div>
            <Button disabled={pending} type="submit" className="w-full">
              {pending ? "Salvando..." : "Salvar pagamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
