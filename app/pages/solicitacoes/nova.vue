<script setup lang="ts">
import type { OcorrenciaCandidata } from '#shared/types/solicitacao'

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
  | 'confirmar_duplicidade'
  | 'referencia'
  | 'risco'
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

interface NominatimBusca {
  lat: string
  lon: string
}

const route = useRoute()
const router = useRouter()

const categoriaInicial = CATEGORIAS.some(categoria => categoria.value === route.query.categoria)
  ? (route.query.categoria as string)
  : ''

// Nome/e-mail/telefone/CPF não entram mais aqui: o cidadão já está
// autenticado quando chega nesta página (ver app/middleware/auth.global.ts)
// e o backend usa a identidade da sessão, não confia em nada vindo daqui
// (ver server/api/solicitacoes/index.post.ts).
function estadoInicial() {
  return {
    categoria: categoriaInicial,
    descricao: '',
    fotos: [] as string[],
    rua: '',
    numero: '',
    bairro: '',
    pontoReferencia: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    risco: '' as '' | 'sim' | 'nao' | 'nao_sei',
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
const candidataEncontrada = ref<OcorrenciaCandidata | null>(null)

const containerRef = useTemplateRef('containerRef')
const fileInputRef = useTemplateRef('fileInputRef')
const inputRef = useTemplateRef('inputRef')

const etapasComTexto: Etapa[] = ['descricao', 'referencia']
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

  const ameaca = detectarAmeacaEntrada(texto)
  if (ameaca) {
    mensagemUsuario(texto)
    await mensagemBot(MENSAGEM_AMEACA_ENTRADA[ameaca])
    return
  }

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

const LADO_MAXIMO_FOTO = 1280

// Redimensiona no navegador antes de converter para base64: fotos de celular
// costumam ter vários MB, e sem isso cada uma vai inteira no JSON da solicitação.
function redimensionarFoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(leitor.error)
    leitor.onload = () => {
      const imagem = new Image()
      imagem.onerror = () => resolve(leitor.result as string)
      imagem.onload = () => {
        const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(imagem.width, imagem.height))
        const largura = Math.round(imagem.width * escala)
        const altura = Math.round(imagem.height * escala)
        const canvas = document.createElement('canvas')
        canvas.width = largura
        canvas.height = altura
        const contexto = canvas.getContext('2d')

        if (!contexto) {
          resolve(leitor.result as string)
          return
        }

        contexto.drawImage(imagem, 0, 0, largura, altura)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      imagem.src = leitor.result as string
    }
    leitor.readAsDataURL(file)
  })
}

async function aoSelecionarFoto(event: Event) {
  const input = event.target as HTMLInputElement
  const arquivos = Array.from(input.files ?? []).slice(0, 3)
  input.value = ''
  if (!arquivos.length)
    return

  const fotos = await Promise.all(arquivos.map(redimensionarFoto))
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
      // GPS é a fonte de verdade das coordenadas. O reverse geocode abaixo
      // só DESCREVE esse ponto (rua/bairro) — nunca substitui latitude/
      // longitude por outra coisa, mesmo que a busca do endereço falhe ou
      // volte incompleta.
      const { latitude, longitude } = posicao.coords
      dados.latitude = latitude
      dados.longitude = longitude

      try {
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
        // Falha no reverse geocode não pode derrubar a coordenada real do
        // GPS, já guardada acima — só falta descrever o endereço.
        digitando.value = false
        await mensagemBot('Consegui sua localização, mas não encontrei o endereço automaticamente. Pode preencher a rua e o bairro?')
        etapa.value = 'localizacao_manual'
      }
    },
    async () => {
      digitando.value = false
      await mensagemBot('Não foi possível obter sua localização. Você pode informar o endereço manualmente.')
      etapa.value = 'localizacao_manual'
    },
    // Alta precisão pede o GPS real do dispositivo em vez de localização
    // aproximada por rede/Wi-Fi (que pode errar por quilômetros). Sem cache
    // (maximumAge: 0) pra nunca reaproveitar uma posição antiga.
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  )
}

function digitarEndereco() {
  mensagemUsuario('Prefiro digitar o endereço')
  etapa.value = 'localizacao_manual'
}

async function confirmarLocalizacaoEncontrada() {
  mensagemUsuario('Sim, é aqui')
  await verificarDuplicidade()
}

