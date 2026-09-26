import { revalidatePath } from "next/cache"
export function revalidateBarbershop(id: string) {
  for (const path of ["/", "/barbershops", "/bookings", "/admin", `/barbershops/${id}`, `/admin/barbershops/${id}`]) revalidatePath(path)
}
