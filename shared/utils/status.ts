import type { StatusSolicitacao } from '../types/solicitacao'

export const STATUS_SOLICITACAO: Record<StatusSolicitacao, { label: string, color: string, icon: string }> = {
  aberto: {
    label: 'Recebido',
    color: 'neutral',
    icon: 'i-lucide-file-plus',
  },
  em_analise: {
    label: 'Em análise',
    color: 'warning',
    icon: 'i-lucide-search',
  },
  encaminhado: {
    label: 'Encaminhado',
    color: 'info',
    icon: 'i-lucide-send',
  },
  em_execucao: {
    label: 'Em atendimento',
    color: 'primary',
    icon: 'i-lucide-hammer',
  },
  concluido: {
    label: 'Concluído',
    color: 'success',
    icon: 'i-lucide-check-circle-2',
  },
}

// Só ocorrência "ativa" (ainda não resolvida) entra na busca por duplicidade
// e pode receber novos relatos — ver server/api/solicitacoes/candidata.post.ts
// e server/api/solicitacoes/[protocolo]/relato.post.ts.
export function statusEhAtivo(status: StatusSolicitacao): boolean {
  return status !== 'concluido'
}

export function gerarProtocolo(): string {
  const ano = new Date().getFullYear()
  const numero = Math.floor(100000 + Math.random() * 900000)
  return `${ano}${numero}`
}
