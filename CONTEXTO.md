# Contexto do projeto — FSW Barber

Documento de referência para manutenção e futuras tarefas de desenvolvimento. Análise do código local em 26/09/2026; descreve a implementação encontrada, incluindo funcionalidades incompletas e problemas conhecidos.

## 1. Produto e escopo atual

Aplicação de descoberta de barbearias e agendamento de serviços, iniciada no bootcamp Full Stack Club e ampliada com profissionais, expediente e administração. Interface em português brasileiro, valores em reais e tema escuro com destaque verde.

O cliente pesquisa uma barbearia, escolhe serviço, dia, horário e profissional, confirma a reserva e consulta ou cancela seus agendamentos. O proprietário tem um painel com serviços, profissionais, expediente e reservas futuras.

Não há implementação de pagamentos, assinaturas SaaS, avaliações reais, geolocalização, notificações, recuperação de senha ou cadastro funcional de barbearias pela interface. “Populares” ordena barbearias pelo nome decrescente; as notas e o número de avaliações são textos fixos. O mapa é a imagem estática `public/map.png`.

## 2. Stack e organização

Versões declaradas em `package.json` (os intervalos não representam necessariamente a versão exata instalada): Next.js `^14.2.32`, React 18, TypeScript 5, Prisma Client `^5.22.0`, CLI Prisma `^5.17.0`, PostgreSQL, NextAuth `^4.24.11`, Tailwind CSS 3, Zod 3, React Hook Form 7 e Vitest 3. Componentes locais seguem o padrão shadcn/ui, com primitivas Radix e ícones Lucide.

| Caminho | Responsabilidade |
| --- | --- |
| `app/page.tsx` e pastas de rotas | Páginas do App Router; consultas predominantemente no servidor |
| `app/_actions/` | Mutações e consultas chamadas pela interface |
| `app/_data/` | Reservas futuras e passadas do usuário autenticado |
| `app/_lib/auth.ts` | Providers, callbacks JWT e sessão NextAuth |
| `app/_lib/prisma.ts` | Instância `db`, reaproveitada globalmente em desenvolvimento |
| `app/_lib/booking-time.ts` | Validação temporal das reservas |
| `app/_lib/utils.ts` | `cn`: composição de classes com clsx e tailwind-merge |
| `app/_components/ui/` | Componentes de negócio: reserva, busca, navegação e login |
| `app/components/ui/` | Primitivas visuais reutilizáveis: botão, formulário, sheet, dialog, calendário etc. |
| `app/admin/barbershops/[id]/_components/` | Formulários e listas administrativos |
| `app/_providers/auth.tsx` | SessionProvider do cliente |
| `app/types/next-auth.d.ts` | Extensões de tipos da sessão, usuário e JWT |
| `app/_constants/search.ts` | Categorias e ícones da busca rápida |
| `app/hooks/use-toast.ts` | Estado do toast Radix; o layout utiliza o Toaster do Sonner |
| `prisma/schema.prisma` | Modelo de dados de referência |
| `prisma/migrations/` | Histórico SQL de evolução do banco |
| `prisma/seed.ts` | Limpeza e carga de dados demonstrativos |
| `tests/booking.test.ts` | Cinco testes de tempo e criação de reservas, com mocks |
| `public/` | Logo, banner, mapa e ícones |
| `app/generated/prisma/` | Artefatos gerados antigos; a aplicação importa `@prisma/client` |

O alias `@/*` aponta para `app/*`, não para a raiz. O layout carrega Inter via `next/font/google`, CSS global, AuthProvider, Footer e Sonner. O tema é fixado por `className="dark"`; as cores estão em `app/globals.css`.

## 3. Rotas

| Rota | Comportamento e acesso atual |
| --- | --- |
| `/` | Pública; busca, categorias, barbearias e reservas futuras da sessão |
| `/barbershops?title=...` | Busca por nome, usando `contains` sem distinção de maiúsculas |
| `/barbershops?service=...` | Busca pelo nome dos serviços associados; filtros combinados por `OR` |
| `/barbershops/[id]` | Pública; detalhes, serviços, profissionais e expediente; ID inexistente retorna 404 |
| `/bookings` | Reservas do usuário; visitante sem sessão recebe 404 |
| `/signup` | Formulário cliente, cadastro e login automático por credenciais |
| `/admin` | Lista barbearias próprias; SUPER_ADMIN lista todas |
| `/admin/barbershops/[id]` | Exige helper de acesso antes de consultar dados sensíveis; permite SUPER_ADMIN |
| `/api/auth/[...nextauth]` | GET/POST do NextAuth |
| `/api/auth/register` | POST de cadastro por nome, e-mail e senha |

