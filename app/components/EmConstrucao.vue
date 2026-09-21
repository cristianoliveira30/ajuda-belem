<script setup lang="ts">
defineProps<{
  titulo: string
  etapa: string
  descricao: string
}>()
</script>

<template>
  <UContainer class="py-16">
    <UPageCard class="max-w-xl mx-auto text-center" variant="subtle">
      <UBadge color="secondary" variant="subtle" class="mx-auto mb-4">
        {{ etapa }}
      </UBadge>
      <h1 class="text-2xl font-bold text-highlighted">
        {{ titulo }}
      </h1>
      <p class="mt-2 text-muted">
        {{ descricao }}
      </p>
      <UButton to="/" label="Voltar para o início" color="neutral" variant="soft" class="mt-6" />
    </UPageCard>
  </UContainer>
</template>
