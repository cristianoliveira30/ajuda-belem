<script setup lang="ts">
import type { CategoriaAviso } from '#shared/utils/avisos'

useSeoMeta({ title: 'Avisos e notícias — Ajuda Belém' })

const filtro = ref<CategoriaAviso | ''>('')

const abas = [
  { label: 'Todos', value: '' as const },
  ...(Object.entries(CATEGORIAS_AVISO) as [CategoriaAviso, typeof CATEGORIAS_AVISO[CategoriaAviso]][])
    .map(([valor, info]) => ({ label: info.label, value: valor })),
]

const avisosFiltrados = computed(() =>
  filtro.value ? AVISOS.filter(aviso => aviso.categoria === filtro.value) : AVISOS,
)

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="max-w-2xl py-10 sm:py-16">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-highlighted">
          Avisos e notícias
        </h1>
        <p class="mt-1 text-muted">
          Fique por dentro do que está acontecendo na cidade.
        </p>
      </div>

      <div class="mb-6 flex flex-wrap gap-2">
        <UButton
          v-for="aba in abas"
          :key="aba.value"
          :label="aba.label"
          :color="filtro === aba.value ? 'primary' : 'neutral'"
          :variant="filtro === aba.value ? 'solid' : 'soft'"
          size="sm"
          class="rounded-full"
          @click="filtro = aba.value"
        />
      </div>

      <div class="space-y-4">
        <div
          v-for="aviso in avisosFiltrados"
          :key="aviso.id"
          class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default"
        >
          <div class="flex items-start gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
              <UIcon :name="aviso.icon" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <UBadge :color="CATEGORIAS_AVISO[aviso.categoria].color" variant="subtle" size="sm">
                  {{ CATEGORIAS_AVISO[aviso.categoria].label }}
                </UBadge>
                <span class="text-xs text-muted">{{ formatarData(aviso.data) }}</span>
              </div>
              <p class="mt-2 font-semibold text-highlighted">
                {{ aviso.titulo }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ aviso.descricao }}
              </p>
            </div>
          </div>
        </div>

        <p v-if="!avisosFiltrados.length" class="text-center text-muted">
          Nenhum aviso nessa categoria no momento.
        </p>
      </div>
    </UContainer>
  </div>
</template>
