import { CATEGORIAS, getCategoria } from '#shared/utils/categorias'
import { calcularIntervaloPeriodo, granularidadePeriodo } from '#shared/utils/periodo'
import { STATUS_SOLICITACAO } from '#shared/utils/status'
import type {
  DashboardResposta,
  OcorrenciaMaisRelatada,
  PontoAbertasConcluidas,
  PontoBairro,
  PontoCategoria,
  PontoEvolucao,
  PontoRisco,
  PontoStatus,
} from '#shared/types/dashboard'
import type { Solicitacao, StatusSolicitacao } from '#shared/types/solicitacao'

// DTO montado campo a campo abaixo: nunca inclui foto, CPF, e-mail,
// telefone, nome do cidadão, userId ou auditoria interna (servidorUserId/
// servidorNome do histórico) — mesmo que esses campos existam no registro
// original de `Solicitacao`.

const STATUS_ATENDIMENTO: StatusSolicitacao[] = ['em_analise', 'encaminhado', 'em_execucao']
const TODOS_STATUS: StatusSolicitacao[] = ['aberto', 'em_analise', 'encaminhado', 'em_execucao', 'concluido']

function quantidadeRelatos(solicitacao: Solicitacao): number {
  // Mesma convenção usada em todo o resto do sistema (mapa, painel, minhas
  // solicitações): registro antigo sem `relatos` conta como 1 (o próprio
  // criador), nunca 0.
  return solicitacao.relatos?.length ?? 1
}

