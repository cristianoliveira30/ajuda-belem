import type { Solicitacao } from '#shared/types/solicitacao'

// Lê todas as solicitações do storage. Ponto único para trocar o armazenamento
// (ver auditoria: migrar para Postgres) sem mexer nas 5 rotas que listam.
export async function listarSolicitacoes(): Promise<Solicitacao[]> {
  const storage = useStorage('solicitacoes')
  const chaves = await storage.getKeys()
  const itens = await Promise.all(chaves.map(chave => storage.getItem<Solicitacao>(chave)))
  return itens.filter((s): s is Solicitacao => !!s)
}
