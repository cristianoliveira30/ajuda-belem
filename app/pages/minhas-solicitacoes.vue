<script setup lang="ts">
definePageMeta({ middleware: 'cidadao' })
useSeoMeta({ title: 'Minhas solicitações — Ajuda Belém' })

interface SolicitacaoResumo {
  protocolo: string
  categoria: string
  status: string
  criadoEm: string
  rua: string
  numero: string
  bairro: string
  complemento?: string
}

const { data: solicitacoesLista, status } = await useFetch<SolicitacaoResumo[]>('/api/solicitacoes/minhas')

const carregando = computed(() => status.value === 'pending')

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { dateStyle: 'short' })
}

function enderecoResumido(solicitacao: SolicitacaoResumo) {
  return `${solicitacao.rua}, ${solicitacao.numero} - ${solicitacao.bairro}`
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="py-10 sm:py-16">
      <div class="mx-auto max-w-2xl">
        <div class="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-highlighted">
              Minhas solicitações
            </h1>
            <p class="mt-2 text-muted">
              Acompanhe o andamento de tudo que você já registrou.
            </p>
          </div>
          <UButton to="/solicitacoes/nova" label="Nova solicitação" icon="i-lucide-plus" class="hidden sm:inline-flex" />
        </div>

        <div v-if="carregando" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
        </div>

        <UPageCard v-else-if="!solicitacoesLista?.length" variant="subtle" class="text-center">
          <UIcon name="i-lucide-inbox" class="mx-auto size-8 text-muted" />
          <p class="mt-3 font-medium text-highlighted">
            Você ainda não tem solicitações.
          </p>
          <p class="mt-1 text-sm text-muted">
            Registre um problema de infraestrutura para começar a acompanhar por aqui.
          </p>
          <UButton to="/solicitacoes/nova" label="Registrar problema" class="mt-4" />
        </UPageCard>

        <div v-else class="space-y-3">
          <NuxtLink
            v-for="solicitacao in solicitacoesLista"
            :key="solicitacao.protocolo"
            :to="`/solicitacoes/acompanhar?protocolo=${solicitacao.protocolo}`"
          >
            <UPageCard variant="subtle" class="transition-colors hover:bg-elevated">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <span
                    class="flex size-11 shrink-0 items-center justify-center rounded-xl"
                    :class="getCategoria(solicitacao.categoria) ? TOM_CATEGORIA_CLASSES[getCategoria(solicitacao.categoria)!.tom] : 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'"
                  >
                    <UIcon :name="getCategoria(solicitacao.categoria)?.icon || 'i-lucide-file'" class="size-5" />
                  </span>
                  <div>
                    <p class="font-semibold text-highlighted">
                      {{ getCategoria(solicitacao.categoria)?.label }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ enderecoResumido(solicitacao) }}
                    </p>
                    <p class="font-mono text-xs text-muted">
                      {{ solicitacao.protocolo }} · {{ formatarData(solicitacao.criadoEm) }}
                    </p>
                  </div>
                </div>
                <UBadge :color="STATUS_SOLICITACAO[solicitacao.status as keyof typeof STATUS_SOLICITACAO]?.color" variant="subtle">
                  {{ STATUS_SOLICITACAO[solicitacao.status as keyof typeof STATUS_SOLICITACAO]?.label }}
                </UBadge>
              </div>
            </UPageCard>
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </div>
</template>
