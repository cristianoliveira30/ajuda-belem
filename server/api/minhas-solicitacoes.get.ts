import type { Solicitacao } from '#shared/types/solicitacao'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user.email) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const userId = session.user.id
  const email = session.user.email.toLowerCase()

  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(
    chaves.map(chave => storage.getItem<Solicitacao>(chave)),
  )

  return solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao => {
      if (!solicitacao)
        return false

      // Cobre quem criou a ocorrência OU quem depois confirmou "é o mesmo
      // problema" (os dois casos ficam em `relatos`, ver
      // server/api/solicitacoes/index.post.ts e .../[protocolo]/relato.post.ts).
      // Fallback por e-mail só pra ocorrências criadas antes dessa mudança,
      // que não têm `relatos`.
      if (solicitacao.relatos?.length)
        return solicitacao.relatos.some(relato => relato.userId === userId)

      return solicitacao.email.toLowerCase() === email
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    // A tela (app/pages/solicitacoes/acompanhar.vue) só usa a primeira foto
    // como miniatura do card (`ocorrencia.fotos?.[0]`) — nunca as 3. Manter
    // só a primeira aqui evita mandar até 3 fotos em base64 por card só pra
    // exibir uma (achado da auditoria).
    .map(solicitacao => ({ ...solicitacao, fotos: solicitacao.fotos?.slice(0, 1) }))
})
