<script setup lang="ts">
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { OcorrenciaMapa } from '#shared/types/solicitacao'

const props = defineProps<{
  ocorrencias: OcorrenciaMapa[]
}>()

const COR_STATUS: Record<OcorrenciaMapa['status'], string> = {
  aberto: '#71717a',
  em_analise: '#f59e0b',
  encaminhado: '#0ea5e9',
  em_execucao: '#2563eb',
  concluido: '#22c55e',
}

const BELEM = { lat: -1.4558, lng: -48.4902 }

const containerRef = useTemplateRef('containerRef')
let mapa: LeafletMap | null = null
let camadaMarcadores: import('leaflet').LayerGroup | null = null
// `onMounted`/`desenharMarcadores` fazem `await import('leaflet')` — se o
// componente for desmontado (usuário navega pra outra página) antes desse
// import resolver, o `await` continua e tenta mexer num componente que já
// não existe mais, o que quebra o unmount interno do Vue no meio (sintoma:
// URL muda mas a página anterior fica presa na tela até um F5). Essa flag
// é checada depois de cada `await` pra sair cedo nesse caso.
let destruido = false

async function desenharMarcadores() {
  if (!mapa || destruido)
    return

  const L = await import('leaflet')
  if (!mapa || destruido)
    return

  camadaMarcadores?.clearLayers()
  camadaMarcadores ??= L.layerGroup().addTo(mapa)

  for (const ocorrencia of props.ocorrencias) {
    if (ocorrencia.latitude == null || ocorrencia.longitude == null)
      continue

    const categoria = getCategoria(ocorrencia.categoria)
    const cor = COR_STATUS[ocorrencia.status]

    const icone = L.divIcon({
      className: '',
      html: `<span style="background:${cor}" class="flex size-6 items-center justify-center rounded-full border-2 border-white shadow"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Construído via DOM (não como string de HTML) para que `bairro` — texto
    // livre digitado pelo cidadão no chat — nunca seja interpretado como
    // marcação/script, mesmo que contenha algo como "<img onerror=...>".
    const popup = document.createElement('div')
    popup.style.minWidth = '180px'

    const titulo = document.createElement('p')
    titulo.style.fontWeight = '600'
    titulo.textContent = categoria?.label ?? 'Ocorrência'

    const subtitulo = document.createElement('p')
    subtitulo.style.fontSize = '12px'
    subtitulo.style.color = '#6b7280'
    subtitulo.textContent = `${ocorrencia.bairro} · ${ocorrencia.protocolo}`

    const link = document.createElement('a')
    link.href = `/solicitacoes/acompanhar?protocolo=${encodeURIComponent(ocorrencia.protocolo)}`
    link.style.fontSize = '12px'
    link.style.color = '#2563eb'
    link.textContent = 'Ver detalhes →'

    popup.append(titulo, subtitulo, link)

    L.marker([ocorrencia.latitude, ocorrencia.longitude], { icon: icone })
      .bindPopup(popup)
      .addTo(camadaMarcadores)
  }
}

onMounted(async () => {
  const L = await import('leaflet')

  if (destruido || !containerRef.value)
    return

  mapa = L.map(containerRef.value).setView([BELEM.lat, BELEM.lng], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapa)

  await desenharMarcadores()
})

watch(() => props.ocorrencias, desenharMarcadores)

onBeforeUnmount(() => {
  destruido = true

  // `.remove()` do Leaflet mexe no DOM por fora do Vue — se lançar por
  // qualquer motivo (ex.: container já alterado por outra causa), não pode
  // travar a troca de página do Nuxt no meio do caminho (sintoma visto: URL
  // muda mas a página anterior continua na tela até um F5).
  try {
    mapa?.remove()
  }
  catch {
    // Nada a fazer — só garantir que o unmount do componente sempre conclui.
  }
  mapa = null
  // Sem isso, uma navegação de volta pro mapa (sem reload completo) reusava
  // uma camada de marcadores presa ao mapa antigo já removido.
  camadaMarcadores = null
})
</script>

<template>
  <div ref="containerRef" class="h-full w-full" />
</template>