O botão “Cadastrar minha barbearia” não possui ação. O botão Admin do cabeçalho depende da existência de uma barbearia do usuário, e não de seu papel.

## 4. Modelo de dados

| Modelo | Campos e relações relevantes |
| --- | --- |
| `User` | UUID, e-mail único, nome obrigatório, senha opcional, `tell`, imagem e role; possui barbearias e reservas |
| `Barbershop` | Proprietário obrigatório, nome, endereço, telefones, descrição e imagem; possui serviços, profissionais e expediente |
| `BarbershopService` | Pertence a uma barbearia; preço Decimal(10,2); profissionais em relação muitos-para-muitos |
| `Professional` | Pertence a uma barbearia; nome e imagem opcional; atende serviços e recebe reservas |
| `WorkingHours` | Um registro por barbearia/dia; `dayOfWeek` de 0 (domingo) a 6 (sábado), `isOpen`, início e fim como strings HH:mm |
| `Booking` | Usuário, serviço, profissional, instante da reserva e timestamps; todos os vínculos são obrigatórios |

Papéis: `USER` (padrão), `BARBERSHOP_ADMIN` e `SUPER_ADMIN`. A propriedade é representada por `Barbershop.ownerId`; não existe `barbershopId` no modelo User.

Não há duração no serviço, status da reserva, preço histórico, pagamento ou exclusão lógica. “Confirmado” e “Finalizado” são derivados da comparação da data com o momento atual. O cancelamento apaga o registro. A receita futura soma os preços atuais dos serviços das reservas futuras; não representa receita recebida.

O banco não impõe unicidade de profissional/horário nem a igualdade de barbearia entre profissional e serviço na relação muitos-para-muitos. As chaves estrangeiras das reservas restringem exclusões de registros relacionados.

As migrations adicionam senha, telefone, proprietário, expediente, profissional, relação serviço/profissional e role. Há uma divergência visível: `User.image` existe no schema atual, mas não há criação dessa coluna nas migrations SQL presentes. A aplicação integral das migrations em banco vazio ainda precisa ser verificada. Algumas migrations também adicionam colunas obrigatórias sem valor padrão, exigindo tratamento se já houver dados.

## 5. Fluxo de agendamento

1. A página da barbearia carrega serviços com profissionais vinculados e expediente.
2. `service-item.tsx` controla o sheet de reserva e os estados de dia, horário, profissional e envio. Visitantes recebem a opção de login.
3. Ao selecionar o dia, `getDayBookings` consulta reservas de todos os serviços da barbearia nesse dia.
4. A interface gera horários em passos de 30 minutos, arredonda a abertura para a próxima meia hora e exige espaço para terminar antes do fechamento. Exibe horários com ao menos um profissional habilitado livre.
5. O cliente escolhe o profissional e envia `{ serviceId, professionalId, date }` para `createBooking`.
6. O servidor exige sessão e usa uma transação serializável para carregar o serviço, conferir o vínculo do profissional, validar a data, procurar conflitos e gravar com o `userId` da sessão.
7. A consulta de conflito considera o mesmo profissional com início estritamente entre 30 minutos antes e 30 minutos depois da data solicitada. Reservas exatamente adjacentes são permitidas.
8. Erro Prisma `P2034` vira orientação para atualizar e tentar novamente. Não há repetição automática. Sucesso revalida `/` e `/bookings`.

`validateBookingTime` exige data válida e futura, expediente aberto em `America/Sao_Paulo`, início dentro do expediente, duração implícita de 30 minutos, minutos múltiplos de 30 e segundos/milissegundos zerados. Dia sem configuração é indisponível. Não há suporte a expediente que atravessa a meia-noite, pausas, feriados ou agenda individual do profissional.

As consultas diárias usam `startOfDay/endOfDay` no fuso do servidor; a interface usa o fuso do navegador. Isso difere da validação explícita em São Paulo. A disponibilidade exibida é uma fotografia e pode mudar até a confirmação; a verificação final ocorre no servidor. A interface mostra erro genérico e não exibe a mensagem detalhada da action.

`getConfirmedBookings` e `getConcludedBookings` filtram pelo usuário da sessão, incluem serviço/barbearia e ordenam por data crescente. O profissional não é incluído nesses resumos. As páginas serializam reservas via JSON antes de enviá-las a `BookingItem`, embora seus tipos ainda descrevam Date/Decimal do Prisma.

## 6. Autenticação e permissões

