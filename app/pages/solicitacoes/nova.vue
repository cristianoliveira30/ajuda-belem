<script setup lang="ts">
useSeoMeta({ title: 'Registrar problema — Ajuda Belém' })
definePageMeta({ layout: 'chat' })

interface MensagemChat {
  id: number
  autor: 'bot' | 'usuario'
  texto?: string
  fotos?: string[]
}

type Etapa =
  | 'descricao'
  | 'confirmar_categoria'
  | 'foto'
  | 'localizacao_opcoes'
  | 'localizacao_manual'
  | 'confirmar_localizacao'
  | 'referencia'
  | 'risco'
  | 'nome'
  | 'email'
  | 'telefone'
  | 'cpf'
  | 'resumo'
  | 'enviando'
  | 'concluido'

interface NominatimResposta {
  address?: {
    road?: string
    pedestrian?: string
    house_number?: string
    suburb?: string
    neighbourhood?: string
    city_district?: string
  }
}

const route = useRoute()
const router = useRouter()

const categoriaInicial = CATEGORIAS.some(categoria => categoria.value === route.query.categoria)
  ? (route.query.categoria as string)
  : ''

function estadoInicial() {
  return {
    categoria: categoriaInicial,
    descricao: '',
    fotos: [] as string[],
    rua: '',
    numero: '',
    bairro: '',
    pontoReferencia: '',
    risco: '' as '' | 'sim' | 'nao' | 'nao_sei',
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
  }
}

const dados = reactive(estadoInicial())
const mensagens = ref<MensagemChat[]>([])
const digitando = ref(false)
const etapa = ref<Etapa>('descricao')
const entrada = ref('')
const revisando = ref(false)
const protocoloGerado = ref('')
const protocoloCopiado = ref(false)
const erroEnvio = ref('')

const containerRef = useTemplateRef('containerRef')
const fileInputRef = useTemplateRef('fileInputRef')
const inputRef = useTemplateRef('inputRef')

const etapasComTexto: Etapa[] = ['descricao', 'referencia', 'nome', 'email', 'telefone', 'cpf']
const podeDigitar = computed(() => etapasComTexto.includes(etapa.value))

let contador = 0
function proximoId() {
  contador += 1
  return contador
}

async function rolarParaFinal() {
  await nextTick()
  if (containerRef.value)
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  inputRef.value?.focus()
}

function mensagemUsuario(texto?: string, fotos?: string[]) {
  mensagens.value.push({ id: proximoId(), autor: 'usuario', texto, fotos })
  rolarParaFinal()
}

async function mensagemBot(texto: string, delay = 500) {
  digitando.value = true
  rolarParaFinal()
  await new Promise(resolve => setTimeout(resolve, delay))
  digitando.value = false
  mensagens.value.push({ id: proximoId(), autor: 'bot', texto })
  rolarParaFinal()
}

async function iniciar() {
  const categoria = getCategoria(dados.categoria)
  if (categoria) {
    await mensagemBot(
      `Olá! 👋 Sou o assistente do Ajuda Belém. Entendi que você quer relatar um problema de ${categoria.label.toLowerCase()}. Pode me contar com mais detalhes o que está acontecendo?`,
    )
  }
  else {
    await mensagemBot('Olá! 👋 Sou o assistente do Ajuda Belém. Vou te ajudar a registrar um problema encontrado na cidade. O que aconteceu?')
  }
  etapa.value = 'descricao'
}

onMounted(iniciar)

async function enviarTexto() {
  const texto = entrada.value.trim()
  if (!texto || digitando.value)
    return

  entrada.value = ''

  if (etapa.value === 'descricao') {
    dados.descricao = dados.descricao ? `${dados.descricao} ${texto}` : texto
    mensagemUsuario(texto)

    if (!dados.categoria) {
      const detectada = detectarCategoria(texto)
      if (detectada) {
        dados.categoria = detectada
        await mensagemBot(`Entendi, parece ser um problema de ${getCategoria(detectada)?.label.toLowerCase()}.`)
        await perguntarFoto()
      }
      else {
        await mensagemBot('Só para eu entender melhor, qual dessas opções combina com o problema?')
        etapa.value = 'confirmar_categoria'
      }
    }
    else {
      await perguntarFoto()
    }
  }
  else if (etapa.value === 'referencia') {
    dados.pontoReferencia = texto
    mensagemUsuario(texto)
    await perguntarRisco()
  }
  else if (etapa.value === 'nome') {
    dados.nome = texto
    mensagemUsuario(texto)
    await perguntarEmail()
  }
  else if (etapa.value === 'email') {
    mensagemUsuario(texto)
    if (!/^\S+@\S+\.\S+$/.test(texto)) {
      await mensagemBot('Esse e-mail não parece válido. Pode conferir e enviar novamente?')
      return
    }
    dados.email = texto
    await perguntarTelefone()
  }
  else if (etapa.value === 'telefone') {
    mensagemUsuario(texto)
    if (texto.replace(/\D/g, '').length < 10) {
      await mensagemBot('Esse telefone parece incompleto. Envie com DDD, por favor.')
      return
    }
    dados.telefone = texto
    await perguntarCpf()
  }
  else if (etapa.value === 'cpf') {
    dados.cpf = texto
    mensagemUsuario(texto)
    await mostrarResumo()
  }
}

