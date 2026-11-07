<script setup lang="ts">
const colorMode = useColorMode()
const { loggedIn, user, clear } = useUserSession()
const router = useRouter()

const links = [
  { label: 'Início', to: '/' },
  { label: 'Registrar problema', to: '/solicitacoes/nova' },
  { label: 'Acompanhar', to: '/solicitacoes/acompanhar' },
  { label: 'Mapa', to: '/mapa' },
]

const menuUsuario = computed(() => [[
  {
    label: user.value?.tipo === 'servidor' ? 'Painel' : 'Minhas solicitações',
    icon: user.value?.tipo === 'servidor' ? 'i-lucide-layout-dashboard' : 'i-lucide-list-checks',
    to: user.value?.tipo === 'servidor' ? '/painel' : '/minhas-solicitacoes',
  },
  ...(user.value?.tipo === 'cidadao' ? [{ label: 'Meu perfil', icon: 'i-lucide-user', to: '/perfil' }] : []),
], [
  { label: 'Sair', icon: 'i-lucide-log-out', onSelect: sair },
]])

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function sair() {
  await clear()
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/80 backdrop-blur">
    <UContainer class="flex h-16 items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 text-sm font-bold text-white shadow-sm">
          AB
        </span>
        <span class="text-lg font-bold text-highlighted">
          Ajuda Belém
        </span>
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-1">
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          color="neutral"
          variant="ghost"
          :label="link.label"
        />
      </nav>

      <div class="flex items-center gap-2">
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          color="neutral"
          variant="ghost"
          aria-label="Alternar tema claro/escuro"
          @click="toggleColorMode"
        />
        <UDropdownMenu v-if="loggedIn" :items="menuUsuario" class="hidden md:inline-flex">
          <UButton color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down">
            {{ user?.nome?.split(' ')[0] }}
          </UButton>
        </UDropdownMenu>
        <UButton
          v-else
          to="/entrar"
          color="secondary"
          variant="solid"
          label="Entrar"
          class="hidden md:inline-flex"
        />
      </div>
    </UContainer>
  </header>
</template>
