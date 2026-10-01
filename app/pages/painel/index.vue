<script setup lang="ts">
import type { DashboardResposta } from '#shared/types/dashboard'

useSeoMeta({ title: 'Painel administrativo — Ajuda Belém' })
definePageMeta({ middleware: 'servidor', layout: 'painel' })

const { perfil } = usePerfil()

// Mesmo endpoint agregado, mesmo componente de gráficos da home — nenhum
// cálculo novo aqui (ver server/api/dashboard.get.ts e
// app/components/dashboard/GraficosAnaliticos.vue). A diferença do painel
// pro dashboard público é só o agrupamento dos KPIs (aqui cada status
// aparece separado, sem juntar em "em atendimento") e as ações de gestão.
const periodo = ref('todos')
const { data: dashboard, status: statusDashboard, error: erroDashboard } = await useFetch<DashboardResposta>('/api/dashboard', {
  query: { periodo },
})
const carregandoDashboard = computed(() => statusDashboard.value === 'pending')

interface ServidorResumo {
  id: string
  primeiroAcesso: boolean
  banned: boolean
}

// Só busca a listagem de servidores se for admin — servidor comum nunca
// recebe/renderiza esses números (ver seção "Servidor não vê administração"
// do pedido). O endpoint em si já é protegido por `exigirAdmin` de qualquer
// forma (server/api/admin/servidores/index.get.ts) — isso aqui é só pra não
// nem tentar buscar quando não faz sentido.
const { data: servidores } = await useFetch<ServidorResumo[]>('/api/admin/servidores', {
  immediate: perfil.value?.papel === 'admin',
})

const totalServidores = computed(() => servidores.value?.length ?? 0)
const servidoresAtivos = computed(() => servidores.value?.filter(s => !s.banned).length ?? 0)
const servidoresInativos = computed(() => servidores.value?.filter(s => s.banned).length ?? 0)
const primeiroAcessoPendente = computed(() => servidores.value?.filter(s => s.primeiroAcesso).length ?? 0)
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-bold text-highlighted">
          Visão geral
        </h1>
        <p class="text-sm text-muted">
          Acompanhe as ocorrências registradas e o andamento dos atendimentos.
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
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardKpiCard titulo="Total" :valor="dashboard?.kpis.totalOcorrencias ?? 0" icon="i-lucide-file-text" :carregando="carregandoDashboard" />
        <DashboardKpiCard titulo="Em aberto" :valor="dashboard?.porStatus.find(p => p.status === 'aberto')?.quantidade ?? 0" icon="i-lucide-file-plus" :carregando="carregandoDashboard" />
        <DashboardKpiCard titulo="Em análise" :valor="dashboard?.porStatus.find(p => p.status === 'em_analise')?.quantidade ?? 0" icon="i-lucide-search" :carregando="carregandoDashboard" />
        <DashboardKpiCard titulo="Em execução" :valor="dashboard?.porStatus.find(p => p.status === 'em_execucao')?.quantidade ?? 0" icon="i-lucide-hammer" :carregando="carregandoDashboard" />
      </div>

      <DashboardBox class="mt-3">
        <DashboardKpiCard compacto titulo="Encaminhados" :valor="dashboard?.porStatus.find(p => p.status === 'encaminhado')?.quantidade ?? 0" icon="i-lucide-send" :carregando="carregandoDashboard" />
        <DashboardKpiCard compacto titulo="Concluídos" :valor="dashboard?.porStatus.find(p => p.status === 'concluido')?.quantidade ?? 0" icon="i-lucide-check-circle-2" :carregando="carregandoDashboard" />
        <DashboardKpiCard compacto titulo="Total de relatos" :valor="dashboard?.kpis.totalRelatos ?? 0" icon="i-lucide-users" :carregando="carregandoDashboard" />
        <DashboardKpiCard compacto titulo="Taxa de conclusão" :valor="`${dashboard?.kpis.taxaConclusao ?? 0}%`" icon="i-lucide-percent" :carregando="carregandoDashboard" />
      </DashboardBox>

      <div class="mt-4">
        <UButton to="/painel/solicitacoes" label="Ver todas as ocorrências" icon="i-lucide-list-checks" color="neutral" variant="soft" />
      </div>

      <div class="mt-6">
        <DashboardGraficosAnaliticos :dashboard="dashboard" :carregando="carregandoDashboard" :periodo="periodo" />
      </div>
    </template>

    <template v-if="perfil?.papel === 'admin'">
      <USeparator class="my-8" />

      <div class="mb-4">
        <h2 class="text-lg font-bold text-highlighted">
          Administração
        </h2>
        <p class="text-sm text-muted">
          Gestão das contas de servidor da Prefeitura.
        </p>
      </div>

      <DashboardBox>
        <DashboardKpiCard compacto titulo="Servidores" :valor="totalServidores" icon="i-lucide-users" />
        <DashboardKpiCard compacto titulo="Ativos" :valor="servidoresAtivos" icon="i-lucide-user-check" />
        <DashboardKpiCard compacto titulo="Inativos" :valor="servidoresInativos" icon="i-lucide-user-x" />
        <DashboardKpiCard compacto titulo="Primeiro acesso pendente" :valor="primeiroAcessoPendente" icon="i-lucide-key-round" />
      </DashboardBox>

      <div class="mt-4">
        <UButton to="/painel/servidores" label="Gerenciar servidores" icon="i-lucide-settings" color="primary" variant="soft" />
      </div>
    </template>
  </div>
</template>
