import { db } from "@/_lib/prisma"

export type RatingSummary = {
  averageRating: number | null
  reviewCount: number
}
export async function withRatings<T extends { id: string }>(
  shops: T[],
): Promise<(T & RatingSummary)[]> {
  if (!shops.length) return []
  const aggregates = await db.review.groupBy({
    by: ["barbershopId"],
    where: { barbershopId: { in: shops.map((shop) => shop.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const ratings = new Map(
    aggregates.map((item) => [
      item.barbershopId,
      { averageRating: item._avg.rating, reviewCount: item._count._all },
    ]),
  )
  return shops.map((shop) => ({
    ...shop,
    ...(ratings.get(shop.id) ?? { averageRating: null, reviewCount: 0 }),
  }))
}
export function comparePopularity(
  a: RatingSummary & { name: string; id: string },
  b: RatingSummary & { name: string; id: string },
) {
  return (
    (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
    b.reviewCount - a.reviewCount ||
    a.name.localeCompare(b.name, "pt-BR") ||
    a.id.localeCompare(b.id)
  )
}
