import type { H3Event } from 'h3'

export async function exigirServidor(event: H3Event) {
  // `disableCookieCache`: autorização de servidor não pode confiar num
  // cookie cacheado (ver session.cookieCache em server/utils/auth.ts) — uma
  // conta rebaixada de servidor para cidadão precisa perder acesso na hora,
  // não só depois do cache expirar.
  const session = await auth.api.getSession({
    headers: event.headers,
    query: { disableCookieCache: true },
  })

  if (!session) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  if (session.user.papel !== 'servidor') {
    throw createError({ statusCode: 403, message: 'Acesso restrito a servidores da Prefeitura' })
  }

  return session.user
}