Credenciais usam `bcryptjs.compare`; cadastro usa `bcryptjs.hash` com custo 10. NextAuth usa estratégia JWT, copia ID e role para o token e depois para a sessão. O papel fica no token; alterações no banco não são reconsultadas em toda requisição.

GoogleProvider e PrismaAdapter estão configurados e aparecem na interface, mas o schema não contém os modelos de adapter Account, Session e VerificationToken, nem `emailVerified`. Esse fluxo não está validado como funcional.

### Onda 1 — autorização e privacidade (implementada)

`requireBarbershopAccess` é a fonte única das permissões administrativas: sessão com ID e role reconhecida, barbearia existente, proprietário (`ownerId`) ou SUPER_ADMIN. Um proprietário com role USER também pode administrar sua barbearia, conforme a regra de propriedade; BARBERSHOP_ADMIN sem propriedade é rejeitado. IDs de barbearia informados pelo cliente não bastam para autorizar recursos de outra barbearia.

| Operação | Regra implementada |
| --- | --- |
| add/edit/delete de serviço | Helper; criação/edição validam todos os profissionais da mesma barbearia dentro de transação serializável |
| add/edit/delete de profissional | Helper e vínculo do profissional com a barbearia; edição é Server Action |
| updateWorkingHours | Helper antes da escrita |
| deleteBooking | Exclusivo do titular autenticado, inclusive para administradores; filtro por usuário na leitura e exclusão |
| getDayBookings/getBookings | Públicas; select apenas professionalId/date |
| Cadastro | Zod no servidor, nome obrigatório, e-mail válido, senha com pelo menos 8 caracteres e no máximo 72 bytes (limite bcrypt); telefone mapeado para tell; resposta apenas id/name/email |

Exclusões de serviço/profissional bloqueiam reservas futuras e removem reservas passadas e recurso na mesma transação serializável. A remoção de histórico é deliberada porque os vínculos são obrigatórios e o escopo não inclui exclusão lógica. As telas administrativa, pública e de reservas são revalidadas por helper comum. O painel permite SUPER_ADMIN e valida acesso antes de consultar dados de clientes; seleciona apenas o nome do cliente.

Verificação da Onda 1: 53 testes passaram (40 autorização, 8 cadastro, 5 agenda existente). Os testes parametrizados verificam todas as sete mutações administrativas sem sessão, com outro proprietário e com role desconhecida, sem escritas; também cobrem proprietário autorizado, SUPER_ADMIN, cancelamento, vínculos cruzados e bloqueio de exclusão com reservas futuras. A checagem de tipos passou. Lint continua pendente para a Onda 3.

## 7. Interface e administração

Formulários de serviços e edição de profissional usam `useFormState/useFormStatus`; adição de profissional e expediente usam FormData manual. As actions administrativas retornam objetos com sucesso/erro, às vezes erros por campo; criação e cancelamento de reserva lançam exceções.

O painel reúne reservas futuras dos serviços e soma seus preços. Cada serviço tem reservas ordenadas, mas o `flatMap` final não faz uma ordenação global. Sheets permitem adicionar/editar serviços e profissionais, e dialogs confirmam exclusões.

O formulário de expediente salva um dia por vez. Quando `isOpen` é falso, os inputs de horário ficam desabilitados e não entram no FormData, enquanto a action continua exigindo strings HH:mm. Isso impede salvar o fechamento do dia pelo fluxo atual. A validação também não exige início anterior ao fim nem dia inteiro em `dayOfWeek`.

Imagens remotas só têm `utfs.io` configurado em `next.config.mjs`, embora formulários aceitem qualquer URL válida. Há fallback para `/user-placeholder.png`, arquivo ausente de `public/`, e seleção de profissional pode passar uma URL vazia. O detalhe da barbearia envolve `SidebarSheet` em outro `SheetContent`, embora o próprio sidebar já renderize esse conteúdo; revisar a composição visual.

## 8. Ambiente, comandos e seed

O README indica Node.js 22.12+, npm e PostgreSQL de desenvolvimento. Não há `engines` em `package.json`. Usar o lockfile para instalação reproduzível.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL do Prisma |
| `NEXTAUTH_URL` | URL base da aplicação |
| `NEXTAUTH_SECRET` | Segredo de autenticação |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Credenciais do provider Google |

Consultar `.env.example`; os valores privados de `.env` não fazem parte deste documento.

