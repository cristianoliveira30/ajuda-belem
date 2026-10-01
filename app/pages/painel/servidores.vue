<script setup lang="ts">
useSeoMeta({ title: 'Servidores — Painel Ajuda Belém' })
// `middleware: 'servidor'` já garante servidor OU admin (ver
// app/middleware/servidor.ts) — a checagem abaixo (perfil.papel === 'admin')
// é só a restrição a mais específica desta página. A proteção de verdade é
// no backend: os 3 endpoints em server/api/admin/servidores/ usam
// `exigirAdmin`, então mesmo um servidor chamando a API direto recebe 403.
definePageMeta({ middleware: 'servidor', layout: 'painel' })

interface Servidor {
  id: string
  nome: string
  email: string
  telefone: string | null
  secretaria: string | null
  primeiroAcesso: boolean
  banned: boolean
  criadoEm?: string
}

const { perfil } = usePerfil()

const { data: servidores, refresh, status } = await useFetch<Servidor[]>('/api/admin/servidores')

const nome = ref('')
const email = ref('')
const senha = ref('')
const telefone = ref('')
const secretaria = ref('')
const criando = ref(false)
const erroCriar = ref('')
const senhaGerada = ref<{ email: string, senha: string } | null>(null)

async function criarServidor() {
  erroCriar.value = ''
  senhaGerada.value = null

  if (nome.value.trim().length < 3) {
    erroCriar.value = 'Informe o nome completo.'
    return
  }
  if (!validarSenha(senha.value)) {
    erroCriar.value = 'A senha inicial precisa ter pelo menos 6 caracteres, com letra e número.'
    return
  }

  criando.value = true

  try {
    await $fetch('/api/admin/servidores', {
      method: 'POST',
      body: {
        nome: nome.value.trim(),
        email: email.value.trim(),
        senha: senha.value,
        telefone: telefone.value.trim() || undefined,
        secretaria: secretaria.value.trim() || undefined,
      },
    })

    senhaGerada.value = { email: email.value.trim(), senha: senha.value }
    nome.value = ''
    email.value = ''
    senha.value = ''
    telefone.value = ''
    secretaria.value = ''
    await refresh()
  }
  catch (erro) {
    const mensagem = (erro as { data?: { message?: string } })?.data?.message
    erroCriar.value = mensagem || 'Não foi possível criar o servidor agora.'
  }
  finally {
    criando.value = false
  }
}

const alternando = ref<string | null>(null)

async function alternarAtivo(servidor: Servidor) {
  alternando.value = servidor.id
  try {
    await $fetch(`/api/admin/servidores/${servidor.id}`, {
      method: 'PATCH',
      body: { banned: !servidor.banned },
    })
    await refresh()
  }
  catch {
    // Silencioso de propósito: a lista volta ao estado real no próximo
    // refresh; não há formulário associado pra mostrar um erro específico.
  }
  finally {
    alternando.value = null
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div v-if="perfil && perfil.papel !== 'admin'" class="rounded-2xl bg-default p-8 text-center shadow-sm ring-1 ring-default">
      <UIcon name="i-lucide-lock" class="mx-auto size-8 text-muted" />
      <p class="mt-3 text-muted">
        Esta área é restrita a administradores.
      </p>
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <h1 class="mb-4 text-lg font-bold text-highlighted">
          Servidores
        </h1>

        <div v-if="status === 'pending'" class="flex justify-center py-16">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
        </div>

        <div v-else-if="!servidores?.length" class="rounded-2xl bg-default p-8 text-center shadow-sm ring-1 ring-default">
          <UIcon name="i-lucide-users" class="mx-auto size-8 text-muted" />
          <p class="mt-3 text-muted">
            Nenhum servidor cadastrado ainda.
          </p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="servidor in servidores"
            :key="servidor.id"
            class="flex items-center gap-3 rounded-2xl bg-default p-4 shadow-sm ring-1 ring-default"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-highlighted">
                {{ servidor.nome }}
              </p>
              <p class="truncate text-sm text-muted">
                {{ servidor.email }} · {{ servidor.secretaria || 'Prefeitura' }}
              </p>
            </div>
            <UBadge v-if="servidor.primeiroAcesso" color="warning" variant="subtle" class="shrink-0">
              Primeiro acesso pendente
            </UBadge>
            <UBadge :color="servidor.banned ? 'error' : 'success'" variant="subtle" class="shrink-0">
              {{ servidor.banned ? 'Inativo' : 'Ativo' }}
            </UBadge>
            <UButton
              :label="servidor.banned ? 'Ativar' : 'Desativar'"
              :color="servidor.banned ? 'success' : 'error'"
              variant="soft"
              size="sm"
              class="shrink-0"
              :loading="alternando === servidor.id"
              @click="alternarAtivo(servidor)"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-default p-5 shadow-sm ring-1 ring-default lg:col-span-1">
        <h2 class="mb-4 font-bold text-highlighted">
          Criar servidor
        </h2>

        <UAlert
          v-if="senhaGerada"
          class="mb-4"
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle-2"
          title="Servidor criado"
          :description="`Informe a senha inicial pra ${senhaGerada.email} por um canal seguro — ela precisará trocar no primeiro acesso.`"
        />

        <form class="space-y-4" @submit.prevent="criarServidor">
          <UFormField label="Nome completo">
            <UInput v-model="nome" required class="w-full" />
          </UFormField>
          <UFormField label="E-mail">
            <UInput v-model="email" type="email" required class="w-full" />
          </UFormField>
          <UFormField label="Senha inicial" help="Mínimo 6 caracteres, com letra e número">
            <UInput v-model="senha" type="password" required class="w-full" />
          </UFormField>
          <UFormField label="Telefone (opcional)">
            <UInput v-model="telefone" class="w-full" />
          </UFormField>
          <UFormField label="Secretaria (opcional)">
            <UInput v-model="secretaria" class="w-full" />
          </UFormField>

          <UAlert v-if="erroCriar" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="erroCriar" />

          <UButton type="submit" label="Criar servidor" color="primary" block :loading="criando" />
        </form>
      </div>
    </div>
  </div>
</template>
