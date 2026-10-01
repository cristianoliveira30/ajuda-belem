<script setup lang="ts">
withDefaults(defineProps<{
  titulo: string
  valor: string | number
  descricao?: string
  icon?: string
  carregando?: boolean
  // KPI principal (card cheio, com borda/sombra própria) vs indicador
  // secundário (compacto, pensado pra ficar lado a lado dentro de uma
  // única faixa — ver app/pages/index.vue e app/pages/painel/index.vue).
  compacto?: boolean
}>(), {
  descricao: undefined,
  icon: undefined,
  carregando: false,
  compacto: false,
})
</script>

<template>
  <div v-if="compacto" class="flex items-center gap-3 p-3">
    <span v-if="icon" class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
      <UIcon :name="icon" class="size-4" />
    </span>
    <div class="min-w-0">
      <p class="truncate text-xs text-muted">
        {{ titulo }}
      </p>
      <div v-if="carregando" class="mt-1 h-5 w-14 animate-pulse rounded bg-elevated" />
      <p v-else class="truncate text-base font-bold text-highlighted">
        {{ valor }}
      </p>
      <p v-if="descricao" class="truncate text-[11px] text-muted">
        {{ descricao }}
      </p>
    </div>
  </div>

  <DashboardCard v-else variant="solido">
    <div class="flex items-center justify-between gap-2">
      <p class="truncate text-xs font-medium text-muted">
        {{ titulo }}
      </p>
      <UIcon v-if="icon" :name="icon" class="size-4 shrink-0 text-muted" />
    </div>

    <div v-if="carregando" class="mt-2 h-7 w-16 animate-pulse rounded bg-elevated" />
    <p v-else class="mt-1 truncate text-2xl font-bold text-highlighted">
      {{ valor }}
    </p>

    <p v-if="descricao" class="mt-1 truncate text-xs text-muted">
      {{ descricao }}
    </p>
  </DashboardCard>
</template>
