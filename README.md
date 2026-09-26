# SaaS para Barbearia

Aplicação de serviços e agendamentos iniciada no bootcamp Full Stack Club e ampliada localmente com profissionais, horários de funcionamento e administração.

Consulte [CONTEXTO.md](./CONTEXTO.md) para o mapa do código, arquitetura, regras de negócio, permissões, configuração e pendências conhecidas.

## Problema e solução

Clientes precisam escolher um serviço e um profissional disponível. A barbearia precisa organizar seu expediente e acompanhar reservas. O projeto utiliza Next.js com Server Actions, autenticação NextAuth e persistência relacional com Prisma e PostgreSQL.

## Decisões técnicas

- A versão local utiliza Next.js 14, React 18, TypeScript e Tailwind CSS. Ela difere da versão pública consultada no GitHub.
- O modelo relaciona reservas, usuários, serviços e profissionais.
- O servidor valida data futura, expediente no fuso `America/Sao_Paulo`, intervalos de 30 minutos e vínculo entre profissional e serviço.
- Consulta de conflito e criação da reserva ocorrem em uma transação serializável. Conflitos de concorrência retornam uma orientação para atualizar e tentar novamente.
- A interface respeita os minutos de abertura/fechamento e verifica profissionais habilitados para o serviço.

## Instalação

Requisitos: Node.js 22.12+, npm e PostgreSQL exclusivo de desenvolvimento.

```bash
npm ci
npx prisma generate
```

Crie `.env` com as variáveis de `.env.example`. Use credenciais locais próprias. Depois:

```bash
npx prisma migrate dev
npm run dev
```

Acesse `http://localhost:3000`. Não execute o seed em um banco existente sem revisar `prisma/seed.ts`.

## Testes

```bash
npm test
npx tsc --noEmit
```

A suíte valida expediente, fuso, data futura, intervalos, autenticação, profissional habilitado, conflito e criação da reserva com o usuário da sessão. As operações de banco são simuladas: a concorrência real de PostgreSQL precisa de teste de integração antes da publicação.

## Resultado e limites

A versão local possui páginas de serviços, reservas e administração. As capturas disponíveis no portfólio ilustram a interface. Não há demo pública publicada nesta revisão.

Antes de uma demo pública:

- Revisar autorização de todas as Server Actions administrativas. Por exemplo, `update-working-hours.ts` ainda precisa validar sessão e propriedade da barbearia.
- A interface de datas utiliza o fuso do navegador; o servidor aplica São Paulo. Unificar a seleção para visitantes em outros fusos.
- Agendamentos assumem duração fixa de 30 minutos. Serviços com durações diferentes exigem modelagem adicional.
- O login Google usa PrismaAdapter, mas o schema local não contém todos os modelos padrão do adapter. Validar esse fluxo ou mantê-lo desativado antes de anunciá-lo.
- Revisar dependências e usar somente dados fictícios no ambiente de demonstração.

As alterações locais já existentes foram preservadas. A publicação exige sincronizar esta versão com o repositório e configurar hospedagem, banco e autenticação; nenhuma dessas operações foi executada automaticamente.
