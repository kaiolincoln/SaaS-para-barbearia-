# Validação — Onda 4 (4.2–4.4)

Escopo: status persistido, duração configurável e avaliações. Notificações e recuperação de senha foram excluídas pelo usuário. Branch baseada em `fix/seguranca-agenda-configuracao`; contém também os commits das Ondas 1–3 ainda não integrados à main.

## Regras implementadas

- CONFIRMED é o padrão, inclusive para reservas antigas. A data sozinha não prova atendimento concluído.
- Titular cancela sem apagar; proprietário ou SUPER_ADMIN finaliza somente CONFIRMED após endsAt. Canceladas não ocupam horário nem aparecem como confirmadas.
- Duração de 30 a 720 minutos, múltipla de 30; snapshot na reserva protege intervalos históricos contra edição do serviço.
- Disponibilidade usa intervalos semiabertos em America/Sao_Paulo; início + duração deve caber no expediente.
- Uma avaliação por reserva COMPLETED, exclusivamente pelo titular; nota inteira 1–5, comentário opcional até 1000 caracteres. Constraint única e CHECK no PostgreSQL.
- Populares: média, contagem, nome e ID. Detalhe mostra as últimas 50 avaliações; total considera todas.
- Serviços/profissionais com qualquer histórico não são excluídos. Isso substitui a exclusão de reservas passadas das Ondas 1–3.

## Verificações realizadas

- 85 testes aprovados, incluindo 6 de integração com PostgreSQL 16 local descartável e execução com TZ=Asia/Tokyo.
- Integração: cancelamento preserva registro/libera horário, conflito entre durações, snapshot após edição, conclusão autorizada, rejeição de avaliação anônima/alheia/não concluída, nota inválida, duplicidade e agregação real.
- Solicitações concorrentes deixam uma única reserva/avaliação. No ambiente local, uma chamada concorrente também pode falhar com P2028 (espera para iniciar transação); portanto essa execução não isola o mecanismo de serialização. Duplicidade sequencial verifica explicitamente a constraint de avaliação.
- TypeScript sem erros; lint sem erros/warnings; build de produção aprovado.
- As 12 migrations aplicadas a banco vazio `fsw_wave4_empty`; migrate diff sem diferenças. Novas migrations também aplicadas ao banco de integração.
- Seed adaptado às FKs de Review e ao intervalo da reserva; não executado, pois é destrutivo.
- Sem teste visual/HTTP: a revisão automática de aprovação bloqueou a tentativa de iniciar o servidor de teste nesta sessão, informando apenas “blocked by policy”. O bloqueio não foi contornado.
- Aviso de caniuse-lite antigo permanece; dependências não foram atualizadas nesta etapa.

## Implantação

Nenhuma migration desta etapa foi aplicada ao Neon. Antes de rodar a nova versão contra esse banco:

1. Conferir backup e histórico/schema do ambiente de destino, especialmente a coluna image da Onda 3, que pode já existir por alteração manual.
2. Reconciliar eventuais divergências sem reset/seed.
3. Com DATABASE_URL apontando para o destino correto, executar `npx prisma migrate deploy` e `npx prisma generate`.
4. Reiniciar o servidor Next.js para carregar o novo Prisma Client.

As colunas adicionadas a tabelas existentes têm defaults. endsAt é preenchido com date + 30 minutos nas reservas existentes; novas escritas devem enviar o término correto para satisfazer o CHECK. Os vínculos da nova tabela Review são obrigatórios e fornecidos pela action, sem defaults artificiais para IDs.

Após implantação, verificar no navegador: reservar serviço de 90 minutos, confirmar indisponibilidade durante todo o intervalo, cancelar e reservar novamente; finalizar um atendimento passado no painel; avaliar pela conta do titular e conferir média/contagem na home, busca e detalhe.
