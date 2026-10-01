export type PapelUsuario = 'cidadao' | 'servidor' | 'admin'

export interface Perfil {
  id: string
  nome: string
  email: string
  cpf: string | null
  telefone: string | null
  papel: PapelUsuario
  secretaria: string | null
  // Só relevante pra servidor criado pelo admin — ver server/utils/auth.ts.
  primeiroAcesso: boolean
}

// Formato do usuário devolvido por GET /api/auth/get-session (Better Auth).
export interface SessaoUsuario {
  id: string
  name: string
  email: string
  cpf?: string | null
  telefone?: string | null
  papel: PapelUsuario
  secretaria?: string | null
  primeiroAcesso?: boolean
  banned?: boolean | null
}
