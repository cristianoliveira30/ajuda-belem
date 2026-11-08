<script setup lang="ts">
const columns = [
  {
    title: 'Serviços',
    links: [
      { label: 'Registrar problema', to: '/solicitacoes/nova' },
      { label: 'Acompanhar solicitação', to: '/solicitacoes/acompanhar' },
      { label: 'Mapa de ocorrências', to: '/mapa' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { label: 'Avisos e notícias', to: '/avisos' },
      { label: 'Contatos úteis', to: '/contatos' },
      { label: 'Acessibilidade', to: '/' },
    ],
  },
]
</script>

<template>
  <footer class="border-t border-default bg-elevated/50">
    <UContainer class="py-10">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-inverted">
              AB
            </span>
            <span class="text-lg font-bold text-highlighted">Ajuda Belém</span>
          </div>
          <p class="mt-3 text-sm text-muted max-w-xs">
            Canal oficial para solicitar e acompanhar serviços de infraestrutura
            urbana da cidade de Belém.
          </p>
        </div>

        <div v-for="column in columns" :key="column.title">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ column.title }}
          </h3>
          <ul class="mt-3 space-y-2">
            <li v-for="link in column.links" :key="link.label">
              <NuxtLink :to="link.to" class="text-sm text-muted hover:text-primary">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-8 flex flex-col gap-2 border-t border-default pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ new Date().getFullYear() }} Prefeitura de Belém — Ajuda Belém</p>
        <p>Inspirado no modelo SP156</p>
      </div>
    </UContainer>
  </footer>
</template>
