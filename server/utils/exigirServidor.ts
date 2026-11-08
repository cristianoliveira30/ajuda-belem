import type { H3Event } from 'h3'

// `servidor` e `admin` compartilham as mesmas operações normais do painel
// (ver auditoria: "tudo que hoje aceita servidor deve também aceitar
// admin"). Quem precisa de admin especificamente usa `exigirAdmin` abaixo,
// no mesmo arquivo — não criamos um segundo helper de autorização pra isso.
export async function exigirServidor(event: H3Event) {
  // `disableCookieCache`: autorização não pode confiar num cookie cacheado
  // (ver session.cookieCache em server/utils/auth.ts) — uma conta rebaixada,
  // desativada ou ainda em primeiro acesso precisa perder/ganhar acesso na
  // hora, não só depois do cache expirar.
  const session = await auth.api.getSession({
    headers: event.headers,
    query: { disableCookieCache: true },
  })

  if (!session) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  if (session.user.papel !== 'servidor' && session.user.papel !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acesso restrito a servidores da Prefeitura' })
  }

  if (session.user.banned) {
    throw createError({ statusCode: 403, message: 'Conta desativada. Fale com o administrador.' })
  }

  // Servidor criado pelo admin não pode operar nada até trocar a senha
  // inicial — checado aqui (backend), não só no redirecionamento da tela
  // (ver app/middleware/auth.global.ts). Admin nunca tem `primeiroAcesso`,
  // então nunca cai nessa trava.
  if (session.user.papel === 'servidor' && session.user.primeiroAcesso) {
    throw createError({ statusCode: 403, message: 'Troque sua senha inicial antes de continuar.' })
  }

  return session.user
}

// Só admin — gestão de contas de servidor (criar, editar, ativar/desativar).
export async function exigirAdmin(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers,
    query: { disableCookieCache: true },
  })

  if (!session) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  if (session.user.papel !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acesso restrito a administradores' })
  }

  return session.user
}