Diagnóstico posterior de conexão: as duas consultas de barbearias da home foram executadas com sucesso no Neon, retornando seis barbearias. A URL local foi ajustada com `sslmode=require`, `connect_timeout=30` e `pool_timeout=30` para tolerar demora na abertura de conexão. Reiniciar `npm run dev` após mudar a URL, pois a instância Prisma fica em cache no processo. A falha inicial intermitente não foi reproduzida fora do sandbox; não foi necessário alterar dados ou migrations. Referência: https://neon.com/blog/prisma-dx-improvements.

```bash
npm ci
npx prisma generate
npx prisma migrate dev
npm run dev
```

Configurar `.env` antes das operações de banco. `npm ci` executa o script `prepare`, que inicializa Husky e gera o Prisma Client. `npm run build` compila produção; `npm start` inicia o build; `npm run lint`, `npm test` e `npx tsc --noEmit` verificam o projeto.

O seed (`npx prisma db seed`) começa apagando reservas, profissionais, expediente, serviços, barbearias e usuários. Usar apenas em banco descartável após revisar o script. Ele cria um usuário, seis barbearias, três serviços e um profissional por barbearia, e uma reserva de exemplo.

Limitações do seed: o usuário chamado admin mantém role USER; não são criados horários nem vínculos entre serviços e profissionais; profissionais ficam sem imagem; a reserva usa o instante atual mais dez dias, sem adequação aos intervalos ou expediente. Portanto, a carga não prepara um fluxo completo de agendamento válido. Há credenciais demonstrativas fixas no script, inadequadas para ambientes reais.

## 9. Qualidade, testes e estado verificado

`tests/booking.test.ts` contém cinco testes cobrindo data/fuso/expediente/intervalos, exigência de autenticação, profissional habilitado, conflito e gravação com o usuário da sessão e isolamento serializável. Prisma, sessão e revalidação são simulados. Não há testes de integração PostgreSQL, concorrência real, administração, cadastro ou navegador nessa suíte.

Resultados desta análise:

- `npx tsc --noEmit --incremental false`: passou, sem erros de tipos. Isso não valida o build Next.js nem os fluxos em execução.
- `npm run lint`: falhou. Há aspas não escapadas no JSX de listas administrativas, imports sem uso, aplicação de `no-unused-vars` a declarações TypeScript e muitos erros em `app/generated/prisma`, que não está excluído dessa verificação.
- `npm test`: não iniciou a suíte; esbuild/Vitest recebeu `spawn EPERM` no sandbox. A execução fora do sandbox não foi autorizada. Nenhum teste foi declarado aprovado nesta revisão.
- Build de produção, navegação, autenticação Google, banco real, migrations e seed não foram executados.

Configurações a reconciliar: coexistem `.eslintrc.json` e `eslint.config.mjs`; `components.json` aponta para `tailwind.config.ts`, mas existe `tailwind.config.js`, e o alias de utils contém um segmento `app` extra. Husky executa lint-staged no pre-commit; lint-staged aplica ESLint com fix e Prettier. Prettier configura dois espaços e ausência de ponto e vírgula, mas os arquivos têm estilos misturados.

## 10. Pendências prioritárias encontradas

As falhas de autorização, cadastro e privacidade da auditoria inicial foram tratadas na Onda 1. Permanecem para as ondas seguintes: fechamento de dia, fuso único, migrations, decisão Google e configuração de lint. Fora do escopo: imagens ausentes, composição de sheets, paginação, avaliações e features de produto.

## 11. Guia para próximas tarefas

Para alterar reservas, começar por `service-item.tsx`, `create-booking.ts`, `booking-time.ts`, `get-day-bookings.ts` e `tests/booking.test.ts`. Preservar a identificação do usuário pela sessão e a verificação final de conflito no servidor.

Para alterar administração, ler a página de detalhe, seu componente de formulário e a action correspondente; conferir autorização diretamente na action. Para autenticação, ler `auth.ts`, `next-auth.d.ts`, a API de cadastro e o schema em conjunto.

Para alterar banco, editar `prisma/schema.prisma` e criar uma migration coerente com os dados existentes; regenerar o cliente utilizado por `@prisma/client`. Artefatos em `app/generated/prisma` não são fonte de regras de negócio.

Para interface, distinguir componentes de negócio em `_components/ui` das primitivas em `components/ui`; reutilizar `cn`, tokens globais e os componentes existentes. Atualizar este documento quando houver mudança de rotas, autenticação, relações, regras de agenda ou comandos.

A revisão considerou páginas, componentes, actions, bibliotecas, tipos, estilos, configurações, migrations, seed e testes locais. Dependências em `node_modules`, builds em `.next` e binários gerados não foram auditados linha a linha. O workspace já continha várias mudanças staged e unstaged; este contexto descreve esse estado local, sem presumir equivalência com uma versão publicada.
