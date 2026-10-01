<script setup lang="ts">
import type { Solicitacao, SolicitacaoPublica, StatusSolicitacao } from '#shared/types/solicitacao'

useSeoMeta({ title: 'Acompanhar — Ajuda Belém' })

const route = useRoute()
const router = useRouter()
const { data: sessao } = useSessao()

const protocolo = ref((route.query.protocolo as string) || '')
const protocoloConsultado = ref(protocolo.value)

// Duas experiências na mesma página, pela URL:
// - com `?protocolo=` → busca pública por protocolo (usada pelo mapa e pela
//   busca da home; não exige login; nunca mostra dado pessoal — ver
//   SolicitacaoPublica em shared/types/solicitacao.ts);
// - sem `?protocolo=` → dashboard do cidadão autenticado (GET
//   /api/minhas-solicitacoes), com todas as ocorrências dele automaticamente,
//   sem precisar digitar nada.
const modoProtocolo = computed(() => !!protocoloConsultado.value)

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

function limparBusca() {
  protocolo.value = ''
  protocoloConsultado.value = ''
  router.replace({ query: {} })
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

function formatarDataCurta(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
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

// --- Dashboard do cidadão (sem protocolo na URL) ---
const { data: minhasOcorrencias, status: statusMinhas } = await useFetch<Solicitacao[]>('/api/minhas-solicitacoes', {
  immediate: !modoProtocolo.value,
})

const GRUPOS_STATUS: Record<'abertas' | 'emAndamento' | 'concluidas', StatusSolicitacao[]> = {
  abertas: ['aberto', 'em_analise', 'encaminhado'],
  emAndamento: ['em_execucao'],
  concluidas: ['concluido'],
}

const resumo = computed(() => {
  const lista = minhasOcorrencias.value ?? []
  return {
    total: lista.length,
    abertas: lista.filter(s => GRUPOS_STATUS.abertas.includes(s.status)).length,
    emAndamento: lista.filter(s => GRUPOS_STATUS.emAndamento.includes(s.status)).length,
    concluidas: lista.filter(s => GRUPOS_STATUS.concluidas.includes(s.status)).length,
  }
})
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="py-10 sm:py-16">
      <div class="mx-auto max-w-2xl">
        <!-- ===== Modo protocolo: detalhe público de uma ocorrência ===== -->
        <template v-if="modoProtocolo">
          <UButton
            v-if="sessao?.user"
            label="Minhas ocorrências"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            class="mb-4"
            @click="limparBusca"
          />

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

              <div v-if="solicitacao.fotos?.length" class="mb-4 flex gap-2">
                <img
                  v-for="(foto, index) in solicitacao.fotos"
                  :key="index"
                  :src="foto"
                  class="size-20 rounded-lg object-cover"
                  alt="Foto da ocorrência"
                >
              </div>

              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-muted">
                    Endereço
                  </dt>
                  <dd class="text-highlighted">
                    {{ enderecoCompleto }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted">
                    Descrição
                  </dt>
                  <dd class="text-highlighted">
                    {{ solicitacao.descricao }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted">
                    Aberto em
                  </dt>
                  <dd class="text-highlighted">
                    {{ formatarData(solicitacao.criadoEm) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted">
                    Quantidade de relatos
                  </dt>
                  <dd class="text-highlighted">
                    {{ solicitacao.relatos?.length ?? 1 }}
                  </dd>
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
        </template>

        <!-- ===== Modo dashboard: ocorrências do cidadão autenticado ===== -->
        <template v-else>
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-highlighted">
              Acompanhar
            </h1>
            <p class="mt-1 text-muted">
              Suas ocorrências registradas ou confirmadas.
            </p>
          </div>

          <div v-if="statusMinhas === 'pending'" class="flex justify-center py-16">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
          </div>

          <template v-else>
            <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-2xl bg-default p-4 text-center shadow-sm ring-1 ring-default">
                <p class="text-2xl font-bold text-highlighted">
                  {{ resumo.total }}
                </p>
                <p class="text-xs text-muted">
                  Total relatado
                </p>
              </div>
              <div class="rounded-2xl bg-default p-4 text-center shadow-sm ring-1 ring-default">
                <p class="text-2xl font-bold text-highlighted">
                  {{ resumo.abertas }}
                </p>
                <p class="text-xs text-muted">
                  Em aberto
                </p>
              </div>
              <div class="rounded-2xl bg-default p-4 text-center shadow-sm ring-1 ring-default">
                <p class="text-2xl font-bold text-highlighted">
                  {{ resumo.emAndamento }}
                </p>
                <p class="text-xs text-muted">
                  Em andamento
                </p>
              </div>
              <div class="rounded-2xl bg-default p-4 text-center shadow-sm ring-1 ring-default">
                <p class="text-2xl font-bold text-highlighted">
                  {{ resumo.concluidas }}
                </p>
                <p class="text-xs text-muted">
                  Concluído
                </p>
              </div>
            </div>

            <div v-if="!minhasOcorrencias?.length" class="rounded-2xl bg-default p-8 text-center shadow-sm ring-1 ring-default">
              <UIcon name="i-lucide-inbox" class="mx-auto size-8 text-muted" />
              <p class="mt-3 text-muted">
                Você ainda não registrou nem confirmou nenhuma ocorrência.
              </p>
              <UButton to="/solicitacoes/nova" label="Registrar um problema" color="primary" class="mt-4" />
            </div>

            <div v-else class="space-y-3">
              <NuxtLink
                v-for="ocorrencia in minhasOcorrencias"
                :key="ocorrencia.protocolo"
                :to="{ path: '/solicitacoes/acompanhar', query: { protocolo: ocorrencia.protocolo } }"
                class="flex items-center gap-3 rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <img
                  v-if="ocorrencia.fotos?.[0]"
                  :src="ocorrencia.fotos[0]"
                  class="size-11 shrink-0 rounded-xl object-cover"
                  alt="Foto da ocorrência"
                >
                <span
                  v-else
                  class="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  :class="TOM_CATEGORIA_CLASSES[getCategoria(ocorrencia.categoria)?.tom ?? 'neutral']"
                >
                  <UIcon :name="getCategoria(ocorrencia.categoria)?.icon || 'i-lucide-file'" class="size-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-highlighted">
                    {{ getCategoria(ocorrencia.categoria)?.label }}
                  </p>
                  <p class="truncate text-sm text-muted">
                    {{ ocorrencia.descricao }}
                  </p>
                  <p class="truncate text-xs text-muted">
                    {{ ocorrencia.bairro }} · {{ formatarDataCurta(ocorrencia.criadoEm) }} · {{ ocorrencia.protocolo }} · {{ ocorrencia.relatos?.length ?? 1 }} relato{{ (ocorrencia.relatos?.length ?? 1) === 1 ? '' : 's' }}
                  </p>
                </div>
                <UBadge :color="STATUS_SOLICITACAO[ocorrencia.status].color" variant="subtle" class="shrink-0">
                  {{ STATUS_SOLICITACAO[ocorrencia.status].label }}
                </UBadge>
              </NuxtLink>
            </div>
          </template>

          <UCard variant="subtle" class="mt-8">
            <template #header>
              <span class="text-sm font-medium text-highlighted">Busca rápida por protocolo</span>
            </template>
            <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="consultar">
              <UInput
                v-model="protocolo"
                placeholder="Digite o protocolo"
                icon="i-lucide-hash"
                class="flex-1"
              />
              <UButton type="submit" label="Consultar" />
            </form>
          </UCard>
        </template>
      </div>
    </UContainer>
  </div>
</template>
