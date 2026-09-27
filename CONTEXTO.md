# Contexto do projeto — FSW Barber

Documento de referência para manutenção e futuras tarefas de desenvolvimento. Análise do código local em 26/09/2026; descreve a implementação encontrada, incluindo funcionalidades incompletas e problemas conhecidos.

## 1. Produto e escopo atual

Aplicação de descoberta de barbearias e agendamento de serviços, iniciada no bootcamp Full Stack Club e ampliada com profissionais, expediente e administração. Interface em português brasileiro, valores em reais e identidade escura de estúdio: ink (#1B1B1D), bone (#EDEAE4), superfície (#242426), cinza quente (#8A8680) e tattoo-red (#C4402D) reservado a interação.

O cliente pesquisa uma barbearia, escolhe serviço, dia, horário e profissional, confirma a reserva e consulta ou cancela seus agendamentos. O proprietário tem um painel com serviços, profissionais, expediente e histórico de reservas; finaliza manualmente atendimentos confirmados após o término.

Onda 4.2: reservas possuem status persistido e cancelamento sem exclusão. Onda 4.3: serviços têm duração configurável em passos de 30 minutos (30–720), considerada na disponibilidade. Onda 4.4: clientes avaliam uma vez cada reserva concluída, com nota 1–5 e comentário opcional de até 1000 caracteres. Notas e contagem vêm do banco; “Populares” ordena por média decrescente, contagem decrescente, nome e ID para desempate. Sem avaliações, mostra indicação explícita.

Não há implementação de pagamentos, assinaturas SaaS, geolocalização ou cadastro funcional de barbearias pela interface. Notificações (4.5) e recuperação de senha (4.6) foram dispensadas explicitamente pelo usuário nesta etapa. O mapa é a imagem estática `public/map.png`.

## 2. Stack e organização

Versões declaradas em `package.json` (os intervalos não representam necessariamente a versão exata instalada): Next.js `^14.2.32`, React 18, TypeScript 5, Prisma Client `^5.22.0`, CLI Prisma `^5.17.0`, PostgreSQL, NextAuth `^4.24.11`, Tailwind CSS 3, Zod 3, React Hook Form 7 e Vitest 3. Componentes locais seguem o padrão shadcn/ui, com primitivas Radix e ícones Lucide.

| Caminho                                   | Responsabilidade                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `app/page.tsx` e pastas de rotas          | Páginas do App Router; consultas predominantemente no servidor                      |
| `app/_actions/`                           | Mutações e consultas chamadas pela interface                                        |
| `app/_data/`                              | Reservas futuras e passadas do usuário autenticado                                  |
| `app/_lib/auth.ts`                        | Providers, callbacks JWT e sessão NextAuth                                          |
| `app/_lib/prisma.ts`                      | Instância `db`, reaproveitada globalmente em desenvolvimento                        |
| `app/_lib/booking-time.ts`                | Validação temporal das reservas                                                     |
| `app/_lib/utils.ts`                       | `cn`: composição de classes com clsx e tailwind-merge                               |
| `app/_components/ui/`                     | Componentes de negócio: reserva, busca, navegação e login                           |
| `app/components/ui/`                      | Primitivas visuais reutilizáveis: botão, formulário, sheet, dialog, calendário etc. |
| `app/admin/barbershops/[id]/_components/` | Formulários e listas administrativos                                                |
| `app/_providers/auth.tsx`                 | SessionProvider do cliente                                                          |
| `app/types/next-auth.d.ts`                | Extensões de tipos da sessão, usuário e JWT                                         |
| `app/_constants/search.ts`                | Categorias e ícones da busca rápida                                                 |
| `app/hooks/use-toast.ts`                  | Estado do toast Radix; o layout utiliza o Toaster do Sonner                         |
| `prisma/schema.prisma`                    | Modelo de dados de referência                                                       |
| `prisma/migrations/`                      | Histórico SQL de evolução do banco                                                  |
| `prisma/seed.ts`                          | Limpeza e carga de dados demonstrativos                                             |
| `tests/`                                  | Testes unitários de agenda, autorização e cadastro; integração PostgreSQL separada  |
| `public/`                                 | Logo, banner, mapa e ícones                                                         |
| `app/generated/prisma/`                   | Artefatos gerados antigos; a aplicação importa `@prisma/client`                     |

O alias `@/*` aponta para `app/*`, não para a raiz. O layout carrega Archivo via `next/font/google`, CSS global, AuthProvider, Footer e Sonner. O tema é fixado por `className="dark"`; as cores estão em `app/globals.css`.

## 3. Rotas

| Rota                       | Comportamento e acesso atual                                                        |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `/`                        | Pública; busca, categorias, barbearias e reservas futuras da sessão                 |
| `/barbershops?title=...`   | Busca por nome, usando `contains` sem distinção de maiúsculas                       |
| `/barbershops?service=...` | Busca pelo nome dos serviços associados; filtros combinados por `OR`                |
| `/barbershops/[id]`        | Pública; detalhes, serviços, profissionais e expediente; ID inexistente retorna 404 |
| `/bookings`                | Reservas do usuário; visitante sem sessão recebe 404                                |
| `/signup`                  | Formulário cliente, cadastro e login automático por credenciais                     |
| `/admin`                   | Lista barbearias próprias; SUPER_ADMIN lista todas                                  |
| `/admin/barbershops/[id]`  | Exige helper de acesso antes de consultar dados sensíveis; permite SUPER_ADMIN      |
| `/api/auth/[...nextauth]`  | GET/POST do NextAuth                                                                |
| `/api/auth/register`       | POST de cadastro por nome, e-mail e senha                                           |

O botão “Cadastrar minha barbearia” não possui ação. O botão Admin aparece para proprietários e SUPER_ADMIN.

## 4. Modelo de dados

| Modelo              | Campos e relações relevantes                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `User`              | UUID, e-mail único, nome obrigatório, senha opcional, `tell`, imagem e role; possui barbearias e reservas            |
| `Barbershop`        | Proprietário obrigatório, nome, endereço, telefones, descrição e imagem; possui serviços, profissionais e expediente |
| `BarbershopService` | Pertence a uma barbearia; preço Decimal(10,2); profissionais em relação muitos-para-muitos                           |
| `Professional`      | Pertence a uma barbearia; nome e imagem opcional; atende serviços e recebe reservas                                  |
| `WorkingHours`      | Um registro por barbearia/dia; `dayOfWeek` de 0 (domingo) a 6 (sábado), `isOpen`, início e fim como strings HH:mm    |
| `Booking`           | Usuário, serviço, profissional, instante da reserva e timestamps; todos os vínculos são obrigatórios                 |

Papéis: `USER` (padrão), `BARBERSHOP_ADMIN` e `SUPER_ADMIN`. A propriedade é representada por `Barbershop.ownerId`; não existe `barbershopId` no modelo User.

Onda 4.2: Booking.status é enum CONFIRMED (default), COMPLETED ou CANCELLED. Reservas antigas ficam CONFIRMED; não se presume atendimento realizado pela data. Só o titular cancela uma reserva CONFIRMED; proprietário/SUPER_ADMIN pode finalizá-la após endsAt. Status terminais não voltam a confirmado.

Onda 4.3: BarbershopService.durationMinutes e Booking.durationMinutes têm default 30. A reserva guarda a duração e endsAt como snapshot; editar o serviço não altera o histórico. A migration preenche endsAt das reservas antigas com date + 30 minutos e impõe CHECK de duração/intervalo. Novas escritas devem enviar endsAt coerente, mesmo havendo default SQL.

Onda 4.4: Review possui bookingId único, userId, barbershopId, rating (CHECK 1–5), comment opcional e createdAt. As FKs restringem exclusão; a action centraliza autorização pelo titular de reserva COMPLETED. Não existem avaliações automáticas ou valores fictícios.

Não há preço histórico nem pagamento. Receita futura considera apenas CONFIRMED no futuro, somando preços atuais; não representa receita recebida.

O banco não impõe unicidade de profissional/horário nem a igualdade de barbearia entre profissional e serviço na relação muitos-para-muitos. As chaves estrangeiras das reservas restringem exclusões de registros relacionados.

As doze migrations incluem `20260926173717_add_user_image`, gerada com `prisma migrate dev` em PostgreSQL 16 descartável. Todas foram aplicadas por `migrate deploy` em outro banco vazio, e `migrate diff` não encontrou diferença em relação ao schema. Algumas migrations antigas adicionam colunas obrigatórias sem padrão: bases existentes precisam de reconciliação prévia, sem reset automático. Nenhuma migration foi aplicada ao Neon nesta tarefa. Se `image` já existir por alteração manual, comparar o schema e o histórico antes de aplicar/resolver a nova migration.

## 5. Fluxo de agendamento

1. A página da barbearia carrega serviços com profissionais vinculados e expediente.
2. `service-item.tsx` controla o sheet de reserva e os estados de dia, horário, profissional e envio. Visitantes recebem a opção de login.
3. Ao selecionar o dia, `getDayBookings` consulta reservas de todos os serviços da barbearia nesse dia.
4. A interface gera horários em passos de 30 minutos, arredonda a abertura para a próxima meia hora e exige espaço para terminar antes do fechamento. Exibe horários com ao menos um profissional habilitado livre.
5. O cliente escolhe o profissional e envia `{ serviceId, professionalId, date }` para `createBooking`.
6. O servidor exige sessão e usa uma transação serializável para carregar o serviço, conferir o vínculo do profissional, validar a data, procurar conflitos e gravar com o `userId` da sessão.
7. A consulta considera somente CONFIRMED do mesmo profissional com date < novo endsAt e endsAt > novo início. Intervalos são semiabertos; reservas adjacentes são permitidas.
8. Erro Prisma `P2034` vira orientação para atualizar e tentar novamente. Não há repetição automática. Sucesso revalida home, busca, reservas e rotas específicas pública/administrativa da barbearia.

`validateBookingTime` exige data válida e futura, expediente aberto em `America/Sao_Paulo`, início dentro do expediente, duração configurada no serviço, minutos múltiplos de 30 e segundos/milissegundos zerados. Dia sem configuração é indisponível. Não há suporte a expediente que atravessa a meia-noite, pausas, feriados ou agenda individual do profissional.

### Onda 2 — expediente e fuso (implementada)

`booking-time.ts` centraliza America/Sao_Paulo usando date-fns-tz 3. Dias civis são strings YYYY-MM-DD, convertidos em instantes UTC somente por `bookingInstant`. Consultas usam intervalo semiaberto [meia-noite de São Paulo, meia-noite seguinte). O calendário usa Date local apenas para seu rótulo de dia; nunca envia esse Date como instante. Geração de horários, conflitos e formatação de reservas/home/painel usam os helpers compartilhados. Testes rodaram tanto com TZ=UTC quanto TZ=Asia/Tokyo: 67 aprovados em cada execução.

A interface espera a disponibilidade do dia corrente, descarta respostas atrasadas e bloqueia confirmação com seleção indisponível. O servidor continua sendo a autoridade final. Erros de reserva são mostrados ao usuário e provocam nova consulta. A criação restringe explicitamente os campos gravados e confere também a barbearia do profissional, protegendo contra vínculos antigos inconsistentes.

Expediente fechado aceita ausência de horários: preserva os existentes em update e usa 09:00/18:00 somente ao criar registro fechado. Aberto exige HH:mm, início anterior ao fim, dia inteiro de 0 a 6. O formulário mantém inputs desabilitados quando fechado e obrigatórios quando aberto. Não há agenda noturna ou feriados.

`getConfirmedBookings` e `getConcludedBookings` filtram pelo usuário da sessão, incluem serviço/barbearia e ordenam por data crescente. O profissional não é incluído nesses resumos. As páginas serializam reservas via JSON antes de enviá-las a `BookingItem`, embora seus tipos ainda descrevam Date/Decimal do Prisma.

## 6. Autenticação e permissões

Credenciais usam `bcryptjs.compare`; cadastro usa `bcryptjs.hash` com custo 10. NextAuth usa estratégia JWT, copia ID e role para o token e depois para a sessão. O papel fica no token; alterações no banco não são reconsultadas em toda requisição.

GoogleProvider e PrismaAdapter foram removidos da configuração, da interface e das dependências do adapter na Onda 3. O único login oferecido é por e-mail/senha. Não foram adicionados modelos OAuth, pois isso ampliaria o escopo; futuras integrações precisam de schema e testes próprios.

### Onda 1 — autorização e privacidade (implementada)

`requireBarbershopAccess` é a fonte única das permissões administrativas: sessão com ID e role reconhecida, barbearia existente, proprietário (`ownerId`) ou SUPER_ADMIN. Um proprietário com role USER também pode administrar sua barbearia, conforme a regra de propriedade; BARBERSHOP_ADMIN sem propriedade é rejeitado. IDs de barbearia informados pelo cliente não bastam para autorizar recursos de outra barbearia.

| Operação                        | Regra implementada                                                                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| add/edit/delete de serviço      | Helper; criação/edição validam todos os profissionais da mesma barbearia dentro de transação serializável                                                                           |
| add/edit/delete de profissional | Helper e vínculo do profissional com a barbearia; edição é Server Action                                                                                                            |
| updateWorkingHours              | Helper antes da escrita                                                                                                                                                             |
| deleteBooking                   | Exclusivo do titular autenticado, inclusive para administradores; filtro por usuário na leitura e atualização de status                                                                          |
| getDayBookings/getBookings      | Públicas; select apenas professionalId/date/endsAt                                                                                                                                         |
| Cadastro                        | Zod no servidor, nome obrigatório, e-mail válido, senha com pelo menos 8 caracteres e no máximo 72 bytes (limite bcrypt); telefone mapeado para tell; resposta apenas id/name/email |

Exclusões de serviço/profissional bloqueiam qualquer reserva vinculada, inclusive cancelada ou concluída, para preservar histórico e avaliações. Recursos sem histórico podem ser excluídos. Esta regra substitui a remoção de reservas passadas das Ondas 1–3. As telas administrativa, pública e de reservas são revalidadas por helper comum. O painel permite SUPER_ADMIN e valida acesso antes de consultar dados de clientes; seleciona apenas o nome do cliente.

Verificação da Onda 1: 53 testes passaram (40 autorização, 8 cadastro, 5 agenda existente). Os testes parametrizados verificam todas as sete mutações administrativas sem sessão, com outro proprietário e com role desconhecida, sem escritas; também cobrem proprietário autorizado, SUPER_ADMIN, cancelamento, vínculos cruzados e bloqueio de exclusão com reservas futuras. A checagem de tipos passou. Lint continua pendente para a Onda 3.

## 7. Interface e administração

Formulários de serviços e edição de profissional usam `useFormState/useFormStatus`; adição de profissional e expediente usam FormData manual. As actions administrativas retornam objetos com sucesso/erro, às vezes erros por campo; criação e cancelamento de reserva lançam exceções.

O painel reúne reservas por status real e permite finalizar atendimentos cujo intervalo terminou. Indicadores financeiros e contagem futura consideram apenas confirmadas futuras. Cada serviço tem reservas ordenadas, mas o `flatMap` final não faz uma ordenação global. Sheets permitem adicionar/editar serviços e profissionais, e dialogs confirmam exclusões.

O formulário de expediente salva um dia por vez com validação condicional descrita na Onda 2.

Imagens remotas só têm `utfs.io` configurado em `next.config.mjs`, embora formulários aceitem qualquer URL válida. Há fallback para `/user-placeholder.png`, arquivo ausente de `public/`, e seleção de profissional pode passar uma URL vazia. A composição duplicada de `SheetContent` na página de detalhe foi removida.

## 8. Ambiente, comandos e seed

O README indica Node.js 22.12+, npm e PostgreSQL de desenvolvimento. Não há `engines` em `package.json`. Usar o lockfile para instalação reproduzível.

| Variável          | Uso                          |
| ----------------- | ---------------------------- |
| `DATABASE_URL`    | Conexão PostgreSQL do Prisma |
| `NEXTAUTH_URL`    | URL base da aplicação        |
| `NEXTAUTH_SECRET` | Segredo de autenticação      |

Consultar `.env.example`; os valores privados de `.env` não fazem parte deste documento.

Diagnóstico posterior de conexão: as duas consultas de barbearias da home foram executadas com sucesso no Neon, retornando seis barbearias. A URL local foi ajustada com `sslmode=require`, `connect_timeout=30` e `pool_timeout=30` para tolerar demora na abertura de conexão. Reiniciar `npm run dev` após mudar a URL, pois a instância Prisma fica em cache no processo. A falha inicial intermitente não foi reproduzida fora do sandbox; não foi necessário alterar dados ou migrations. Referência: https://neon.com/blog/prisma-dx-improvements.

```bash
npm ci
npx prisma generate
npx prisma migrate dev
npm run dev
```

Configurar `.env` antes das operações de banco. `npm ci` executa o script `prepare`, que inicializa Husky e gera o Prisma Client. `npm run build` compila produção; `npm start` inicia o build; `npm run lint`, `npm test` e `npx tsc --noEmit` verificam o projeto.

O seed (`npx prisma db seed`) começa apagando avaliações, reservas, profissionais, expediente, serviços, barbearias e usuários. Usar apenas em banco descartável após revisar o script. Ele cria um usuário, seis barbearias, três serviços e um profissional por barbearia, e uma reserva de exemplo.

Limitações do seed: o usuário chamado admin mantém role USER; não são criados horários nem vínculos entre serviços e profissionais; profissionais ficam sem imagem; a reserva usa o instante atual mais dez dias, sem adequação aos intervalos ou expediente. Portanto, a carga não prepara um fluxo completo de agendamento válido. Há credenciais demonstrativas fixas no script, inadequadas para ambientes reais.

## 9. Onda 3 — configuração e validação

- ESLint usa somente `eslint.config.mjs`, com ignores globais para gerados/builds e `@typescript-eslint/no-unused-vars` para TypeScript. `.eslintrc.json` foi removido. `npm run lint` executa ESLint diretamente e falha também com warnings.
- Next 14 usa integração antiga de ESLint: `npm run build` executa o lint explícito antes de `next build`. O lint interno está desabilitado para evitar duplicação/incompatibilidade; não há bypass no comando de build documentado.
- Tailwind permanece em `tailwind.config.js` (não existia um segundo arquivo .ts). `components.json` agora aponta para esse arquivo e para `@/_lib/utils`/`@/_lib`. O alias `@/* -> app/*` de TypeScript já estava correto.
- Aspas JSX/imports sem uso foram corrigidos. Os tipos do toast usam união literal em vez de constante usada somente como tipo. Os artefatos antigos de `app/generated` ficam fora de lint e Git; o cliente usado é `@prisma/client`.
- Google removido conforme a decisão da seção 6; cadastro por credenciais permanece funcional.
- `User.image` reconciliado por migration, validada sem acessar/escrever o banco Neon.
- `spawn EPERM` era associado à execução no sandbox: os mesmos testes passaram com Node 22.14.0 e permissões normais, sem reinstalar esbuild nem mudar o runner.
- O hook commit-msg chama a biblioteca instalada, sem depender de um script gerado dentro de `.git/hooks`. Pre-commit mantém lint-staged/Prettier.

Validação e roteiro reprodutível: [docs/VALIDACAO-ONDAS-1-3.md](docs/VALIDACAO-ONDAS-1-3.md). Foram executados testes em fusos distintos, integração em PostgreSQL real, lint, TypeScript e build. O snapshot inicial e commits intermediários preservaram o estado anterior sem hooks porque o lint legado ainda falhava; a entrega final passa pelo lint completo e pelos hooks corrigidos.

## 10. Limites e pendências fora das três ondas

- Duração fixa de 30 minutos, sem feriados, pausa ou expediente noturno.
- Recursos com histórico não podem ser excluídos; arquivamento de serviços/profissionais ainda não existe.
- Role no JWT é atualizada no login; revogação imediata de papéis exige outra política de sessão.
- Seed continua destrutivo e incompleto para demonstração (detalhes na seção 8); não foi executado nesta tarefa.
- Imagens opcionais/fallback ausente, contratos de serialização Prisma e paginação merecem uma revisão própria.
- `npm install` reportou 22 vulnerabilidades na árvore existente (2 baixas, 5 moderadas, 13 altas, 2 críticas). Atualização de dependências/framework precisa de tarefa dedicada; nenhum `audit fix --force` foi aplicado.
- O aviso de caniuse-lite desatualizado não bloqueou o build.

## 11. Guia para próximas tarefas

Para alterar reservas, começar por `service-item.tsx`, `create-booking.ts`, `booking-time.ts`, `get-day-bookings.ts` e `tests/booking.test.ts`. Preservar a identificação do usuário pela sessão e a verificação final de conflito no servidor.

Para alterar administração, ler a página de detalhe, seu componente de formulário e a action correspondente; conferir autorização diretamente na action. Para autenticação, ler `auth.ts`, `next-auth.d.ts`, a API de cadastro e o schema em conjunto.

Para alterar banco, editar `prisma/schema.prisma` e criar uma migration coerente com os dados existentes; regenerar o cliente utilizado por `@prisma/client`. Artefatos em `app/generated/prisma` não são fonte de regras de negócio.

Para interface, distinguir componentes de negócio em `_components/ui` das primitivas em `components/ui`; reutilizar `cn`, tokens globais e os componentes existentes. Atualizar este documento quando houver mudança de rotas, autenticação, relações, regras de agenda ou comandos.

A revisão considerou páginas, componentes, actions, bibliotecas, tipos, estilos, configurações, migrations, seed e testes locais. Dependências em `node_modules`, builds em `.next` e binários gerados não foram auditados linha a linha. O workspace já continha várias mudanças staged e unstaged; este contexto descreve esse estado local, sem presumir equivalência com uma versão publicada.


## 12. Onda 4 — status, duração e avaliações

Implementados itens 4.2–4.4. Notificações e recuperação de senha ficaram para depois por decisão explícita do usuário. Não houve implementação de 4.1, ausente no anexo.

As duas novas migrations foram geradas e testadas em PostgreSQL local descartável. Colunas adicionadas a tabelas existentes possuem defaults; os vínculos obrigatórios da nova tabela Review são fornecidos pela action, sem inventar IDs/defaults que violariam integridade. O formulário aparece na reserva COMPLETED não avaliada; detalhe da barbearia lista até 50 avaliações recentes e a contagem total. Somente nome, nota, comentário e data são públicos.

Consulte `docs/VALIDACAO-ONDA-4.md` para verificações e implantação. Nenhuma migration desta etapa foi aplicada ao Neon. Antes de executar esta versão contra esse banco, reconciliar o histórico/schema (incluindo image da Onda 3) e aplicar as migrations pendentes com `prisma migrate deploy`; não usar reset nem seed.


## 13. Design system estúdio

Redesign exclusivamente visual na branch `feat/design-system-estudio`, baseado na Onda 4. Sem mudanças de autorização, agenda, dados ou migrations.

Tokens shadcn preservados, raio 4 px, cards sem sombras e hairlines discretas. Archivo é a família de produção; títulos em peso Black, corpo regular/médio. Caixa-alta apenas no wordmark. A comparação manual Archivo/Space Grotesk está em `docs/design/specimen.html`; a captura automática foi bloqueada pela política do ambiente.

`DuotonePhoto` centraliza o filtro SVG sRGB (ink → bone) para capas públicas, miniaturas de barbearia em reservas e capas administrativas. Retratos profissionais permanecem coloridos. Home, busca, detalhe e reservas usam hierarquia e espaçamento comuns; painel mantém os fluxos existentes.

Contraste: bone sobre ink com contraste superior a 14:1; warm-gray/ink 4,75:1. Warm-gray/surface 4,28:1 exige texto mais claro nas superfícies. Bone/vermelho 4,25:1: botões primários usam 20 px em negrito, atendendo ao limiar de texto grande (3:1). Foco visível e prefers-reduced-motion tratados globalmente. Validar responsividade, filtro SVG e navegação por teclado em navegador antes do aceite visual final; build não substitui essa revisão.


## Cache de desenvolvimento

Next dev usa `.next-dev`; build e start usam `.next`. A separação evita 404 de main-app.js/app-pages-internals.js quando um build é executado enquanto o dev está ativo. Ambas as pastas são geradas e ignoradas no Git e ESLint. Após mudar a configuração, reiniciar o dev se a recarga automática não acontecer.

Correção posterior à captura de tela: a coluna User.image já existia no Neon e foi reconciliada no histórico via migrate resolve; as migrations de duração e status/avaliações foram aplicadas com migrate deploy. Sem reset/seed. Isso substitui as observações anteriores de migrations pendentes.


## 14. Refinamento visual estúdio

Branch `feat/refinamento-estudio`. Mudança somente de apresentação: CTA Reservar usa a variante primária vermelha e hover escurecido; superfície 1 #242426 e superfície 2 #2D2D2F. Calendário mantém regras de seleção e usa a segunda superfície para o estado selecionado.

A home destaca no hero a primeira barbearia do ranking real existente. Sem reviews, o desempate estável do ranking é usado; Barbershop não possui createdAt e nenhum campo/consulta foi adicionado para simular recência. Hero de 28vh mobile/40vh desktop, nome e endereço sobre foto duotone; pequenos fundos locais sob o texto garantem contraste mesmo em imagens claras. Saudação/data são secundárias.

Recomendados coloca o mesmo destaque primeiro em duas colunas, com título maior; Populares mantém cards uniformes. Cards sem avaliações omitem o badge. Hover e focus-within revelam a cor original por CSS, elevam a superfície, mostram borda e sublinhado vermelhos, sem escala/sombra. DuotonePhoto expõe `photo-duotone` e variável CSS `--duotone-filter`; profissionais não são afetados.

Carousel é um wrapper cliente apenas de apresentação: setas acessíveis rolam a faixa, toque/teclado continuam disponíveis, scrollbar oculta em Firefox/WebKit e rolagem imediata com movimento reduzido. Nenhuma lógica de negócio, action, consulta ou migration alterada. Revisão renderizada permanece pendente por bloqueio prévio de captura do navegador; as etapas foram descritas durante a execução.
