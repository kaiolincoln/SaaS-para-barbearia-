# Redesign estúdio — revisão por etapas

Escopo exclusivamente visual. Branch baseada em feat/onda4-status-duracao-avaliacoes, que contém as Ondas 1–4; nenhuma alteração de actions, schema, migrations ou regras de negócio nesta tarefa.

## Revisões intermediárias

1. Tokens: ink/bone, cinza quente, superfície elevada, vermelho para interação. Archivo configurada via next/font/google. Tema dark mantido.
2. Primitivas: raio 4 px, sem sombras cinza; campos e botões com foco; badges neutros; dia selecionado vermelho com texto grande.
3. DuotonePhoto: filtro SVG reutilizável e IDs por instância; sRGB, contraste 1,1 e mapeamento dos canais preto→ink/branco→bone. Só capas, sem retratos profissionais.
4. Negócio: wordmark tipográfico, busca nomeada para leitores de tela, cards sem moldura, capas maiores; estrelas e preços neutros.
5. Cliente: título principal forte por tela, seções menores e hairlines; home sem banner verde antigo, busca com grade de 1/2/3 colunas, detalhe com capa ampla; reservas com rodapé empilhado no mobile.
6. Administração: cantos/cores coerentes, título dominante, indicadores menores, retratos preservados.

Cada etapa teve revisão de código e descrição visual comunicada antes da seguinte. Não houve screenshot renderizado da aplicação. A tentativa de captura local com Edge foi rejeitada pela revisão automática (“blocked by policy”), sem razão mais específica. O bloqueio não foi contornado.

## Tipografia e contraste

Archivo foi mantida conforme primeira opção do briefing. O espécime HTML compara Archivo e Space Grotesk na mesma composição; serve para revisão manual, não prova de teste visual realizado. Comparação renderizada de ambas e aceite final da tipografia permanecem pendentes. O espécime carrega Google Fonts; não é rota da aplicação nem dependência de UI.

Warm-gray sobre ink: 4,75:1. Sobre surface: 4,28:1, por isso texto secundário em superfícies recebe bone a 75% de opacidade. Bone sobre tattoo-red: 4,25:1; ações primárias usam 20px em negrito (texto grande, mínimo 3:1). Mensagens estáticas e notas não recebem vermelho. Foco de teclado bone/red, contraste de anel preservado; transições respeitam prefers-reduced-motion.

## Aceite manual pendente

- Comparar o espécime de fontes e confirmar Archivo.
- Abrir home, busca, detalhe, reservas e painel em 320/390/768/1440 px.
- Conferir sheets/dialogs e calendário com Tab, Escape e foco visível.
- Confirmar que capas são duotone e retratos profissionais permanecem coloridos.
- Verificar SVG em Chrome/Edge, Firefox e Safari; não houve validação entre navegadores.
- Conferir nomes longos e textos de erro nas larguras menores.

Nenhuma nova dependência foi adicionada. Não houve mudança de dado para acomodar o desenho. As migrations pendentes do Neon pertencem à Onda 4 e continuam sendo pré-requisito para executar a base atual.

## Verificação técnica

Build de produção e lint aprovados; TypeScript sem erros. 79 testes unitários aprovados, seis de integração ignorados por ausência de TEST_DATABASE_URL. Nenhum teste novo foi criado para esta mudança visual. Aviso de caniuse-lite antigo permanece.
