import { normalizarCpf, validarCpf } from '#shared/utils/cpf'

// Único uso: cidadão que entrou pelo Google (que não fornece CPF) completa
// esse campo depois do OAuth (ver app/middleware/auth.global.ts, que
// redireciona pra /completar-cadastro enquanto isso não acontece). Cadastro
// tradicional nunca chama isso — já nasce com CPF (ver hook de
// `/sign-up/email` em server/utils/auth.ts).
//
// Só a coluna `cpf` é lida/gravada aqui: `email`, `name`, `papel`,
// `secretaria`, `id` nunca são tocados por este endpoint, então não existe
// payload que altere mais que isso, mesmo chamando a API direto.
export default defineEventHandler(async (event) => {
  // `disableCookieCache`: mesmo motivo de exigirServidor — checagem de
  // autorização aqui não pode confiar num cookie cacheado de até 60s.
  const session = await auth.api.getSession({
    headers: event.headers,
    query: { disableCookieCache: true },
  })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody(event)
  const cpf = normalizarCpf(typeof body?.cpf === 'string' ? body.cpf : '')

  if (!validarCpf(cpf)) {
    throw createError({ statusCode: 400, message: 'Informe um CPF válido.' })
  }

  // Pré-checagem só para mensagem amigável — a garantia definitiva contra
  // duplicidade é o índice único `user_cpf_uidx` no Postgres (ver
  // db/schema.sql); se essa checagem passar mas o UPDATE ainda assim violar
  // a constraint, a requisição falha do mesmo jeito.
  const { rows } = await pool.query('select 1 from "user" where cpf = $1 limit 1', [cpf])
  if (rows.length > 0) {
    throw createError({ statusCode: 400, message: 'Este CPF já está vinculado a outra conta.' })
  }

  await pool.query('update "user" set cpf = $1, "updatedAt" = now() where id = $2', [cpf, session.user.id])

  return { ok: true }
})
