export type ValorPeriodo = 'hoje' | '7dias' | '30dias' | 'mes' | 'ano' | 'todos'

// Lista única de opções — usada pelo select da home e do painel (ver
// app/components/dashboard/FiltroPeriodo.vue), evita duas listas divergentes.
export const OPCOES_PERIODO: { label: string, value: ValorPeriodo }[] = [
  { label: 'Hoje', value: 'hoje' },
  { label: '7 dias', value: '7dias' },
  { label: '30 dias', value: '30dias' },
  { label: 'Este mês', value: 'mes' },
  { label: 'Este ano', value: 'ano' },
  { label: 'Todos', value: 'todos' },
]

export const PERIODO_PADRAO: ValorPeriodo = 'todos'

// Só usado no backend (server/api/dashboard.get.ts) — o frontend só manda a
// string do período escolhido, quem calcula a data real é sempre aqui, pra
// não duplicar essa conta em mais de um lugar.
export function calcularIntervaloPeriodo(periodo: unknown, agora: Date = new Date()): { inicio: Date | null, fim: Date } {
  const valor: ValorPeriodo = OPCOES_PERIODO.some(opcao => opcao.value === periodo)
    ? (periodo as ValorPeriodo)
    : PERIODO_PADRAO

  const fim = agora

  switch (valor) {
    case 'hoje': {
      const inicio = new Date(agora)
      inicio.setHours(0, 0, 0, 0)
      return { inicio, fim }
    }
    case '7dias':
      return { inicio: new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000), fim }
    case '30dias':
      return { inicio: new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000), fim }
    case 'mes':
      return { inicio: new Date(agora.getFullYear(), agora.getMonth(), 1), fim }
    case 'ano':
      return { inicio: new Date(agora.getFullYear(), 0, 1), fim }
    case 'todos':
    default:
      return { inicio: null, fim }
  }
}

// Período curto → agrupa por dia; período longo (ou "todos") → por mês.
// Evita um gráfico de evolução com centenas de pontos diários num período de
// anos.
export function granularidadePeriodo(periodo: unknown): 'dia' | 'mes' {
  return periodo === 'ano' || periodo === 'todos' ? 'mes' : 'dia'
}
