// Lista só contas com papel = servidor — nunca cidadão, nunca outro admin
// (ver auditoria: "admin não precisa aparecer como servidor gerenciável").
// SELECT direto porque não há API oficial do Better Auth pra listar
// filtrando por um additionalField nosso sem o plugin admin (ver decisão em
// server/utils/auth.ts) — é leitura simples, sem risco de injeção (não usa
// nenhum valor vindo do cliente na query).
export default defineEventHandler(async (event) => {
  await exigirAdmin(event)

  const { rows } = await pool.query(
    `select id, name, email, telefone, secretaria, "primeiroAcesso", banned, "createdAt"
     from "user"
     where papel = 'servidor'
     order by "createdAt" desc`,
  )

  return rows.map(row => ({
    id: row.id,
    nome: row.name,
    email: row.email,
    telefone: row.telefone,
    secretaria: row.secretaria,
    primeiroAcesso: row.primeiroAcesso,
    banned: row.banned,
    criadoEm: row.createdAt,
  }))
})
