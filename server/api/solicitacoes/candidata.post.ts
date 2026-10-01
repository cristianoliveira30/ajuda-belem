import { z } from 'zod'
import { calcularDistanciaMetros, RAIO_DUPLICIDADE_METROS } from '#shared/utils/distancia'
import { statusEhAtivo } from '#shared/utils/status'
import type { OcorrenciaCandidata, Solicitacao } from '#shared/types/solicitacao'

const corpoSchema = z.object({
  categoria: z.string(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

// Sugere ao cidadão uma ocorrência já existente perto do local informado —
// nunca decide sozinho que é o mesmo problema, só propõe (ver
// server/api/solicitacoes/[protocolo]/relato.post.ts, que é quem de fato
// registra a confirmação do cidadão).
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const resultado = corpoSchema.safeParse(await readBody(event))
  if (!resultado.success) {
    throw createError({ statusCode: 400, message: 'Dados inválidos' })
  }

  const { categoria, latitude, longitude } = resultado.data

  // Sem coordenadas não dá pra comparar proximidade — não tenta deduplicar,
  // segue como ocorrência nova.
  if (latitude == null || longitude == null) {
    return { candidata: null }
  }

  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const solicitacoes = await Promise.all(chaves.map(chave => storage.getItem<Solicitacao>(chave)))

  // Entre as elegíveis dentro do raio, pega a mais próxima — mais provável
  // de ser o mesmo problema do que uma outra qualquer dentro do limite.
  const candidatas = solicitacoes
    .filter((solicitacao): solicitacao is Solicitacao => {
      if (!solicitacao || solicitacao.categoria !== categoria)
        return false
      if (!statusEhAtivo(solicitacao.status))
        return false
      return solicitacao.latitude != null && solicitacao.longitude != null
    })
    .map(solicitacao => ({
      solicitacao,
      distanciaMetros: calcularDistanciaMetros(latitude, longitude, solicitacao.latitude!, solicitacao.longitude!),
    }))
    .filter(item => item.distanciaMetros <= RAIO_DUPLICIDADE_METROS)
    .sort((a, b) => a.distanciaMetros - b.distanciaMetros)

  const maisProxima = candidatas[0]
  if (!maisProxima) {
    return { candidata: null }
  }

  const { solicitacao, distanciaMetros } = maisProxima

  // DTO explícito, campo a campo — nunca espalha a Solicitacao inteira, que
  // teria nome/e-mail/telefone/CPF/userId de quem relatou.
  const resumo: OcorrenciaCandidata = {
    protocolo: solicitacao.protocolo,
    categoria: solicitacao.categoria,
    descricao: solicitacao.descricao,
    fotoPrincipal: solicitacao.fotos?.[0],
    rua: solicitacao.rua,
    bairro: solicitacao.bairro,
    pontoReferencia: solicitacao.pontoReferencia,
    status: solicitacao.status,
    criadoEm: solicitacao.criadoEm,
    risco: solicitacao.risco,
    quantidadeRelatos: solicitacao.relatos?.length ?? 1,
    distanciaMetros: Math.round(distanciaMetros),
  }

  return { candidata: resumo }
})
