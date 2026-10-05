<script setup lang="ts">
const colorMode = useColorMode()

const CHAVE_TEMA_PRETO = 'tema-preto-ajuda-belem'

const modoPreto = ref(false)

const { data: sessao } = useSessao()

const links = [
  { label: 'Início', to: '/' },
  { label: 'Registrar problema', to: '/solicitacoes/nova' },
  { label: 'Acompanhar', to: '/solicitacoes/acompanhar' },
  { label: 'Mapa', to: '/mapa' },
  { label: 'Avisos', to: '/avisos' },
]

type Tema = 'light' | 'dark' | 'black'

const tema = computed<Tema>(() => {
  if (colorMode.value === 'light') return 'light'
  return modoPreto.value ? 'black' : 'dark'
})

const temaUi: Record<Tema, { icon: string, label: string }> = {
  light: { icon: 'i-lucide-sun', label: 'Tema claro' },
  dark: { icon: 'i-lucide-moon', label: 'Tema escuro' },
  black: { icon: 'i-lucide-contrast', label: 'Tema preto' },
}

const temaAtual = computed(() => temaUi[tema.value as Tema])

// Aplica a classe "black" antes da hidratação para evitar flash do tema escuro padrão
useHead({
  script: [
    {
      key: 'tema-preto-inicial',
      innerHTML: `try{if(localStorage.getItem('${CHAVE_TEMA_PRETO}')==='true'){document.documentElement.classList.add('black')}}catch(e){}`,
      tagPosition: 'head',
    },
  ],
})

function salvarTemaPreto() {
  try {
    localStorage.setItem(CHAVE_TEMA_PRETO, String(modoPreto.value))
  } catch {
    // armazenamento indisponível (modo privado/bloqueado)
  }
}

function alternarTema() {
  // claro -> escuro -> preto -> claro
  if (tema.value === 'light') {
    modoPreto.value = false
    colorMode.preference = 'dark'
  } else if (tema.value === 'dark') {
    modoPreto.value = true
  } else {
    modoPreto.value = false
    colorMode.preference = 'light'
  }

  salvarTemaPreto()
}

function atualizarClasseBlack() {
  document.documentElement.classList.toggle('black', tema.value === 'black')
}

watch(tema, atualizarClasseBlack)

onMounted(() => {
  try {
    modoPreto.value = localStorage.getItem(CHAVE_TEMA_PRETO) === 'true'
  } catch {
    modoPreto.value = false
  }

  atualizarClasseBlack()
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
            :icon="temaAtual.icon"
            color="neutral"
            variant="ghost"
            :aria-label="temaAtual.label"
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
