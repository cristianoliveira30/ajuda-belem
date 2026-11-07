<script setup lang="ts">
useSeoMeta({ title: 'Entrar — Ajuda Belém' })

const { fetch: atualizarSessao } = useUserSession()
const router = useRouter()

const email = ref('')
const senha = ref('')
const carregando = ref(false)
const erro = ref('')

async function entrar() {
  erro.value = ''
  carregando.value = true

  try {
    const usuario = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, senha: senha.value },
    })

    await atualizarSessao()
    router.push(usuario.tipo === 'servidor' ? '/painel' : '/minhas-solicitacoes')
  }
  catch {
    erro.value = 'E-mail ou senha inválidos.'
  }
  finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="min-h-full bg-muted">
    <UContainer class="py-10 sm:py-16">
      <div class="mx-auto max-w-md">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold text-highlighted">
            Entrar
          </h1>
          <p class="mt-2 text-muted">
            Acesse sua conta para acompanhar suas solicitações.
          </p>
        </div>

        <UCard variant="subtle">
          <form class="flex flex-col gap-4" @submit.prevent="entrar">
            <UFormField label="E-mail">
              <UInput v-model="email" type="email" placeholder="seu@email.com" icon="i-lucide-mail" class="w-full" required />
            </UFormField>
            <UFormField label="Senha">
              <UInput v-model="senha" type="password" placeholder="Sua senha" icon="i-lucide-lock" class="w-full" required />
            </UFormField>

            <UAlert
              v-if="erro"
              color="error"
              variant="subtle"
              icon="i-lucide-alert-triangle"
              :description="erro"
            />

            <UButton type="submit" label="Entrar" size="lg" block :loading="carregando" />
          </form>
        </UCard>

        <p class="mt-6 text-center text-sm text-muted">
          Ainda não tem conta?
          <NuxtLink to="/cadastro" class="font-medium text-primary">
            Cadastre-se
          </NuxtLink>
        </p>
      </div>
    </UContainer>
  </div>
</template>
