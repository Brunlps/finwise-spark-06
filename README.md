# GerFinance — Frontend

Frontend do GerFinance, um sistema de gerenciamento financeiro pessoal.

## Tecnologias

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Rodando localmente

Pré-requisito: Node.js & npm instalados ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre na pasta do projeto
cd finwise-spark-06

# 3. Instale as dependências
npm i

# 4. Configure a URL da API (backend)
cp .env.example .env.local
# edite .env.local e ajuste VITE_API_URL se necessário

# 5. Suba o servidor de desenvolvimento
npm run dev
```

O app fica disponível em `http://localhost:8080`.

## Testes

```sh
npm run test
```
