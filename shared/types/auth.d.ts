declare module '#auth-utils' {
  interface User {
    id: number
    tipo: 'cidadao' | 'servidor'
    nome: string
    email: string
    cpf?: string
    papel?: 'atendente' | 'gestor'
    secretaria?: string
  }
}

export {}
