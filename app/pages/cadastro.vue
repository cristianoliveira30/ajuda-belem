<script setup lang="ts">
useSeoMeta({ title: 'Criar conta — Ajuda Belém' })

const nome = ref('')
const email = ref('')
const telefone = ref('')
const cpf = ref('')
const senha = ref('')
const carregando = ref(false)
const erro = ref('')

async function cadastrar() {
  erro.value = ''

  if (nome.value.trim().length < 3) {
    erro.value = 'Informe seu nome completo.'
    return
  }
  if (senha.value.length < 6) {
    erro.value = 'A senha precisa ter pelo menos 6 caracteres.'
    return
  }

  const ameaca = detectarAmeacaEntrada(nome.value) || detectarAmeacaEntrada(telefone.value)
  if (ameaca) {
    erro.value = MENSAGEM_AMEACA_ENTRADA[ameaca]
    return
  }

  carregando.value = true

  try {
    const { error } = await authClient.signUp.email({
      name: nome.value.trim(),
      email: email.value.trim(),
      password: senha.value,
      telefone: telefone.value.trim() || undefined,
      cpf: cpf.value.trim() || undefined,
    })

    if (error) {
      erro.value = error.status === 422
        ? 'Já existe uma conta com esse e-mail.'
        : 'Não foi possível criar sua conta. Tente novamente.'
      return
    }

    await navigateTo('/perfil')
  }
  catch {
    erro.value = 'Não foi possível criar sua conta agora. Verifique sua conexão e tente novamente.'
  }
  finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="flex min-h-full items-center justify-center bg-muted px-4 py-16">
    <UPageCard variant="subtle" class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <span class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-sm">
          <UIcon name="i-lucide-user-plus" class="size-6" />
        </span>
        <h1 class="mt-4 text-xl font-bold text-highlighted">
          Criar conta de cidadão
        </h1>
        <p class="mt-1 text-sm text-muted">
          Acompanhe suas solicitações e mantenha seus dados salvos.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="cadastrar">
        <UFormField label="Nome completo">
          <UInput v-model="nome" required class="w-full" />
        </UFormField>
        <UFormField label="E-mail">
          <UInput v-model="email" type="email" required placeholder="voce@exemplo.com" class="w-full" />
        </UFormField>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Telefone">
            <UInput v-model="telefone" placeholder="(91) 90000-0000" class="w-full" />
          </UFormField>
          <UFormField label="CPF (opcional)">
            <UInput v-model="cpf" placeholder="000.000.000-00" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Senha" help="Mínimo de 6 caracteres">
          <UInput v-model="senha" type="password" required placeholder="••••••••" class="w-full" />
        </UFormField>

        <UAlert v-if="erro" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erro" />

        <UButton
          type="submit"
          label="Criar conta"
          color="primary"
          block
          size="lg"
          :loading="carregando"
        />
      </form>

      <p class="mt-6 text-center text-sm text-muted">
        Já tem conta?
        <NuxtLink to="/entrar" class="font-medium text-primary">
          Entrar
        </NuxtLink>
      </p>
    </UPageCard>
  </div>
</template>
