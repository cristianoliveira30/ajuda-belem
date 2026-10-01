<script setup lang="ts">
import type { DashboardResposta } from '#shared/types/dashboard'

const protocolo = ref('')
const busca = ref('')
const router = useRouter()
const { data: sessao } = useSessao()

// Dashboard de transparência ("Belém em números") — endpoint público e
// agregado, mesmo usado pelo painel (ver server/api/dashboard.get.ts e
// app/components/dashboard/GraficosAnaliticos.vue). Se falhar, o resto da
// home continua funcionando normalmente — só essa seção fica indisponível.
const periodo = ref('todos')
const { data: dashboard, status: statusDashboard, error: erroDashboard } = await useFetch<DashboardResposta>('/api/dashboard', {
  query: { periodo },
})
const carregandoDashboard = computed(() => statusDashboard.value === 'pending')

function consultarProtocolo() {
  if (!protocolo.value.trim())
    return

  router.push({ path: '/solicitacoes/acompanhar', query: { protocolo: protocolo.value.trim() } })
}

// Calculado só no navegador: o servidor roda em UTC (dentro do Docker),
// então "a hora agora" no servidor quase nunca bate com o horário local de
// quem está acessando — isso gerava um "Hydration text content mismatch" no
// Vue (texto renderizado no servidor diferente do esperado no cliente), que
// descartava e remontava o resto da árvore a partir daqui — incluindo a
// seção do dashboard logo abaixo, o que deixava os gráficos sem conseguir
// se conectar ao elemento na tela a tempo de desenhar.
const saudacao = ref('Olá')
onMounted(() => {
  const hora = new Date().getHours()
  if (hora < 12)
    saudacao.value = 'Bom dia'
  else if (hora < 18)
    saudacao.value = 'Boa tarde'
  else
    saudacao.value = 'Boa noite'
})

const servicosFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo)
    return CATEGORIAS

  return CATEGORIAS.filter(categoria =>
    categoria.label.toLowerCase().includes(termo) || categoria.description.toLowerCase().includes(termo),
  )
})

const avisosRecentes = AVISOS.slice(0, 3)

const passos = [
  {
    title: '1. Conte o que aconteceu',
    description: 'Converse com o assistente, envie uma foto e a localização do problema.',
    icon: 'i-lucide-message-circle',
  },
  {
    title: '2. Acompanhe pelo protocolo',
    description: 'Receba um número de protocolo para consultar o andamento a qualquer momento.',
    icon: 'i-lucide-search',
  },
  {
    title: '3. Receba atualizações',
    description: 'Veja o histórico de status até a conclusão do atendimento.',
    icon: 'i-lucide-bell',
  },
]
</script>

