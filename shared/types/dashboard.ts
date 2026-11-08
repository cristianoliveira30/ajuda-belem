import type { RiscoPercebido, StatusSolicitacao } from './solicitacao'

// Contrato de GET /api/dashboard (ver server/api/dashboard.get.ts). Nunca inclui foto, CPF, e-mail, telefone,
// nome do cidadão, userId ou auditoria interna; é montado campo a campo no
// backend, nunca espalhando um objeto Solicitacao inteiro.

export interface ContagemRotulada {
  label: string
  quantidade: number
}

export interface PontoStatus extends ContagemRotulada {
  status: StatusSolicitacao
}

export interface PontoCategoria extends ContagemRotulada {
  categoria: string
}

export interface PontoBairro {
  bairro: string
  quantidade: number
}

export interface PontoEvolucao {
  data: string
  quantidade: number
}

export interface PontoAbertasConcluidas {
  data: string
  abertas: number
  concluidas: number
}

export interface PontoRisco extends ContagemRotulada {
  risco: RiscoPercebido | 'nao_informado'
}

export interface OcorrenciaMaisRelatada {
  protocolo: string
  categoria: string
  categoriaLabel: string
  bairro: string
  quantidadeRelatos: number
}

export interface DashboardKpis {
  totalOcorrencias: number
  abertas: number
  emAtendimento: number
  concluidas: number
  totalRelatos: number
  taxaConclusao: number
  bairroMaisOcorrencias: PontoBairro | null
  categoriaMaisRegistrada: (ContagemRotulada & { categoria: string }) | null
}

export interface DashboardResposta {
  periodo: { valor: string, inicio: string | null, fim: string }
  kpis: DashboardKpis
  porStatus: PontoStatus[]
  porCategoria: PontoCategoria[]
  porBairro: PontoBairro[]
  evolucao: PontoEvolucao[]
  abertasConcluidas: PontoAbertasConcluidas[]
  relatosPorCategoria: PontoCategoria[]
  concluidasPorCategoria: PontoCategoria[]
  maisRelatadas: OcorrenciaMaisRelatada[]
  porRisco: PontoRisco[]
}