async function escolherCategoria(valor: string) {
  dados.categoria = valor
  mensagemUsuario(getCategoria(valor)?.label)
  await perguntarFoto()
}

async function perguntarFoto() {
  await mensagemBot('Você consegue mandar uma foto do local?')
  etapa.value = 'foto'
}

function abrirSeletorFoto() {
  fileInputRef.value?.click()
}

function arquivoParaBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function aoSelecionarFoto(event: Event) {
  const input = event.target as HTMLInputElement
  const arquivos = Array.from(input.files ?? []).slice(0, 3)
  input.value = ''
  if (!arquivos.length)
    return

  const fotos = await Promise.all(arquivos.map(arquivoParaBase64))
  dados.fotos.push(...fotos)
  mensagens.value.push({ id: proximoId(), autor: 'usuario', fotos })
  rolarParaFinal()
  await mensagemBot('Foto recebida. 👍 Isso vai ajudar a equipe a avaliar o problema.')
  await perguntarLocalizacao()
}

async function pularFoto() {
  mensagemUsuario('Não tenho foto agora')
  await perguntarLocalizacao()
}

async function perguntarLocalizacao() {
  await mensagemBot('Onde fica esse problema?')
  etapa.value = 'localizacao_opcoes'
}

async function usarLocalizacaoAtual() {
  mensagemUsuario('📍 Usar minha localização atual')

  if (!import.meta.client || !navigator.geolocation) {
    await mensagemBot('Seu navegador não permite compartilhar localização. Pode digitar o endereço?')
    etapa.value = 'localizacao_manual'
    return
  }

  digitando.value = true
  navigator.geolocation.getCurrentPosition(
    async (posicao) => {
      try {
        const { latitude, longitude } = posicao.coords
        const resposta = await $fetch<NominatimResposta>('https://nominatim.openstreetmap.org/reverse', {
          query: { lat: latitude, lon: longitude, format: 'jsonv2' },
        })
        const endereco = resposta?.address ?? {}
        dados.rua = endereco.road || endereco.pedestrian || ''
        dados.numero = endereco.house_number || 'S/N'
        dados.bairro = endereco.suburb || endereco.neighbourhood || endereco.city_district || ''
        digitando.value = false

        if (dados.rua && dados.bairro) {
          await mensagemBot(`Encontrei este local: ${dados.rua}, ${dados.bairro} — Belém/PA. É aqui?`)
          etapa.value = 'confirmar_localizacao'
        }
        else {
          await mensagemBot('Consegui sua localização, mas não encontrei o endereço completo. Pode confirmar a rua e o bairro?')
          etapa.value = 'localizacao_manual'
        }
      }
      catch {
        digitando.value = false
        await mensagemBot('Não consegui identificar o endereço a partir da localização. Pode digitar manualmente?')
        etapa.value = 'localizacao_manual'
      }
    },
    async () => {
      digitando.value = false
      await mensagemBot('Não consegui acessar sua localização. Pode digitar o endereço?')
      etapa.value = 'localizacao_manual'
    },
  )
}

function digitarEndereco() {
  mensagemUsuario('Prefiro digitar o endereço')
  etapa.value = 'localizacao_manual'
}

async function confirmarLocalizacaoEncontrada() {
  mensagemUsuario('Sim, é aqui')
  await perguntarReferencia()
}

function corrigirLocalizacao() {
  mensagemUsuario('Corrigir localização')
  etapa.value = 'localizacao_manual'
}

async function enviarEnderecoManual() {
  if (!dados.rua.trim() || !dados.bairro.trim())
    return

  mensagemUsuario(`${dados.rua}, ${dados.numero || 'S/N'} — ${dados.bairro}`)
  await perguntarReferencia()
}

async function perguntarReferencia() {
  await mensagemBot('Tem algum ponto de referência que ajude a equipe a encontrar o local?')
  etapa.value = 'referencia'
}

