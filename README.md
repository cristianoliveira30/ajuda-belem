# Ajuda Belém

Portal de solicitações de serviços de infraestrutura urbana da Prefeitura de Belém, inspirado no modelo do [SP156](https://www.prefeitura.sp.gov.br/) (São Paulo).

O cidadão registra ocorrências (iluminação pública, buracos e pavimentação, saneamento, poda de árvores, limpeza urbana, sinalização de trânsito, entre outras), acompanha o andamento pelo número de protocolo e vê as ocorrências no mapa. A Prefeitura, por meio dos servidores e do administrador, gerencia e prioriza os atendimentos em um painel restrito.

## O que o sistema faz

| Quem | Acesso |
| --- | --- |
| Visitante (sem login) | Home, mapa de ocorrências, avisos, contatos úteis e consulta de uma ocorrência pelo protocolo (sem dados pessoais do cidadão) |
| Cidadão | Tudo acima, mais registrar ocorrências pelo assistente (exige login e CPF), ver as próprias ocorrências e editar o perfil |
| Servidor | Painel em `/painel`: dashboard com indicadores e gráficos, fila de atendimento e atualização de status das ocorrências |
| Administrador | Tudo do servidor, mais a gestão das contas de servidor em `/painel/servidores` (criar, ativar e desativar) |

O dashboard com os números agregados **não é público**: a API (`GET /api/dashboard`) devolve 401 sem login e 403 para cidadão.

Regras do cadastro de cidadão:

- CPF obrigatório, com os dois dígitos verificadores validados, e único por conta. A validação é feita no servidor, não só na tela.
- Senha com no mínimo 6 caracteres, com letra e número.
- Telefone opcional, mas, se informado, precisa ter DDD (10 ou 11 dígitos).
- Também é possível entrar com Google (opcional, ver [Login com Google](#login-com-google-opcional)). Nesse caso o CPF é pedido depois, em `/perfil`.
- Servidores não se cadastram sozinhos: a conta é criada pelo administrador e exige troca de senha no primeiro acesso.

## Tecnologias

- [Nuxt 4](https://nuxt.com) e TypeScript
- [Nuxt UI v4](https://ui.nuxt.com) (componentes, Tailwind CSS v4, ícones e modo escuro)
- [Better Auth](https://better-auth.com) + PostgreSQL 16 (autenticação e contas)
- [ApexCharts](https://apexcharts.com) (gráficos do painel)
- [Leaflet](https://leafletjs.com) + OpenStreetMap (mapa)
- PWA instalável (`@vite-pwa/nuxt`)
- [Zod](https://zod.dev) (validação) e [Vitest](https://vitest.dev) (testes)
- Docker e Docker Compose

## Como executar

### Opção 1: com Docker (recomendada)

Só precisa de **Docker com Compose v2**. Não é preciso instalar Node, Yarn nem Postgres.

```bash
# 1. Variáveis de ambiente. Gera um BETTER_AUTH_SECRET aleatório (Linux/macOS/WSL).
#    No Windows sem WSL, copie o arquivo e preencha BETTER_AUTH_SECRET à mão com qualquer texto longo.
cp .env.example .env
sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" .env

# 2. Sobe o Postgres e o app em modo desenvolvimento (a primeira vez demora, pois constrói a imagem)
docker compose --profile dev up -d --build dev

# 3. Cria as tabelas do Better Auth no banco
docker compose run --rm migrate

# 4. Carrega os dados de demonstração (4 contas + 100 ocorrências)
docker compose exec dev yarn db:seed
```

Abra <http://localhost:3000> e entre com uma das [contas de demonstração](#contas-de-demonstração).

A primeira abertura de cada página em modo dev pode levar alguns segundos, porque o Nuxt compila sob demanda. Para acompanhar o log: `docker compose logs -f dev`.

Para parar:

```bash
docker compose --profile dev down        # mantém o banco
docker compose --profile dev down -v     # apaga também o banco (recomeça do zero)
rm -rf .data                             # apaga as ocorrências (ficam em arquivos, ver "Limitações")
```

Se mudar `server/utils/auth.ts`, rode o passo 3 de novo.

### Opção 2: sem Docker para o app (Node local)

Precisa de **Node 24** e **Yarn 4** (`corepack enable`) e de um Postgres. O Postgres pode vir do Docker (`docker compose up -d db`, que expõe a porta **5433**) ou ser um já instalado, ajustando `DATABASE_URL`.

```bash
cp .env.example .env            # preencha BETTER_AUTH_SECRET
docker compose up -d db         # só o banco, na porta 5433
yarn install
yarn db:migrate                 # cria as tabelas
DATABASE_URL=postgres://ajuda_belem:ajuda_belem@localhost:5433/ajuda_belem yarn db:seed
yarn dev                        # http://localhost:3000
```

O `yarn db:seed` não lê o `.env`; por isso o `DATABASE_URL` vai na frente do comando.

### Contas de demonstração

Criadas pelo `yarn db:seed`. Todas usam a senha `Belem123` (apenas para demonstração; o seed se recusa a rodar com `NODE_ENV=production`).

| E-mail | Papel | O que testar |
| --- | --- | --- |
| `admin@ajudabelem.local` | Administrador | `/painel` (dashboard), `/painel/servidores` (criar e desativar servidores), todas as ocorrências |
| `servidor.obras@ajudabelem.local` | Servidor (Secretaria de Obras) | `/painel/solicitacoes`: atualizar o status das ocorrências |
| `servidor.limpeza@ajudabelem.local` | Servidor (Secretaria de Limpeza Urbana) | Mesma fila de atendimento |
| `cidadao@ajudabelem.local` | Cidadão | Registrar ocorrência, acompanhar por protocolo, editar perfil |

Depois do login, cada papel cai na sua tela: administrador em `/painel`, servidor em `/painel/solicitacoes` e cidadão em `/perfil`.

Para testar o **cadastro** em `/cadastro`, use um CPF válido (por exemplo, de um gerador de CPF de teste) e uma senha com letra e número. Um CPF já usado em outra conta é recusado.

### Roteiro sugerido para avaliar

1. Na home, sem login, confira que **não** há indicadores: o dashboard é restrito.
2. Entre como `cidadao@ajudabelem.local`, clique em "Contar um problema" e registre uma ocorrência pelo assistente. Anote o protocolo.
3. Consulte o protocolo na home (sem login) e veja a ocorrência no `/mapa`.
4. Saia, entre como `servidor.obras@ajudabelem.local`, abra `/painel/solicitacoes`, ache a ocorrência e mude o status.
5. Em `/painel`, veja os KPIs e os gráficos, e o filtro de período.
6. Entre como `admin@ajudabelem.local` e crie um servidor em `/painel/servidores`. No primeiro acesso dele, o sistema exige trocar a senha.
7. Como cidadão, tente abrir `/painel`: você é redirecionado, e `GET /api/dashboard` responde 403.

## Testes e qualidade

```bash
yarn lint
yarn test
```

Os testes ([test/basic.test.ts](./test/basic.test.ts)) sobem o app e fazem requisições reais, então precisam do Postgres no ar, das tabelas criadas (`yarn db:migrate`) e do `.env` preenchido. Cobrem, entre outros pontos: exigência de login para registrar ocorrência, ocultação de dados pessoais na consulta pública, bloqueio de payloads com XSS/SQL, regras do cadastro (nome, telefone, CPF) e restrição do dashboard. Os testes apagam as ocorrências que criam.

Com Docker: `docker compose exec dev yarn test`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` / `yarn preview` | Build de produção e pré-visualização |
| `yarn lint` | ESLint |
| `yarn test` | Testes (Vitest) |
| `yarn db:migrate` | Cria/atualiza as tabelas do Better Auth |
| `yarn db:seed` | Dados de demonstração |

## Estrutura do projeto

```
app/          Interface (Nuxt): páginas, componentes, layouts, middlewares e composables
server/api/   Rotas da API (solicitações, painel, admin, perfil, dashboard, mapa)
server/utils/ Configuração do Better Auth e controle de acesso (exigirServidor/exigirAdmin)
shared/       Tipos e validações usados pelo front e pelo back (CPF, senha, schemas Zod)
db/           schema.sql (referência), seed.mjs e o fixture das 100 ocorrências
test/         Testes
docs/         Histórico de desenvolvimento por etapas
```

## Banco de dados e armazenamento

- **Postgres:** contas e sessões (tabelas `user`, `account`, `session`, `verification` do Better Auth). O `db/schema.sql` é só referência; a fonte da verdade é a configuração em [server/utils/auth.ts](./server/utils/auth.ts), aplicada por `yarn db:migrate`.
- **Arquivos JSON** em `.data/solicitacoes`: as ocorrências. Foi uma escolha de simplicidade para o trabalho (ver Limitações).

## Limitações conhecidas

- As ocorrências ficam em arquivos locais, não no Postgres. Serve para o escopo do trabalho, mas um sistema real usaria o banco.
- O e-mail do cadastro não é verificado por mensagem de confirmação.
- As fotos do seed são do Wikimedia Commons e não retratam Belém. Autoria e licenças em [public/seed/fotos/CREDITOS.md](./public/seed/fotos/CREDITOS.md).
- O mapa público mostra de cada ocorrência o protocolo, a categoria, a rua, o bairro, as coordenadas, o status e a descrição. Nome, e-mail, telefone e CPF do cidadão ficam de fora, mas a descrição é texto livre digitado por ele.

## Login com Google (opcional)

O botão "Continuar com Google" só funciona com credenciais OAuth. Sem elas, o resto do sistema funciona normalmente e o botão apenas falha ao tentar entrar. Para ativar, crie um OAuth Client (tipo "Web application") no Google Cloud Console, cadastre `http://localhost:3000/api/auth/callback/google` como URI de redirecionamento e preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.

## Produção com Docker

```bash
cp .env.example .env            # preencha BETTER_AUTH_SECRET
docker compose up -d --build    # app (porta 3000) + Postgres
docker compose run --rm migrate
```

O `Dockerfile` usa build em dois estágios: o primeiro instala as dependências e roda `yarn build`; o segundo copia só o `.output` e instala as dependências de runtime. Os volumes `db-data` (Postgres) e `app-data` (ocorrências em `/app/.data`) preservam os dados entre execuções. O seed não roda em produção por segurança; para avaliar com dados de demonstração, use a Opção 1.

## Problemas comuns

| Sintoma | Causa e solução |
| --- | --- |
| `defina BETTER_AUTH_SECRET no .env` ao subir o Docker | O `.env` não existe ou está com `BETTER_AUTH_SECRET` vazio. Refaça o passo 1. |
| Login ou cadastro dá erro de servidor | As tabelas não existem. Rode `docker compose run --rm migrate`. |
| Login recusa as contas de demonstração | O seed não foi executado. Rode `docker compose exec dev yarn db:seed`. |
| Porta 3000 ou 5433 já em uso | Pare o outro serviço que usa a porta, ou mude o mapeamento em `docker-compose.yml`. |
| Quero recomeçar do zero | `docker compose --profile dev down -v` e `rm -rf .data`, depois refaça os passos 2 a 4. |

## Documentação adicional

O histórico de desenvolvimento por etapas está em [docs/etapa-iniciais.md](./docs/etapa-iniciais.md). As primeiras etapas usaram Supabase, que depois foi substituído pelo Better Auth; vale a leitura como registro de decisões, não como descrição do estado atual.
