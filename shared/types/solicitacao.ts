export type StatusSolicitacao = 'aberto' | 'em_analise' | 'encaminhado' | 'em_execucao' | 'concluido'
export type RiscoPercebido = 'sim' | 'nao' | 'nao_sei'

export interface HistoricoSolicitacao {
  status: StatusSolicitacao
  data: string
  mensagem: string
}

export interface Solicitacao {
  protocolo: string
  categoria: string
  rua: string
  numero: string
  bairro: string
  complemento?: string
  pontoReferencia?: string
  descricao: string
  fotos?: string[]
  risco?: RiscoPercebido
  nome: string
  email: string
  telefone: string
  cpf?: string
  status: StatusSolicitacao
  criadoEm: string
  historico: HistoricoSolicitacao[]
}

export type NovaSolicitacaoPayload = Pick<
  Solicitacao,
  | 'categoria' | 'rua' | 'numero' | 'bairro' | 'complemento' | 'pontoReferencia'
  | 'descricao' | 'fotos' | 'risco' | 'nome' | 'email' | 'telefone' | 'cpf'
>
