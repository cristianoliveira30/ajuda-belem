<script setup lang="ts">
import type { OcorrenciaMapa, StatusSolicitacao } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Mapa de ocorrências — Ajuda Belém' })

const { data: ocorrencias, status: carregamento } = await useFetch<OcorrenciaMapa[]>('/api/mapa/ocorrencias')

// `USelect` (Reka UI) não aceita item com `value: ''` — é reservado pra
// "seleção limpa" internamente. 'todas'/'todos' representa a opção "sem
// filtro" em vez de string vazia.
const filtroCategoria = ref('todas')
const filtroStatus = ref('todos')

const opcoesCategoria = computed(() => [
  { label: 'Todas as categorias', value: 'todas' },
  ...CATEGORIAS.map(categoria => ({ label: categoria.label, value: categoria.value })),
])

const listaStatus = Object.entries(STATUS_SOLICITACAO) as [StatusSolicitacao, typeof STATUS_SOLICITACAO[StatusSolicitacao]][]

const opcoesStatus = computed(() => [
  { label: 'Todos os status', value: 'todos' },
  ...listaStatus.map(([valor, info]) => ({ label: info.label, value: valor })),
])

const filtradas = computed(() => {
  return (ocorrencias.value ?? []).filter((ocorrencia) => {
    if (filtroCategoria.value !== 'todas' && ocorrencia.categoria !== filtroCategoria.value)
      return false
    if (filtroStatus.value !== 'todos' && ocorrencia.status !== filtroStatus.value)
      return false
    return true
  })
})

const CORES_LEGENDA: Record<StatusSolicitacao, string> = {
  aberto: '#71717a',
  em_analise: '#f59e0b',
  encaminhado: '#0ea5e9',
  em_execucao: '#2563eb',
  concluido: '#22c55e',
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="max-w-4xl py-8 sm:py-12">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-highlighted">
          Mapa de ocorrências
        </h1>
        <p class="mt-1 text-muted">
          Acompanhe onde estão as solicitações registradas pelos cidadãos de Belém.
        </p>
      </div>

      <div class="mb-4 grid gap-3 sm:grid-cols-2">
        <USelect v-model="filtroCategoria" :items="opcoesCategoria" placeholder="Categoria" />
        <USelect v-model="filtroStatus" :items="opcoesStatus" placeholder="Status" />
      </div>

      <div class="relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl shadow-sm ring-1 ring-default">
        <div v-if="carregamento === 'pending'" class="absolute inset-0 z-10 flex items-center justify-center bg-default/60">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
        </div>
        <!--
          ClientOnly de propósito: Leaflet manipula o DOM do container por
          fora do Vue (painéis, tiles, popups), o que não é compatível com o
          <Suspense> de página do Nuxt (esta página tem `await useFetch` no
          topo do script) — sem isso, navegar pra fora enquanto esse
          Suspense ainda está resolvendo derrubava o unmount interno do Vue
          no meio do caminho (URL mudava, tela ficava presa até um F5). Ver
          https://github.com/nuxt/nuxt/issues/20798.
        -->
        <ClientOnly>
          <MapaOcorrencias :ocorrencias="filtradas" />
        </ClientOnly>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <span
          v-for="[valor, info] in listaStatus"
          :key="valor"
          class="flex items-center gap-1.5"
        >
          <span class="size-2.5 rounded-full" :style="{ background: CORES_LEGENDA[valor] }" />
          {{ info.label }}
        </span>
      </div>

      <p v-if="ocorrencias && !ocorrencias.length" class="mt-4 rounded-2xl bg-default p-4 text-center text-sm text-muted shadow-sm ring-1 ring-default">
        Nenhuma ocorrência com localização registrada ainda. Ao usar "Usar minha localização" no chat de registro, a ocorrência passa a aparecer aqui.
      </p>
    </UContainer>
  </div>
</template>