async function pularReferencia() {
  mensagemUsuario('Não tenho um ponto de referência')
  await perguntarRisco()
}

async function perguntarRisco() {
  await mensagemBot('Esse problema oferece risco imediato para pedestres ou veículos?')
  etapa.value = 'risco'
}

const LABEL_RISCO = { sim: 'Sim', nao: 'Não', nao_sei: 'Não sei' } as const

async function responderRisco(valor: 'sim' | 'nao' | 'nao_sei') {
  dados.risco = valor
  mensagemUsuario(LABEL_RISCO[valor])

  if (revisando.value) {
    revisando.value = false
    await mostrarResumo()
  }
  else {
    await perguntarNome()
  }
}

async function perguntarNome() {
  await mensagemBot('Para finalizar, qual é o seu nome completo?')
  etapa.value = 'nome'
}

async function perguntarEmail() {
  await mensagemBot('Qual o melhor e-mail para contato?')
  etapa.value = 'email'
}

async function perguntarTelefone() {
  await mensagemBot('E um telefone com DDD?')
  etapa.value = 'telefone'
}

async function perguntarCpf() {
  await mensagemBot('Se quiser, você pode informar seu CPF para facilitar o acompanhamento. É totalmente opcional.')
  etapa.value = 'cpf'
}

async function pularCpf() {
  mensagemUsuario('Prefiro não informar')
  await mostrarResumo()
}

async function mostrarResumo() {
  await mensagemBot('Pronto! Já tenho as informações necessárias. Confira antes de enviar:')
  etapa.value = 'resumo'
}

async function corrigirAlgo() {
  mensagemUsuario('Quero corrigir alguma informação')
  await mensagemBot('Sem problema! Me conte novamente o que está acontecendo, que eu atualizo os dados.')
  dados.descricao = ''
  dados.categoria = categoriaInicial
  revisando.value = true
  etapa.value = 'descricao'
}

const categoriaSelecionada = computed(() => getCategoria(dados.categoria))
const enderecoCompleto = computed(() => {
  if (!dados.rua)
    return ''
  return `${dados.rua}, ${dados.numero || 'S/N'} — ${dados.bairro}, Belém - PA`
})

async function confirmarEnvio() {
  etapa.value = 'enviando'
  erroEnvio.value = ''

  try {
    const { protocolo } = await $fetch<{ protocolo: string }>('/api/solicitacoes', {
      method: 'POST',
      body: {
        categoria: dados.categoria,
        descricao: dados.descricao,
        fotos: dados.fotos,
        rua: dados.rua,
        numero: dados.numero || 'S/N',
        bairro: dados.bairro,
        pontoReferencia: dados.pontoReferencia || undefined,
        risco: dados.risco || undefined,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf || undefined,
      },
    })

    protocoloGerado.value = protocolo
    etapa.value = 'concluido'
    await mensagemBot('✅ Ocorrência registrada! Sua solicitação foi enviada para a equipe responsável.', 300)
  }
  catch {
    erroEnvio.value = 'Não foi possível enviar sua solicitação agora. Tente novamente em instantes.'
    await mensagemBot('Ops, não consegui enviar sua solicitação agora. Podemos tentar de novo?')
    etapa.value = 'resumo'
  }
}

async function copiarProtocolo() {
  if (!protocoloGerado.value)
    return

  await navigator.clipboard.writeText(protocoloGerado.value)
  protocoloCopiado.value = true
  setTimeout(() => (protocoloCopiado.value = false), 2000)
}

