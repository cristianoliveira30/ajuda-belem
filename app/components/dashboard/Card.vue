<script setup lang="ts">
// Primitiva estrutural do dashboard: só cuida da "casca" (fundo, borda,
// sombra, cantos, padding) — nunca sabe o que tem dentro. KpiCard,
// ChartCard e o card do mapa (ver GraficosAnaliticos.vue) são construídos
// em cima dela; Box.vue (a faixa que agrupa vários itens) também.
withDefaults(defineProps<{
  // solido = card isolado (KPI principal): fundo opaco, sombra própria.
  // subtle = card de conteúdo (gráfico, mapa, faixa): fundo discreto, sem
  // sombra, no mesmo padrão do restante do Nuxt UI usado no projeto.
  variant?: 'solido' | 'subtle'
  padding?: 'normal' | 'compacto' | 'nenhum'
}>(), {
  variant: 'solido',
  padding: 'normal',
})

const PADDING_UCARD: Record<string, { header: string, body: string } | undefined> = {
  normal: undefined,
  compacto: { header: 'p-3 sm:p-4', body: 'p-2 sm:p-3' },
  nenhum: { header: 'p-0', body: 'p-0' },
}

const PADDING_DIV: Record<string, string> = {
  normal: 'p-4',
  compacto: 'p-3',
  nenhum: '',
}
</script>

<template>
  <UCard v-if="variant === 'subtle'" variant="subtle" :ui="PADDING_UCARD[padding]">
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
  </UCard>

  <div v-else class="rounded-2xl bg-default shadow-sm ring-1 ring-default" :class="PADDING_DIV[padding]">
    <slot name="header" />
    <slot />
  </div>
</template>
