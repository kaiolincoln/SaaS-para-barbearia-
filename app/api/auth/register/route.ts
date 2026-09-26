import { NextResponse } from "next/server"
import { db } from "@/_lib/prisma"
import { hash } from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(8)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Senha deve ter no máximo 72 bytes.",
    ),
  telefone: z
    .string()
    .trim()
    .regex(/^[+\d() .-]{8,25}$/)
    .optional(),
})

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      {
        message:
          "Dados inválidos. Informe nome, e-mail válido, senha de 8 a 72 bytes e telefone válido.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  const { name, email, password, telefone } = parsed.data
  try {
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json(
        { message: "Este e-mail já está em uso." },
        { status: 409 },
      )
    }
    const user = await db.user.create({
      data: { name, email, password: await hash(password, 10), tell: telefone },
      select: { id: true, name: true, email: true },
    })
    return NextResponse.json(
      { message: "Usuário registrado com sucesso!", user },
      { status: 201 },
    )
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Este e-mail já está em uso." },
        { status: 409 },
      )
    }
    console.error(error)
    return NextResponse.json(
      { message: "Ocorreu um erro no servidor." },
      { status: 500 },
    )
  }
}
