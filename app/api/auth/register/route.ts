import { NextResponse } from 'next/server';
import { db } from '@/_lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Este e-mail já está em uso." }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "Usuário registrado com sucesso!", user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ message: "Ocorreu um erro no servidor." }, { status: 500 });
  }
}