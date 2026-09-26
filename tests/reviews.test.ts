import { expect, test, vi } from "vitest"
vi.mock("@/_lib/prisma", () => ({ db: {} }))
import { comparePopularity, withRatings } from "@/_data/reviews"

test("popularity ranks by real rating, count and stable name tie-break", () => {
  const shops = [
    { id: "1", name: "Z", averageRating: null, reviewCount: 0 },
    { id: "2", name: "A", averageRating: 4, reviewCount: 100 },
    { id: "3", name: "B", averageRating: 5, reviewCount: 1 },
    { id: "4", name: "C", averageRating: 5, reviewCount: 2 },
  ]
  expect(shops.sort(comparePopularity).map((s) => s.id)).toEqual([
    "4",
    "3",
    "2",
    "1",
  ])
})
test("empty search needs no review query", async () => {
  expect(await withRatings([])).toEqual([])
})
