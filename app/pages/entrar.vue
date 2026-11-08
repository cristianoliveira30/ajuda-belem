<script setup lang="ts">
useSeoMeta({ title: 'Entrar — Ajuda Belém' })

// Quem já está logado continua podendo usar o formulário (para trocar de
// conta): a tela só avisa quem é a sessão atual e oferece atalho para a tela
// do papel dela ou para sair (ver app/utils/destinoPosLogin.ts).
const { data: sessao, refresh: atualizarSessao } = await useSessao()
const usuarioLogado = computed(() => sessao.value?.user ?? null)
const saindo = ref(false)

async function sairDaContaAtual() {
  saindo.value = true
  try {
    await authClient.signOut()
    await atualizarSessao()
  }
  finally {
    saindo.value = false
  }
}

const email = ref('')
const senha = ref('')
const carregando = ref(false)
const carregandoGoogle = ref(false)
const erro = ref('')

async function entrar() {
  erro.value = ''
  carregando.value = true

  try {
    const { data, error } = await authClient.signIn.email({
      email: email.value.trim(),
      password: senha.value,
    })

    if (error || !data?.user) {
      erro.value = 'E-mail ou senha inválidos.'
      return
    }

    // Conta desativada pelo admin (ver `banned` em server/utils/auth.ts):
    // o Better Auth ainda cria a sessão, então desfazemos aqui em vez de
    // mandar a pessoa para uma tela que vai rejeitá-la.
    if (data.user.banned) {
      await authClient.signOut()
      erro.value = 'Conta desativada. Fale com o administrador.'
      return
    }

    // Atualiza a sessão em cache (key 'sessao', compartilhada com o
    // cabeçalho e os middlewares) antes de navegar.
    await refreshNuxtData('sessao')
    await navigateTo(destinoPosLogin(data.user))
  }
  catch {
    erro.value = 'Não foi possível entrar agora. Verifique sua conexão e tente novamente.'
  }
  finally {
    carregando.value = false
  }
}

// Login via Google é sempre de cidadão (papel padrão) — sem CPF/senha
// envolvidos, então não há decisão de destino aqui como no login
// tradicional: vai direto para /perfil.
async function entrarComGoogle() {
  erro.value = ''
  carregandoGoogle.value = true

  try {
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/perfil',
    })

    if (error) {
      erro.value = error.message || 'Não foi possível continuar com o Google agora.'
      carregandoGoogle.value = false
    }
  }
  catch {
    erro.value = 'Não foi possível continuar com o Google agora. Verifique sua conexão e tente novamente.'
    carregandoGoogle.value = false
  }
}
</script>

<template>
  <div class="flex min-h-full items-center justify-center bg-muted px-4 py-16">
    <UPageCard variant="subtle" class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <span class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-sm">
          <UIcon name="i-lucide-landmark" class="size-6" />
        </span>
        <h1 class="mt-4 text-xl font-bold text-highlighted">
          Entrar no Ajuda Belém
        </h1>
        <p class="mt-1 text-sm text-muted">
          Acesse sua conta de cidadão ou servidor da Prefeitura.
        </p>
      </div>

      <UAlert
        v-if="usuarioLogado"
        class="mb-6"
        color="info"
        variant="subtle"
        icon="i-lucide-user-check"
        title="Você já está logado"
        :description="`${usuarioLogado.name} (${usuarioLogado.email}). Para entrar com outra conta, saia primeiro ou preencha abaixo.`"
        :actions="[
          { label: 'Ir para minha tela', color: 'primary', variant: 'soft', to: destinoPosLogin(usuarioLogado) },
          { label: 'Sair', color: 'neutral', variant: 'outline', loading: saindo, onClick: sairDaContaAtual },
        ]"
      />

      <UButton
        label="Continuar com Google"
        icon="i-lucide-chrome"
        color="neutral"
        variant="outline"
        block
        size="lg"
        :loading="carregandoGoogle"
        @click="entrarComGoogle"
      />

      <div class="my-6 flex items-center gap-3 text-xs text-muted">
        <span class="h-px flex-1 bg-default" />
        ou
        <span class="h-px flex-1 bg-default" />
      </div>

      <form class="space-y-4" @submit.prevent="entrar">
        <UFormField label="E-mail">
          <UInput v-model="email" type="email" required placeholder="voce@exemplo.com" class="w-full" />
        </UFormField>
        <UFormField label="Senha">
          <UInput v-model="senha" type="password" required placeholder="••••••••" class="w-full" />
        </UFormField>

        <UAlert v-if="erro" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erro" />

        <UButton
          type="submit"
          label="Entrar"
          color="primary"
          block
          size="lg"
          :loading="carregando"
        />
      </form>

      <div class="mt-6 space-y-2 text-center text-sm">
        <p class="text-muted">
          Ainda não tem conta?
          <NuxtLink to="/cadastro" class="font-medium text-primary">
            Cadastre-se
          </NuxtLink>
        </p>
        <p>
          <NuxtLink to="/" class="text-muted underline">
            Continuar sem login
          </NuxtLink>
        </p>
      </div>
    </UPageCard>
  </div>
</template>
