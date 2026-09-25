import { atualizarStatusSchema } from '#shared/utils/validacao'
import { detectarAmeacaEmCampos, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'
import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  await exigirServidor(event)

  const protocolo = getRouterParam(event, 'protocolo')
  if (!protocolo) {
    throw createError({ statusCode: 400, message: 'Informe o número de protocolo' })
  }

  const body = await readBody(event)
  const resultado = atualizarStatusSchema.safeParse(body)

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const ameaca = detectarAmeacaEmCampos([resultado.data.mensagem, resultado.data.responsavel])
  if (ameaca) {
    throw createError({ statusCode: 400, message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
  }

  const storage = useStorage('solicitacoes')
  const chave = `${protocolo}.json`
  const solicitacao = await storage.getItem<Solicitacao>(chave)

  if (!solicitacao) {
    throw createError({ statusCode: 404, message: 'Solicitação não encontrada' })
  }

  const { status, mensagem, responsavel } = resultado.data

  const atualizada: Solicitacao = {
    ...solicitacao,
    status,
    responsavel: responsavel || solicitacao.responsavel,
    historico: [
      ...solicitacao.historico,
      { status, mensagem, data: new Date().toISOString() },
    ],
  }

  await storage.setItem(chave, atualizada)

  return atualizada
})
