// Seed de desenvolvimento/demonstração — `yarn db:seed`.
//
// Cobre os DOIS lugares onde o app guarda dados hoje:
//   1. Postgres (Better Auth): contas de admin, servidores e cidadãos de demo
//      — tabelas "user" e "account" (as outras, "session"/"verification",
//      nascem vazias, ver db/schema.sql).
//   2. Storage de arquivos do Nitro (`./.data/solicitacoes`, ver nuxt.config.ts):
//      as solicitações, vindas de db/seed/solicitacoes.json (100 ocorrências
//      simuladas — todas as categorias, status, bairros e relatos).
//
// Idempotente: pode rodar quantas vezes quiser. Só mexe no que é do seed
// (ids `seed-*` no banco, protocolos do fixture nos arquivos) — nunca apaga
// nem sobrescreve conta ou solicitação criada de verdade.
//
// Precisa ser rodado onde o `.data` e o Postgres são alcançáveis (no Docker
// de dev: `docker compose exec dev yarn db:seed`). Requer `yarn db:migrate`
// antes (as tabelas precisam existir).
//
// Contas criadas (senha de TODAS: `Belem123` — só para dev, nunca em produção):
//   admin@ajudabelem.local            admin
//   servidor.obras@ajudabelem.local   servidor (Secretaria de Obras)
//   servidor.limpeza@ajudabelem.local servidor (Secretaria de Limpeza Urbana)
//   cidadao@ajudabelem.local          cidadão (CPF válido fictício)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword } from 'better-auth/crypto'
import pg from 'pg'

const aqui = dirname(fileURLToPath(import.meta.url))
const SENHA_PADRAO = 'Belem123'
const DIR_SOLICITACOES = resolve(process.env.SOLICITACOES_DIR ?? resolve(aqui, '../.data/solicitacoes'))

if (process.env.NODE_ENV === 'production') {
  console.error('Seed recusado: NODE_ENV=production (contas com senha conhecida).')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL (ver .env.example).')
  process.exit(1)
}

// Mesmo algoritmo de shared/utils/cpf.ts — gera CPF com dígitos verificadores
// válidos a partir de 9 dígitos-base, em vez de hardcodar números.
function cpfValido(base9) {
  const digito = (base) => {
    let soma = 0
    let peso = base.length + 1
    for (const d of base) soma += Number(d) * peso--
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = digito(base9)
  return `${base9}${d1}${digito(base9 + d1)}`
}

const USUARIOS = [
  { id: 'seed-admin', name: 'Administrador Ajuda Belém', email: 'admin@ajudabelem.local', papel: 'admin' },
  {
    id: 'seed-servidor-obras',
    name: 'Servidor Obras',
    email: 'servidor.obras@ajudabelem.local',
    papel: 'servidor',
    secretaria: 'Secretaria de Obras',
    telefone: '91999990001',
  },
  {
    id: 'seed-servidor-limpeza',
    name: 'Servidor Limpeza Urbana',
    email: 'servidor.limpeza@ajudabelem.local',
    papel: 'servidor',
    secretaria: 'Secretaria de Limpeza Urbana',
    telefone: '91999990002',
  },
  {
    id: 'seed-cidadao',
    name: 'Cidadão Demonstração',
    email: 'cidadao@ajudabelem.local',
    papel: 'cidadao',
    cpf: cpfValido('123456780'),
    telefone: '91999990003',
  },
]

async function semearUsuarios(pool) {
  const senhaHash = await hashPassword(SENHA_PADRAO)

  for (const u of USUARIOS) {
    // `on conflict (id)`: reexecutar atualiza a conta do seed (papel, senha)
    // sem tocar em nenhuma outra. Se o e-mail/CPF já pertencer a OUTRA conta
    // (id diferente), a constraint única do banco barra e o erro aparece —
    // melhor do que sobrescrever uma conta real.
    await pool.query(
      `insert into "user" ("id","name","email","emailVerified","papel","cpf","telefone","secretaria","primeiroAcesso","banned")
       values ($1,$2,$3,true,$4,$5,$6,$7,false,false)
       on conflict ("id") do update set
         "name" = excluded."name", "papel" = excluded."papel", "cpf" = excluded."cpf",
         "telefone" = excluded."telefone", "secretaria" = excluded."secretaria",
         "primeiroAcesso" = false, "banned" = false, "updatedAt" = now()`,
      [u.id, u.name, u.email, u.papel, u.cpf ?? null, u.telefone ?? null, u.secretaria ?? null],
    )
    await pool.query(
      `insert into "account" ("id","accountId","providerId","userId","password","updatedAt")
       values ($1,$2,'credential',$2,$3,now())
       on conflict ("id") do update set "password" = excluded."password", "updatedAt" = now()`,
      [`${u.id}-credential`, u.id, senhaHash],
    )
  }
  console.log(`✔ ${USUARIOS.length} contas (user + account) — senha: ${SENHA_PADRAO}`)
}

async function semearSolicitacoes() {
  const solicitacoes = JSON.parse(await readFile(resolve(aqui, 'seed/solicitacoes.json'), 'utf8'))
  await mkdir(DIR_SOLICITACOES, { recursive: true })

  // Arquivo `<protocolo>.json` — o mesmo nome que `useStorage('solicitacoes')`
  // usa (ver server/api/solicitacoes/index.post.ts). Escrever direto no
  // diretório evita precisar subir o Nitro só para semear.
  for (const s of solicitacoes) {
    await writeFile(resolve(DIR_SOLICITACOES, `${s.protocolo}.json`), JSON.stringify(s, null, 2))
  }
  console.log(`✔ ${solicitacoes.length} solicitações em ${DIR_SOLICITACOES}`)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  await semearUsuarios(pool)
  await semearSolicitacoes()
}
finally {
  await pool.end()
}
