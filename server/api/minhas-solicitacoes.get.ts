import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user.email) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const email = session.user.email

  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(
    chaves.map(chave => storage.getItem<Solicitacao>(chave)),
  )

  return solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao =>
      !!solicitacao && solicitacao.email.toLowerCase() === email.toLowerCase(),
    )
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
})
