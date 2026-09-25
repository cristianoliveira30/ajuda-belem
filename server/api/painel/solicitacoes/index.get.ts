import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  await exigirServidor(event)

  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(
    chaves.map(chave => storage.getItem<Solicitacao>(chave)),
  )

  return solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao => !!solicitacao)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
})
