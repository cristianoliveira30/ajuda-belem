<script setup lang="ts">
const abas = [
  { label: 'Início', icon: 'i-lucide-home', to: '/' },
  { label: 'Mapa', icon: 'i-lucide-map', to: '/mapa' },
  { label: 'Protocolos', icon: 'i-lucide-clock', to: '/solicitacoes/acompanhar' },
  { label: 'Avisos', icon: 'i-lucide-newspaper', to: '/avisos' },
  { label: 'Perfil', icon: 'i-lucide-user', to: '/perfil' },
]

const route = useRoute()
function ativo(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-default bg-default/95 backdrop-blur md:hidden">
    <div class="flex items-stretch justify-around">
      <NuxtLink
        v-for="aba in abas"
        :key="aba.label"
        :to="aba.to"
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors"
        :class="ativo(aba.to) ? 'text-primary' : 'text-muted'"
      >
        <UIcon :name="aba.icon" class="size-5" />
        {{ aba.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
