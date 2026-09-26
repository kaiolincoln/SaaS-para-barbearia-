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
npm run lint
npm run build
```

A suíte cobre agenda no fuso de São Paulo, permissões, cadastro e privacidade. Há testes adicionais com PostgreSQL real para concorrência e exclusão transacional. Consulte [o relatório de validação](docs/VALIDACAO-ONDAS-1-3.md) para reproduzir migrations e integração em banco descartável.

## Resultado e limites

A versão local possui páginas de serviços, reservas e administração. As capturas disponíveis no portfólio ilustram a interface. Não há demo pública publicada nesta revisão.

As correções das Ondas 1–3 unificam autorização por proprietário/SUPER_ADMIN, limitam os dados públicos de disponibilidade e usam São Paulo em toda a agenda. O login disponível é por e-mail/senha; a opção Google incompleta foi removida.

Limites: reservas duram 30 minutos, exclusões administrativas podem apagar histórico passado, e o seed exige revisão antes de uso. Atualização de dependências e preparação de dados demonstrativos continuam pendentes. Nenhuma migration foi aplicada ao banco Neon nesta revisão; valide divergências de schema/histórico antes de atualizar uma base existente.
