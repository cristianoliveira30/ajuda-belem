import type { DashboardResposta } from '#shared/types/dashboard'

// Transforma a resposta de GET /api/dashboard nas formas que ChartCard
// espera (categorias/series). Um só lugar pra essa conta — reaproveitado
// pela home e pelo painel (ver app/components/dashboard/GraficosAnaliticos.vue)
// pra não duplicar o mesmo cálculo nas duas telas.
export function useDashboardCharts(dashboard: Ref<DashboardResposta | null | undefined>) {
  const porStatus = computed(() => ({
    categorias: dashboard.value?.porStatus.map(p => p.label) ?? [],
    series: dashboard.value?.porStatus.map(p => p.quantidade) ?? [],
  }))

  const porCategoria = computed(() => ({
    categorias: dashboard.value?.porCategoria.map(p => p.label) ?? [],
    series: [{ name: 'Ocorrências', data: dashboard.value?.porCategoria.map(p => p.quantidade) ?? [] }],
  }))

  const porBairro = computed(() => ({
    categorias: dashboard.value?.porBairro.map(p => p.bairro) ?? [],
    series: [{ name: 'Ocorrências', data: dashboard.value?.porBairro.map(p => p.quantidade) ?? [] }],
  }))

  const evolucao = computed(() => ({
    categorias: dashboard.value?.evolucao.map(p => p.data) ?? [],
    series: [{ name: 'Novas ocorrências', data: dashboard.value?.evolucao.map(p => p.quantidade) ?? [] }],
  }))

  const abertasConcluidas = computed(() => ({
    categorias: dashboard.value?.abertasConcluidas.map(p => p.data) ?? [],
    series: [
      { name: 'Abertas', data: dashboard.value?.abertasConcluidas.map(p => p.abertas) ?? [] },
      { name: 'Concluídas', data: dashboard.value?.abertasConcluidas.map(p => p.concluidas) ?? [] },
    ],
  }))

  const relatosPorCategoria = computed(() => ({
    categorias: dashboard.value?.relatosPorCategoria.map(p => p.label) ?? [],
    series: [{ name: 'Relatos', data: dashboard.value?.relatosPorCategoria.map(p => p.quantidade) ?? [] }],
  }))

  const concluidasPorCategoria = computed(() => ({
    categorias: dashboard.value?.concluidasPorCategoria.map(p => p.label) ?? [],
    series: [{ name: 'Concluídas', data: dashboard.value?.concluidasPorCategoria.map(p => p.quantidade) ?? [] }],
  }))

  const maisRelatadas = computed(() => ({
    categorias: dashboard.value?.maisRelatadas.map(m => `${m.categoriaLabel} · ${m.bairro} · ${m.protocolo}`) ?? [],
    series: [{ name: 'Relatos', data: dashboard.value?.maisRelatadas.map(m => m.quantidadeRelatos) ?? [] }],
  }))

  const porRisco = computed(() => ({
    categorias: dashboard.value?.porRisco.map(p => p.label) ?? [],
    series: dashboard.value?.porRisco.map(p => p.quantidade) ?? [],
  }))

  return {
    porStatus,
    porCategoria,
    porBairro,
    evolucao,
    abertasConcluidas,
    relatosPorCategoria,
    concluidasPorCategoria,
    maisRelatadas,
    porRisco,
  }
}
