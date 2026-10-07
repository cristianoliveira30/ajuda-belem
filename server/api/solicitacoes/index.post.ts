import { solicitacaoSchema } from '#shared/utils/validacao'
import { gerarProtocolo } from '#shared/utils/status'
import { detectarAmeacaEmCampos, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'
import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  // Exige cidadão autenticado — identidade vem da sessão, nunca do body, pra
  // ninguém conseguir registrar uma ocorrência em nome de outra pessoa.
  const session = await auth.api.getSession({
    headers: event.headers,
    query: { disableCookieCache: true },
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  // Cidadão que entrou pelo Google ainda sem CPF precisa completar o
  // cadastro em /perfil antes de registrar uma ocorrência.
  if (session.user.papel === 'cidadao' && !session.user.cpf) {
    throw createError({ statusCode: 403, message: 'Complete seu cadastro informando o CPF antes de registrar uma ocorrência.' })
  }

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
  // diretamente (sem passar pela UI) também precisa passar por ela. `nome`
  // não entra aqui: vem da sessão, não deste body (ver abaixo).
  const { rua, bairro, complemento, pontoReferencia, descricao } = resultado.data
  const ameaca = detectarAmeacaEmCampos([rua, bairro, complemento, pontoReferencia, descricao])
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
    // Sobrescreve nome/e-mail do body com os da sessão — o chat nem pergunta
    // mais isso, e mesmo que perguntasse, o que fica gravado é sempre a
    // identidade autenticada, nunca o que vier no body.
    nome: session.user.name,
    email: session.user.email,
    // Telefone e CPF vêm sempre da conta (já validados no cadastro), nunca
    // do corpo da requisição.
    telefone: session.user.telefone ?? undefined,
    cpf: session.user.cpf ?? undefined,
    userId: session.user.id,
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
    // Quem cria a ocorrência conta como o primeiro relato dela.
    relatos: [{ userId: session.user.id, criadoEm: agora }],
  }

  await storage.setItem(`${protocolo}.json`, solicitacao)

  return { protocolo }
})
