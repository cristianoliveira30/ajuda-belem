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

### Etapa 2 — Conta do cidadão e acesso da equipe (em andamento)

Decisões tomadas com o usuário: autenticação via **Supabase Auth** (serviço externo, plano free — também resolve a limitação de a solicitação ficar só em arquivo local, já que o Supabase inclui um Postgres) em vez de sessão própria via Nitro; e o login de servidores da Prefeitura entra já nesta etapa (não esperar a Etapa 3).

O que foi implementado:

- **`@nuxtjs/supabase`** instalado e configurado em `nuxt.config.ts`, com redirecionamento automático (para `/entrar`) apenas nas rotas protegidas (`/perfil`, `/minhas-solicitacoes`, `/painel`). As demais rotas continuam públicas.
- **`supabase/schema.sql`**: script único para colar no SQL Editor do Supabase. Cria a tabela `profiles` (nome, cpf, telefone, papel `cidadao`/`servidor`, secretaria), políticas de RLS (cada um vê o próprio perfil; servidores veem todos) e um trigger que cria o perfil automaticamente no cadastro.
- **`/cadastro`**: cadastro público de cidadão (nome, e-mail, telefone, CPF opcional, senha). Contas de **servidor não têm cadastro público** nesta etapa — são criadas manualmente no Supabase (instruções no fim do `schema.sql`), já que o painel que as gerenciaria só existe na Etapa 3.
- **`/entrar`**: login único para cidadão e servidor; após autenticar, verifica o `papel` no perfil e redireciona para `/painel` (servidor) ou `/perfil` (cidadão).
- **`/perfil`**: dados da conta, CPF sempre mascarado (`***.345.678-**`, ver `shared/utils/cpf.ts`), atalho para "Minhas solicitações" (ou para o painel, se servidor) e botão de sair.
- **`/minhas-solicitacoes`**: lista as solicitações do usuário logado. Como as solicitações continuam no armazenamento em arquivo (não foram migradas para o Postgres nesta etapa, para não somar duas mudanças grandes de uma vez), o filtro é feito por e-mail no servidor (`server/api/minhas-solicitacoes.get.ts`), usando o e-mail da sessão autenticada (nunca um valor vindo do cliente).
- **`/painel`**: protegido por um middleware (`app/middleware/servidor.ts`) que só libera acesso para contas com `papel = 'servidor'`. O conteúdo do painel em si foi construído na Etapa 3, abaixo.
- Cabeçalho e navegação inferior atualizados para refletir se há uma sessão ativa.

