<script setup lang="ts">
const { perfil, refresh } = usePerfil()

const links = computed(() => {
  const base = [
    { label: 'Visão geral', icon: 'i-lucide-layout-dashboard', to: '/painel' },
    { label: 'Solicitações', icon: 'i-lucide-list-checks', to: '/painel/solicitacoes' },
  ]

  if (perfil.value?.papel === 'admin') {
    base.push({ label: 'Servidores', icon: 'i-lucide-users', to: '/painel/servidores' })
  }

  return base
})

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
          <span class="font-bold text-highlighted">Painel</span>
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
        <UDashboardNavbar title="Painel administrativo" />
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
