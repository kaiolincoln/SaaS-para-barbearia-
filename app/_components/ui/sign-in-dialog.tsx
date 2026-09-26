"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"


const SignInDialog = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLoginWithGoogleClick = () => signIn("google")

  const handleLoginWithCredentials = () => {
    signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Faça login na plataforma</DialogTitle>
        <DialogDescription>
          Conecte-se usando sua conta do Google ou suas credenciais.
        </DialogDescription>
      </DialogHeader>

      {/* Login com Credenciais */}
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="email@exemplo.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="********" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <Button onClick={handleLoginWithCredentials} className="w-full font-bold">
          Entrar
        </Button>

        <p>Nao tem conta? <Link href={"/signup"} className="text-sky-500"> Entra aqui </Link> </p>
      </div>

      <Separator />

      {/* Login com Google (Sua lógica original) */}
      <Button
        variant="outline"
        className="gap-1 font-bold"
        onClick={handleLoginWithGoogleClick}
      >
        <Image
          alt="Fazer login com o Google"
          src="/google.svg"
          width={18}
          height={18}
        />
        Google
      </Button>
    </>
  )
}

export default SignInDialog