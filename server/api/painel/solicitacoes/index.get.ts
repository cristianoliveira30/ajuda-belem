export default defineEventHandler(async (event) => {
  await exigirServidor(event)

  const solicitacoes = await listarSolicitacoes()

  // A tela de listagem (app/pages/painel/solicitacoes/index.vue) nunca
  // exibe foto — só ícone de categoria, texto e badges. `fotos` aqui só
  // engordava o payload à toa (achado da auditoria); o detalhe
  // (GET /api/painel/solicitacoes/[protocolo]) continua devolvendo as fotos
  // normalmente, pra quem realmente precisa vê-las.
  return solicitacoes
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .map(({ fotos: _fotos, ...resto }) => resto)
})
