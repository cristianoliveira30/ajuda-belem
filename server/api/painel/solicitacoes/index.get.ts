import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  await exigirServidor(event)

  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(
    chaves.map(chave => storage.getItem<Solicitacao>(chave)),
  )

  // A tela de listagem (app/pages/painel/solicitacoes/index.vue) nunca
  // exibe foto — só ícone de categoria, texto e badges. `fotos` aqui só
  // engordava o payload à toa (achado da auditoria); o detalhe
  // (GET /api/painel/solicitacoes/[protocolo]) continua devolvendo as fotos
  // normalmente, pra quem realmente precisa vê-las.
  return solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao => !!solicitacao)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .map(({ fotos: _fotos, ...resto }) => resto)
})
