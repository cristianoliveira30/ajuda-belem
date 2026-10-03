<script setup lang="ts">
const { perfil, refresh } = usePerfil()

const ehAdmin = computed(() => perfil.value?.papel === 'admin')

// Cada papel tem a sua tela inicial (ver app/utils/destinoPosLogin.ts): o
// admin abre na visão geral e ainda gerencia servidores; o servidor abre
// direto na fila de solicitações.
const links = computed(() => {
  const visaoGeral = { label: 'Visão geral', icon: 'i-lucide-layout-dashboard', to: '/painel' }
  const solicitacoes = { label: 'Solicitações', icon: 'i-lucide-list-checks', to: '/painel/solicitacoes' }

  if (ehAdmin.value)
    return [visaoGeral, solicitacoes, { label: 'Servidores', icon: 'i-lucide-users', to: '/painel/servidores' }]

  return [solicitacoes, visaoGeral]
})

const tituloPainel = computed(() => ehAdmin.value ? 'Painel do administrador' : 'Painel do servidor')

const erroSair = ref('')

async function sair() {
  erroSair.value = ''

  try {
    await authClient.signOut()
  }
  catch {
    erroSair.value = 'Não foi possível sair agora.'
    return
  }

  // Mesmo motivo do sair() em app/pages/perfil.vue: força a sessão em
  // cache (key 'sessao', compartilhada em todo o app) a refletir o logout.
  await refresh()
  await navigateTo('/')
}
</script>

<template>
  <UDashboardGroup class="min-h-screen">
    <UDashboardSidebar>
      <template #header>
        <NuxtLink to="/painel" class="flex items-center gap-2">
          <span class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 text-sm font-bold text-white">
            AB
          </span>
          <span class="font-bold text-highlighted">{{ ehAdmin ? 'Admin' : 'Servidor' }}</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="links" orientation="vertical" />

      <template #footer>
        <div class="w-full space-y-2">
          <p class="truncate text-xs text-muted">
            {{ perfil?.nome }} · {{ perfil?.secretaria || 'Prefeitura' }}
          </p>
          <UButton label="Voltar ao site" icon="i-lucide-arrow-left" to="/" color="neutral" variant="ghost" block />
          <UAlert v-if="erroSair" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erroSair" />
          <UButton label="Sair" icon="i-lucide-log-out" color="error" variant="ghost" block @click="sair" />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="tituloPainel" />
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
