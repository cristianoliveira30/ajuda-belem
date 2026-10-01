export type StatusSolicitacao = 'aberto' | 'em_analise' | 'encaminhado' | 'em_execucao' | 'concluido'
export type RiscoPercebido = 'sim' | 'nao' | 'nao_sei'

export interface HistoricoSolicitacao {
  status: StatusSolicitacao
  data: string
  mensagem: string
  // Auditoria interna — quem (conta servidor/admin) fez essa mudança, vindo
  // sempre da sessão de quem chamou o PATCH, nunca do body (ver
  // server/api/painel/solicitacoes/[protocolo].patch.ts). Nunca exposta na
  // rota pública de consulta por protocolo — ver HistoricoSolicitacaoPublico.
  servidorUserId?: string
  servidorNome?: string
}

// Mesmo histórico, sem os 2 campos internos acima — é o que
// server/api/solicitacoes/[protocolo].get.ts (rota pública) realmente devolve.
export type HistoricoSolicitacaoPublico = Omit<HistoricoSolicitacao, 'servidorUserId' | 'servidorNome'>

export interface AvaliacaoAtendimento {
  nota: number
  comentario?: string
  data: string
}

// Um "relato" é um cidadão confirmando que o problema de uma Solicitacao
// (a ocorrência física) também existe pra ele — ver
// server/api/solicitacoes/[protocolo]/relato.post.ts. O criador original da
// ocorrência conta como o primeiro relato.
export interface RelatoOcorrencia {
  userId: string
  criadoEm: string
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
  // Opcional: o chat não pergunta mais isso (identidade vem da sessão, ver
  // server/api/solicitacoes/index.post.ts) — quando a conta tem telefone
  // cadastrado, ele é copiado pra cá automaticamente; senão fica ausente.
  telefone?: string
  cpf?: string
  status: StatusSolicitacao
  responsavel?: string
  avaliacao?: AvaliacaoAtendimento
  criadoEm: string
  historico: HistoricoSolicitacao[]
  // Opcionais por compatibilidade: solicitações criadas antes da exigência de
  // login (ver server/api/solicitacoes/index.post.ts) não têm esses campos.
  userId?: string
  relatos?: RelatoOcorrencia[]
}

export type NovaSolicitacaoPayload = Pick<
  Solicitacao,
  | 'categoria' | 'rua' | 'numero' | 'bairro' | 'complemento' | 'pontoReferencia' | 'latitude' | 'longitude'
  | 'descricao' | 'fotos' | 'risco' | 'nome' | 'email' | 'telefone' | 'cpf'
>

export type OcorrenciaMapa = Pick<
  Solicitacao,
  'protocolo' | 'categoria' | 'bairro' | 'rua' | 'latitude' | 'longitude' | 'status' | 'descricao' | 'criadoEm'
> & {
  quantidadeRelatos: number
}

// Resumo devolvido por POST /api/solicitacoes/candidata quando encontra uma
// ocorrência já existente perto do local informado — o suficiente pro
// cidadão decidir se é o mesmo problema, mas SÓ dado público/operacional.
// Nunca inclui nome, e-mail, telefone, CPF ou userId de quem relatou (ver
// server/api/solicitacoes/candidata.post.ts, que monta isso campo a campo,
// nunca espalhando a Solicitacao inteira).
export interface OcorrenciaCandidata {
  protocolo: string
  categoria: string
  descricao: string
  fotoPrincipal?: string
  rua: string
  bairro: string
  pontoReferencia?: string
  status: StatusSolicitacao
  criadoEm: string
  risco?: RiscoPercebido
  quantidadeRelatos: number
  distanciaMetros: number
}

// Versão exposta pela consulta pública de protocolo (server/api/solicitacoes/[protocolo].get.ts):
// sem nome, e-mail, telefone e CPF do cidadão, e sem a auditoria interna de
// quem alterou cada item do histórico — essa rota não exige login.
export type SolicitacaoPublica = Omit<Solicitacao, 'nome' | 'email' | 'telefone' | 'cpf' | 'historico'> & {
  historico: HistoricoSolicitacaoPublico[]
}
