import { normalizarCpf, validarCpf } from '#shared/utils/cpf'

// Cidadão que entrou pelo Google (que não fornece CPF) informa o CPF depois
// do OAuth, em /perfil. O CPF só pode ser gravado uma vez: quem já tem CPF
// não consegue trocá-lo por aqui.
//
// Só a coluna `cpf` é gravada: `email`, `name`, `papel`, `secretaria` e `id`
// nunca são tocados por este endpoint.
export default defineEventHandler(async (event) => {
  // `disableCookieCache`: a checagem não pode confiar num cookie cacheado de
  // até 60s (senão um CPF recém-gravado ainda apareceria como vazio).
  const session = await auth.api.getSession({
    headers: event.headers,
    query: { disableCookieCache: true },
  })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  if (session.user.cpf) {
    throw createError({ statusCode: 400, message: 'Seu CPF já está cadastrado e não pode ser alterado.' })
  }

  const body = await readBody(event)
  const cpf = normalizarCpf(typeof body?.cpf === 'string' ? body.cpf : '')

  if (!validarCpf(cpf)) {
    throw createError({ statusCode: 400, message: 'Informe um CPF válido.' })
  }

  const mensagemCpfEmUso = 'Este CPF já está vinculado a outra conta.'

  // A pré-checagem dá a mensagem amigável; quem garante a unicidade de fato
  // é a constraint `user_cpf_key` no Postgres (ver o UPDATE abaixo).
  const { rows } = await pool.query('select 1 from "user" where cpf = $1 limit 1', [cpf])
  if (rows.length > 0) {
    throw createError({ statusCode: 400, message: mensagemCpfEmUso })
  }

  try {
    // `cpf is null` evita sobrescrever um CPF gravado por outra requisição
    // entre a leitura da sessão e este UPDATE.
    const resultado = await pool.query(
      'update "user" set cpf = $1, "updatedAt" = now() where id = $2 and cpf is null',
      [cpf, session.user.id],
    )

    if (!resultado.rowCount) {
      throw createError({ statusCode: 400, message: 'Seu CPF já está cadastrado e não pode ser alterado.' })
    }
  }
  catch (erro) {
    // 23505 = violação de unique: outro cadastro pegou o mesmo CPF agora.
    if ((erro as { code?: string }).code === '23505') {
      throw createError({ statusCode: 400, message: mensagemCpfEmUso })
    }
    throw erro
  }

  return { ok: true }
})
