import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

// Instância única do servidor de auth, usada tanto pelo handler HTTP
// (server/api/auth/[...all].ts) quanto por quem precisa ler a sessão em
// outras rotas (ver server/utils/exigirServidor.ts), e pela CLI do Better
// Auth (`yarn db:migrate`) — por isso lê `process.env` direto em vez de
// `useRuntimeConfig()`, que só existe dentro do runtime do Nuxt/Nitro.
// O `Pool` só conecta de forma preguiçosa na primeira query — não falha
// aqui se DATABASE_URL estiver ausente/errada, só quando alguém de fato
// tentar logar/cadastrar.
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Evita bater no Postgres a cada carregamento de página pública (home,
    // cabeçalho) só para saber se há sessão — as rotas que de fato precisam
    // de uma checagem de autorização fresca (ver server/utils/exigirServidor.ts)
    // pedem `disableCookieCache`.
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  user: {
    additionalFields: {
      // "cidadao" por padrão: não há cadastro público de servidor — contas
      // de servidor são promovidas manualmente no banco (ver docs/etapa-iniciais.md).
      papel: {
        type: 'string',
        required: false,
        defaultValue: 'cidadao',
        input: false,
      },
      cpf: {
        type: 'string',
        required: false,
      },
      telefone: {
        type: 'string',
        required: false,
      },
      secretaria: {
        type: 'string',
        required: false,
      },
    },
  },
})
