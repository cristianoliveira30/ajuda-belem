<script setup lang="ts">
useSeoMeta({ title: 'Contatos úteis — Ajuda Belém' })
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="max-w-2xl py-10 sm:py-16">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-highlighted">
          Contatos úteis
        </h1>
        <p class="mt-1 text-muted">
          Números de emergência e canais de atendimento da Prefeitura.
        </p>
      </div>

      <section class="mb-8">
        <h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Emergência
        </h2>
        <div class="space-y-2">
          <div
            v-for="contato in CONTATOS_EMERGENCIA"
            :key="contato.nome"
            class="flex items-center gap-3 rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300">
              <UIcon :name="contato.icon" class="size-5" />
            </span>
            <p class="flex-1 font-medium text-highlighted">
              {{ contato.nome }}
            </p>
            <a :href="`tel:${contato.telefone}`" class="font-mono text-lg font-bold text-primary">
              {{ contato.telefone }}
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Prefeitura de Belém
        </h2>
        <div class="space-y-2">
          <div
            v-for="contato in CONTATOS_PREFEITURA"
            :key="contato.nome"
            class="rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default"
          >
            <div class="flex items-center gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <UIcon :name="contato.icon" class="size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-highlighted">
                    {{ contato.nome }}
                  </p>
                  <UBadge v-if="contato.exemplo" color="warning" variant="subtle" size="sm">
                    Exemplo
                  </UBadge>
                </div>
              </div>
              <a :href="`tel:${contato.telefone}`" class="font-mono font-bold text-primary">
                {{ contato.telefone }}
              </a>
            </div>
            <p v-if="contato.descricao" class="mt-2 text-xs text-muted">
              {{ contato.descricao }}
            </p>
          </div>
        </div>
      </section>
    </UContainer>
  </div>
</template>
