<script setup lang="ts">
// Sem isso, ApexCharts (a partir da v6, que externalizou o CSS do pacote em
// vez de injetar um <style> via JS como antes) desenha o SVG sem nenhum
// estilo/dimensão — o card aparece, mas o gráfico some (mesmo problema que
// o Leaflet teria sem `leaflet.css`, ver app/components/MapaOcorrencias.vue).
import 'apexcharts/dist/apexcharts.css'
import type { ApexOptions } from 'apexcharts'

// Componente único pra todos os tipos de gráfico do dashboard (donut, bar,
// barra horizontal, line, area) — evita um componente por tipo. ApexCharts
// não roda no servidor, então este componente só deve ser usado dentro de
// <ClientOnly> (mesmo padrão do mapa — ver app/components/MapaOcorrencias.vue
// e app/components/dashboard/GraficosAnaliticos.vue). Sem sufixo `.client`
// de propósito: esse mecanismo do Nuxt não estava entregando a referência do
// elemento (`useTemplateRef`) a tempo do onMounted rodar — ver
// https://github.com/nuxt/nuxt/issues/20798.
const props = withDefaults(defineProps<{
  titulo: string
  subtitulo?: string
  tipo: 'donut' | 'bar' | 'line' | 'area'
  series: ApexOptions['series']
  categorias?: string[]
  horizontal?: boolean
  carregando?: boolean
  altura?: number
  cores?: string[]
}>(), {
  subtitulo: undefined,
  categorias: undefined,
  horizontal: false,
  carregando: false,
  altura: 300,
  cores: undefined,
})

const CORES_PADRAO = ['#2563eb', '#f59e0b', '#0ea5e9', '#22c55e', '#71717a', '#ef4444', '#a855f7']

const containerRef = useTemplateRef('containerRef')
let grafico: import('apexcharts').default | null = null
// Mesma cautela do MapaOcorrencias.vue: `await import('apexcharts')` pode
// terminar depois do componente já ter sido desmontado (navegação rápida) —
// sem essa flag, o unmount do Vue quebrava no meio do caminho.
let destruido = false

const semDados = computed(() => {
  const series = props.series
  if (!series || !Array.isArray(series) || series.length === 0)
    return true

  if (typeof series[0] === 'number')
    return (series as number[]).every(valor => !valor)

  return (series as { data?: number[] }[]).every(serie => !serie.data?.length || serie.data.every(valor => !valor))
})

function montarOpcoes(): ApexOptions {
  const ehDonut = props.tipo === 'donut'

  // Importante: quando uma dessas opções não se aplica ao tipo do gráfico,
  // a chave é OMITIDA (via spread condicional) em vez de setada como
  // `undefined`. Passar `undefined` explicitamente anula o valor padrão
  // que o ApexCharts preencheria sozinho para aquela chave (ex.:
  // `config.plotOptions.line`), o que quebrava a biblioteca por dentro
  // (`Cannot read properties of undefined`) mesmo pros tipos que não usam
  // aquela opção.
  return {
    chart: {
      type: props.tipo,
      height: props.altura,
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { enabled: true },
    },
    colors: props.cores ?? CORES_PADRAO,
    series: props.series,
    ...(ehDonut ? { labels: props.categorias } : { xaxis: { categories: props.categorias ?? [] } }),
    ...(props.tipo === 'bar' ? { plotOptions: { bar: { horizontal: props.horizontal ?? false, borderRadius: 4 } } } : {}),
    dataLabels: { enabled: false },
    legend: { position: ehDonut ? 'bottom' : 'top', fontSize: '12px' },
    tooltip: { theme: 'light' },
    ...(props.tipo === 'line' || props.tipo === 'area' ? { stroke: { curve: 'smooth', width: 2 } } : {}),
  }
}

async function renderizar() {
  if (destruido || !containerRef.value || props.carregando || semDados.value)
    return

  try {
    const { default: ApexCharts } = await import('apexcharts')
    if (destruido || !containerRef.value)
      return

    if (grafico) {
      await grafico.updateOptions(montarOpcoes(), true, true)
      return
    }

    grafico = new ApexCharts(containerRef.value, montarOpcoes())
    await grafico.render()
  }
  catch (erro) {
    // Falha ao desenhar não pode virar uma rejeição de promise não tratada
    // (onMounted/watch não aguardam esta função) — registra e deixa o card
    // simplesmente sem gráfico, em vez de travar algo silenciosamente.
    console.error('[ChartCard] Falha ao renderizar gráfico:', erro)
  }
}

onMounted(renderizar)

watch(() => [props.series, props.categorias, props.tipo, props.carregando], renderizar, { deep: true })

onBeforeUnmount(() => {
  destruido = true
  try {
    grafico?.destroy()
  }
  catch {
    // Só garantir que o unmount do componente sempre conclui.
  }
  grafico = null
})
</script>

<template>
  <DashboardCard variant="subtle" padding="compacto">
    <template #header>
      <div>
        <p class="font-semibold text-highlighted">
          {{ titulo }}
        </p>
        <p v-if="subtitulo" class="text-xs text-muted">
          {{ subtitulo }}
        </p>
      </div>
    </template>

    <div class="flex items-center justify-center" :style="{ minHeight: `${altura}px` }">
      <UIcon v-if="carregando" name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
      <p v-else-if="semDados" class="text-sm text-muted">
        Sem dados para o período selecionado.
      </p>
      <div v-show="!carregando && !semDados" ref="containerRef" class="w-full" />
    </div>
  </DashboardCard>
</template>
