import { statusEhAtivo } from '#shared/utils/status'
import type { RelatoOcorrencia, Solicitacao } from '#shared/types/solicitacao'

// Cidadão confirmando "sim, é o mesmo problema" pra uma ocorrência já
// existente (ver server/api/solicitacoes/candidata.post.ts) — não cria uma
// nova ocorrência nem salva outra foto, só adiciona esse cidadão à lista de
// relatos da ocorrência que já existe.
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const protocolo = getRouterParam(event, 'protocolo')
  if (!protocolo) {
    throw createError({ statusCode: 400, message: 'Informe o número de protocolo' })
  }

  const storage = useStorage('solicitacoes')
  const chave = `${protocolo}.json`

  // Releitura fresca da ocorrência — não confia em nada que o frontend possa
  // ter visto na checagem de candidata alguns segundos antes; o status pode
  // ter mudado nesse meio-tempo, ou a ocorrência pode nem existir mais.
  const solicitacao = await storage.getItem<Solicitacao>(chave)

  if (!solicitacao) {
    throw createError({ statusCode: 404, message: 'Ocorrência não encontrada' })
  }

  if (!statusEhAtivo(solicitacao.status)) {
    throw createError({ statusCode: 400, message: 'Esta ocorrência já foi concluída e não aceita novos relatos.' })
  }

  const relatos = solicitacao.relatos ?? []

  if (relatos.some(relato => relato.userId === session.user.id)) {
    throw createError({ statusCode: 409, message: 'Você já registrou um relato para esta ocorrência.' })
  }

  const novoRelato: RelatoOcorrencia = { userId: session.user.id, criadoEm: new Date().toISOString() }
  const atualizada: Solicitacao = { ...solicitacao, relatos: [...relatos, novoRelato] }

  await storage.setItem(chave, atualizada)

  return { protocolo, quantidadeRelatos: atualizada.relatos!.length }
})
