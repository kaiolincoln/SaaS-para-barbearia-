// app/layout.tsx (Versão Limpa e Correta)

import type { Metadata } from "next"
import { Archivo } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import Footer from "@/_components/ui/footer"
import AuthProvider from "@/_providers/auth"

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FSW Barber", // Mudei o título para algo mais relevante
  description: "Encontre as melhores barbearias perto de você!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${archivo.className} ${archivo.variable} bg-background text-foreground`}
      >
        <AuthProvider>
          <div className="flex h-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "none",
            },
          }}
        />
      </body>
    </html>
  )
}
