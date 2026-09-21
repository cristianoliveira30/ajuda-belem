# Ajuda Belém — Roteiro de construção

Este documento registra as decisões de arquitetura tomadas no início do projeto e o roteiro de etapas para construir o sistema completo. Serve como referência para retomar o trabalho a qualquer momento.

## Objetivo

Construir um portal de solicitações de serviços de infraestrutura urbana para a Prefeitura de Belém, inspirado no [SP156](https://www.prefeitura.sp.gov.br/) (sistema de atendimento ao cidadão da Prefeitura de São Paulo). O sistema deve permitir que o cidadão:

- Registre ocorrências de infraestrutura (iluminação pública, buracos e pavimentação, saneamento, poda de árvores, limpeza urbana, sinalização de trânsito etc.);
- Acompanhe o andamento de cada solicitação por número de protocolo;
- Visualize ocorrências da cidade em um mapa.

E que a Prefeitura (equipe interna) possa:

- Triar, priorizar e atualizar o status das solicitações recebidas;
- Ter uma visão geral (painel) por secretaria/categoria e bairro.

## Etapa 0 — Arquitetura e fundação (concluída)

O repositório havia sido criado a partir do template padrão de **Nuxt Module** (`src/module.ts` com `defineNuxtModule`, uma pasta `playground/` como app de teste do módulo, e um README com textos de placeholder "My Module / Foo / Bar / Baz" nunca preenchidos). Essa estrutura é voltada para quem publica um pacote reutilizável para outros projetos Nuxt instalarem — não para construir uma aplicação própria.

Como o objetivo é entregar um portal de serviços municipais (múltiplas páginas, autenticação, painel administrativo), o repositório foi **convertido para um app Nuxt padrão**:

- Removido: `src/` (módulo), `playground/` (app de teste do módulo), fixtures de teste do módulo.
- Criado: estrutura de app Nuxt 4 (`app/`) com `pages`, `layouts`, `components`, `assets`, na raiz do projeto.
- `package.json` deixou de ser um workspace (`yarn workspaces`) e passou a ser o próprio app.
- `nuxt.config.ts`, `tsconfig.json`, `eslint.config.mjs`, testes (`test/basic.test.ts`) e o workflow de CI (`.github/workflows/ci.yml`) foram ajustados para essa nova estrutura.

### Bibliotecas

Já estavam disponíveis no projeto (via `@nuxt/ui`, que traz várias dependências prontas):

| Biblioteca | Uso |
| --- | --- |
| [Nuxt UI v4](https://ui.nuxt.com) | Biblioteca de componentes (antigo "Nuxt UI Pro" hoje é gratuito/open source) — botões, formulários, tabelas, cards, seções de página prontas (`UPageHero`, `UPageCard`, `UPageCTA` etc.) |
| Tailwind CSS v4 | Estilização utilitária, já integrado pelo Nuxt UI |
| `@nuxt/icon` | Ícones via Iconify |
| `@nuxt/fonts` | Carregamento automático de webfonts |
| `@nuxtjs/color-mode` | Alternância entre tema claro/escuro |
| `@vueuse/core` | Utilitários de composição (usado internamente pelo Nuxt UI) |

Adicionadas nesta etapa:

| Biblioteca | Motivo |
| --- | --- |
| `@iconify-json/lucide` | Conjunto de ícones "lucide" (usado por padrão pelos componentes Nuxt UI) embutido localmente, evitando dependência de rede em build/CI |
| `@nuxt/eslint` | Módulo oficial de lint do Nuxt — gera a config do ESLint automaticamente a partir do projeto (o `eslint.config.mjs` do template apontava para um pacote que nunca havia sido instalado) |
| `eslint` | Necessário para o `@nuxt/eslint` funcionar |

`typescript` foi fixado em `5.9.3` (a versão `^7.0.2` que constava no template ainda não é suportada pelo `typescript-eslint`, o que quebrava o lint).

Adicionada na Etapa 1:

| Biblioteca | Motivo |
| --- | --- |
| `zod` | Validação de dados do formulário/API de solicitações, usada tanto no cliente quanto no servidor a partir do mesmo schema (`shared/utils/validacao.ts`) |

Bibliotecas que **ainda não foram adicionadas** e devem entrar em etapas específicas (evitar instalar antes de precisar):

- Biblioteca de mapas (`maplibre-gl` ou `leaflet`) — Etapa 4.
- Persistência (banco de dados) e autenticação real — Etapa 2, a depender da infraestrutura de backend escolhida (ex.: Nitro + banco gerenciado, ou serviço externo). Na Etapa 1 o armazenamento usa o storage de arquivos do próprio Nitro (`useStorage`), suficiente para desenvolvimento mas não para produção.
- Integração com LLM real (ex.: API da Anthropic) para o assistente de registro de ocorrências — avaliado na Etapa 1 e adiado deliberadamente (ver nota abaixo); entraria como evolução futura opcional.

### Identidade visual

- **Cores**: `primary = azul`, `secondary = vermelho`, `neutral = slate`, configuradas em [app/app.config.ts](../app/app.config.ts) através dos aliases semânticos do Nuxt UI (`ui.colors`). Azul e vermelho foram escolhidos por serem as cores associadas à identidade visual do Pará/Belém, conforme solicitado. Como usam os tokens semânticos do Nuxt UI, todas as variações (hover, foco, contraste em modo escuro) são geradas automaticamente — não há necessidade de definir cada tom manualmente.
- **Tema**: claro é o padrão (`colorMode.preference = 'light'` em `nuxt.config.ts`), com alternância para escuro pelo botão no cabeçalho (`app/components/layout/AppHeader.vue`). Toda a superfície usa as classes semânticas do Nuxt UI (`bg-default`, `text-highlighted`, `text-muted` etc.) em vez de cores fixas, para que o modo escuro funcione automaticamente em qualquer componente novo.
- **Responsividade**: layout construído com utilitários responsivos do Tailwind (`sm:`, `md:`) — menu principal vira um `USlideover` (gaveta) em telas pequenas.

### Estrutura de pastas

```
app/
  app.vue                 # shell da aplicação (layout + página atual)
  app.config.ts           # tema (cores) do Nuxt UI
  assets/css/main.css     # import do Tailwind + Nuxt UI
  layouts/
    default.vue           # header + conteúdo + footer (páginas institucionais)
    chat.vue              # layout minimalista (sem header/footer) usado pelo chat de registro
  components/
    layout/AppHeader.vue  # cabeçalho, navegação, alternância de tema
    layout/AppFooter.vue  # rodapé institucional
    EmConstrucao.vue      # placeholder usado pelas páginas ainda não detalhadas
  pages/
    index.vue             # página inicial
    solicitacoes/
      nova.vue             # chat guiado de registro de ocorrência (Etapa 1)
      acompanhar.vue       # consulta de protocolo com linha do tempo (Etapa 1)
    mapa.vue               # placeholder — Etapa 4
    entrar.vue              # placeholder — Etapa 2
    painel/index.vue        # placeholder — Etapa 3
shared/
  types/solicitacao.ts    # tipos isomórficos (cliente + servidor) da Solicitação
  utils/
    categorias.ts          # lista de categorias de serviço (ícone, label, descrição)
    bairros.ts              # lista de bairros de Belém (sugestão nos campos de endereço)
    status.ts               # rótulos/cores/ícones de status + gerador de protocolo
    validacao.ts             # schema Zod da solicitação, usado no cliente e na API
    deteccaoCategoria.ts      # detecção simples por palavra-chave da categoria a partir do texto livre
server/
  api/solicitacoes/
    index.post.ts           # cria uma solicitação (valida com Zod, gera protocolo único)
    [protocolo].get.ts       # consulta uma solicitação por protocolo
docs/
  etapa-iniciais.md       # este documento
```

A página inicial (`/`) e o fluxo de registro/consulta de solicitação (`/solicitacoes/nova` e `/solicitacoes/acompanhar`) já estão implementados por completo. As demais rotas existem (para a navegação já funcionar de ponta a ponta) mas mostram um aviso "Em construção" apontando a etapa em que serão detalhadas.

---

## Etapa 1 — Registrar e acompanhar ocorrência (concluída)

### Mudança de rumo: formulário → chat guiado

A Etapa 1 começou como um formulário tradicional em passos (categoria → endereço → descrição/fotos → contato), usando `UStepper` do Nuxt UI. Esse formulário foi **substituído por uma interface de chat guiado** (`/solicitacoes/nova`) depois que o usuário compartilhou um protótipo de referência (Figma) com dois prompts detalhados descrevendo a experiência desejada: em vez de preencher campos administrativos, o cidadão conversa com o "Assistente Ajuda Belém", que faz uma pergunta por vez (descrição → foto → localização → ponto de referência → risco percebido → nome/e-mail/telefone → CPF opcional) até montar um resumo para confirmação.

Decisões tomadas com o usuário antes de implementar:

- **Motor do chat**: conversa **roteirizada por regras** (sem LLM), não uma IA real. A detecção de categoria usa correspondência simples de palavras-chave (`shared/utils/deteccaoCategoria.ts`). Uma integração com IA real (ex.: API da Anthropic) exigiria chave de API e geraria custo por uso — fica como evolução futura, não incluída agora.
- **Escopo desta rodada**: apenas a Home e o fluxo de registro foram redesenhados/reconstruídos. As demais telas do protótipo de referência (categorias em grade dedicada, contatos úteis, notícias/avisos completos, perfil do cidadão, dashboard administrativo com gráficos) **não foram construídas** — viraram itens explícitos no roadmap abaixo.
- **Paleta de cores**: mantida a paleta azul/vermelho definida na Etapa 0, e não a paleta verde sugerida nos prompts do protótipo de referência (confirmado com o usuário).
- A localização por GPS usa a API de geolocalização do navegador + geocodificação reversa gratuita do **Nominatim/OpenStreetMap** (sem chave, sem custo) para sugerir rua/bairro; o cidadão sempre pode digitar o endereço manualmente.

### O que foi implementado

- **Home (`/`)**: redesenhada com busca por serviço (filtra os atalhos por palavra-chave), atalhos de categoria que já abrem o chat pré-contextualizado (`?categoria=...`), seção de avisos institucionais (estática, sem backend ainda) e CTA principal "Conversar e registrar problema".
- **Chat de registro (`/solicitacoes/nova`)**: interface própria (layout `chat.vue`, sem header/footer do site) com bolhas de mensagem, indicador de "digitando", respostas rápidas em botão, upload de foto (miniatura na conversa, convertida em base64), captura de localização (GPS + geocodificação reversa ou endereço manual com sugestão de bairros), pergunta de risco percebido, coleta de nome/e-mail/telefone (validados) e CPF opcional, resumo final e confirmação. Ao final, mostra o protocolo com opção de copiar, acompanhar, registrar outro problema ou voltar ao início.
- **Consulta de protocolo (`/solicitacoes/acompanhar`)**: usa `useFetch` (SSR) para já renderizar o resultado quando acessada via link direto (`?protocolo=...`), mostra card com categoria/status/endereço/descrição e uma `UTimeline` com o histórico.
- **API (`server/api/solicitacoes`)**: `POST` valida o corpo com o schema Zod compartilhado, gera um protocolo único (`AAAA` + 6 dígitos) e grava via `useStorage` do Nitro (arquivos em `.data/solicitacoes`, fora do controle de versão); `GET /:protocolo` retorna a solicitação ou 404.
- Status renomeados para o vocabulário do protótipo: **Recebido → Em análise → Encaminhado → Em atendimento → Concluído** (`shared/utils/status.ts`).
- Testado de ponta a ponta em `localhost` (build de produção e `yarn dev`): criação de solicitação, consulta por protocolo (SSR e client-side), categorias, e as páginas placeholder — sem erros de hidratação. Suíte de testes (`yarn test`) cobre a renderização da Home e o ciclo criar→consultar solicitação via API.

### Refinamento visual

Depois da primeira versão, o usuário compartilhou capturas de tela e o script React usado para gerar o protótipo de referência no Figma, pedindo um visual mais elegante mantendo a paleta azul/vermelho (não a paleta verde do protótipo). Isso resultou em um segundo passo de polimento visual sobre as mesmas páginas (sem novas funcionalidades):

- **Tipografia**: fonte "Plus Jakarta Sans" carregada via `@nuxt/fonts` (auto-hospedada, sem chamada a serviço externo em runtime), configurada em `app/assets/css/main.css`.
- **Raio de borda global**: `--ui-radius` aumentado para deixar cards, botões e inputs mais arredondados em todo o app, sem precisar customizar componente por componente.
- **Home**: cabeçalho com gradiente em tons de azul (`primary`), saudação conforme o horário, ilustração decorativa sutil e um card de CTA "branco flutuante" sobreposto à base do gradiente (`-mt-10`) — mesmo recurso visual do protótipo de referência, adaptado à paleta do projeto.
- **Ícones de categoria com tom**: cada categoria recebeu um `tom` (`primary`, `secondary` ou `neutral`, ver `shared/utils/categorias.ts`) usado para colorir o "badge" do ícone, dando variedade visual sem sair da paleta azul/vermelho/neutro.
- **Navegação inferior (mobile)**: novo `app/components/layout/BottomNav.vue`, com 5 abas (Início, Mapa, Protocolos, Avisos, Perfil) inspiradas no protótipo, reaproveitando as rotas já existentes (`Avisos` aponta para a âncora `#avisos` na Home; `Perfil` aponta para `/entrar` até a Etapa 2 existir). Visível apenas em telas pequenas; no desktop a navegação continua pelo cabeçalho.
- **Chat de registro**: avatar do assistente com gradiente, respostas rápidas em formato de pílula (`rounded-full`, contorno azul) e um cartão de confirmação de localização com ícone de pino, aproximando a conversa da referência visual.
- Funcionalidades como gamificação (XP, níveis, badges), modal de termos legais e reCAPTCHA presentes no script de referência **não foram implementadas** — são elementos de produto/negócio que precisam de decisão própria antes de entrar no roadmap (ver observação abaixo).

### Roadmap ampliado (inspirado no protótipo de referência)

O protótipo compartilhado pelo usuário descreve telas adicionais que não faziam parte do escopo original (voltado a infraestrutura). As que são compatíveis com esse escopo foram incorporadas às etapas futuras abaixo; telas de outras secretarias (saúde, educação, transporte, assistência social) ficam fora do escopo deste sistema.

### Etapa 2 — Conta do cidadão e acesso da equipe

Páginas: `entrar.vue`, `cadastro.vue`, `minhas-solicitacoes.vue`, `perfil.vue`.

- Login/cadastro do cidadão (permite ver histórico de solicitações abertas por CPF/e-mail).
- Login separado para servidores da Prefeitura (perfis: atendente, gestor por secretaria).
- Definição do provedor de autenticação (sessão própria via Nitro, ou serviço externo).
- Tela de perfil do cidadão: dados da conta, solicitações em andamento/concluídas, notificações. CPF sempre mascarado (`***.345.678-**`).

### Etapa 3 — Painel administrativo

Páginas: `painel/index.vue` (visão geral), `painel/solicitacoes.vue` (fila/triagem), `painel/solicitacoes/[id].vue` (detalhe e atualização de status).

- Listagem com filtros por categoria, bairro, status e prazo.
- Atribuição de responsável e atualização de status com histórico (usando os status já definidos em `shared/utils/status.ts`).
- Indicadores por secretaria (quantidade aberta, tempo médio de atendimento) — total de solicitações, por categoria, protocolos pendentes, mapa de ocorrências e tabela de demandas recentes.

### Etapa 4 — Mapa de ocorrências

Página: `mapa.vue`.

- Mapa interativo (a definir: MapLibre GL ou Leaflet, com estilo OpenStreetMap) com marcadores por status (recebido, em análise/atendimento, concluído).
- Filtro por categoria e status, reaproveitando os dados da Etapa 1.
- Seleção de ponto no mapa reaproveitada no fluxo de registro (alternativa ao GPS/endereço manual do chat).

### Etapa 5 — Notificações, avaliação, notícias e contatos úteis

- Notificação por e-mail/SMS ao mudar o status de uma solicitação.
- Avaliação do atendimento pelo cidadão ao concluir o protocolo.
- Página de notícias/avisos da Prefeitura com categorias (alerta, zeladoria, obras, infraestrutura), evoluindo a seção estática já presente na Home.
- Página de contatos úteis (ouvidoria, defesa civil, guarda municipal, atendimento presencial).

### Etapa 6 — Acessibilidade, performance e PWA

- Revisão de acessibilidade (contraste, navegação por teclado, leitores de tela) em todas as páginas construídas.
- Otimização de imagens e carregamento.
- Possibilidade de instalar como PWA para uso em campo pelas equipes de rua.

---

Cada etapa deve ser tratada como uma entrega independente: ao iniciar uma etapa, detalhar a página correspondente (layout, componentes, dados) antes de implementar, e atualizar este documento marcando o que foi concluído.
