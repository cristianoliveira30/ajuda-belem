<script setup lang="ts">
const protocolo = ref('')
const busca = ref('')
const router = useRouter()

function consultarProtocolo() {
  if (!protocolo.value.trim())
    return

  router.push({ path: '/solicitacoes/acompanhar', query: { protocolo: protocolo.value.trim() } })
}

const saudacao = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12)
    return 'Bom dia'
  if (hora < 18)
    return 'Boa tarde'
  return 'Boa noite'
})

const servicosFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo)
    return CATEGORIAS

  return CATEGORIAS.filter(categoria =>
    categoria.label.toLowerCase().includes(termo) || categoria.description.toLowerCase().includes(termo),
  )
})

const avisos = [
  {
    icon: 'i-lucide-cloud-rain',
    title: 'Período chuvoso em Belém',
    description: 'Relate pontos de alagamento na sua região para agilizar a limpeza de bueiros e canais.',
  },
  {
    icon: 'i-lucide-hard-hat',
    title: 'Manutenção programada',
    description: 'Equipes de zeladoria seguem atuando nos bairros com mais solicitações abertas.',
  },
  {
    icon: 'i-lucide-megaphone',
    title: 'Canal oficial',
    description: 'O Ajuda Belém é o canal direto entre você e as equipes de infraestrutura da Prefeitura.',
  },
]

const passos = [
  {
    title: '1. Conte o que aconteceu',
    description: 'Converse com o assistente, envie uma foto e a localização do problema.',
    icon: 'i-lucide-message-circle',
  },
  {
    title: '2. Acompanhe pelo protocolo',
    description: 'Receba um número de protocolo para consultar o andamento a qualquer momento.',
    icon: 'i-lucide-search',
  },
  {
    title: '3. Receba atualizações',
    description: 'Veja o histórico de status até a conclusão do atendimento.',
    icon: 'i-lucide-bell',
  },
]
</script>

<template>
  <div>
    <div class="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-600 to-primary-500 px-4 pb-20 pt-8 sm:pt-12">
      <svg class="pointer-events-none absolute inset-x-0 bottom-0 text-white/10" viewBox="0 0 400 90" preserveAspectRatio="none" fill="currentColor">
        <path d="M0 45 Q100 5 200 45 T400 45 V90 H0 Z" />
        <path d="M0 62 Q100 25 200 62 T400 62 V90 H0 Z" opacity="0.7" />
      </svg>

      <UContainer class="relative">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white">
              <UIcon name="i-lucide-landmark" class="size-6" />
            </span>
            <div>
              <p class="text-lg font-extrabold leading-none text-white">
                Ajuda Belém
              </p>
              <p class="mt-1 text-xs text-white/70">
                Prefeitura de Belém do Pará
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-bell"
              color="neutral"
              variant="ghost"
              class="bg-white/15 text-white hover:bg-white/25"
              aria-label="Notificações"
            />
            <UButton
              to="/entrar"
              icon="i-lucide-user"
              color="neutral"
              variant="ghost"
              class="bg-white/15 text-white hover:bg-white/25"
              aria-label="Entrar"
            />
          </div>
        </div>

        <p class="mt-8 text-sm font-medium text-white/80">
          {{ saudacao }}, cidadão! 👋
        </p>
        <h1 class="mt-1 text-2xl font-extrabold leading-snug text-white sm:text-3xl">
          Encontrou um problema na cidade?<br class="hidden sm:block"> Conte para o Ajuda Belém.
        </h1>
        <p class="mt-2 max-w-md text-sm text-white/80">
          Envie uma foto ou conte o que aconteceu. Nosso assistente ajuda você a registrar a ocorrência.
        </p>
      </UContainer>
    </div>

    <div class="bg-muted pb-12">
      <UContainer class="relative z-10 -mt-10">
        <NuxtLink
          to="/solicitacoes/nova"
          class="flex items-center gap-4 rounded-2xl bg-default p-4 shadow-lg ring-1 ring-default transition hover:shadow-xl active:scale-[0.99]"
        >
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300">
            <UIcon name="i-lucide-message-circle" class="size-5" />
          </span>
          <span class="flex-1">
            <span class="block font-bold text-highlighted">Contar um problema</span>
            <span class="block text-sm text-muted">Fale com o Assistente Ajuda Belém</span>
          </span>
          <UIcon name="i-lucide-arrow-right" class="size-5 text-muted" />
        </NuxtLink>
      </UContainer>

      <UContainer class="mt-8 space-y-8">
        <section>
          <h2 class="mb-4 text-lg font-bold text-highlighted">
            Atalhos rápidos
          </h2>
          <UInput
            v-model="busca"
            placeholder="Buscar por palavra-chave, ex: buraco, luz, alagamento..."
            icon="i-lucide-search"
            size="lg"
            class="mb-5 w-full"
          />

          <div v-if="servicosFiltrados.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NuxtLink
              v-for="servico in servicosFiltrados"
              :key="servico.value"
              :to="{ path: '/solicitacoes/nova', query: { categoria: servico.value } }"
              class="flex flex-col items-center gap-2 rounded-2xl bg-default p-4 text-center shadow-sm ring-1 ring-default transition hover:shadow-md active:scale-[0.97]"
            >
              <span class="flex size-11 items-center justify-center rounded-xl" :class="TOM_CATEGORIA_CLASSES[servico.tom]">
                <UIcon :name="servico.icon" class="size-5" />
              </span>
              <span class="text-xs font-semibold text-highlighted">{{ servico.label }}</span>
            </NuxtLink>
          </div>
          <p v-else class="text-center text-muted">
            Nenhuma categoria encontrada. Você ainda pode
            <NuxtLink to="/solicitacoes/nova" class="text-primary underline">
              contar o problema para o assistente
            </NuxtLink>.
          </p>
        </section>

        <section class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default">
          <h2 class="mb-3 text-base font-bold text-highlighted">
            Acompanhar protocolo
          </h2>
          <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="consultarProtocolo">
            <UInput v-model="protocolo" placeholder="Ex: 2026384512" icon="i-lucide-hash" size="lg" class="flex-1" />
            <UButton type="submit" label="Buscar" color="primary" size="lg" />
          </form>
        </section>

        <section id="avisos" class="scroll-mt-20">
          <h2 class="mb-4 text-lg font-bold text-highlighted">
            Avisos e notícias
          </h2>
          <div class="space-y-3">
            <div
              v-for="aviso in avisos"
              :key="aviso.title"
              class="flex items-start gap-3 rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default"
            >
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <UIcon :name="aviso.icon" class="size-5" />
              </span>
              <div>
                <p class="font-semibold text-highlighted">
                  {{ aviso.title }}
                </p>
                <p class="mt-0.5 text-sm text-muted">
                  {{ aviso.description }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </UContainer>
    </div>

    <UPageSection
      title="Como funciona"
      description="Uma conversa simples, do relato à conclusão do atendimento."
    >
      <UPageGrid>
        <UPageFeature
          v-for="passo in passos"
          :key="passo.title"
          :icon="passo.icon"
          :title="passo.title"
          :description="passo.description"
        />
      </UPageGrid>
    </UPageSection>

    <UPageCTA
      title="Encontrou um problema na sua região?"
      description="Contar para o Ajuda Belém leva poucos minutos e ajuda a Prefeitura a priorizar os reparos."
      :links="[
        { label: 'Conversar e registrar problema', to: '/solicitacoes/nova', icon: 'i-lucide-message-circle', color: 'secondary' },
      ]"
      variant="soft"
    />
  </div>
</template>
