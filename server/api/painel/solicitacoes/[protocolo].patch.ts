import { atualizarStatusSchema } from '#shared/utils/validacao'
import { detectarAmeacaEmCampos, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'
import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const usuario = await exigirServidor(event)

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
      // `servidorUserId`/`servidorNome` vêm da sessão (exigirServidor acima),
      // nunca do body — é a auditoria real de quem alterou. `responsavel`
      // continua sendo o texto livre que já existia, preservado por
      // compatibilidade (ex.: nome da secretaria), não é usado como
      // identificação de quem fez a mudança.
      { status, mensagem, data: new Date().toISOString(), servidorUserId: usuario.id, servidorNome: usuario.name },
    ],
  }

  await storage.setItem(chave, atualizada)

  return atualizada
})
