<script setup lang="ts">
import type { Solicitacao } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Minhas solicitações — Ajuda Belém' })

const { data: solicitacoes, status } = await useFetch<Solicitacao[]>('/api/minhas-solicitacoes')

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="max-w-2xl py-10 sm:py-16">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-highlighted">
          Minhas solicitações
        </h1>
        <p class="mt-1 text-muted">
          Ocorrências registradas com o e-mail da sua conta.
        </p>
      </div>

      <div v-if="status === 'pending'" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
      </div>

      <div v-else-if="!solicitacoes?.length" class="rounded-2xl bg-default p-8 text-center shadow-sm ring-1 ring-default">
        <UIcon name="i-lucide-inbox" class="mx-auto size-8 text-muted" />
        <p class="mt-3 text-muted">
          Você ainda não registrou nenhuma solicitação com este e-mail.
        </p>
        <UButton to="/solicitacoes/nova" label="Registrar um problema" color="primary" class="mt-4" />
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="solicitacao in solicitacoes"
          :key="solicitacao.protocolo"
          :to="{ path: '/solicitacoes/acompanhar', query: { protocolo: solicitacao.protocolo } }"
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
              {{ solicitacao.bairro }} · {{ formatarData(solicitacao.criadoEm) }} · {{ solicitacao.protocolo }}
            </p>
          </div>
          <UBadge :color="STATUS_SOLICITACAO[solicitacao.status].color" variant="subtle" class="shrink-0">
            {{ STATUS_SOLICITACAO[solicitacao.status].label }}
          </UBadge>
        </NuxtLink>
      </div>
    </UContainer>
  </div>
</template>
