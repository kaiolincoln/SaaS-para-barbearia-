# Fluxo de trabalho do projeto

- Ler `CONTEXTO.md` para entender a arquitetura e as pendências conhecidas.
- Preferência expressa do usuário: criar uma branch por tarefa (`feat/`, `fix/` ou `docs/` com nome descritivo), validar as alterações, fazer commits e publicar a branch no remoto `origin` por este ambiente.
- A autorização para commits e push das tarefas persiste; não pedir confirmação a cada publicação. Informar a branch, o resultado das verificações e o resultado do push.
- Preservar mudanças locais anteriores e não incluí-las indiscriminadamente nos commits de uma tarefa. Não publicar segredos ou arquivos `.env`.
- Não fazer merge na `main` nem force push sem solicitação específica.
- Atualizar `CONTEXTO.md` quando houver mudanças relevantes de arquitetura, regras, configuração ou fluxo de desenvolvimento.
