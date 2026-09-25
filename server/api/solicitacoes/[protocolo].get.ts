import type { Solicitacao, SolicitacaoPublica } from '#shared/types/solicitacao'

export default defineEventHandler(async (event): Promise<SolicitacaoPublica> => {
  const protocolo = getRouterParam(event, 'protocolo')

  if (!protocolo) {
    throw createError({ statusCode: 400, message: 'Informe o número de protocolo' })
  }

  const solicitacao = await useStorage('solicitacoes').getItem<Solicitacao>(`${protocolo}.json`)

  if (!solicitacao) {
    throw createError({ statusCode: 404, message: 'Solicitação não encontrada' })
  }

  // Rota pública (sem login): nunca devolver nome, e-mail, telefone ou CPF do
  // cidadão. Quem precisa dos dados de contato é a rota do painel, autenticada.
  const { nome: _nome, email: _email, telefone: _telefone, cpf: _cpf, ...solicitacaoPublica } = solicitacao
  return solicitacaoPublica
})
