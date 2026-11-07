<script setup lang="ts">
useSeoMeta({ title: 'Criar conta — Ajuda Belém' })

const { fetch: atualizarSessao } = useUserSession()
const router = useRouter()

const dados = reactive({
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  senha: '',
})
const confirmarSenha = ref('')
const carregando = ref(false)
const erro = ref('')

async function cadastrar() {
  erro.value = ''

  if (dados.senha !== confirmarSenha.value) {
    erro.value = 'As senhas não conferem.'
    return
  }

  carregando.value = true

  try {
    await $fetch('/api/auth/cadastro', {
      method: 'POST',
      body: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf || undefined,
        senha: dados.senha,
      },
    })

    await atualizarSessao()
    router.push('/minhas-solicitacoes')
  }
  catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    erro.value = status === 409
      ? 'Já existe uma conta com esse e-mail ou CPF.'
      : 'Não foi possível criar sua conta. Confira os dados e tente novamente.'
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
            Criar conta
          </h1>
          <p class="mt-2 text-muted">
            Crie sua conta de cidadão para acompanhar suas solicitações.
          </p>
        </div>

        <UCard variant="subtle">
          <form class="flex flex-col gap-4" @submit.prevent="cadastrar">
            <UFormField label="Nome completo">
              <UInput v-model="dados.nome" placeholder="Seu nome completo" icon="i-lucide-user" class="w-full" required />
            </UFormField>
            <UFormField label="E-mail">
              <UInput v-model="dados.email" type="email" placeholder="seu@email.com" icon="i-lucide-mail" class="w-full" required />
            </UFormField>
            <UFormField label="Telefone">
              <UInput v-model="dados.telefone" placeholder="(91) 99999-9999" icon="i-lucide-phone" class="w-full" required />
            </UFormField>
            <UFormField label="CPF (opcional)">
              <UInput v-model="dados.cpf" placeholder="000.000.000-00" icon="i-lucide-id-card" class="w-full" />
            </UFormField>
            <UFormField label="Senha">
              <UInput v-model="dados.senha" type="password" placeholder="Mínimo 8 caracteres" icon="i-lucide-lock" class="w-full" required />
            </UFormField>
            <UFormField label="Confirmar senha">
              <UInput v-model="confirmarSenha" type="password" placeholder="Repita a senha" icon="i-lucide-lock" class="w-full" required />
            </UFormField>

            <UAlert
              v-if="erro"
              color="error"
              variant="subtle"
              icon="i-lucide-alert-triangle"
              :description="erro"
            />

            <UButton type="submit" label="Criar conta" size="lg" block :loading="carregando" />
          </form>
        </UCard>

        <p class="mt-6 text-center text-sm text-muted">
          Já tem conta?
          <NuxtLink to="/entrar" class="font-medium text-primary">
            Entrar
          </NuxtLink>
        </p>
      </div>
    </UContainer>
  </div>
</template>
