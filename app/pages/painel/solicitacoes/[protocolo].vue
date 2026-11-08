<script setup lang="ts">
import type { Solicitacao, StatusSolicitacao } from '#shared/types/solicitacao'

definePageMeta({ middleware: 'servidor', layout: 'painel' })

const route = useRoute()
const protocolo = route.params.protocolo as string

useSeoMeta({ title: `Protocolo ${protocolo} — Painel Ajuda Belém` })

const { data: solicitacao, refresh } = await useFetch<Solicitacao>(`/api/painel/solicitacoes/${protocolo}`)
const { perfil } = usePerfil()

const categoria = computed(() => solicitacao.value ? getCategoria(solicitacao.value.categoria) : undefined)

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

const opcoesStatus = (Object.entries(STATUS_SOLICITACAO) as [StatusSolicitacao, typeof STATUS_SOLICITACAO[StatusSolicitacao]][])
  .map(([valor, info]) => ({ label: info.label, value: valor }))

const novoStatus = ref<StatusSolicitacao>('aberto')
const mensagem = ref('')
const responsavel = ref('')
const enviando = ref(false)
const erro = ref('')

watch(solicitacao, (valor) => {
  if (valor) {
    novoStatus.value = valor.status
    responsavel.value = valor.responsavel || perfil.value?.secretaria || ''
  }
}, { immediate: true })

async function atualizarStatus() {
  if (!mensagem.value.trim()) {
    erro.value = 'Descreva a atualização antes de salvar.'
    return
  }

  const ameaca = detectarAmeacaEntrada(mensagem.value) || detectarAmeacaEntrada(responsavel.value)
  if (ameaca) {
    erro.value = MENSAGEM_AMEACA_ENTRADA[ameaca]
    return
  }

  erro.value = ''
  enviando.value = true

  try {
    await $fetch(`/api/painel/solicitacoes/${protocolo}`, {
      method: 'PATCH',
      body: {
        status: novoStatus.value,
        mensagem: mensagem.value.trim(),
        responsavel: responsavel.value.trim() || undefined,
      },
    })
    mensagem.value = ''
    await refresh()
  }
  catch {
    erro.value = 'Não foi possível salvar a atualização. Tente novamente.'
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <UButton to="/painel/solicitacoes" label="Voltar" icon="i-lucide-arrow-left" color="neutral" variant="ghost" class="mb-4" />

    <div v-if="!solicitacao" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-xl"
                :class="TOM_CATEGORIA_CLASSES[categoria?.tom ?? 'neutral']"
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
            <UBadge :color="STATUS_SOLICITACAO[solicitacao.status].color" variant="subtle">
              {{ STATUS_SOLICITACAO[solicitacao.status].label }}
            </UBadge>
          </div>

          <USeparator class="my-4" />

          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-muted">
                Endereço
              </dt>
              <dd class="text-highlighted">
                {{ enderecoCompleto }}
              </dd>
            </div>
            <div v-if="solicitacao.pontoReferencia">
              <dt class="text-muted">
                Ponto de referência
              </dt>
              <dd class="text-highlighted">
                {{ solicitacao.pontoReferencia }}
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
            <div v-if="solicitacao.risco">
              <dt class="text-muted">
                Risco percebido pelo cidadão
              </dt>
              <dd class="text-highlighted">
                {{ { sim: 'Sim', nao: 'Não', nao_sei: 'Não sei' }[solicitacao.risco] }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Contato
              </dt>
              <dd class="text-highlighted">
                {{ solicitacao.nome }} · {{ solicitacao.email }} · {{ solicitacao.telefone || 'Não informado' }}
              </dd>
            </div>
            <div v-if="solicitacao.cpf">
              <dt class="text-muted">
                CPF
              </dt>
              <dd class="text-highlighted">
                {{ mascararCpf(solicitacao.cpf) }}
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

          <div v-if="solicitacao.fotos?.length" class="mt-4 flex gap-2">
            <img
              v-for="(foto, index) in solicitacao.fotos"
              :key="index"
              :src="foto"
              class="size-20 rounded-lg object-cover"
              alt="Foto enviada pelo cidadão"
            >
          </div>
        </div>

        <div class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default">
          <h2 class="mb-3 font-bold text-highlighted">
            Histórico
          </h2>
          <UTimeline :items="timelineItems" />
        </div>
      </div>

      <div class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default lg:col-span-1">
        <h2 class="mb-4 font-bold text-highlighted">
          Atualizar status
        </h2>

        <div class="space-y-4">
          <UFormField label="Novo status">
            <USelect v-model="novoStatus" :items="opcoesStatus" class="w-full" />
          </UFormField>
          <UFormField label="Responsável">
            <UInput v-model="responsavel" placeholder="Ex: SEINFRA" class="w-full" />
          </UFormField>
          <UFormField label="Mensagem para o histórico" required>
            <UTextarea v-model="mensagem" :rows="3" placeholder="Descreva o que foi feito ou o motivo da mudança de status." class="w-full" />
          </UFormField>

          <UAlert v-if="erro" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erro" />

          <UButton label="Salvar atualização" icon="i-lucide-check" color="primary" block :loading="enviando" @click="atualizarStatus" />
        </div>
      </div>
    </div>
  </div>
</template>
