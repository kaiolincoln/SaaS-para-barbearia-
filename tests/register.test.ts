import { beforeEach, expect, test, vi } from "vitest"
const m = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), hash: vi.fn() }))
vi.mock("@/_lib/prisma", () => ({ db: { user: { findUnique: m.find, create: m.create } } }))
vi.mock("bcryptjs", () => ({ hash: m.hash }))
import { POST } from "@/api/auth/register/route"
const valid = { name: "Cliente", email: "cliente@example.com", password: "abcdefgh", telefone: "(11) 99999-9999" }
const request = (data: unknown) => new Request("http://localhost/api/auth/register", { method: "POST", body: JSON.stringify(data) })
beforeEach(() => { vi.resetAllMocks(); m.find.mockResolvedValue(null); m.hash.mockResolvedValue("hash") })
test.each([{ name: " " }, { email: "bad" }, { password: "1234567" }, { password: "a".repeat(73) }, { telefone: "abc" }])("rejects invalid registration %j", async change => {
  expect((await POST(request({ ...valid, ...change }))).status).toBe(400)
  expect(m.create).not.toHaveBeenCalled()
})
test("invalid JSON returns 400", async () => {
  expect((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400)
})
test("persists phone and selects only public fields", async () => {
  m.create.mockResolvedValue({ id: "user", name: valid.name, email: valid.email })
  const response = await POST(request(valid))
  expect(response.status).toBe(201)
  expect(m.create).toHaveBeenCalledWith({ data: { name: valid.name, email: valid.email, password: "hash", tell: valid.telefone }, select: { id: true, name: true, email: true } })
  expect((await response.json()).user).toEqual({ id: "user", name: valid.name, email: valid.email })
})
test("concurrent duplicate email returns 409", async () => {
  m.create.mockRejectedValue({ code: "P2002" })
  expect((await POST(request(valid))).status).toBe(409)
})
