export type StatusSolicitacao = 'aberto' | 'em_analise' | 'encaminhado' | 'em_execucao' | 'concluido'
export type RiscoPercebido = 'sim' | 'nao' | 'nao_sei'

export interface HistoricoSolicitacao {
  status: StatusSolicitacao
  data: string
  mensagem: string
}

export interface AvaliacaoAtendimento {
  nota: number
  comentario?: string
  data: string
}

export interface Solicitacao {
  protocolo: string
  categoria: string
  rua: string
  numero: string
  bairro: string
  complemento?: string
  pontoReferencia?: string
  latitude?: number
  longitude?: number
  descricao: string
  fotos?: string[]
  risco?: RiscoPercebido
  nome: string
  email: string
  telefone: string
  cpf?: string
  status: StatusSolicitacao
  responsavel?: string
  avaliacao?: AvaliacaoAtendimento
  criadoEm: string
  historico: HistoricoSolicitacao[]
}

export type NovaSolicitacaoPayload = Pick<
  Solicitacao,
  | 'categoria' | 'rua' | 'numero' | 'bairro' | 'complemento' | 'pontoReferencia' | 'latitude' | 'longitude'
  | 'descricao' | 'fotos' | 'risco' | 'nome' | 'email' | 'telefone' | 'cpf'
>

export type OcorrenciaMapa = Pick<
  Solicitacao,
  'protocolo' | 'categoria' | 'bairro' | 'rua' | 'latitude' | 'longitude' | 'status' | 'descricao' | 'criadoEm'
>

// Versão exposta pela consulta pública de protocolo (server/api/solicitacoes/[protocolo].get.ts):
// sem nome, e-mail, telefone e CPF do cidadão, já que essa rota não exige login.
export type SolicitacaoPublica = Omit<Solicitacao, 'nome' | 'email' | 'telefone' | 'cpf'>
