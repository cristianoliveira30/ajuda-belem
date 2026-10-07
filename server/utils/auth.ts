import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { Pool } from 'pg'
// Import relativo (não `#shared/...`) de propósito: este arquivo também é
// carregado direto pela CLI do Better Auth (`yarn db:migrate`), fora do
// runtime/bundler do Nuxt, que é quem resolve o alias `#shared`.
import { normalizarCpf, validarCpf } from '../../shared/utils/cpf'
import { validarSenha, validarTelefone } from '../../shared/utils/validacao'
import { detectarAmeacaEntrada, MENSAGEM_AMEACA_ENTRADA } from '../../shared/utils/segurancaEntrada'

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

// Nome e telefone chegam direto no corpo de /sign-up/email e /update-user,
// então a validação precisa estar aqui e não só na tela.
function validarNomeETelefone(body: Record<string, unknown> | undefined) {
  const nome = body?.name
  const telefone = body?.telefone

  if (typeof nome === 'string') {
    if (nome.trim().length < 3) {
      throw new APIError('BAD_REQUEST', { message: 'Informe seu nome completo.' })
    }
    const ameaca = detectarAmeacaEntrada(nome)
    if (ameaca) {
      throw new APIError('BAD_REQUEST', { message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
    }
  }

  if (typeof telefone === 'string' && telefone.trim()) {
    const ameaca = detectarAmeacaEntrada(telefone)
    if (ameaca) {
      throw new APIError('BAD_REQUEST', { message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
    }
    if (!validarTelefone(telefone)) {
      throw new APIError('BAD_REQUEST', { message: 'Informe um telefone válido, com DDD.' })
    }
  }
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // Divergia do que a tela sempre pediu (6): o padrão da lib é 8. A regra
    // de composição (letra + número) é forçada no hook abaixo — a lib não
    // tem opção nativa pra isso, só tamanho.
    minPasswordLength: 6,
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
      // Preservado — não é usado pra restringir nada hoje (nenhuma tela
      // filtra por secretaria), só exibição e valor-padrão sugerido do
      // campo `responsavel` no painel. Ver auditoria desta sessão.
      secretaria: {
        type: 'string',
        required: false,
      },
      // Servidor criado pelo admin (ver server/api/admin/servidores/index.post.ts)
      // nasce com isso `true`; cidadão, Google e admin nunca passam por lá,
      // então sempre ficam com o default `false`. Zerado de volta pelo hook
      // `after` abaixo, assim que a troca de senha é concluída com sucesso —
      // nunca por um `primeiroAcesso: false` vindo do body do cliente.
      primeiroAcesso: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      // Mesmo nome/formato que o plugin `admin` nativo do Better Auth usaria
      // (ver auditoria) — sem habilitar o plugin em si, cuja autorização é
      // presa ao campo `role` dele, separado do nosso `papel` (ver
      // server/utils/exigirServidor.ts para onde isso é checado de verdade).
      banned: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  hooks: {
    // Roda antes de QUALQUER endpoint do Better Auth — cada bloco abaixo
    // filtra por `ctx.path` pra só se aplicar onde faz sentido.
    before: createAuthMiddleware(async (ctx) => {
      // Regra de senha (mín. 6 já é a lib, aqui só a composição: letra +
      // número, sem maiúscula/símbolo obrigatório) — vale tanto pro
      // cadastro tradicional quanto pra troca de senha do primeiro acesso
      // do servidor (ver app/pages/perfil.vue).
      if (ctx.path === '/sign-up/email' || ctx.path === '/change-password') {
        const senha = ctx.path === '/change-password' ? ctx.body?.newPassword : ctx.body?.password
        if (typeof senha === 'string' && !validarSenha(senha)) {
          throw new APIError('BAD_REQUEST', {
            message: 'A senha precisa ter pelo menos 6 caracteres, com letra e número.',
          })
        }
      }

      // CPF e secretaria não podem ser alterados depois do cadastro por
      // aqui: o CPF só entra pelo cadastro ou por /api/perfil/completar-cadastro.
      if (ctx.path === '/update-user') {
        if (ctx.body && (Object.hasOwn(ctx.body, 'cpf') || Object.hasOwn(ctx.body, 'secretaria'))) {
          throw new APIError('BAD_REQUEST', { message: 'Esses dados não podem ser alterados por aqui.' })
        }
        validarNomeETelefone(ctx.body)
        return
      }

      if (ctx.path !== '/sign-up/email')
        return

      validarNomeETelefone(ctx.body)

      // Cadastro de servidor pelo admin (server/api/admin/servidores/index.post.ts)
      // repassa o header de sessão do próprio admin autenticado ao chamar
      // `auth.api.signUpEmail` — nesse caso não exigimos CPF (servidor não
      // precisa disso pra operar o painel). Cadastro público de cidadão
      // nunca carrega essa sessão, então a exigência abaixo continua valendo
      // pra ele normalmente.
      const sessaoChamador = ctx.headers ? await auth.api.getSession({ headers: ctx.headers }).catch(() => null) : null
      if (sessaoChamador?.user.papel === 'admin') {
        return
      }

      if (ctx.body && Object.hasOwn(ctx.body, 'secretaria')) {
        throw new APIError('BAD_REQUEST', { message: 'Campo não permitido no cadastro.' })
      }

      // Garantia real: uma chamada direta a `POST /api/auth/sign-up/email`
      // sem CPF, com CPF inválido ou com CPF já usado é rejeitada aqui, não
      // importa o que a tela faça ou deixe de fazer.
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
    // Só roda depois que o endpoint terminou com sucesso — troca de senha
    // que falhou (ex.: senha sem número) nunca chega aqui, então
    // `primeiroAcesso` só zera quando a troca realmente aconteceu. Backend
    // é quem garante isso, nunca um `primeiroAcesso: false` vindo do body.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/change-password' || !ctx.headers)
        return

      const sessao = await auth.api.getSession({ headers: ctx.headers }).catch(() => null)
      if (sessao?.user.id) {
        await pool.query('update "user" set "primeiroAcesso" = false where id = $1', [sessao.user.id])
      }
    }),
  },
})
