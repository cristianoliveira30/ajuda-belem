import { eq } from 'drizzle-orm'
import { loginSchema } from '#shared/utils/validacaoAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const resultado = loginSchema.safeParse(body)

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const email = resultado.data.email.toLowerCase()
  const usuario = db.select().from(users).where(eq(users.email, email)).get()

  if (!usuario || !(await verifyPassword(usuario.senhaHash, resultado.data.senha))) {
    throw createError({ statusCode: 401, message: 'E-mail ou senha inválidos' })
  }

  const sessionUser = {
    id: usuario.id,
    tipo: usuario.tipo,
    nome: usuario.nome,
    email: usuario.email,
    cpf: usuario.cpf ?? undefined,
    papel: usuario.papel ?? undefined,
    secretaria: usuario.secretaria ?? undefined,
  }

  await setUserSession(event, { user: sessionUser })

  return sessionUser
})
