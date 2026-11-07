<script setup lang="ts">
definePageMeta({ middleware: 'servidor' })
useSeoMeta({ title: 'Painel administrativo — Ajuda Belém' })

const { user, clear } = useUserSession()
const router = useRouter()

async function sair() {
  await clear()
  router.push('/')
}
</script>

<template>
  <UContainer class="py-16">
    <UPageCard class="mx-auto max-w-xl text-center" variant="subtle">
      <UBadge color="secondary" variant="subtle" class="mx-auto mb-4">
        Etapa 3
      </UBadge>
      <h1 class="text-2xl font-bold text-highlighted">
        Olá, {{ user?.nome }}
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ user?.papel === 'gestor' ? 'Gestor(a)' : 'Atendente' }} · {{ user?.secretaria }}
      </p>
      <p class="mt-4 text-muted">
        A fila de triagem, atribuição de responsáveis e os indicadores por secretaria serão implementados na Etapa 3. Veja docs/etapa-iniciais.md.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <UButton to="/" label="Voltar para o início" color="neutral" variant="soft" />
        <UButton label="Sair" color="secondary" variant="outline" icon="i-lucide-log-out" @click="sair" />
      </div>
    </UPageCard>
  </UContainer>
</template>
