import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const protocolo = getRouterParam(event, 'protocolo')

  if (!protocolo) {
    throw createError({ statusCode: 400, message: 'Informe o número de protocolo' })
  }

  const solicitacao = await useStorage('solicitacoes').getItem<Solicitacao>(`${protocolo}.json`)

  if (!solicitacao) {
    throw createError({ statusCode: 404, message: 'Solicitação não encontrada' })
  }

  return solicitacao
})