function corrigirLocalizacao() {
  mensagemUsuario('Corrigir localização')
  dados.latitude = undefined
  dados.longitude = undefined
  etapa.value = 'localizacao_manual'
}

async function geocodificarEnderecoDigitado() {
  try {
    const resultados = await $fetch<NominatimBusca[]>('https://nominatim.openstreetmap.org/search', {
      query: {
        q: `${dados.rua}, ${dados.numero}, ${dados.bairro}, Belém, Pará, Brasil`,
        format: 'jsonv2',
        limit: 1,
      },
    })
    const encontrado = resultados?.[0]
    if (encontrado) {
      dados.latitude = Number.parseFloat(encontrado.lat)
      dados.longitude = Number.parseFloat(encontrado.lon)
    }
  }
  catch {
    // Sem coordenadas, a solicitação simplesmente não aparece no mapa.
  }
}

async function enviarEnderecoManual() {
  if (!dados.rua.trim() || !dados.bairro.trim())
    return

  const enderecoDigitado = `${dados.rua}, ${dados.numero || 'S/N'} — ${dados.bairro}`
  const ameaca = detectarAmeacaEntrada(enderecoDigitado)
  if (ameaca) {
    mensagemUsuario(enderecoDigitado)
    await mensagemBot(MENSAGEM_AMEACA_ENTRADA[ameaca])
    return
  }

  mensagemUsuario(enderecoDigitado)

  if (!dados.latitude || !dados.longitude)
    await geocodificarEnderecoDigitado()

  await verificarDuplicidade()
}

// Roda depois que a localização é confirmada (GPS ou endereço digitado),
// antes de perguntar o ponto de referência. Só SUGERE uma ocorrência
// parecida pro cidadão — quem decide se é o mesmo problema é sempre o
// cidadão, nunca o sistema sozinho (ver server/api/solicitacoes/candidata.post.ts).
async function verificarDuplicidade() {
  if (dados.latitude == null || dados.longitude == null) {
    await perguntarReferencia()
    return
  }

  digitando.value = true
  try {
    const resposta = await $fetch<{ candidata: OcorrenciaCandidata | null }>('/api/solicitacoes/candidata', {
      method: 'POST',
      body: { categoria: dados.categoria, latitude: dados.latitude, longitude: dados.longitude },
    })
    digitando.value = false

    if (resposta.candidata) {
      candidataEncontrada.value = resposta.candidata
      await mensagemBot('Encontrei um problema parecido já registrado perto daqui — dá uma olhada:')
      etapa.value = 'confirmar_duplicidade'
    }
    else {
      await perguntarReferencia()
    }
  }
  catch {
    digitando.value = false
    // Falha na checagem não pode travar o cidadão — segue como ocorrência nova.
    await perguntarReferencia()
  }
}

async function confirmarMesmoProblema() {
  const candidata = candidataEncontrada.value
  if (!candidata)
    return

  mensagemUsuario('Sim, é o mesmo problema')
  etapa.value = 'enviando'

  try {
    const resposta = await $fetch<{ protocolo: string, quantidadeRelatos: number }>(
      `/api/solicitacoes/${candidata.protocolo}/relato`,
      { method: 'POST' },
    )
    protocoloGerado.value = resposta.protocolo
    etapa.value = 'concluido'
    await mensagemBot(`✅ Seu relato foi registrado nesta ocorrência. Esta ocorrência já possui ${resposta.quantidadeRelatos} relato${resposta.quantidadeRelatos === 1 ? '' : 's'}.`, 300)
  }
  catch (erro) {
    if ((erro as { statusCode?: number }).statusCode === 409) {
      // Já tinha relatado antes — não é um erro de verdade pro cidadão.
      protocoloGerado.value = candidata.protocolo
      etapa.value = 'concluido'
      await mensagemBot('Você já tinha registrado esse problema antes — não precisa relatar de novo. 👍', 300)
    }
    else {
      erroEnvio.value = 'Não foi possível registrar seu relato agora. Tente novamente em instantes.'
      await mensagemBot('Ops, não consegui registrar seu relato agora. Podemos tentar de novo?')
      etapa.value = 'confirmar_duplicidade'
    }
  }
}

