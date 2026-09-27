import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { Pool } from 'pg'
// Import relativo (não `#shared/...`) de propósito: este arquivo também é
// carregado direto pela CLI do Better Auth (`yarn db:migrate`), fora do
// runtime/bundler do Nuxt, que é quem resolve o alias `#shared`.
import { normalizarCpf, validarCpf } from '../../shared/utils/cpf'

// Instância única do servidor de auth, usada tanto pelo handler HTTP
// (server/api/auth/[...all].ts) quanto por quem precisa ler a sessão em
// outras rotas (ver server/utils/exigirServidor.ts), e pela CLI do Better
// Auth (`yarn db:migrate`) — por isso lê `process.env` direto em vez de
// `useRuntimeConfig()`, que só existe dentro do runtime do Nuxt/Nitro.
// O `Pool` só conecta de forma preguiçosa na primeira query — não falha
// aqui se DATABASE_URL estiver ausente/errada, só quando alguém de fato
// tentar logar/cadastrar. Guardado em variável (em vez de inline) porque o
// hook de cadastro abaixo também usa para checar CPF duplicado — e exportado
// porque server/api/perfil/completar-cadastro.post.ts (fluxo de CPF do
// Google) reaproveita a mesma conexão em vez de abrir outra.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // Login/cadastro com Google. Sem GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET
    // reais no ambiente, o provedor fica registrado mas qualquer tentativa
    // real de login falha do lado do Google — é o estado esperado até essas
    // credenciais serem configuradas (ver .env.example).
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  // Conta criada via Google nunca precisa de CPF/senha (ver hook de
  // cadastro abaixo, que só exige CPF em `/sign-up/email`), então pode
  // ficar seguro linkar automaticamente com uma conta local existente do
  // mesmo e-mail — mas só quando esse e-mail local já foi verificado
  // (comportamento padrão do Better Auth 1.7.5: `requireLocalEmailVerified`
  // é `true` por padrão). Como o cadastro tradicional deste projeto nunca
  // verifica e-mail, isso na prática BLOQUEIA o auto-link entre uma conta
  // e-mail/senha existente e um login Google do mesmo e-mail — o Better
  // Auth rejeita a tentativa em vez de linkar ou duplicar. Não há
  // configuração customizada aqui: é o comportamento nativo já seguro.
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
      // `required: false` no nível do campo de propósito: conta Google
      // nunca tem CPF (fica `null`) — a exigência de CPF é só para o
      // cadastro tradicional, forçada no hook abaixo, não aqui.
      // `unique: true` vira uma constraint/índice único de verdade no
      // Postgres (aplicado por `yarn db:migrate`) — múltiplas linhas com
      // `cpf = null` continuam permitidas (regra padrão de índice único no
      // Postgres), só CPFs preenchidos não podem repetir.
      cpf: {
        type: 'string',
        required: false,
        unique: true,
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
  hooks: {
    // Roda antes de QUALQUER endpoint do Better Auth. Filtra por `ctx.path`
    // para só se aplicar ao cadastro tradicional — login (email ou Google),
    // cadastro Google e todo o resto passam direto. É a garantia real: uma
    // chamada direta a `POST /api/auth/sign-up/email` sem CPF, com CPF
    // inválido ou com CPF já usado é rejeitada aqui, não importa o que a
    // tela faça ou deixe de fazer.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email')
        return

      const cpfNormalizado = normalizarCpf(typeof ctx.body?.cpf === 'string' ? ctx.body.cpf : '')

      if (!validarCpf(cpfNormalizado)) {
        throw new APIError('BAD_REQUEST', {
          message: 'Informe um CPF válido.',
        })
      }

      // Checagem antecipada só para dar uma mensagem amigável sem vazar
      // dado de quem já é dono do CPF. A garantia definitiva contra corrida
      // (duas requisições simultâneas com o mesmo CPF) é o índice único no
      // Postgres — se essa checagem aqui passar mas o INSERT ainda assim
      // violar a constraint, o cadastro falha de qualquer forma.
      const { rows } = await pool.query('select 1 from "user" where cpf = $1 limit 1', [cpfNormalizado])
      if (rows.length > 0) {
        throw new APIError('BAD_REQUEST', {
          message: 'Este CPF já está vinculado a outra conta.',
        })
      }

      // Body é repassado adiante para o handler de cadastro — normaliza
      // aqui para o que fica persistido ser sempre só os 11 dígitos,
      // independente de como a tela mandou (com ou sem máscara).
      ctx.body.cpf = cpfNormalizado
    }),
  },
})
