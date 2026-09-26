"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createReview } from "@/_actions/create-review"

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  if (sent) return <p className="my-3 text-sm">Avaliação enviada. Obrigado!</p>
  return (
    <form
      className="my-4 space-y-3 rounded-md border p-4"
      onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setPending(true)
        try {
          const result = await createReview(data)
          if (result.success) {
            setSent(true)
            router.refresh()
          } else toast.error(result.error)
        } catch {
          toast.error("Não foi possível enviar a avaliação.")
        } finally {
          setPending(false)
        }
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <Label htmlFor={`rating-${bookingId}`}>Como foi o atendimento?</Label>
      <select
        id={`rating-${bookingId}`}
        name="rating"
        required
        defaultValue=""
        className="w-full rounded-md border bg-background p-2"
      >
        <option value="" disabled>
          Escolha uma nota
        </option>
        {[1, 2, 3, 4, 5].map((rating) => (
          <option key={rating} value={rating}>
            {rating} {rating === 1 ? "estrela" : "estrelas"}
          </option>
        ))}
      </select>
      <Label htmlFor={`comment-${bookingId}`}>Comentário (opcional)</Label>
      <Textarea id={`comment-${bookingId}`} name="comment" maxLength={1000} />
      <p className="text-xs text-muted-foreground">
        Seu nome, nota e comentário serão públicos na página da barbearia.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  )
}
