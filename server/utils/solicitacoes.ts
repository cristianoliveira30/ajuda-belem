import type { Solicitacao } from '#shared/types/solicitacao'
import type { historicoSolicitacao, solicitacoes } from '../database/schema'

export function paraSolicitacao(
  linha: typeof solicitacoes.$inferSelect,
  historico: (typeof historicoSolicitacao.$inferSelect)[],
): Solicitacao {
  return {
    protocolo: linha.protocolo,
    categoria: linha.categoria,
    rua: linha.rua,
    numero: linha.numero,
    bairro: linha.bairro,
    complemento: linha.complemento ?? undefined,
    pontoReferencia: linha.pontoReferencia ?? undefined,
    descricao: linha.descricao,
    fotos: linha.fotos ? JSON.parse(linha.fotos) : undefined,
    risco: linha.risco ?? undefined,
    nome: linha.nome,
    email: linha.email,
    telefone: linha.telefone,
    cpf: linha.cpf ?? undefined,
    status: linha.status,
    criadoEm: linha.criadoEm,
    historico: historico.map(item => ({
      status: item.status as Solicitacao['status'],
      data: item.data,
      mensagem: item.mensagem,
    })),
  }
}