<template>
  <div>
    <div class="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-600 to-primary-500 px-4 pb-20 pt-8 sm:pt-12">
      <svg class="pointer-events-none absolute inset-x-0 bottom-0 text-white/10" viewBox="0 0 400 90" preserveAspectRatio="none" fill="currentColor">
        <path d="M0 45 Q100 5 200 45 T400 45 V90 H0 Z" />
        <path d="M0 62 Q100 25 200 62 T400 62 V90 H0 Z" opacity="0.7" />
      </svg>

      <UContainer class="relative">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white">
              <UIcon name="i-lucide-landmark" class="size-6" />
            </span>
            <div>
              <p class="text-lg font-extrabold leading-none text-white">
                Ajuda Belém
              </p>
              <p class="mt-1 text-xs text-white/70">
                Prefeitura de Belém do Pará
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-bell"
              color="neutral"
              variant="ghost"
              class="bg-white/15 text-white hover:bg-white/25"
              aria-label="Notificações"
            />
            <UButton
              :to="sessao?.user ? '/perfil' : '/entrar'"
              icon="i-lucide-user"
              color="neutral"
              variant="ghost"
              class="bg-white/15 text-white hover:bg-white/25"
              :aria-label="sessao?.user ? 'Minha conta' : 'Entrar'"
            />
          </div>
        </div>

        <p class="mt-8 text-sm font-medium text-white/80">
          {{ saudacao }}, cidadão! 👋
        </p>
        <h1 class="mt-1 text-2xl font-extrabold leading-snug text-white sm:text-3xl">
          Encontrou um problema na cidade?<br class="hidden sm:block"> Conte para o Ajuda Belém.
        </h1>
        <p class="mt-2 max-w-md text-sm text-white/80">
          Envie uma foto ou conte o que aconteceu. Nosso assistente ajuda você a registrar a ocorrência.
        </p>
      </UContainer>
    </div>

    <div class="bg-muted pb-12">
      <UContainer class="relative z-10 -mt-10">
        <NuxtLink
          to="/solicitacoes/nova"
          class="flex items-center gap-4 rounded-2xl bg-default p-4 shadow-lg ring-1 ring-default transition hover:shadow-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300">
            <UIcon name="i-lucide-message-circle" class="size-5" />
          </span>
          <span class="flex-1">
            <span class="block font-bold text-highlighted">Contar um problema</span>
            <span class="block text-sm text-muted">Fale com o Assistente Ajuda Belém</span>
          </span>
          <UIcon name="i-lucide-arrow-right" class="size-5 text-muted" />
        </NuxtLink>
      </UContainer>

      <UContainer class="mt-8 space-y-8">
        <section id="numeros" class="scroll-mt-20">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-highlighted">
                Belém em números
              </h2>
              <p class="text-sm text-muted">
                Acompanhe os problemas urbanos registrados pela população e o andamento dos atendimentos.
              </p>
            </div>
            <DashboardFiltroPeriodo v-model="periodo" />
          </div>

          <UAlert
            v-if="erroDashboard"
            class="mb-4"
            color="warning"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            description="Não foi possível carregar os indicadores agora."
          />

          <template v-else>
            <div class="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DashboardKpiCard
                titulo="Total de ocorrências"
                :valor="dashboard?.kpis.totalOcorrencias ?? 0"
                icon="i-lucide-file-text"
                :carregando="carregandoDashboard"
              />
              <DashboardKpiCard
                titulo="Em aberto"
                :valor="dashboard?.kpis.abertas ?? 0"
                icon="i-lucide-file-plus"
                :carregando="carregandoDashboard"
              />
              <DashboardKpiCard
                titulo="Em atendimento"
                :valor="dashboard?.kpis.emAtendimento ?? 0"
                icon="i-lucide-hammer"
                :carregando="carregandoDashboard"
              />
              <DashboardKpiCard
                titulo="Concluídas"
                :valor="dashboard?.kpis.concluidas ?? 0"
                icon="i-lucide-check-circle-2"
                :carregando="carregandoDashboard"
              />
            </div>

            <DashboardBox class="mb-4">
              <DashboardKpiCard
                compacto
                titulo="Total de relatos"
                :valor="dashboard?.kpis.totalRelatos ?? 0"
                icon="i-lucide-users"
                :carregando="carregandoDashboard"
              />
              <DashboardKpiCard
                compacto
                titulo="Taxa de conclusão"
                :valor="`${dashboard?.kpis.taxaConclusao ?? 0}%`"
                icon="i-lucide-percent"
                :carregando="carregandoDashboard"
              />
              <DashboardKpiCard
                compacto
                titulo="Bairro com mais ocorrências"
                :valor="dashboard?.kpis.bairroMaisOcorrencias?.bairro ?? '—'"
                :descricao="dashboard?.kpis.bairroMaisOcorrencias ? `${dashboard.kpis.bairroMaisOcorrencias.quantidade} ocorrências` : undefined"
                icon="i-lucide-map-pin"
                :carregando="carregandoDashboard"
              />
              <DashboardKpiCard
                compacto
                titulo="Categoria mais registrada"
                :valor="dashboard?.kpis.categoriaMaisRegistrada?.label ?? '—'"
                :descricao="dashboard?.kpis.categoriaMaisRegistrada ? `${dashboard.kpis.categoriaMaisRegistrada.quantidade} ocorrências` : undefined"
                icon="i-lucide-tag"
                :carregando="carregandoDashboard"
              />
            </DashboardBox>

            <DashboardGraficosAnaliticos :dashboard="dashboard" :carregando="carregandoDashboard" :periodo="periodo" />
          </template>
        </section>

        <section>
          <h2 class="mb-4 text-lg font-bold text-highlighted">
            Atalhos rápidos
          </h2>
          <UInput
            v-model="busca"
            placeholder="Buscar por palavra-chave, ex: buraco, luz, alagamento..."
            icon="i-lucide-search"
            size="lg"
            class="mb-5 w-full"
          />

          <div v-if="servicosFiltrados.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NuxtLink
              v-for="servico in servicosFiltrados"
              :key="servico.value"
              :to="{ path: '/solicitacoes/nova', query: { categoria: servico.value } }"
              class="flex flex-col items-center gap-2 rounded-2xl bg-default p-4 text-center shadow-sm ring-1 ring-default transition hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span class="flex size-11 items-center justify-center rounded-xl" :class="TOM_CATEGORIA_CLASSES[servico.tom]">
                <UIcon :name="servico.icon" class="size-5" />
              </span>
              <span class="text-xs font-semibold text-highlighted">{{ servico.label }}</span>
            </NuxtLink>
          </div>
          <p v-else class="text-center text-muted">
            Nenhuma categoria encontrada. Você ainda pode
            <NuxtLink to="/solicitacoes/nova" class="text-primary underline">
              contar o problema para o assistente
            </NuxtLink>.
          </p>
        </section>

        <section class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default">
          <h2 class="mb-3 text-base font-bold text-highlighted">
            Acompanhar protocolo
          </h2>
          <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="consultarProtocolo">
            <UInput v-model="protocolo" placeholder="Ex: 2026384512" icon="i-lucide-hash" size="lg" class="flex-1" />
            <UButton type="submit" label="Buscar" color="primary" size="lg" />
          </form>
        </section>

        <section id="avisos" class="scroll-mt-20">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-highlighted">
              Avisos e notícias
            </h2>
            <UButton to="/avisos" label="Ver todos" color="neutral" variant="ghost" size="sm" />
          </div>
          <div class="space-y-3">
            <NuxtLink
              v-for="aviso in avisosRecentes"
              :key="aviso.id"
              to="/avisos"
              class="flex items-start gap-3 rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <UIcon :name="aviso.icon" class="size-5" />
              </span>
              <div>
                <p class="font-semibold text-highlighted">
                  {{ aviso.titulo }}
                </p>
                <p class="mt-0.5 text-sm text-muted">
                  {{ aviso.descricao }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </section>
      </UContainer>
    </div>

    <UPageSection
      title="Como funciona"
      description="Uma conversa simples, do relato à conclusão do atendimento."
    >
      <UPageGrid>
        <UPageFeature
          v-for="passo in passos"
          :key="passo.title"
          :icon="passo.icon"
          :title="passo.title"
          :description="passo.description"
        />
      </UPageGrid>
    </UPageSection>

    <UPageCTA
      title="Encontrou um problema na sua região?"
      description="Contar para o Ajuda Belém leva poucos minutos e ajuda a Prefeitura a priorizar os reparos."
      :links="[
        { label: 'Conversar e registrar problema', to: '/solicitacoes/nova', icon: 'i-lucide-message-circle', color: 'secondary' },
      ]"
      variant="soft"
    />
  </div>
</template>
