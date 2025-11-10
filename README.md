# 💈 SaaS para Barbearias (Full Stack Club)

## Descrição do Projeto

Este é um **Sistema como Serviço (SaaS)** completo, desenvolvido para a gestão de barbearias. O projeto começou como parte do Bootcamp SaaS para Barbearias do **Full Stack Club** e foi significativamente expandido com funcionalidades avançadas e arquitetura robusta.

O foco principal é oferecer uma solução de gestão empresarial que abrange desde o agendamento de clientes até o controle administrativo com múltiplos níveis de acesso.

## ✨ Destaques e Funcionalidades Expandidas

*   **Arquitetura Full Stack Moderna:** Construído com Next.js, TypeScript e Prisma.
*   **Dashboard Gerencial:** Visão geral e analítica para acompanhamento de performance e métricas chave.
*   **Sistema de Agendamento Avançado:** Gerenciamento de horários de funcionamento **reais** e disponibilidade de profissionais.
*   **Controle de Acesso Multi-Nível (RBAC):** Implementação de um sistema de administração com diferentes papéis de usuário:
    *   `SUPER_ADMIN`: Acesso total e configurações globais.
    *   `BARBERSHOP_ADMIN`: Gerenciamento específico de uma unidade (barbearia).

## 🚀 Stack Tecnológica

Este projeto utiliza uma stack moderna e escalável, ideal para aplicações de nível empresarial:

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Framework** | **Next.js** | React para o Front-End e Back-End (Full Stack), otimizado para performance e SEO. |
| **Linguagem** | **TypeScript** | Garante código mais seguro, escalável e com menos erros em tempo de execução. |
| **ORM** | **Prisma** | Moderno ORM (Object-Relational Mapper) para acesso e manipulação do banco de dados. |
| **Banco de Dados** | [Mencione o DB, ex: PostgreSQL/MySQL] | Armazenamento persistente e relacional dos dados. |
| **Estilização** | [Mencione o CSS Framework, ex: Tailwind CSS/Styled Components] | Estilização e design responsivo. |

## ⚙️ Como Executar o Projeto Localmente

Este é um projeto Next.js. Siga os passos abaixo para configurar o ambiente:

### Pré-requisitos

*   Node.js (versão 18+)
*   npm ou yarn
*   Um banco de dados [Mencione o DB, ex: PostgreSQL]

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [URL do seu repositório]
    ```
2.  **Instale as dependências:**
    ```bash
    cd [nome-do-projeto]
    npm install
    # ou yarn install
    ```
3.  **Configuração do Banco de Dados:**
    *   Crie um arquivo `.env` na raiz do projeto.
    *   Configure a variável de ambiente `DATABASE_URL` com a string de conexão do seu banco de dados.
    *   Execute as migrações do Prisma:
        ```bash
        npx prisma migrate dev
        ```
4.  **Inicie o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    # ou yarn dev
    ```
    O aplicativo estará rodando em `http://localhost:3000`.

## 🤝 Contribuição

Contribuições são bem-vindas, especialmente em testes e otimização de performance.

## 📝 Licença

Este projeto está sob a licença.

---
**Desenvolvido por:** Kaio Lincoln
**Bootcamp:** Full Stack Club - SaaS para Barbearias
**Status:** Em Desenvolvimento / Expansão

