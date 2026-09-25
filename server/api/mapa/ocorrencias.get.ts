import type { OcorrenciaMapa, Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async () => {
  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(
    chaves.map(chave => storage.getItem<Solicitacao>(chave)),
  )

  // Endpoint público: só campos de interesse coletivo, sem dados pessoais
  // do cidadão (nome, e-mail, telefone, CPF ficam de fora).
  return solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao =>
      !!solicitacao && solicitacao.latitude != null && solicitacao.longitude != null,
    )
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
    }))
})
