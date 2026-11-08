import { calcularIntervaloPeriodo } from '#shared/utils/periodo'
import type { OcorrenciaMapa, Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(
    chaves.map(chave => storage.getItem<Solicitacao>(chave)),
  )

  // `periodo` é opcional — a página /mapa nunca manda esse parâmetro, então
  // continua mostrando todas as ocorrências como sempre. Só o card de mapa
  // do dashboard (ver GraficosAnaliticos.vue) manda, pra respeitar o mesmo
  // filtro de período dos KPIs/gráficos (server/api/dashboard.get.ts usa a
  // mesma função de cálculo, não duplica essa lógica).
  const query = getQuery(event)
  const { inicio, fim } = typeof query.periodo === 'string'
    ? calcularIntervaloPeriodo(query.periodo)
    : { inicio: null, fim: new Date() }

  // Endpoint público: só campos de interesse coletivo, sem dados pessoais
  // do cidadão (nome, e-mail, telefone, CPF ficam de fora).
  return solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao => {
      if (!solicitacao || solicitacao.latitude == null || solicitacao.longitude == null)
        return false
      if (!inicio)
        return true
      const data = new Date(solicitacao.criadoEm)
      return data >= inicio && data <= fim
    })
    .map((solicitacao): OcorrenciaMapa => ({
      protocolo: solicitacao.protocolo,
      categoria: solicitacao.categoria,
      bairro: solicitacao.bairro,
      rua: solicitacao.rua,
      latitude: solicitacao.latitude,
      longitude: solicitacao.longitude,
      status: solicitacao.status,
      descricao: solicitacao.descricao,
      criadoEm: solicitacao.criadoEm,
      // Uma ocorrência = um marcador, mesmo com vários relatos (ver
      // server/api/solicitacoes/[protocolo]/relato.post.ts) — a UI do mapa
      // não usa isso ainda, fica disponível pra uso futuro.
      quantidadeRelatos: solicitacao.relatos?.length ?? 1,
    }))
})