**Pendente do lado do usuário**: o app só funciona de verdade com um projeto Supabase real. Crie um projeto em [supabase.com](https://supabase.com), rode `supabase/schema.sql` no SQL Editor, copie a Project URL e a anon key (Project Settings → API) para um `.env` local (ver `.env.example`) com `NUXT_PUBLIC_SUPABASE_URL` e `NUXT_PUBLIC_SUPABASE_KEY`. Sem isso, o app usa valores de placeholder só para não quebrar o SSR das páginas públicas — login e cadastro não funcionam de verdade até as chaves reais serem configuradas.

Fica para depois (fora do escopo desta etapa): recuperação de senha, notificações, e a migração das solicitações do armazenamento em arquivo para uma tabela no Postgres do Supabase (unificaria os dois bancos e permitiria consultas mais ricas no painel da Etapa 3).

### Etapa 3 — Painel administrativo (concluída)

O painel usa um layout de dashboard próprio (`app/layouts/painel.vue`, com `UDashboardGroup`/`UDashboardSidebar`/`UDashboardPanel` do Nuxt UI — sidebar com navegação, dados do servidor logado e botão de sair), separado do layout público do site.

- **`/painel`**: visão geral — total de solicitações, quantidade por status (recebidas / em andamento / concluídas), quebra por categoria e uma lista das solicitações mais recentes.
- **`/painel/solicitacoes`**: listagem de todas as solicitações com filtros por categoria, status e bairro (filtrados no cliente sobre os dados carregados — dataset pequeno, arquivo local).
- **`/painel/solicitacoes/[protocolo]`**: detalhe completo (endereço, descrição, fotos, contato, CPF mascarado, risco percebido) e histórico (`UTimeline`), com um formulário para atualizar o status (novo status + responsável + mensagem), que grava uma nova entrada no histórico.
- Novo status **"Encaminhado"** já estava no vocabulário (`shared/utils/status.ts`, Etapa 1); o campo `responsavel` foi adicionado à `Solicitacao` para registrar quem/qual secretaria está tratando o caso.
- **Segurança**: a proteção de página (middleware `servidor`) é só uma camada de UX. As rotas de API (`server/api/painel/**`) verificam a sessão e o papel de novo no servidor, via o helper `server/utils/exigirServidor.ts` — testado retornando 401 sem sessão e 403 para quem não é servidor.

Fora do escopo desta etapa (fica para quando fizer sentido): tempo médio de atendimento por secretaria (precisa de mais dados históricos reais para ser útil), mapa de ocorrências no painel (depende da Etapa 4), e a migração das solicitações para uma tabela Postgres — enquanto isso não acontece, a listagem do painel carrega todos os arquivos de uma vez, o que não escala além de um volume pequeno de solicitações.

### Etapa 4 — Mapa de ocorrências (concluída)

- **Biblioteca escolhida: Leaflet** (`leaflet` + `@types/leaflet`) com tiles do OpenStreetMap (`tile.openstreetmap.org`, gratuito, sem chave) — mais simples que MapLibre GL para o que era necessário aqui (marcadores + popup). O componente (`app/components/MapaOcorrencias.vue`) carrega a biblioteca dinamicamente (`import('leaflet')`) só no cliente, já que ela manipula o DOM diretamente e não deve entrar no bundle de SSR.
- **Coordenadas**: as solicitações não guardavam latitude/longitude até agora (só endereço em texto). O chat de registro (`solicitacoes/nova.vue`) passou a salvar as coordenadas quando o cidadão usa "Usar minha localização atual" (já vinham do GPS, só não eram guardadas) e, quando o endereço é digitado manualmente, faz uma geocodificação (busca) via Nominatim antes de enviar — best-effort: se não encontrar, a solicitação é registrada normalmente, só não aparece no mapa. Solicitações registradas antes desta etapa não têm coordenadas e não aparecem no mapa.
- **`/mapa`**: filtros por categoria e status, marcadores coloridos por status (mesma paleta do restante do sistema) com popup (categoria, bairro, protocolo, link para acompanhar) e legenda.
- **`GET /api/mapa/ocorrencias`**: endpoint público, mas só retorna campos de interesse coletivo (categoria, bairro, rua, status, descrição, coordenadas, protocolo) — nunca nome, e-mail, telefone ou CPF do cidadão.
- Não implementado (fica para quando fizer sentido): seleção de ponto no mapa como alternativa ao GPS/endereço digitado dentro do próprio chat, e o mapa dentro do painel administrativo (Etapa 3 ficou só com a listagem e o resumo por categoria).

### Etapa 5 — Avaliação, notícias e contatos úteis (concluída)

Decisão tomada com o usuário: **sem envio real de e-mail/SMS por agora** — notificação por SMS quase certamente exigiria uma conta paga (Twilio ou similar); e-mail teria uma opção gratuita viável (Resend), mas ficou fora desta rodada para não depender de mais uma conta/chave externa. O andamento continua visível em `/minhas-solicitacoes` e `/solicitacoes/acompanhar`.

O que foi implementado:

- **Avaliação do atendimento**: quando a solicitação está com status "Concluído", `/solicitacoes/acompanhar` mostra um formulário de 1 a 5 estrelas (`UInputRating`) + comentário opcional. Guardado no campo `avaliacao` da própria `Solicitacao`. O endpoint (`server/api/solicitacoes/[protocolo]/avaliacao.post.ts`) rejeita avaliações de solicitações que ainda não foram concluídas.
- **`/avisos`**: evolução da seção estática da Home para uma página completa, com abas de filtro por categoria (Alerta, Zeladoria, Obras, Infraestrutura). Conteúdo estático por enquanto (`shared/utils/avisos.ts`) — não há painel para a Prefeitura publicar avisos de verdade ainda.
- **`/contatos`**: números de emergência nacionais (190/192/193/199, informação pública e estável) e contatos da Prefeitura (Ouvidoria, Guarda Municipal, atendimento presencial) — estes últimos marcados com um badge "Exemplo" porque são **dados fictícios**: não inventei números reais da Prefeitura de Belém para não apresentar informação errada como se fosse oficial. Substituir por dados reais antes de qualquer uso fora deste projeto de estudo.
- Navegação (cabeçalho, rodapé, barra inferior) atualizada com links para as páginas novas.

Fica para depois: notificação real por e-mail (Resend) ou SMS, e uma tela no painel administrativo para a própria Prefeitura cadastrar avisos (hoje é preciso editar `shared/utils/avisos.ts` no código).

### Etapa 6 — Acessibilidade, performance e PWA (concluída)

- **Acessibilidade**: link "Pular para o conteúdo" (visível ao navegar por teclado) no layout público; `aria-label` nos botões que só têm ícone; `role="status"` + texto para leitor de tela no indicador "digitando" do chat, com `motion-reduce:animate-none` para quem desativou animações no sistema; a lista de mensagens do chat usa `aria-live="polite"` para que novas mensagens sejam anunciadas; anel de foco visível (`focus-visible:ring`) nos cards/links que não são componentes do Nuxt UI (a maior parte já vem com foco acessível de fábrica); todas as imagens de fotos enviadas têm texto alternativo. **Isso é uma revisão pontual, não uma auditoria completa** — não tenho como rodar Lighthouse/axe ou testar com leitor de tela de verdade neste ambiente; recomendo rodar uma auditoria automatizada antes de considerar isso resolvido.
- **Performance**: fotos enviadas no chat agora são redimensionadas no navegador (máx. 1280px, JPEG 75%) antes de virar base64 — antes, uma foto de celular de vários MB ia inteira para o JSON da solicitação; `/avisos` e `/contatos` ganharam cache (`routeRules` com `swr`), já que o conteúdo é estático.
- **PWA**: `@vite-pwa/nuxt` configurado — manifesto (`Ajuda Belém`, cor `#2563eb`, ícones em `public/icons/`, gerados uma única vez com `sharp` a partir de um SVG simples com o mesmo emblema "AB" do cabeçalho) e service worker que cacheia só os arquivos estáticos da build (JS/CSS/fontes) via Workbox — **nunca respostas de API**, para não arriscar mostrar status de solicitação desatualizado como se fosse atual quando o cidadão estiver offline. O ícone/manifesto real da Prefeitura (se houver identidade visual oficial) deve substituir os arquivos em `public/icons/`.

Fica para depois: auditoria de acessibilidade com ferramenta automatizada (Lighthouse/axe) e teste com leitor de tela real; e — se fizer sentido para o caso de uso de "equipes de rua" — cache offline dos dados já carregados (ex.: uma solicitação já aberta na tela continuar visível sem internet), o que exigiria decidir deliberadamente quando mostrar dado desatualizado.

## Revisão de segurança pós-Etapa 6

Depois de fechar as 6 etapas, uma revisão geral do diff (7 agentes em paralelo, cada um olhando o código por um ângulo diferente — correção, duplicação, eficiência, comportamento removido) encontrou dois problemas reais que foram corrigidos na hora:

- **`GET /api/solicitacoes/[protocolo]` vazava dados pessoais sem login**: a rota pública de consulta por protocolo devolvia o registro inteiro, incluindo nome, e-mail, telefone e CPF sem mascarar. Como o protocolo é só `${ano}${6 dígitos}` (~900 mil combinações por ano, sem limite de tentativas), qualquer um poderia varrer a faixa de números e coletar dados pessoais de todo mundo. Corrigido: essa rota agora devolve `SolicitacaoPublica` (tudo, menos nome/e-mail/telefone/CPF — ver `shared/types/solicitacao.ts`); a página `/solicitacoes/acompanhar` nunca exibia esses campos mesmo, então não mudou nada visualmente. O painel administrativo, que precisa dos dados de contato, ganhou sua própria rota autenticada (`GET /api/painel/solicitacoes/[protocolo]`, protegida por `exigirServidor`).
- **Avaliação do atendimento podia ser sobrescrita por qualquer um**: `POST /api/solicitacoes/[protocolo]/avaliacao` não checava se já existia uma avaliação antes de gravar por cima. Corrigido: a rota agora responde `409` se a solicitação já tiver sido avaliada.

Também corrigidos, de menor gravidade: `/entrar` e `/cadastro` tinham `try/finally` sem `catch` — uma falha de rede fazia a tela voltar ao normal sem nenhuma mensagem de erro; e `usePerfil()` engolia erros de consulta ao Supabase, então um perfil ausente ou uma falha de RLS resultava em `/perfil` em branco sem explicação — agora mostra uma mensagem com botão de "Tentar novamente".

Um teste automatizado (`test/basic.test.ts`) foi adicionado especificamente para não deixar o vazamento de dados pessoais voltar despercebido.

Ficaram identificados, mas não corrigidos nesta rodada (são duplicação/eficiência, não bugs de segurança): a checagem "é servidor?" está reimplementada em três lugares (`app/middleware/servidor.ts`, `server/utils/exigirServidor.ts`, `app/pages/entrar.vue`); três rotas de API fazem a mesma varredura completa do armazenamento de arquivos a cada chamada, sem paginação ou cache; e a geração de protocolo tem uma corrida rara (TOCTOU) que poderia, em teoria, sobrescrever uma solicitação sob envios simultâneos. Vale revisar antes de qualquer uso em produção real.

## Detecção de XSS/SQL injection nos formulários + XSS real corrigido no mapa

Pedido do usuário: avisar o cidadão/servidor quando o texto digitado parecer um ataque (XSS ou injeção de SQL), em vez de só rejeitar silenciosamente.

Duas coisas importantes de contexto técnico, para não dar a impressão de que isso "resolve" XSS/SQLi por si só:

- **SQL injection não tem superfície de ataque neste projeto**: não existe SQL bruto em lugar nenhum do código. As solicitações ficam em arquivo (`useStorage`), e as consultas ao banco de autenticação passam pelo query builder do Better Auth (Kysely internamente, ver nota sobre a migração de Supabase para Postgres mais abaixo), que já é imune a injeção por construção — não porque alguém escreveu uma defesa, mas porque nunca se concatena string de SQL. A checagem abaixo é só uma camada extra de aviso, não a proteção real.
- **XSS reflexivo/armazenado via `{{ }}` do Vue já não existe**: o Vue escapa toda interpolação por padrão. Só uma vulnerabilidade real foi encontrada e corrigida: o popup do mapa de ocorrências (`app/components/MapaOcorrencias.vue`) montava HTML via *template string* usando `bairro` (texto que o cidadão digita livremente no chat) direto no `innerHTML` do Leaflet — um bairro como `<img src=x onerror=...>` executaria para qualquer um vendo `/mapa`. Corrigido construindo o popup via DOM (`textContent`) em vez de string de HTML.

O que foi adicionado (`shared/utils/segurancaEntrada.ts`): uma checagem por padrões (tags `<script>`/`<iframe>`, atributos `on*=`, `javascript:`, e padrões clássicos de SQLi como `' OR '1'='1`, `UNION SELECT`, `; --`) aplicada nos campos de texto livre — descrição, referência, endereço e nome no chat de registro; comentário da avaliação; mensagem e responsável no painel; nome/telefone no cadastro. Quando detectado, mostra uma mensagem explicando o motivo e bloqueia o envio. A mesma checagem roda de novo no servidor (`server/api/solicitacoes/index.post.ts`, `.../avaliacao.post.ts`, `server/api/painel/solicitacoes/[protocolo].patch.ts`), já que a checagem no cliente pode ser contornada por quem chama a API direto.

É uma heurística: texto legítimo cheio de pontuação incomum pode eventualmente disparar um falso positivo, e alguém determinado pode escrever um payload que não bate com nenhum padrão. Testado (incluído em `test/basic.test.ts`): payload com `<script>` é rejeitado, payload com `' OR '1'='1` é rejeitado, e texto legítimo com apóstrofo (`"a rua d'Oliveira"`) passa normalmente.

## Migração de Supabase para PostgreSQL próprio + Better Auth

Pedido do usuário: tirar a dependência do Supabase (serviço externo hospedado) e usar uma imagem PostgreSQL normal, própria do projeto.

O Supabase, desde a Etapa 2, cobria duas coisas ao mesmo tempo: autenticação (Supabase Auth) e o banco Postgres por trás da tabela `profiles`. As solicitações em si nunca usaram Supabase — sempre ficaram no storage de arquivo do Nitro (ver Etapa 1/3). Decisões tomadas com o usuário antes de implementar:

- **Autenticação**: [Better Auth](https://better-auth.com) no lugar do Supabase Auth — biblioteca open source que roda dentro do próprio Nitro (rota catch-all `server/api/auth/[...all].ts`), sem depender de um serviço externo. Guarda usuário/sessão/senha (hash) no Postgres próprio.
- **Infraestrutura**: `docker-compose.yml` com um serviço `db` (`postgres:16-alpine`, volume nomeado `db-data`) e um serviço `app` (build do `Dockerfile` existente, volume `app-data` para as solicitações). `docker compose up -d` sobe os dois. Um terceiro serviço, `migrate` (`profiles: ['tools']`, não sobe com `up`), builda a partir do estágio intermediário `build` do `Dockerfile` — que ainda tem yarn/node_modules/código-fonte, ao contrário do estágio `runtime` final usado pelo `app` — só para rodar `yarn db:migrate` sem precisar de Node/Yarn instalado no host: `docker compose run --rm migrate`.

O que mudou:

- **`supabase/schema.sql`** (tabela `profiles`, RLS, trigger `handle_new_user` ligados a `auth.users`/`auth.uid()` do Supabase) foi removido. No lugar, **`server/utils/auth.ts`** configura o Better Auth com `emailAndPassword` habilitado e campos extra no próprio `user` (`papel`, `cpf`, `telefone`, `secretaria`) via `user.additionalFields` — substitui a tabela `profiles` separada, já que o Better Auth guarda tudo na sua própria tabela `user`. O campo `papel` tem `input: false` (não pode ser setado pelo cliente no cadastro) e `defaultValue: 'cidadao'`, replicando a mesma regra do Supabase: **não há cadastro público de servidor**, contas são promovidas manualmente no banco (`update "user" set papel = 'servidor', ...`, documentado no topo de **`db/schema.sql`**, um arquivo gerado por referência — a fonte da verdade é a config do Better Auth aplicada via `yarn db:migrate`, novo script do `package.json`).
- A proteção de rotas que o módulo `@nuxtjs/supabase` fazia automaticamente (`redirect`/`redirectOptions`) virou um middleware próprio, **`app/middleware/auth.global.ts`**, que exige sessão para `/perfil`, `/minhas-solicitacoes` e `/painel/**`. `app/middleware/servidor.ts` continua fazendo a checagem extra de `papel === 'servidor'` para `/painel`, agora lendo a sessão do Better Auth.
- No servidor, `server/utils/exigirServidor.ts` trocou `serverSupabaseUser`/`serverSupabaseClient` (`#supabase/server`) por `auth.api.getSession({ headers: event.headers })`. Mesmo contrato (401 sem sessão, 403 se não for servidor) usado por `server/api/painel/**`.
- No cliente, `useSupabaseUser()`/`useSupabaseClient()` viraram: `app/composables/useSessao.ts` (wrapper fino sobre `GET /api/auth/get-session` com uma `key` fixa, para o Nuxt reaproveitar a mesma resposta entre middleware/cabeçalho/página em vez de uma requisição por consumidor) para leitura de sessão, e `app/utils/auth-client.ts` (`authClient`, cliente `better-auth/vue`) para as ações (`signIn.email`, `signUp.email`, `signOut`). `usePerfil()` foi reescrito para derivar o perfil direto da sessão (que já inclui `papel`/`cpf`/`telefone`/`secretaria` via `additionalFields`), sem precisar de uma segunda consulta a uma tabela `profiles` separada como antes.
- **Efeito colateral simplificador**: como o Better Auth (self-hosted) não manda e-mail de confirmação por padrão — e o projeto já havia decidido na Etapa 5 não integrar envio de e-mail —, o cadastro (`/cadastro`) loga o cidadão na hora, sem a etapa intermediária de "aguardando confirmação" que existia com o Supabase Auth (que dependia de confirmação por e-mail habilitada no projeto).
- O aviso "Supabase não configurado" em `/entrar` e `/cadastro` (fallback de placeholder para o app não quebrar em SSR sem `.env`) foi removido — sem equivalente direto no novo modelo, já que não há mais uma URL/chave de projeto hospedado para validar; erros de conexão com o Postgres continuam tratados pelo `catch` genérico de cada formulário.

Testado manualmente (fora do app, com um Postgres descartável via Docker): `yarn db:migrate` cria as tabelas (`user`, `session`, `account`, `verification`) a partir de `server/utils/auth.ts`; cadastro via `auth.api.signUpEmail` confirma que `papel` sempre volta `'cidadao'` mesmo tentando enviar `papel: 'servidor'` no corpo da requisição (o `input: false` bloqueia).

Fica para depois: os testes automatizados (`test/basic.test.ts`) não cobrem o fluxo de autenticação (nunca cobriram, mesmo com Supabase) — depende de um Postgres disponível no CI, avaliar se vale a pena antes de qualquer uso em produção real.

### Dockerfile de desenvolvimento

Pedido do usuário, na sequência da migração acima: rodar o projeto inteiro (app + Postgres) via Docker também para desenvolvimento com hot-reload, sem precisar de Node/Yarn instalados na máquina — até então o `Dockerfile` só servia para builds de produção.

- **`Dockerfile.dev`**: imagem que só instala as dependências (`yarn install`); não copia o código-fonte — quem fornece o código é o bind mount do serviço `dev` no `docker-compose.yml` (`.:/app`), então editar um arquivo local já reflete no container, sem rebuild de imagem. `node_modules` fica de fora do bind mount (volume anônimo `/app/node_modules`) para não ser sobrescrito pelo `node_modules` do host (que pode nem existir).
- **Serviço `dev`** no `docker-compose.yml`, atrás de `profiles: ['dev']` (não sobe com `docker compose up` puro, que continua subindo `app`/produção como antes) — sobe com `docker compose --profile dev up dev`. Reaproveita o `db` já existente (mesmo `depends_on: service_healthy`).
- As variáveis `DATABASE_URL`/`BETTER_AUTH_SECRET`, antes repetidas em `app` e `migrate`, viraram uma âncora YAML (`x-auth-env`) reaproveitada pelos três serviços (`app`, `dev`, `migrate`).

Testado manualmente: `docker compose --profile dev up dev` sobe o Nuxt dev server dentro do container (`http://localhost:3000`); editar um texto em `app/pages/index.vue` no host apareceu no HTML servido pelo container quase na hora (log `✔ Vite server hmr ... files in Nms`), confirmando que o bind mount + HMR funcionam de ponta a ponta.

---

Cada etapa deve ser tratada como uma entrega independente: ao iniciar uma etapa, detalhar a página correspondente (layout, componentes, dados) antes de implementar, e atualizar este documento marcando o que foi concluído.
