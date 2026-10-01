import { criarServidorSchema } from '#shared/utils/validacao'
import { detectarAmeacaEmCampos, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'

// Admin cria uma conta de servidor. Usa `auth.api.signUpEmail` — a mesma API
// oficial do Better Auth que o cadastro público de cidadão usa (server/api/
// auth/[...all].ts → /sign-up/email) — não faz insert manual em user/account.
// Repassamos `event.headers` (a sessão do próprio admin) pra chamada: é
// assim que o hook em server/utils/auth.ts reconhece "isso é criação de
// servidor pelo admin" e pula a exigência de CPF (servidor não precisa).
//
// `papel`/`primeiroAcesso` são `input: false` (ver server/utils/auth.ts) —
// signUpEmail sempre cria com os defaults (`cidadao`/`false`), então em
// seguida promovemos com um UPDATE mínimo, o mesmo padrão já documentado em
// db/schema.sql pra promoção manual de servidor.
export default defineEventHandler(async (event) => {
  await exigirAdmin(event)

  const resultado = criarServidorSchema.safeParse(await readBody(event))
  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const { nome, email, senha, telefone, secretaria } = resultado.data

  const ameaca = detectarAmeacaEmCampos([nome, telefone, secretaria])
  if (ameaca) {
    throw createError({ statusCode: 400, message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
  }

  const { user } = await auth.api.signUpEmail({
    body: { name: nome, email, password: senha, telefone, secretaria },
    headers: event.headers,
  })

  await pool.query('update "user" set papel = $1, "primeiroAcesso" = true where id = $2', ['servidor', user.id])

  return { id: user.id, nome: user.name, email: user.email }
})
