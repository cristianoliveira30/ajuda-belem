import { eq, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.tipo !== 'cidadao') {
    throw createError({ statusCode: 403, message: 'Apenas cidadãos podem acessar suas solicitações' })
  }

  const condicoes = [eq(solicitacoes.userId, user.id), eq(solicitacoes.email, user.email)]
  if (user.cpf) {
    condicoes.push(eq(solicitacoes.cpf, user.cpf))
  }

  const linhas = db.select().from(solicitacoes).where(or(...condicoes)).all()

  return linhas
    .map(linha => ({
      protocolo: linha.protocolo,
      categoria: linha.categoria,
      status: linha.status,
      criadoEm: linha.criadoEm,
      rua: linha.rua,
      numero: linha.numero,
      bairro: linha.bairro,
      complemento: linha.complemento ?? undefined,
    }))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
})
