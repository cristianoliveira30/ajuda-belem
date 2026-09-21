import { solicitacaoSchema } from '#shared/utils/validacao'
import { gerarProtocolo } from '#shared/utils/status'
import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const resultado = solicitacaoSchema.safeParse(body)

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const storage = useStorage('solicitacoes')

  let protocolo = gerarProtocolo()
  while (await storage.hasItem(`${protocolo}.json`)) {
    protocolo = gerarProtocolo()
  }

  const agora = new Date().toISOString()

  const solicitacao: Solicitacao = {
    ...resultado.data,
    protocolo,
    status: 'aberto',
    criadoEm: agora,
    historico: [
      {
        status: 'aberto',
        data: agora,
        mensagem: 'Solicitação registrada com sucesso.',
      },
    ],
  }

  await storage.setItem(`${protocolo}.json`, solicitacao)

  return { protocolo }
})
