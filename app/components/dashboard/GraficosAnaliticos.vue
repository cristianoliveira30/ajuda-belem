<script setup lang="ts">
import type { DashboardResposta } from '#shared/types/dashboard'
import type { OcorrenciaMapa } from '#shared/types/solicitacao'

const props = defineProps<{
  dashboard: DashboardResposta | null | undefined
  carregando: boolean
  periodo: string
}>()

const {
  porStatus,
  porCategoria,
  porBairro,
  evolucao,
  abertasConcluidas,
  relatosPorCategoria,
  concluidasPorCategoria,
  maisRelatadas,
  porRisco,
} = useDashboardCharts(computed(() => props.dashboard))

// Card 10 (mapa) busca os próprios dados — reaproveita o mesmo endpoint e
// componente já usados em /mapa, só respeitando o mesmo período dos outros
// 9 cards (ver server/api/mapa/ocorrencias.get.ts).
const { data: ocorrenciasMapa, status: statusMapa } = await useFetch<OcorrenciaMapa[]>('/api/mapa/ocorrencias', {
  query: { periodo: computed(() => props.periodo) },
})
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Ocorrências por status"
          tipo="donut"
          :categorias="porStatus.categorias"
          :series="porStatus.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>
    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Ocorrências por categoria"
          tipo="bar"
          :categorias="porCategoria.categorias"
          :series="porCategoria.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>

    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Evolução das ocorrências"
          tipo="area"
          :categorias="evolucao.categorias"
          :series="evolucao.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>
    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Bairros com mais ocorrências"
          subtitulo="Top 10"
          tipo="bar"
          horizontal
          :categorias="porBairro.categorias"
          :series="porBairro.series"
          :carregando="carregando"
          :altura="360"
        />
      </ClientOnly>
    </div>

    <div class="lg:col-span-12">
      <ClientOnly>
        <DashboardChartCard
          titulo="Abertas x concluídas"
          subtitulo="Ao longo do tempo, pela data real de cada evento"
          tipo="line"
          :categorias="abertasConcluidas.categorias"
          :series="abertasConcluidas.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>

    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Relatos por categoria"
          subtitulo="Quantas confirmações cada tipo de problema recebeu"
          tipo="bar"
          :categorias="relatosPorCategoria.categorias"
          :series="relatosPorCategoria.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>
    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Concluídas por categoria"
          tipo="bar"
          :categorias="concluidasPorCategoria.categorias"
          :series="concluidasPorCategoria.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>

    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Problemas mais relatados"
          subtitulo="Top 10 por quantidade de relatos"
          tipo="bar"
          horizontal
          :categorias="maisRelatadas.categorias"
          :series="maisRelatadas.series"
          :carregando="carregando"
          :altura="360"
        />
      </ClientOnly>
    </div>
    <div class="lg:col-span-6">
      <ClientOnly>
        <DashboardChartCard
          titulo="Ocorrências por nível de risco"
          tipo="donut"
          :categorias="porRisco.categorias"
          :series="porRisco.series"
          :carregando="carregando"
        />
      </ClientOnly>
    </div>

    <div class="lg:col-span-12">
      <DashboardCard variant="subtle" padding="compacto">
        <template #header>
          <p class="font-semibold text-highlighted">
            Mapa de ocorrências
          </p>
        </template>
        <div class="relative h-[420px] overflow-hidden rounded-xl">
          <div v-if="statusMapa === 'pending'" class="absolute inset-0 z-10 flex items-center justify-center bg-default/60">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
          </div>
          <ClientOnly>
            <MapaOcorrencias :ocorrencias="ocorrenciasMapa ?? []" />
          </ClientOnly>
        </div>
      </DashboardCard>
    </div>
  </div>
</template>
