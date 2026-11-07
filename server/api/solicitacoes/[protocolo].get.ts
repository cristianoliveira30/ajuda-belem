import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const protocolo = getRouterParam(event, 'protocolo')

  if (!protocolo) {
    throw createError({ statusCode: 400, message: 'Informe o número de protocolo' })
  }

  const linha = db.select().from(solicitacoes).where(eq(solicitacoes.protocolo, protocolo)).get()

  if (!linha) {
    throw createError({ statusCode: 404, message: 'Solicitação não encontrada' })
  }

  const historico = db.select().from(historicoSolicitacao)
    .where(eq(historicoSolicitacao.protocolo, protocolo))
    .orderBy(historicoSolicitacao.id)
    .all()

  return paraSolicitacao(linha, historico)
})
