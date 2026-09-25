<script setup lang="ts">
useSeoMeta({ title: 'Meu perfil — Ajuda Belém' })

const { perfil, status, refresh } = usePerfil()

async function sair() {
  await authClient.signOut()
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="max-w-lg py-10 sm:py-16">
      <div v-if="status === 'pending'" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
      </div>

      <UPageCard v-else-if="!perfil" variant="subtle" class="text-center">
        <UIcon name="i-lucide-alert-triangle" class="mx-auto size-8 text-error" />
        <p class="mt-3 text-highlighted">
          Não foi possível carregar seu perfil.
        </p>
        <UButton label="Tentar novamente" color="neutral" variant="soft" class="mt-4" @click="refresh()" />
      </UPageCard>

      <template v-else>
        <UPageCard variant="subtle">
          <div class="flex items-center gap-4">
            <span class="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-lg font-bold text-white">
              {{ perfil.nome.charAt(0).toUpperCase() }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-lg font-bold text-highlighted">
                {{ perfil.nome }}
              </p>
              <p class="truncate text-sm text-muted">
                {{ perfil.email }}
              </p>
              <UBadge
                :color="perfil.papel === 'servidor' ? 'secondary' : 'primary'"
                variant="subtle"
                class="mt-1"
              >
                {{ perfil.papel === 'servidor' ? `Servidor · ${perfil.secretaria || 'Prefeitura'}` : 'Cidadão' }}
              </UBadge>
            </div>
          </div>

          <USeparator class="my-5" />

          <dl class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                CPF
              </dt>
              <dd class="text-highlighted">
                {{ mascararCpf(perfil.cpf) }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Telefone
              </dt>
              <dd class="text-highlighted">
                {{ perfil.telefone || '—' }}
              </dd>
            </div>
          </dl>
        </UPageCard>

        <div class="mt-4 space-y-3">
          <UButton
            v-if="perfil.papel === 'servidor'"
            to="/painel"
            label="Painel administrativo"
            icon="i-lucide-layout-dashboard"
            color="primary"
            variant="soft"
            block
          />
          <UButton
            to="/minhas-solicitacoes"
            label="Minhas solicitações"
            icon="i-lucide-list"
            color="neutral"
            variant="soft"
            block
          />
          <UButton
            label="Sair da conta"
            icon="i-lucide-log-out"
            color="error"
            variant="outline"
            block
            @click="sair"
          />
        </div>
      </template>
    </UContainer>
  </div>
</template>
