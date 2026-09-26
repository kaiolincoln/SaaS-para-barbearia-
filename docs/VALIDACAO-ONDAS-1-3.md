# Validação das Ondas 1–3

Data: 26/09/2026. Node 22.14.0, Next 14.2.32, Prisma 5.22.0, Vitest 3.2.7 e PostgreSQL 16 em Docker.

## Decisões implementadas

- Administração: usuário com sessão, role reconhecida e propriedade da barbearia; SUPER_ADMIN pode acessar qualquer barbearia existente. USER proprietário é permitido, conforme a regra explícita do helper solicitada. BARBERSHOP_ADMIN sem propriedade é rejeitado.
- Cancelamento: somente o titular pode cancelar, inclusive se o solicitante tiver papel administrativo. Isso mantém o escopo da tela “Meus agendamentos”.
- Profissionais e serviços: bloqueio com reserva futura; histórico passado apagado na mesma transação serializável da exclusão. As relações obrigatórias impedem desvincular sem nova modelagem. Conflitos serializáveis pedem nova tentativa.
- Cadastro: nome e e-mail válidos, senha mínima de 8 caracteres e limite de 72 bytes do bcrypt; telefone validado e salvo em `tell`; retorno de `id`, `name`, `email` apenas.
- Agenda: `America/Sao_Paulo` em consulta, geração, validação e exibição. A API de disponibilidade recebe `day: YYYY-MM-DD`; retorna somente `professionalId`/`date`. Utilitários usam [date-fns-tz](https://github.com/marnusw/date-fns-tz), sem assumir um offset constante.
- Expediente fechado: não exige horários e preserva os anteriores. Se ainda não existe registro, cria fechado com horários internos padrão 09:00/18:00. Aberto exige início anterior ao fim; dia precisa ser inteiro de 0 a 6.
- Google: removidos provider, adapter, botão e variáveis do exemplo até existir integração completa. Autenticação por credenciais continua.
- Configuração: flat ESLint único, artefatos gerados ignorados, Tailwind JS apontado corretamente pelo shadcn; alias TypeScript mantido. `npm run build` chama lint antes do build porque a integração interna do Next 14 é legada.

## Verificações executadas

1. A suíte inicial de 5 testes passou no ambiente sem sandbox. O erro anterior `spawn EPERM` não foi reproduzido; nenhuma alteração de esbuild foi necessária.
2. Onda 1: 53 testes passaram, incluindo 40 de autorização e 8 de cadastro.
3. Onda 2: 67 testes passaram em processos separados com `TZ=UTC` e `TZ=Asia/Tokyo`.
4. Integração PostgreSQL: 3 testes passaram — concorrência com uma única reserva, bloqueio de exclusão com reserva futura sem perder passado, negação ao outro proprietário e exclusão autorizada do profissional/histórico.
5. Migration `20260926173717_add_user_image` gerada com `migrate dev`; dez migrations aplicadas em banco vazio com `migrate deploy`; `migrate diff --exit-code` retornou zero, sem diferenças.
6. `npm run build` passou: lint sem erros/warnings, compilação, tipos e geração de páginas. O aviso de Browserslist não bloqueou a execução.
7. Suíte final: 68 testes unitários passaram; os 3 testes de integração ficam ignorados sem TEST_DATABASE_URL e passaram na execução separada descrita acima.

Uma tentativa adicional de iniciar `npm start` na porta 3100 para smoke test HTTP foi rejeitada pela revisão automática de permissões, com a mensagem genérica `blocked by policy`. Nenhum resultado de navegação/HTTP é declarado como validado.

Os testes de integração são ignorados por padrão sem `TEST_DATABASE_URL`. Essa variável só aceita host local e banco chamado `fsw_integration`, evitando execução acidental no banco da aplicação. Os demais testes usam mocks e não dependem de banco. Eles validam regras, mas não substituem a interação manual completa no navegador.

## Reproduzir migrations em banco vazio

Com Docker ativo, em PowerShell, a partir da raiz do projeto. A senha abaixo é exclusiva do banco descartável, exposto apenas no loopback.

```powershell
docker run --name fsw-waves-postgres -e POSTGRES_PASSWORD=fsw_test_only -e POSTGRES_DB=fsw_migrate -p 127.0.0.1:55432:5432 -d postgres:16
docker exec fsw-waves-postgres pg_isready -U postgres
$env:DATABASE_URL = 'postgresql://postgres:fsw_test_only@localhost:55432/fsw_migrate'
npx prisma migrate dev --name add_user_image --skip-seed --skip-generate
docker exec fsw-waves-postgres createdb -U postgres fsw_deploy
$env:DATABASE_URL = 'postgresql://postgres:fsw_test_only@localhost:55432/fsw_deploy'
npx prisma migrate deploy
npx prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --exit-code
Remove-Item Env:DATABASE_URL
```

O comando `migrate dev` acima foi usado para gerar a migration faltante; com ela já no repositório, deverá apenas verificar/aplicar o histórico. `fsw_deploy` é um segundo banco vazio, sem seed ou `db push`. As dez migrations devem aplicar. O diff final deve retornar `No difference detected.` com código 0.

Nenhum reset ou migrate foi executado contra o Neon. Em uma base que já tenha a coluna `image` por alteração manual, comparar estrutura e histórico antes de aplicar ou marcar uma migration como resolvida. Não marcar como aplicada sem confirmar que o SQL correspondente já está refletido no banco.

## Reproduzir testes de integração

```powershell
docker exec fsw-waves-postgres createdb -U postgres fsw_integration
$env:DATABASE_URL = 'postgresql://postgres:fsw_test_only@localhost:55432/fsw_integration'
npx prisma migrate deploy
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npx vitest run tests/prisma.integration.test.ts
Remove-Item Env:TEST_DATABASE_URL
Remove-Item Env:DATABASE_URL
```

Os testes criam IDs únicos e limpam somente os registros criados por eles. O banco é descartável; não usar credenciais de produção. Ao terminar, `docker stop fsw-waves-postgres` interrompe somente esse container. Para uma nova execução de migrations do zero, usar outro container/banco vazio, sem reaproveitar `fsw_deploy` populado.

## Reproduzir verificações locais

```powershell
npm test
$env:TZ = 'UTC'
npm test
$env:TZ = 'Asia/Tokyo'
npm test
Remove-Item Env:TZ
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

O teste de fuso demonstra que 09:00 UTC corresponde a 06:00 em São Paulo e é rejeitado no expediente 09:00–18:00. A seleção 09:00 brasileira gera 12:00 UTC; query, interface e validador concordam. O teste de virada de dia verifica limites 03:00Z inclusivo a 03:00Z do dia seguinte exclusivo.

## Checklist manual de aceitação

Roteiro complementar, não declarado como executado no navegador. Usar duas contas proprietárias de barbearias distintas, uma conta sem propriedade e um SUPER_ADMIN em banco de teste.

| Operação                   | Sem sessão / outro proprietário                   | Caso permitido / regra adicional                                             |
| -------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| addService                 | Retorna erro; não cria                            | Proprietário cria; profissional de outra barbearia é rejeitado               |
| editService                | Retorna erro; não altera                          | Proprietário edita; valida todos os profissionais                            |
| deleteService              | Retorna erro; não apaga                           | Bloqueia reservas futuras; passado e serviço removidos atomicamente          |
| addProfessional            | Retorna erro; não cria                            | Proprietário cria na própria barbearia                                       |
| editProfessional           | Retorna erro; não altera                          | Trocar ID por profissional de outra barbearia deve falhar                    |
| deleteProfessional         | Retorna erro; não apaga                           | Bloqueia reservas futuras; passado e profissional removidos atomicamente     |
| updateWorkingHours         | Retorna erro; não salva                           | Fechar dia sem horários funciona; início >= fim e dia fracionário falham     |
| deleteBooking              | Sem sessão ou reserva alheia: erro                | Só titular cancela; SUPER_ADMIN não cancela reserva alheia                   |
| getDayBookings/getBookings | Permanecem públicas                               | Resposta contém exclusivamente data e profissional                           |
| POST register              | Corpo inválido: 400                               | Sucesso: 201, telefone salvo, sem senha/hash na resposta; duplicado: 409     |
| Painel administrativo      | Visitante/não proprietário redirecionado          | Proprietário/SUPER_ADMIN acessa; nome de cliente só em contexto autorizado   |
| Login                      | Google não aparece nos providers nem na interface | Cadastro seguido de login com e-mail/senha funciona                          |
| Agenda no navegador        | Usar emulação de fuso UTC e Tóquio                | Mesmo dia, slots e horário confirmado em São Paulo; dia fechado indisponível |

Os casos de permissão das actions, cadastro, expediente e disponibilidade acima têm cobertura automatizada nos arquivos `tests/authorization.test.ts`, `tests/register.test.ts`, `tests/booking.test.ts` e `tests/availability.test.ts`. O teste `auth-config.test.ts` garante que somente credenciais são anunciadas. Os testes com PostgreSQL verificam as transações reais, sem substituir sessão por autenticação via navegador.

## Pendências fora do escopo

Atualização da árvore de dependências (npm reportou 22 vulnerabilidades), preparação do seed demonstrativo, preservação de histórico por exclusão lógica, duração variável e demais features da Onda 4. Não houve deploy da aplicação nem alteração dos dados do Neon.
