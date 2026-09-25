import { avaliacaoSchema } from '#shared/utils/validacao'
import { detectarAmeacaEntrada, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'
import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
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

  const storage = useStorage('solicitacoes')
  const chave = `${protocolo}.json`
  const solicitacao = await storage.getItem<Solicitacao>(chave)

  if (!solicitacao) {
    throw createError({ statusCode: 404, message: 'Solicitação não encontrada' })
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
