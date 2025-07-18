# ACBank

Projeto desenvolvido como parte do processo seletivo do Grupo Adriano Cobuccio para a vaga de Front-end. A aplicação simula uma carteira digital com funcionalidades de cadastro, autenticação, operações financeiras e controle de sessões de usuário.

---

## Stack utilizada

- **Next.js** (App Router + API Routes)
- **TypeScript**
- **PostgreSQL** (via Docker)
- **React Hook Form** + **Zod** (validação)
- **Jest** (testes de integração)
- **Docker + Compose**
- **Node PG Migrate** (migrações do banco)
- **UUID**, **bcryptjs**, **axios**, entre outras

---

## Funcionalidades

### Cadastro e Autenticação

- Criação de usuários com `nome`, `email` e `senha`
- Login com e-mail e senha, gerando sessão via `session_id` (cookie HttpOnly)
- Verificação de sessão autenticada

### Operações Financeiras

- **Depósito**: adiciona saldo à conta do usuário autenticado
- **Transferência**: envia saldo de um usuário para outro (valida saldo suficiente)
- **Reversão**: possibilidade de reverter operações em caso de inconsistência (em implementação)

### Histórico de Operações

- Consulta das operações realizadas por cada usuário (requer autenticação)

---

## Testes Automatizados

O projeto inclui **testes de integração completos**, cobrindo:

- `POST /users`: criação de usuários (inclui validações de unicidade e senha)
- `POST /sessions`: autenticação e gerenciamento de sessão
- `GET /sessions`: verificação de sessão
- `POST /operacoes`: depósito e transferência (com e sem autenticação)
- `GET /operacoes/:userId`: histórico de operações do usuário
- `GET /status`: healthcheck completo da aplicação e banco
- `GET/POST /migrations`: execução e verificação de migrações pendentes

Para rodar os testes:

```bash
npm run test:watch
```

---

## Como rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir infraestrutura com Docker

```bash
npm run services:up
```

> Isso iniciará o banco de dados PostgreSQL com as configurações do arquivo `infra/compose.yaml`.

### 3. Esperar banco e rodar migrações

```bash
npm run services:wait:database
npm run migrations:up
```

### 4. Iniciar aplicação em modo desenvolvimento

```bash
npm run dev
```

---

## Scripts disponíveis

| Comando                     | Descrição                              |
| --------------------------- | -------------------------------------- |
| `npm run dev`               | Inicia app local + serviços via Docker |
| `npm run build`             | Gera build de produção                 |
| `npm run start`             | Inicia build gerado                    |
| `npm run lint`              | Lint com Next                          |
| `npm run migrations:create` | Cria nova migração                     |
| `npm run migrations:up`     | Executa migrações pendentes            |
| `npm run test:watch`        | Roda testes com Jest em modo watch     |
| `npm run services:up`       | Sobe serviços (banco) via Docker       |
| `npm run services:down`     | Para e remove containers               |
| `npm run commit`            | Commit com commitizen padronizado      |

---

## Avaliação técnica

Este projeto foi construído com foco nos seguintes critérios:

- Uso de código limpo e boas práticas (SOLID, modularização)
- Arquitetura baseada em **MVC** (Model-View-Controller)
- Validação de dados e mensagens de erro estruturadas
- Testes de integração robustos
- Segurança básica com autenticação via cookie HttpOnly
- Uso de Docker para simulação do ambiente de produção
- Arquitetura escalável com separação entre API e lógica de domínio

## Autor

**Alexandre Toulios**
🔗 [Link do Github](https://github.com/Lehzinho/acBank)

---

## Observações

- O projeto está em fase inicial (v0.1.0), novas features como **reversão de operações** e **relatórios financeiros** estão em planejamento.
