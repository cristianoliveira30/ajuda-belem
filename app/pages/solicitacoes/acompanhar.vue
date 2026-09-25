<script setup lang="ts">
import type { SolicitacaoPublica } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Acompanhar solicitação — Ajuda Belém' })

const route = useRoute()
const router = useRouter()

const protocolo = ref((route.query.protocolo as string) || '')
const protocoloConsultado = ref(protocolo.value)

const { data: solicitacao, error, status, refresh } = await useFetch<SolicitacaoPublica>(
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

const notaSelecionada = ref(0)
const comentarioAvaliacao = ref('')
const enviandoAvaliacao = ref(false)
const erroAvaliacao = ref('')

async function enviarAvaliacao() {
  if (!notaSelecionada.value) {
    erroAvaliacao.value = 'Selecione de 1 a 5 estrelas antes de enviar.'
    return
  }

  const ameaca = detectarAmeacaEntrada(comentarioAvaliacao.value)
  if (ameaca) {
    erroAvaliacao.value = MENSAGEM_AMEACA_ENTRADA[ameaca]
    return
  }

  erroAvaliacao.value = ''
  enviandoAvaliacao.value = true

  try {
    await $fetch(`/api/solicitacoes/${protocoloConsultado.value}/avaliacao`, {
      method: 'POST',
      body: { nota: notaSelecionada.value, comentario: comentarioAvaliacao.value.trim() || undefined },
    })
    await refresh()
  }
  catch {
    erroAvaliacao.value = 'Não foi possível enviar sua avaliação. Tente novamente.'
  }
  finally {
    enviandoAvaliacao.value = false
  }
}
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

        <UPageCard v-if="solicitacao.status === 'concluido'" variant="subtle">
          <template #header>
            <span class="font-medium text-highlighted">Avaliar atendimento</span>
          </template>

          <template v-if="solicitacao.avaliacao">
            <div class="flex items-center gap-2">
              <UInputRating :model-value="solicitacao.avaliacao.nota" readonly />
              <span class="text-sm text-muted">Avaliação enviada, obrigado!</span>
            </div>
            <p v-if="solicitacao.avaliacao.comentario" class="mt-2 text-sm text-highlighted">
              "{{ solicitacao.avaliacao.comentario }}"
            </p>
          </template>

          <template v-else>
            <p class="mb-3 text-sm text-muted">
              Como você avalia o atendimento recebido para essa solicitação?
            </p>
            <UInputRating v-model="notaSelecionada" size="xl" />
            <UTextarea
              v-model="comentarioAvaliacao"
              :rows="2"
              placeholder="Comentário (opcional)"
              class="mt-3 w-full"
            />
            <UAlert
              v-if="erroAvaliacao"
              class="mt-3"
              color="error"
              variant="subtle"
              icon="i-lucide-alert-triangle"
              :description="erroAvaliacao"
            />
            <UButton
              label="Enviar avaliação"
              color="primary"
              class="mt-3"
              :loading="enviandoAvaliacao"
              @click="enviarAvaliacao"
            />
          </template>
        </UPageCard>
      </div>
      </div>
    </UContainer>
  </div>
</template>
