<script setup lang="ts">
import { OPCOES_PERIODO } from '#shared/utils/periodo'

// Reaproveitado pela home e pelo painel (ver app/pages/index.vue e
// app/pages/painel/index.vue) — mesmas opções, mesmo componente, sem
// duplicar a lista nem o cálculo de datas (isso fica só no backend, ver
// server/api/dashboard.get.ts).
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [valor: string]
}>()
</script>

<template>
  <USelect
    :model-value="modelValue"
    :items="OPCOES_PERIODO"
    class="w-40"
    @update:model-value="(valor) => $emit('update:modelValue', String(valor))"
  />
</template>
