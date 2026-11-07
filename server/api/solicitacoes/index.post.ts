import { eq } from 'drizzle-orm'
import { solicitacaoSchema } from '#shared/utils/validacao'
import { gerarProtocolo } from '#shared/utils/status'

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

  let protocolo = gerarProtocolo()
  while (db.select().from(solicitacoes).where(eq(solicitacoes.protocolo, protocolo)).get()) {
    protocolo = gerarProtocolo()
  }

  const sessao = await getUserSession(event)
  const userId = sessao.user?.tipo === 'cidadao' ? sessao.user.id : null

  const agora = new Date().toISOString()
  const dados = resultado.data

  db.insert(solicitacoes).values({
    protocolo,
    userId,
    categoria: dados.categoria,
    rua: dados.rua,
    numero: dados.numero,
    bairro: dados.bairro,
    complemento: dados.complemento,
    pontoReferencia: dados.pontoReferencia,
    descricao: dados.descricao,
    fotos: dados.fotos ? JSON.stringify(dados.fotos) : null,
    risco: dados.risco,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    cpf: dados.cpf,
    status: 'aberto',
    criadoEm: agora,
  }).run()

  db.insert(historicoSolicitacao).values({
    protocolo,
    status: 'aberto',
    data: agora,
    mensagem: 'Solicitação registrada com sucesso.',
  }).run()

  return { protocolo }
})
