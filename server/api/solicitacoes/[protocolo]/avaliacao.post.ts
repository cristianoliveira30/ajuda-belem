import { avaliacaoSchema } from '#shared/utils/validacao'
import { detectarAmeacaEntrada, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'
import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const protocolo = getRouterParam(event, 'protocolo')
  if (!protocolo) {
    throw createError({ statusCode: 400, message: 'Informe o número de protocolo' })
  }

  const body = await readBody(event)
  const resultado = avaliacaoSchema.safeParse(body)

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const ameaca = detectarAmeacaEntrada(resultado.data.comentario)
  if (ameaca) {
    throw createError({ statusCode: 400, message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
  }

  return comTrava(protocolo, async () => {
    const storage = useStorage('solicitacoes')
    const chave = `${protocolo}.json`
    const solicitacao = await storage.getItem<Solicitacao>(chave)

    if (!solicitacao) {
      throw createError({ statusCode: 404, message: 'Solicitação não encontrada' })
    }

    // Só quem relatou a ocorrência avalia. Registro antigo sem `relatos` cai no
    // e-mail, mesma regra de minhas-solicitacoes.get.ts.
    const ehRelator = solicitacao.relatos?.length
      ? solicitacao.relatos.some(relato => relato.userId === session.user.id)
      : solicitacao.email.toLowerCase() === session.user.email.toLowerCase()
    if (!ehRelator) {
      throw createError({ statusCode: 403, message: 'Só quem registrou esta ocorrência pode avaliá-la' })
    }

    if (solicitacao.status !== 'concluido') {
      throw createError({ statusCode: 400, message: 'Só é possível avaliar uma solicitação concluída' })
    }

    if (solicitacao.avaliacao) {
      throw createError({ statusCode: 409, message: 'Esta solicitação já foi avaliada' })
    }

    const atualizada: Solicitacao = {
      ...solicitacao,
      avaliacao: {
        nota: resultado.data.nota,
        comentario: resultado.data.comentario,
        data: new Date().toISOString(),
      },
    }

    await storage.setItem(chave, atualizada)

    return atualizada
  })
})
