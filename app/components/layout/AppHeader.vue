<script setup lang="ts">
const colorMode = useColorMode()

const modoPreto = ref(false)

const { data: sessao } = useSessao()

const links = [
  { label: 'Início', to: '/' },
  { label: 'Registrar problema', to: '/solicitacoes/nova' },
  { label: 'Acompanhar', to: '/solicitacoes/acompanhar' },
  { label: 'Mapa', to: '/mapa' },
  { label: 'Avisos', to: '/avisos' },
]

function alternarTema() {
  if (colorMode.value === 'light') {
    colorMode.preference = 'dark'
    modoPreto.value = false
  } else if (!modoPreto.value) {
    modoPreto.value = true
    colorMode.preference = 'dark'
  } else {
    modoPreto.value = false
    colorMode.preference = 'light'
  }

  localStorage.setItem(
    'tema-preto-ajuda-belem',
    String(modoPreto.value),
  )
}

function atualizarClasseBlack() {
  if (!import.meta.client) return

  document.documentElement.classList.toggle(
    'black',
    colorMode.value === 'dark' && modoPreto.value,
  )
}

watch(
  [modoPreto, () => colorMode.value],
  () => {
    atualizarClasseBlack()
  },
)

onMounted(() => {
  modoPreto.value = localStorage.getItem('tema-preto-ajuda-belem') === 'true'

  nextTick(() => {
    atualizarClasseBlack()
  })
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/80 backdrop-blur">
    <UContainer class="flex h-14 items-center justify-between gap-4 md:h-16">
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
        <ClientOnly>
  <UButton
    :icon="
      colorMode.value === 'light'
        ? 'i-lucide-sun'
        : modoPreto
          ? 'i-lucide-contrast'
          : 'i-lucide-moon'
    "
    color="neutral"
    variant="ghost"
    :aria-label="
      colorMode.value === 'light'
        ? 'Tema claro'
        : modoPreto
          ? 'Tema preto'
          : 'Tema escuro'
    "
    @click="alternarTema"
  />
</ClientOnly>
        <UButton
          :to="sessao?.user ? '/perfil' : '/entrar'"
          :icon="sessao?.user ? 'i-lucide-user' : undefined"
          color="secondary"
          variant="solid"
          :label="sessao?.user ? 'Minha conta' : 'Entrar'"
          class="hidden md:inline-flex"
        />
      </div>
    </UContainer>
  </header>
</template>
