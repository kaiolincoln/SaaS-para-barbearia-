import { expect, test, vi } from "vitest"
vi.mock("@/_lib/prisma", () => ({ db: {} }))
import { authOptions } from "@/_lib/auth"

test("authentication advertises only the implemented credentials provider", () => {
  expect(authOptions.providers.map((provider) => provider.id)).toEqual([
    "credentials",
  ])
  expect(authOptions.adapter).toBeUndefined()
  expect(authOptions.session?.strategy).toBe("jwt")
})
