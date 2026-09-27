import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  // 1. Limpa o banco de dados na ordem correta
  console.log("Limpando dados antigos...")
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.professional.deleteMany()
  await prisma.workingHours.deleteMany()
  await prisma.barbershopService.deleteMany()
  await prisma.barbershop.deleteMany()
  await prisma.user.deleteMany()
  console.log("Dados antigos limpos com sucesso.")

  const images = [
    "https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png",
    "https://utfs.io/f/45331760-899c-4b4b-910e-e00babb6ed81-16q.png",
    "https://utfs.io/f/5832df58-cfd7-4b3f-b102-42b7e150ced2-16r.png",
    "https://utfs.io/f/7e309eaa-d722-465b-b8b6-76217404a3d3-16s.png",
    "https://utfs.io/f/178da6b6-6f9a-424a-be9d-a2feb476eb36-16t.png",
    "https://utfs.io/f/2f9278ba-3975-4026-af46-64af78864494-16u.png",
  ]
  const creativeNames = [
    "Barbearia Vintage",
    "Corte & Estilo",
    "Barba & Navalha",
    "The Dapper Den",
    "Cabelo & Cia.",
    "Machado & Tesoura",
  ]
  const addresses = [
    "Rua da Barbearia, 123",
    "Avenida dos Cortes, 456",
    "Praça da Barba, 789",
    "Travessa da Navalha, 101",
    "Alameda dos Estilos, 202",
    "Estrada do Machado, 303",
  ]
  const servicesData = [
    {
      name: "Corte de Cabelo",
      description: "Estilo personalizado.",
      price: 60.0,
      imageUrl:
        "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
    },
    {
      name: "Barba",
      description: "Modelagem completa.",
      price: 40.0,
      imageUrl:
        "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
    },
    {
      name: "Pézinho",
      description: "Acabamento perfeito.",
      price: 35.0,
      imageUrl:
        "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
    },
  ]
  const phonesBarber = [
    ["(11) 99999-9999", "(11) 98888-8888"],
    ["(11) 97777-7777"],
    ["(11) 96666-6666"],
    ["(11) 95555-5555"],
    ["(11) 94444-4444", "(11) 93333-3333"],
    ["(11) 93333-3333"],
  ]

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin FSW",
      email: "admin@fsw.com",
      password: await hash("123456", 10),
    },
  })
  console.log(
    `Usuário admin '${adminUser.name}' criado. E-mail: admin@fsw.com, Senha: 123456`,
  )

  for (let i = 0; i < creativeNames.length; i++) {
    const barbershop = await prisma.barbershop.create({
      data: {
        name: creativeNames[i],
        address: addresses[i],
        imageUrl: images[i],
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        phones: phonesBarber[i],
        ownerId: adminUser.id,
      },
    })
    console.log(`Barbearia '${barbershop.name}' criada.`)

    // Cria serviços
    const createdServices = []
    for (const service of servicesData) {
      const createdService = await prisma.barbershopService.create({
        data: { ...service, barbershopId: barbershop.id },
      })
      createdServices.push(createdService)
    }
    console.log(`Serviços adicionados para '${barbershop.name}'.`)

    // Cria um profissional
    const professional = await prisma.professional.create({
      data: { name: `Barbeiro ${i + 1}`, barbershopId: barbershop.id },
    })
    console.log(`Profissional '${professional.name}' criado.`)

    // Cria um agendamento de exemplo
    if (i === 0) {
      const date = new Date(new Date().setDate(new Date().getDate() + 10))
      await prisma.booking.create({
        data: {
          userId: adminUser.id,
          serviceId: createdServices[0].id,
          priceAtBooking: createdServices[0].price,
          professionalId: professional.id,
          date,
          durationMinutes: createdServices[0].durationMinutes,
          endsAt: new Date(
            date.getTime() + createdServices[0].durationMinutes * 60_000,
          ),
        },
      })
      console.log(`Agendamento de exemplo criado.`)
    }
  }
}

main()
  .catch((e) => {
    console.error("Erro ao executar o seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
