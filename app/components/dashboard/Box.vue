<script setup lang="ts">
// Container que agrupa vários itens compactos lado a lado dentro de uma
// única faixa visual (ex.: os 4 indicadores secundários da home/painel, ou
// os 4 números da seção "Administração") — usa Card.vue (variant subtle,
// sem padding próprio) só como casca, e organiza o conteúdo num grid com
// divisórias internas entre os itens.
withDefaults(defineProps<{
  colunas?: 2 | 3 | 4
}>(), {
  colunas: 4,
})

const COLUNAS_SM: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}
</script>

<template>
  <DashboardCard variant="subtle" padding="nenhum">
    <div class="grid grid-cols-2 divide-x divide-y divide-default sm:divide-y-0" :class="COLUNAS_SM[colunas]">
      <slot />
    </div>
  </DashboardCard>
</template>
