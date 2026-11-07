<script setup lang="ts">
definePageMeta({ middleware: 'cidadao' })
useSeoMeta({ title: 'Meu perfil — Ajuda Belém' })

interface SolicitacaoResumo {
  protocolo: string
  status: string
}

const { user, clear } = useUserSession()
const router = useRouter()

const { data: solicitacoesLista } = await useFetch<SolicitacaoResumo[]>('/api/solicitacoes/minhas')

const emAndamento = computed(() =>
  solicitacoesLista.value?.filter(s => s.status !== 'concluido').length ?? 0,
)
const concluidas = computed(() =>
  solicitacoesLista.value?.filter(s => s.status === 'concluido').length ?? 0,
)

async function sair() {
  await clear()
  router.push('/')
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="py-10 sm:py-16">
      <div class="mx-auto max-w-2xl space-y-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-highlighted">
            Meu perfil
          </h1>
          <p class="mt-2 text-muted">
            Seus dados e o resumo das suas solicitações.
          </p>
        </div>

        <UPageCard variant="subtle">
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-muted">Nome</dt>
              <dd class="text-highlighted">{{ user?.nome }}</dd>
            </div>
            <div>
              <dt class="text-muted">E-mail</dt>
              <dd class="text-highlighted">{{ user?.email }}</dd>
            </div>
            <div v-if="user?.cpf">
              <dt class="text-muted">CPF</dt>
              <dd class="text-highlighted">{{ mascararCpf(user.cpf) }}</dd>
            </div>
          </dl>
        </UPageCard>

        <div class="grid grid-cols-2 gap-4">
          <UPageCard variant="subtle" class="text-center">
            <p class="text-2xl font-bold text-highlighted">
              {{ emAndamento }}
            </p>
            <p class="text-sm text-muted">
              Em andamento
            </p>
          </UPageCard>
          <UPageCard variant="subtle" class="text-center">
            <p class="text-2xl font-bold text-highlighted">
              {{ concluidas }}
            </p>
            <p class="text-sm text-muted">
              Concluídas
            </p>
          </UPageCard>
        </div>

        <UPageCard variant="subtle">
          <template #header>
            <span class="font-medium text-highlighted">Notificações</span>
          </template>
          <p class="text-sm text-muted">
            O envio de notificações por e-mail/SMS sobre o andamento das solicitações chega na Etapa 5.
          </p>
        </UPageCard>

        <div class="flex justify-center gap-3">
          <UButton to="/minhas-solicitacoes" label="Ver minhas solicitações" color="neutral" variant="soft" />
          <UButton label="Sair" color="secondary" variant="outline" icon="i-lucide-log-out" @click="sair" />
        </div>
      </div>
    </UContainer>
  </div>
</template>
