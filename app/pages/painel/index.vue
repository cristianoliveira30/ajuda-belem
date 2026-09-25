<script setup lang="ts">
import type { Solicitacao } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Painel administrativo — Ajuda Belém' })
definePageMeta({ middleware: 'servidor', layout: 'painel' })

const { data: solicitacoes, status } = await useFetch<Solicitacao[]>('/api/painel/solicitacoes')

const total = computed(() => solicitacoes.value?.length ?? 0)

function contarPorStatus(...statusList: Solicitacao['status'][]) {
  return computed(() => solicitacoes.value?.filter(s => statusList.includes(s.status)).length ?? 0)
}

const recebidas = contarPorStatus('aberto')
const emAndamento = contarPorStatus('em_analise', 'encaminhado', 'em_execucao')
const concluidas = contarPorStatus('concluido')

const porCategoria = computed(() => {
  const contagem = new Map<string, number>()
  for (const solicitacao of solicitacoes.value ?? [])
    contagem.set(solicitacao.categoria, (contagem.get(solicitacao.categoria) ?? 0) + 1)

  return [...contagem.entries()]
    .map(([categoria, quantidade]) => ({ categoria: getCategoria(categoria), quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
})

const recentes = computed(() => (solicitacoes.value ?? []).slice(0, 8))

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div v-if="status === 'pending'" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default">
          <p class="text-xs text-muted">
            Total
          </p>
          <p class="mt-1 text-2xl font-bold text-highlighted">
            {{ total }}
          </p>
        </div>
        <div class="rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default">
          <p class="text-xs text-muted">
            Recebidas
          </p>
          <p class="mt-1 text-2xl font-bold text-highlighted">
            {{ recebidas }}
          </p>
        </div>
        <div class="rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default">
          <p class="text-xs text-muted">
            Em andamento
          </p>
          <p class="mt-1 text-2xl font-bold text-highlighted">
            {{ emAndamento }}
          </p>
        </div>
        <div class="rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default">
          <p class="text-xs text-muted">
            Concluídas
          </p>
          <p class="mt-1 text-2xl font-bold text-highlighted">
            {{ concluidas }}
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default lg:col-span-1">
          <h2 class="mb-4 font-bold text-highlighted">
            Por categoria
          </h2>
          <ul class="space-y-3">
            <li v-for="item in porCategoria" :key="item.categoria?.value" class="flex items-center gap-3">
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg"
                :class="TOM_CATEGORIA_CLASSES[item.categoria?.tom ?? 'neutral']"
              >
                <UIcon :name="item.categoria?.icon || 'i-lucide-file'" class="size-4" />
              </span>
              <span class="flex-1 text-sm text-highlighted">{{ item.categoria?.label }}</span>
              <span class="text-sm font-semibold text-muted">{{ item.quantidade }}</span>
            </li>
          </ul>
          <p v-if="!porCategoria.length" class="text-sm text-muted">
            Nenhuma solicitação registrada ainda.
          </p>
        </div>

        <div class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default lg:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-bold text-highlighted">
              Solicitações recentes
            </h2>
            <UButton to="/painel/solicitacoes" label="Ver todas" color="neutral" variant="ghost" size="sm" />
          </div>

          <div class="space-y-2">
            <NuxtLink
              v-for="solicitacao in recentes"
              :key="solicitacao.protocolo"
              :to="`/painel/solicitacoes/${solicitacao.protocolo}`"
              class="flex items-center gap-3 rounded-xl p-2 transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-lg"
                :class="TOM_CATEGORIA_CLASSES[getCategoria(solicitacao.categoria)?.tom ?? 'neutral']"
              >
                <UIcon :name="getCategoria(solicitacao.categoria)?.icon || 'i-lucide-file'" class="size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-highlighted">
                  {{ getCategoria(solicitacao.categoria)?.label }} · {{ solicitacao.bairro }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ solicitacao.protocolo }} · {{ formatarData(solicitacao.criadoEm) }}
                </p>
              </div>
              <UBadge :color="STATUS_SOLICITACAO[solicitacao.status].color" variant="subtle" class="shrink-0">
                {{ STATUS_SOLICITACAO[solicitacao.status].label }}
              </UBadge>
            </NuxtLink>
            <p v-if="!recentes.length" class="text-sm text-muted">
              Nenhuma solicitação registrada ainda.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
