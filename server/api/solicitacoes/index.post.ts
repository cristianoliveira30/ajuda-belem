import { solicitacaoSchema } from '#shared/utils/validacao'
import { gerarProtocolo } from '#shared/utils/status'
import { detectarAmeacaEmCampos, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'
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

  // Defesa em profundidade: a checagem já roda no chat, mas quem chama a API
  // diretamente (sem passar pela UI) também precisa passar por ela.
  const { rua, bairro, complemento, pontoReferencia, descricao, nome } = resultado.data
  const ameaca = detectarAmeacaEmCampos([rua, bairro, complemento, pontoReferencia, descricao, nome])
  if (ameaca) {
    throw createError({ statusCode: 400, message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
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
