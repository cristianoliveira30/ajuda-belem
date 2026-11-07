import { eq } from 'drizzle-orm'
import { cadastroSchema } from '#shared/utils/validacaoAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const resultado = cadastroSchema.safeParse(body)

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const { nome, telefone, senha } = resultado.data
  const email = resultado.data.email.toLowerCase()
  const cpf = resultado.data.cpf || null

  const existente = db.select().from(users).where(eq(users.email, email)).get()
  if (existente) {
    throw createError({ statusCode: 409, message: 'Já existe uma conta com esse e-mail' })
  }

  const senhaHash = await hashPassword(senha)
  const criadoEm = new Date().toISOString()

  let novoId: number
  try {
    const resultadoInsercao = db.insert(users).values({
      tipo: 'cidadao',
      nome,
      email,
      senhaHash,
      cpf,
      telefone,
      criadoEm,
    }).run()
    novoId = Number(resultadoInsercao.lastInsertRowid)
  }
  catch (erro) {
    if (erro instanceof Error && erro.message.includes('UNIQUE')) {
      throw createError({ statusCode: 409, message: 'Já existe uma conta com esse e-mail ou CPF' })
    }
    throw erro
  }

  const sessionUser = { id: novoId, tipo: 'cidadao' as const, nome, email, cpf: cpf ?? undefined }
  await setUserSession(event, { user: sessionUser })

  return sessionUser
})
