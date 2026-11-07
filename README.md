# Ajuda Belém

Portal de solicitações de serviços de infraestrutura urbana da Prefeitura de Belém, inspirado no modelo do [SP156](https://www.prefeitura.sp.gov.br/) (São Paulo).

Permite que o cidadão registre ocorrências de infraestrutura (iluminação pública, buracos e pavimentação, saneamento, poda de árvores, limpeza urbana, sinalização de trânsito, entre outras), acompanhe o andamento por número de protocolo e, para a Prefeitura, gerencie e priorize os atendimentos.

## Stack

- [Nuxt 4](https://nuxt.com)
- [Nuxt UI v4](https://ui.nuxt.com) (componentes + Tailwind CSS v4 + ícones + modo escuro)
- TypeScript
- [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (sessão de autenticação própria) + [Drizzle ORM](https://orm.drizzle.team) sobre SQLite (`better-sqlite3`)

Veja o roadmap de construção do projeto, por etapas, em [docs/etapa-iniciais.md](./docs/etapa-iniciais.md).

## Desenvolvimento

```bash
# Instalar dependências
yarn install

# Variáveis de ambiente (copie e ajuste; NUXT_SESSION_PASSWORD é gerada
# automaticamente em dev caso não seja definida)
cp .env.example .env

# Ambiente de desenvolvimento
yarn dev

# Gerar uma nova migração do banco após alterar server/database/schema.ts
yarn db:generate

# Build de produção
yarn build

# Lint
yarn lint

# Testes
yarn test
```

O banco SQLite é criado automaticamente em `.data/ajuda-belem.db` na primeira execução (mesma pasta que o `Dockerfile` monta como volume para persistência).
