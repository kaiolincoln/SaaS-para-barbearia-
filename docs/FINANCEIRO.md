# Controle de caixa manual

Financeiro fica na barra existente de /admin/barbershops/[id], como seção da mesma página. Equipe e Serviços foram preservados. Não há rota financeira pública.

## Uso

1. Finalizar o atendimento pela agenda.
2. Em Pagamento pendente, abrir Registrar pagamento. O preço da reserva preenche o valor; selecionar a forma e informar data/hora em São Paulo ou deixar vazio para agora.
3. Para corrigir, usar Corrigir pagamento. O aviso informa que o registro anterior será sobrescrito.
4. Em Financeiro, escolher período e agrupamento. O contador de pendências abre a mesma agenda filtrada com os IDs calculados pelo relatório.

## Regras

- Preço gravado na reserva não acompanha edições futuras do serviço.
- Dados anteriores à migration receberam o preço do serviço naquele momento: aproximação histórica explicitamente indicada.
- Um pagamento manual por reserva concluída. Valor zero permitido para cortesia; negativos, mais de duas casas, método inválido e datas futuras são rejeitados.
- Sem gateway, split, estorno ou histórico de correções.
- Projetada: CONFIRMED pela data de atendimento. Recebida: COMPLETED com pagamento pela data paidAt. CANCELLED nunca contribui.
- Conversão é recebido/projetado, não quitação de uma carteira fixa. Pode superar 100%; com projeção zero mostra traço.
- Semana começa na segunda-feira; datas finais são inclusivas para o usuário e convertidas em limite exclusivo no dia seguinte em São Paulo. Personalizado limitado a dez anos.
- Gráfico diário até 31 dias, semanal até 180, mensal acima; opção profissional/serviço. SVG com tabela equivalente, sem nova dependência.
- Detalhamento inclui atendimento ou recebimento no período, para explicar pagamentos de atendimentos antigos. Sem paginação nesta versão.
- Somente proprietário da barbearia ou SUPER_ADMIN pode ler relatório ou registrar pagamento; cliente identificado só pelo nome.

## Validação e implantação

107 testes aprovados (100 unitários e 7 de integração PostgreSQL local). Cobrem snapshots, canceladas, bordas de São Paulo, denominador zero, agrupamentos, autorização de leitura/escrita, valores inválidos e correção persistida. Resumo mensal e relatório testados com o mesmo período/cálculo.

A suíte preexistente de concorrência de avaliações pode registrar P2028 localmente; os testes financeiros passaram, incluindo pagamento real no banco de teste.

Migration aditiva aplicada localmente e no Neon; migrate status atualizado. Sem seed/reset. Prisma Client regenerado. Conferência visual autenticada da tela ainda não foi feita; nenhuma captura de navegador foi produzida.
