<script setup lang="ts">
import type { Solicitacao } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Acompanhar solicitação — Ajuda Belém' })

const route = useRoute()
const router = useRouter()

const protocolo = ref((route.query.protocolo as string) || '')
const protocoloConsultado = ref(protocolo.value)

const { data: solicitacao, error, status, refresh } = await useFetch<Solicitacao>(
  () => `/api/solicitacoes/${protocoloConsultado.value}`,
  { immediate: !!protocoloConsultado.value },
)

const carregando = computed(() => status.value === 'pending')
const erro = computed(() => error.value ? 'Não encontramos nenhuma solicitação com esse número de protocolo.' : '')

function consultar() {
  const valor = protocolo.value.trim()
  if (!valor)
    return

  protocoloConsultado.value = valor
  router.replace({ query: { protocolo: valor } })
  refresh()
}

const categoria = computed(() => solicitacao.value ? getCategoria(solicitacao.value.categoria) : undefined)
const statusInfo = computed(() => solicitacao.value ? STATUS_SOLICITACAO[solicitacao.value.status] : undefined)

const enderecoCompleto = computed(() => {
  if (!solicitacao.value)
    return ''
  const { rua, numero, complemento, bairro } = solicitacao.value
  const complementoTexto = complemento ? ` - ${complemento}` : ''
  return `${rua}, ${numero}${complementoTexto} - ${bairro}, Belém - PA`
})

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const timelineItems = computed(() => {
  if (!solicitacao.value)
    return []

  return solicitacao.value.historico.map(item => ({
    date: formatarData(item.data),
    title: STATUS_SOLICITACAO[item.status].label,
    description: item.mensagem,
    icon: STATUS_SOLICITACAO[item.status].icon,
  }))
})
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="py-10 sm:py-16">
      <div class="mx-auto max-w-2xl">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-highlighted">
          Acompanhar solicitação
        </h1>
        <p class="mt-2 text-muted">
          Informe o número de protocolo recebido no momento do registro.
        </p>
      </div>

      <UCard variant="subtle">
        <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="consultar">
          <UInput
            v-model="protocolo"
            placeholder="Número de protocolo"
            icon="i-lucide-hash"
            size="lg"
            class="flex-1"
          />
          <UButton type="submit" label="Consultar" size="lg" :loading="carregando" />
        </form>
      </UCard>

      <UAlert
        v-if="erro"
        class="mt-6"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :description="erro"
      />

      <div v-if="solicitacao" class="mt-8 space-y-6">
        <UPageCard variant="subtle">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-xl"
                :class="categoria ? TOM_CATEGORIA_CLASSES[categoria.tom] : 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'"
              >
                <UIcon :name="categoria?.icon || 'i-lucide-file'" class="size-5" />
              </span>
              <div>
                <p class="font-semibold text-highlighted">
                  {{ categoria?.label }}
                </p>
                <p class="font-mono text-sm text-muted">
                  {{ solicitacao.protocolo }}
                </p>
              </div>
            </div>
            <UBadge :color="statusInfo?.color" variant="subtle">
              {{ statusInfo?.label }}
            </UBadge>
          </div>

          <USeparator class="my-4" />

          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-muted">Endereço</dt>
              <dd class="text-highlighted">{{ enderecoCompleto }}</dd>
            </div>
            <div>
              <dt class="text-muted">Descrição</dt>
              <dd class="text-highlighted">{{ solicitacao.descricao }}</dd>
            </div>
            <div>
              <dt class="text-muted">Aberto em</dt>
              <dd class="text-highlighted">{{ formatarData(solicitacao.criadoEm) }}</dd>
            </div>
          </dl>
        </UPageCard>

        <UPageCard variant="subtle">
          <template #header>
            <span class="font-medium text-highlighted">Histórico</span>
          </template>
          <UTimeline :items="timelineItems" />
        </UPageCard>
      </div>
      </div>
    </UContainer>
  </div>
</template>