function chaveData(data: Date, granularidade: 'dia' | 'mes'): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  if (granularidade === 'mes')
    return `${ano}-${mes}`
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export default defineEventHandler(async (event): Promise<DashboardResposta> => {
  await exigirServidor(event)

  const query = getQuery(event)
  const periodo = typeof query.periodo === 'string' ? query.periodo : undefined

  const { inicio, fim } = calcularIntervaloPeriodo(periodo)
  const granularidade = granularidadePeriodo(periodo)

  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const todas = (await Promise.all(chaves.map(chave => storage.getItem<Solicitacao>(chave))))
    .filter((solicitacao): solicitacao is Solicitacao => !!solicitacao)

  // Todos os KPIs/gráficos derivam deste mesmo recorte por período — filtra
  // uma vez só, pela data de criação da ocorrência.
  const filtradas = inicio
    ? todas.filter((solicitacao) => {
        const data = new Date(solicitacao.criadoEm)
        return data >= inicio && data <= fim
      })
    : todas

  // ---- KPIs ----
  const totalOcorrencias = filtradas.length
  const abertas = filtradas.filter(s => s.status === 'aberto').length
  const emAtendimento = filtradas.filter(s => STATUS_ATENDIMENTO.includes(s.status)).length
  const concluidas = filtradas.filter(s => s.status === 'concluido').length
  const totalRelatos = filtradas.reduce((soma, s) => soma + quantidadeRelatos(s), 0)
  const taxaConclusao = totalOcorrencias > 0 ? Math.round((concluidas / totalOcorrencias) * 1000) / 10 : 0

  const contagemBairro = new Map<string, number>()
  const contagemCategoriaTotal = new Map<string, number>()
  for (const s of filtradas) {
    if (s.bairro)
      contagemBairro.set(s.bairro, (contagemBairro.get(s.bairro) ?? 0) + 1)
    contagemCategoriaTotal.set(s.categoria, (contagemCategoriaTotal.get(s.categoria) ?? 0) + 1)
  }

  const bairroTop = [...contagemBairro.entries()].sort((a, b) => b[1] - a[1])[0]
  const bairroMaisOcorrencias: PontoBairro | null = bairroTop ? { bairro: bairroTop[0], quantidade: bairroTop[1] } : null

  const categoriaTop = [...contagemCategoriaTotal.entries()].sort((a, b) => b[1] - a[1])[0]
  const categoriaMaisRegistrada = categoriaTop
    ? { categoria: categoriaTop[0], label: getCategoria(categoriaTop[0])?.label ?? categoriaTop[0], quantidade: categoriaTop[1] }
    : null

  // ---- Card 1: por status ----
  const porStatus: PontoStatus[] = TODOS_STATUS.map(status => ({
    status,
    label: STATUS_SOLICITACAO[status].label,
    quantidade: filtradas.filter(s => s.status === status).length,
  }))

  // ---- Card 2: por categoria (todas as categorias reais, mesmo com 0) ----
  const porCategoria: PontoCategoria[] = CATEGORIAS.map(categoria => ({
    categoria: categoria.value,
    label: categoria.label,
    quantidade: contagemCategoriaTotal.get(categoria.value) ?? 0,
  }))

  // ---- Card 3: top 10 bairros ----
  const porBairro: PontoBairro[] = [...contagemBairro.entries()]
    .map(([bairro, quantidade]) => ({ bairro, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10)

  // ---- Card 4: evolução (novas ocorrências ao longo do tempo) ----
  const contagemEvolucao = new Map<string, number>()
  for (const s of filtradas) {
    const chave = chaveData(new Date(s.criadoEm), granularidade)
    contagemEvolucao.set(chave, (contagemEvolucao.get(chave) ?? 0) + 1)
  }
  const evolucao: PontoEvolucao[] = [...contagemEvolucao.entries()]
    .map(([data, quantidade]) => ({ data, quantidade }))
    .sort((a, b) => a.data.localeCompare(b.data))

  // ---- Card 5: abertas x concluídas ao longo do tempo ----
  // "Abertas" usa a mesma contagem de criação da evolução acima. "Concluídas"
  // só conta quem tem uma entrada real de histórico com status=concluido —
  // não inventamos data pra quem está concluído sem esse registro (esses
  // continuam valendo pro KPI `concluidas`, só não entram nesta série).
  const contagemConclusao = new Map<string, number>()
  for (const s of filtradas) {
    const entradaConclusao = s.historico.find(item => item.status === 'concluido')
    if (!entradaConclusao)
      continue
    const dataConclusao = new Date(entradaConclusao.data)
    if (inicio && (dataConclusao < inicio || dataConclusao > fim))
      continue
    const chave = chaveData(dataConclusao, granularidade)
    contagemConclusao.set(chave, (contagemConclusao.get(chave) ?? 0) + 1)
  }
  const datasUnidas = new Set([...contagemEvolucao.keys(), ...contagemConclusao.keys()])
  const abertasConcluidas: PontoAbertasConcluidas[] = [...datasUnidas]
    .sort((a, b) => a.localeCompare(b))
    .map(data => ({
      data,
      abertas: contagemEvolucao.get(data) ?? 0,
      concluidas: contagemConclusao.get(data) ?? 0,
    }))

  // ---- Card 6: relatos por categoria (soma relatos, não ocorrências) ----
  const somaRelatosCategoria = new Map<string, number>()
  for (const s of filtradas)
    somaRelatosCategoria.set(s.categoria, (somaRelatosCategoria.get(s.categoria) ?? 0) + quantidadeRelatos(s))
  const relatosPorCategoria: PontoCategoria[] = CATEGORIAS.map(categoria => ({
    categoria: categoria.value,
    label: categoria.label,
    quantidade: somaRelatosCategoria.get(categoria.value) ?? 0,
  }))

  // ---- Card 7: concluídas por categoria ----
  const contagemConcluidasCategoria = new Map<string, number>()
  for (const s of filtradas) {
    if (s.status === 'concluido')
      contagemConcluidasCategoria.set(s.categoria, (contagemConcluidasCategoria.get(s.categoria) ?? 0) + 1)
  }
  const concluidasPorCategoria: PontoCategoria[] = CATEGORIAS.map(categoria => ({
    categoria: categoria.value,
    label: categoria.label,
    quantidade: contagemConcluidasCategoria.get(categoria.value) ?? 0,
  }))

  // ---- Card 8: top 10 mais relatadas (só dado público) ----
  const maisRelatadas: OcorrenciaMaisRelatada[] = [...filtradas]
    .sort((a, b) => quantidadeRelatos(b) - quantidadeRelatos(a))
    .slice(0, 10)
    .map(s => ({
      protocolo: s.protocolo,
      categoria: s.categoria,
      categoriaLabel: getCategoria(s.categoria)?.label ?? s.categoria,
      bairro: s.bairro,
      quantidadeRelatos: quantidadeRelatos(s),
    }))

  // ---- Card 9: por nível de risco ----
  const rotuloRisco: Record<'sim' | 'nao' | 'nao_sei' | 'nao_informado', string> = {
    sim: 'Sim',
    nao: 'Não',
    nao_sei: 'Não sei',
    nao_informado: 'Não informado',
  }
  const contagemRisco = new Map<string, number>()
  for (const s of filtradas) {
    const chave = s.risco ?? 'nao_informado'
    contagemRisco.set(chave, (contagemRisco.get(chave) ?? 0) + 1)
  }
  const porRisco: PontoRisco[] = (['sim', 'nao', 'nao_sei', 'nao_informado'] as const)
    .filter(risco => contagemRisco.has(risco))
    .map(risco => ({ risco, label: rotuloRisco[risco], quantidade: contagemRisco.get(risco) ?? 0 }))

  return {
    periodo: { valor: periodo ?? 'todos', inicio: inicio ? inicio.toISOString() : null, fim: fim.toISOString() },
    kpis: {
      totalOcorrencias,
      abertas,
      emAtendimento,
      concluidas,
      totalRelatos,
      taxaConclusao,
      bairroMaisOcorrencias,
      categoriaMaisRegistrada,
    },
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
})