function reiniciar() {
  Object.assign(dados, estadoInicial())
  mensagens.value = []
  protocoloGerado.value = ''
  erroEnvio.value = ''
  revisando.value = false
  contador = 0
  router.replace({ query: {} })
  etapa.value = 'descricao'
  iniciar()
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <div class="border-b border-default bg-elevated/40">
      <UContainer class="flex items-center gap-3 py-3">
        <UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Voltar" />
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-sm">
          <UIcon name="i-lucide-message-circle" class="size-5" />
        </span>
        <div>
          <p class="font-semibold text-highlighted">
            Assistente Ajuda Belém
          </p>
          <p class="flex items-center gap-1.5 text-xs text-muted">
            <span class="size-1.5 rounded-full bg-success" />
            Assistente virtual da Prefeitura
          </p>
        </div>
      </UContainer>
    </div>

    <div ref="containerRef" class="flex-1 overflow-y-auto">
      <UContainer class="max-w-2xl space-y-4 py-6">
        <div
          v-for="mensagem in mensagens"
          :key="mensagem.id"
          class="flex items-end gap-2"
          :class="mensagem.autor === 'usuario' ? 'justify-end' : 'justify-start'"
        >
          <span
            v-if="mensagem.autor === 'bot'"
            class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-white"
          >
            <UIcon name="i-lucide-message-circle" class="size-3" />
          </span>
          <div
            class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm"
            :class="mensagem.autor === 'usuario'
              ? 'bg-primary text-inverted rounded-br-sm'
              : 'bg-default text-highlighted rounded-bl-sm ring-1 ring-default'"
          >
            <p v-if="mensagem.texto">
              {{ mensagem.texto }}
            </p>
            <div v-if="mensagem.fotos?.length" class="flex gap-2" :class="mensagem.texto ? 'mt-2' : ''">
              <img
                v-for="(foto, index) in mensagem.fotos"
                :key="index"
                :src="foto"
                class="size-16 rounded-lg object-cover"
                alt="Foto enviada pelo cidadão"
              >
            </div>
          </div>
        </div>

        <div v-if="digitando" class="flex items-end gap-2 justify-start">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-white">
            <UIcon name="i-lucide-message-circle" class="size-3" />
          </span>
          <div class="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-default px-4 py-3 shadow-sm ring-1 ring-default">
            <span class="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
            <span class="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
            <span class="size-1.5 animate-bounce rounded-full bg-muted" />
          </div>
        </div>

        <div v-if="etapa === 'confirmar_categoria'" class="flex flex-wrap gap-2">
          <UButton
            v-for="categoria in CATEGORIAS"
            :key="categoria.value"
            :label="categoria.label"
            :icon="categoria.icon"
            color="primary"
            variant="outline"
            size="sm"
            class="rounded-full"
            @click="escolherCategoria(categoria.value)"
          />
        </div>

        <div v-if="etapa === 'foto'" class="flex flex-wrap gap-2">
          <UButton label="🖼️ Escolher fotos" color="primary" variant="outline" class="rounded-full" @click="abrirSeletorFoto" />
          <UButton label="Pular esta etapa" color="neutral" variant="ghost" class="rounded-full" @click="pularFoto" />
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="aoSelecionarFoto"
          >
        </div>

        <div v-if="etapa === 'localizacao_opcoes'" class="flex flex-wrap gap-2">
          <UButton label="📍 Usar minha localização atual" color="primary" variant="outline" class="rounded-full" @click="usarLocalizacaoAtual" />
          <UButton label="✍️ Digitar endereço" color="neutral" variant="ghost" class="rounded-full" @click="digitarEndereco" />
        </div>

        <UCard v-if="etapa === 'localizacao_manual'" variant="subtle">
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Rua ou avenida" class="sm:col-span-2">
              <UInput v-model="dados.rua" placeholder="Ex: Av. Gentil Bittencourt" class="w-full" />
            </UFormField>
            <UFormField label="Número">
              <UInput v-model="dados.numero" placeholder="Ex: 1234 (ou S/N)" class="w-full" />
            </UFormField>
            <UFormField label="Bairro">
              <UInput v-model="dados.bairro" list="bairros-belem" placeholder="Ex: Nazaré" class="w-full" />
              <datalist id="bairros-belem">
                <option v-for="bairro in BAIRROS_BELEM" :key="bairro" :value="bairro" />
              </datalist>
            </UFormField>
          </div>
          <UButton label="Confirmar endereço" color="primary" class="mt-4" @click="enviarEnderecoManual" />
        </UCard>

        <div v-if="etapa === 'confirmar_localizacao'" class="space-y-3">
          <div class="flex items-center gap-3 rounded-2xl bg-default p-3 shadow-sm ring-1 ring-default">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 text-white">
              <UIcon name="i-lucide-map-pin" class="size-5" />
            </span>
            <div class="min-w-0">
              <p class="truncate font-semibold text-highlighted">
                {{ dados.rua }}{{ dados.numero && dados.numero !== 'S/N' ? `, ${dados.numero}` : '' }}
              </p>
              <p class="text-sm text-muted">
                {{ dados.bairro }} — Belém/PA
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton label="Sim, é aqui" color="primary" class="rounded-full" @click="confirmarLocalizacaoEncontrada" />
            <UButton label="Corrigir localização" color="neutral" variant="ghost" class="rounded-full" @click="corrigirLocalizacao" />
          </div>
        </div>

        <div v-if="etapa === 'referencia'" class="flex flex-wrap gap-2">
          <UButton label="Não tenho ponto de referência" color="neutral" variant="ghost" size="sm" class="rounded-full" @click="pularReferencia" />
        </div>

        <div v-if="etapa === 'risco'" class="flex flex-wrap gap-2">
          <UButton label="Sim" color="primary" class="rounded-full" @click="responderRisco('sim')" />
          <UButton label="Não" color="neutral" variant="outline" class="rounded-full" @click="responderRisco('nao')" />
          <UButton label="Não sei" color="neutral" variant="ghost" class="rounded-full" @click="responderRisco('nao_sei')" />
        </div>

        <div v-if="etapa === 'cpf'" class="flex flex-wrap gap-2">
          <UButton label="Prefiro não informar" color="neutral" variant="ghost" size="sm" class="rounded-full" @click="pularCpf" />
        </div>

        <UCard v-if="etapa === 'resumo' || etapa === 'enviando'" variant="subtle">
          <template #header>
            <span class="font-medium text-highlighted">Resumo da ocorrência</span>
          </template>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                📌 Problema
              </dt>
              <dd class="text-right text-highlighted">
                {{ categoriaSelecionada?.label || '—' }}
              </dd>
            </div>
            <div v-if="dados.fotos.length" class="flex justify-between gap-4">
              <dt class="text-muted">
                📷 Fotos
              </dt>
              <dd class="flex gap-1">
                <img v-for="(foto, index) in dados.fotos" :key="index" :src="foto" class="size-10 rounded-md object-cover">
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                📝 Descrição
              </dt>
              <dd class="text-highlighted">
                {{ dados.descricao }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                📍 Local
              </dt>
              <dd class="text-right text-highlighted">
                {{ enderecoCompleto }}
              </dd>
            </div>
            <div v-if="dados.pontoReferencia" class="flex justify-between gap-4">
              <dt class="text-muted">
                🏪 Referência
              </dt>
              <dd class="text-right text-highlighted">
                {{ dados.pontoReferencia }}
              </dd>
            </div>
            <div v-if="dados.risco" class="flex justify-between gap-4">
              <dt class="text-muted">
                ⚠️ Risco informado
              </dt>
              <dd class="text-right text-highlighted">
                {{ LABEL_RISCO[dados.risco] }}
              </dd>
            </div>
          </dl>

          <UAlert
            v-if="erroEnvio"
            class="mt-4"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            :description="erroEnvio"
          />

          <div class="mt-6 flex flex-wrap gap-2">
            <UButton
              label="Confirmar e enviar"
              icon="i-lucide-send"
              color="secondary"
              :loading="etapa === 'enviando'"
              @click="confirmarEnvio"
            />
            <UButton
              label="Corrigir alguma informação"
              color="neutral"
              variant="ghost"
              :disabled="etapa === 'enviando'"
              @click="corrigirAlgo"
            />
          </div>
        </UCard>

        <UCard v-if="etapa === 'concluido'" variant="subtle" class="text-center">
          <UIcon name="i-lucide-check-circle-2" class="mx-auto size-10 text-success" />
          <p class="mt-2 font-semibold text-highlighted">
            Guarde o número de protocolo para acompanhar o andamento.
          </p>

          <div class="mt-4 flex items-center justify-center gap-2 rounded-lg border border-default bg-default px-4 py-3">
            <span class="font-mono text-lg font-semibold tracking-wide text-highlighted">{{ protocoloGerado }}</span>
            <UButton
              :icon="protocoloCopiado ? 'i-lucide-check' : 'i-lucide-copy'"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Copiar protocolo"
              @click="copiarProtocolo"
            />
          </div>

          <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <UButton
              :to="{ path: '/solicitacoes/acompanhar', query: { protocolo: protocoloGerado } }"
              label="Acompanhar ocorrência"
              icon="i-lucide-search"
              color="primary"
            />
            <UButton label="Registrar outro problema" color="neutral" variant="soft" @click="reiniciar" />
            <UButton to="/" label="Voltar ao início" color="neutral" variant="ghost" />
          </div>
        </UCard>
      </UContainer>
    </div>

    <div v-if="podeDigitar" class="border-t border-default bg-default p-3">
      <UContainer class="max-w-2xl">
        <form class="flex items-center gap-2" @submit.prevent="enviarTexto">
          <UInput
            ref="inputRef"
            v-model="entrada"
            placeholder="Conte o que aconteceu..."
            class="flex-1"
            :ui="{ base: 'rounded-full' }"
            size="lg"
            autofocus
          />
          <UButton type="submit" icon="i-lucide-send" size="lg" class="rounded-full" aria-label="Enviar" />
        </form>
      </UContainer>
    </div>
  </div>
</template>
