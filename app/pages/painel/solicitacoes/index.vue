<script setup lang="ts">
import type { Solicitacao, StatusSolicitacao } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Solicitações — Painel Ajuda Belém' })
definePageMeta({ middleware: 'servidor', layout: 'painel' })

const { data: solicitacoes, status: carregamento } = await useFetch<Solicitacao[]>('/api/painel/solicitacoes')

// `USelect` (Reka UI) não aceita item com `value: ''` — é reservado pra
// "seleção limpa" internamente. 'todas'/'todos' representa a opção "sem
// filtro" em vez de string vazia.
const filtroCategoria = ref('todas')
const filtroStatus = ref('todos')
const filtroBairro = ref('')

const opcoesCategoria = computed(() => [
  { label: 'Todas as categorias', value: 'todas' },
  ...CATEGORIAS.map(categoria => ({ label: categoria.label, value: categoria.value })),
])

const opcoesStatus = computed(() => [
  { label: 'Todos os status', value: 'todos' },
  ...(Object.entries(STATUS_SOLICITACAO) as [StatusSolicitacao, typeof STATUS_SOLICITACAO[StatusSolicitacao]][])
    .map(([valor, info]) => ({ label: info.label, value: valor })),
])

const filtradas = computed(() => {
  return (solicitacoes.value ?? []).filter((solicitacao) => {
    if (filtroCategoria.value !== 'todas' && solicitacao.categoria !== filtroCategoria.value)
      return false
    if (filtroStatus.value !== 'todos' && solicitacao.status !== filtroStatus.value)
      return false
    if (filtroBairro.value && !solicitacao.bairro.toLowerCase().includes(filtroBairro.value.toLowerCase()))
      return false
    return true
  })
})

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-4 grid gap-3 sm:grid-cols-3">
      <USelect v-model="filtroCategoria" :items="opcoesCategoria" placeholder="Categoria" />
      <USelect v-model="filtroStatus" :items="opcoesStatus" placeholder="Status" />
      <UInput v-model="filtroBairro" placeholder="Buscar por bairro" icon="i-lucide-search" />
    </div>

    <div v-if="carregamento === 'pending'" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
    </div>

    <div v-else class="space-y-2">
      <NuxtLink
        v-for="solicitacao in filtradas"
        :key="solicitacao.protocolo"
        :to="`/painel/solicitacoes/${solicitacao.protocolo}`"
        class="flex items-center gap-3 rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-xl"
          :class="TOM_CATEGORIA_CLASSES[getCategoria(solicitacao.categoria)?.tom ?? 'neutral']"
        >
          <UIcon :name="getCategoria(solicitacao.categoria)?.icon || 'i-lucide-file'" class="size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-highlighted">
            {{ getCategoria(solicitacao.categoria)?.label }}
          </p>
          <p class="truncate text-sm text-muted">
            {{ solicitacao.bairro }} · {{ solicitacao.nome }} · {{ formatarData(solicitacao.criadoEm) }} · {{ solicitacao.protocolo }}
          </p>
        </div>
        <UBadge color="neutral" variant="subtle" class="shrink-0">
          {{ solicitacao.relatos?.length ?? 1 }} relato{{ (solicitacao.relatos?.length ?? 1) === 1 ? '' : 's' }}
        </UBadge>
        <UBadge :color="STATUS_SOLICITACAO[solicitacao.status].color" variant="subtle" class="shrink-0">
          {{ STATUS_SOLICITACAO[solicitacao.status].label }}
        </UBadge>
      </NuxtLink>

      <div v-if="!filtradas.length" class="rounded-2xl bg-default p-8 text-center shadow-sm ring-1 ring-default">
        <UIcon name="i-lucide-inbox" class="mx-auto size-8 text-muted" />
        <p class="mt-3 text-muted">
          Nenhuma solicitação encontrada com esses filtros.
        </p>
      </div>
    </div>
  </div>
</template>