async function naoEhMesmoProblema() {
  mensagemUsuario('Não, é outro problema')
  candidataEncontrada.value = null
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
  revisando.value = false
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
  candidataEncontrada.value = null
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
        latitude: dados.latitude,
        longitude: dados.longitude,
        risco: dados.risco || undefined,
        // Sem nome/e-mail/telefone/CPF aqui — o backend usa a sessão pra
        // identidade e a própria conta pra telefone/CPF, se existirem (ver
        // server/api/solicitacoes/index.post.ts).
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
  candidataEncontrada.value = null
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

    <div ref="containerRef" class="flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
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
          <div
            class="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-default px-4 py-3 shadow-sm ring-1 ring-default"
            role="status"
          >
            <span class="sr-only">Assistente está digitando</span>
            <span class="size-1.5 animate-bounce rounded-full bg-muted motion-reduce:animate-none [animation-delay:-0.3s]" />
            <span class="size-1.5 animate-bounce rounded-full bg-muted motion-reduce:animate-none [animation-delay:-0.15s]" />
            <span class="size-1.5 animate-bounce rounded-full bg-muted motion-reduce:animate-none" />
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

        <UCard v-if="etapa === 'confirmar_duplicidade' && candidataEncontrada" variant="subtle">
          <template #header>
            <span class="font-medium text-highlighted">Encontramos um problema semelhante próximo deste local</span>
          </template>

          <div class="flex gap-3">
            <img
              v-if="candidataEncontrada.fotoPrincipal"
              :src="candidataEncontrada.fotoPrincipal"
              class="size-20 shrink-0 rounded-lg object-cover"
              alt="Foto da ocorrência já registrada"
            >
            <dl class="min-w-0 flex-1 space-y-2 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-muted">
                  Categoria
                </dt>
                <dd class="text-right text-highlighted">
                  {{ getCategoria(candidataEncontrada.categoria)?.label }}
                </dd>
              </div>
              <div>
                <dt class="text-muted">
                  Descrição
                </dt>
                <dd class="text-highlighted">
                  {{ candidataEncontrada.descricao }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">
                  Local
                </dt>
                <dd class="text-right text-highlighted">
                  {{ candidataEncontrada.rua }}, {{ candidataEncontrada.bairro }}
                </dd>
              </div>
              <div v-if="candidataEncontrada.pontoReferencia" class="flex justify-between gap-4">
                <dt class="text-muted">
                  Referência
                </dt>
                <dd class="text-right text-highlighted">
                  {{ candidataEncontrada.pontoReferencia }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">
                  Status
                </dt>
                <dd class="text-right text-highlighted">
                  {{ STATUS_SOLICITACAO[candidataEncontrada.status].label }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">
                  Relatos
                </dt>
                <dd class="text-right text-highlighted">
                  {{ candidataEncontrada.quantidadeRelatos }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">
                  Distância
                </dt>
                <dd class="text-right text-highlighted">
                  aproximadamente {{ candidataEncontrada.distanciaMetros }}m
                </dd>
              </div>
            </dl>
          </div>

          <p class="mt-4 text-sm font-medium text-highlighted">
            Este é o mesmo problema que você está relatando?
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton label="Sim, é o mesmo problema" color="primary" class="rounded-full" @click="confirmarMesmoProblema" />
            <UButton label="Não, é outro problema" color="neutral" variant="outline" class="rounded-full" @click="naoEhMesmoProblema" />
          </div>
        </UCard>

        <div v-if="etapa === 'referencia'" class="flex flex-wrap gap-2">
          <UButton label="Não tenho ponto de referência" color="neutral" variant="ghost" size="sm" class="rounded-full" @click="pularReferencia" />
        </div>

        <div v-if="etapa === 'risco'" class="flex flex-wrap gap-2">
          <UButton label="Sim" color="primary" class="rounded-full" @click="responderRisco('sim')" />
          <UButton label="Não" color="neutral" variant="outline" class="rounded-full" @click="responderRisco('nao')" />
          <UButton label="Não sei" color="neutral" variant="ghost" class="rounded-full" @click="responderRisco('nao_sei')" />
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
                <img
                  v-for="(foto, index) in dados.fotos"
                  :key="index"
                  :src="foto"
                  class="size-10 rounded-md object-cover"
                  alt="Foto enviada pelo cidadão"
                >
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
