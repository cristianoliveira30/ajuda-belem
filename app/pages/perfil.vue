<script setup lang="ts">
useSeoMeta({ title: 'Meu perfil — Ajuda Belém' })

const { perfil, status, refresh } = usePerfil()

// Cidadão que entrou pelo Google não tem CPF (Google não fornece) — pede só
// isso aqui mesmo, em vez de mandar pra outra tela. Cadastro tradicional
// nunca cai nesse caso, já nasce com CPF (ver hook em server/utils/auth.ts).
const cadastroIncompleto = computed(() => perfil.value?.papel === 'cidadao' && !perfil.value.cpf)

// Servidor criado pelo admin precisa trocar a senha inicial antes de
// qualquer outra coisa — mesmo padrão do CPF acima, só que pra essa
// situação (ver server/api/admin/servidores/index.post.ts e
// app/middleware/auth.global.ts, que já redireciona pra cá).
const primeiroAcessoPendente = computed(() => perfil.value?.papel === 'servidor' && perfil.value.primeiroAcesso)

const senhaAtual = ref('')
const novaSenha = ref('')
const carregandoSenha = ref(false)
const erroSenha = ref('')

async function trocarSenhaInicial() {
  erroSenha.value = ''

  if (!validarSenha(novaSenha.value)) {
    erroSenha.value = 'A nova senha precisa ter pelo menos 6 caracteres, com letra e número.'
    return
  }

  carregandoSenha.value = true

  try {
    const { error } = await authClient.changePassword({
      currentPassword: senhaAtual.value,
      newPassword: novaSenha.value,
    })

    if (error) {
      erroSenha.value = error.message || 'Não foi possível trocar sua senha agora.'
      return
    }

    // `primeiroAcesso` já foi zerado no backend pelo hook `after` de
    // `/change-password` (ver server/utils/auth.ts) — só precisamos de uma
    // leitura fresca aqui pra sessão em cache (key 'sessao') refletir isso
    // antes do middleware avaliar a próxima navegação.
    await $fetch('/api/auth/get-session', { query: { disableCookieCache: true } })
    await refresh()
  }
  catch {
    erroSenha.value = 'Não foi possível trocar sua senha agora. Tente novamente.'
  }
  finally {
    carregandoSenha.value = false
  }
}

const cpf = ref('')
const carregandoCpf = ref(false)
const erroCpf = ref('')

async function completarCpf() {
  erroCpf.value = ''

  if (!validarCpf(cpf.value)) {
    erroCpf.value = 'Informe um CPF válido.'
    return
  }

  carregandoCpf.value = true

  try {
    await $fetch('/api/perfil/completar-cadastro', {
      method: 'POST',
      body: { cpf: normalizarCpf(cpf.value) },
    })

    // O cookie de sessão cacheia o `cpf` antigo (null) por até 60s (ver
    // session.cookieCache em server/utils/auth.ts) — sem forçar uma leitura
    // fresca aqui, a tela continuaria achando que falta CPF até o cache
    // expirar sozinho.
    await $fetch('/api/auth/get-session', { query: { disableCookieCache: true } })
    await refresh()
  }
  catch (erroRequisicao) {
    const mensagem = (erroRequisicao as { data?: { message?: string } })?.data?.message
    erroCpf.value = mensagem || 'Não foi possível salvar seu CPF agora. Tente novamente.'
  }
  finally {
    carregandoCpf.value = false
  }
}

const erroSair = ref('')

async function sair() {
  erroSair.value = ''

  try {
    await authClient.signOut()
  }
  catch {
    erroSair.value = 'Não foi possível sair agora. Tente novamente.'
    return
  }

  // `refresh` força um novo GET /api/auth/get-session, ignorando o cache
  // compartilhado da key 'sessao' (ver useSessao.ts) — sem isso, a próxima
  // visita a uma rota protegida reaproveitava a sessão antiga em cache.
  await refresh()
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

      <UPageCard v-else-if="primeiroAcessoPendente" variant="subtle">
        <div class="mb-6 text-center">
          <span class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-sm">
            <UIcon name="i-lucide-key-round" class="size-6" />
          </span>
          <h1 class="mt-4 text-xl font-bold text-highlighted">
            Troque sua senha
          </h1>
          <p class="mt-1 text-sm text-muted">
            Este é seu primeiro acesso. Troque a senha inicial antes de continuar.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="trocarSenhaInicial">
          <UFormField label="Senha atual (a que você recebeu)">
            <UInput v-model="senhaAtual" type="password" required class="w-full" />
          </UFormField>
          <UFormField label="Nova senha" help="Mínimo 6 caracteres, com letra e número">
            <UInput v-model="novaSenha" type="password" required class="w-full" />
          </UFormField>

          <UAlert v-if="erroSenha" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erroSenha" />

          <UButton
            type="submit"
            label="Trocar senha e continuar"
            color="primary"
            block
            size="lg"
            :loading="carregandoSenha"
          />
        </form>
      </UPageCard>

      <UPageCard v-else-if="cadastroIncompleto" variant="subtle">
        <div class="mb-6 text-center">
          <span class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-sm">
            <UIcon name="i-lucide-user-check" class="size-6" />
          </span>
          <h1 class="mt-4 text-xl font-bold text-highlighted">
            Complete seu cadastro
          </h1>
          <p class="mt-1 text-sm text-muted">
            Para concluir seu cadastro, informe seu CPF.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="completarCpf">
          <UFormField label="CPF">
            <UInput v-model="cpf" required placeholder="000.000.000-00" class="w-full" />
          </UFormField>

          <UAlert v-if="erroCpf" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erroCpf" />

          <UButton
            type="submit"
            label="Concluir cadastro"
            color="primary"
            block
            size="lg"
            :loading="carregandoCpf"
          />
        </form>
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
                :color="perfil.papel === 'cidadao' ? 'primary' : 'secondary'"
                variant="subtle"
                class="mt-1"
              >
                <template v-if="perfil.papel === 'servidor'">
                  Servidor · {{ perfil.secretaria || 'Prefeitura' }}
                </template>
                <template v-else-if="perfil.papel === 'admin'">
                  Administrador
                </template>
                <template v-else>
                  Cidadão
                </template>
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
                {{ perfil.telefone || 'Não informado' }}
              </dd>
            </div>
          </dl>
        </UPageCard>

        <div class="mt-4 space-y-3">
          <UButton
            v-if="perfil.papel === 'servidor' || perfil.papel === 'admin'"
            to="/painel"
            label="Painel administrativo"
            icon="i-lucide-layout-dashboard"
            color="primary"
            variant="soft"
            block
          />
          <UButton
            to="/solicitacoes/acompanhar"
            label="Minhas solicitações"
            icon="i-lucide-list"
            color="neutral"
            variant="soft"
            block
          />
          <UAlert v-if="erroSair" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erroSair" />

          <UButton
            label=" conta"
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
