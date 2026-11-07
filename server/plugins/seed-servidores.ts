import { eq } from 'drizzle-orm'

const CONTAS_DEMO = [
  { nome: 'Ana Ferreira', email: 'ana.atendente@ajudabelem.pa.gov.br', papel: 'atendente' as const, secretaria: 'Secretaria de Infraestrutura', senha: 'atendente123' },
  { nome: 'Carlos Mendes', email: 'carlos.gestor@ajudabelem.pa.gov.br', papel: 'gestor' as const, secretaria: 'Secretaria de Infraestrutura', senha: 'gestor123' },
]

export default defineNitroPlugin(async () => {
  if (process.env.SEED_DEMO_USERS !== 'true') {
    return
  }

  const jaExiste = db.select().from(users).where(eq(users.tipo, 'servidor')).get()
  if (jaExiste) {
    return
  }

  const criadoEm = new Date().toISOString()

  for (const conta of CONTAS_DEMO) {
    const senhaHash = await hashPassword(conta.senha)
    db.insert(users).values({
      tipo: 'servidor',
      nome: conta.nome,
      email: conta.email,
      senhaHash,
      papel: conta.papel,
      secretaria: conta.secretaria,
      criadoEm,
    }).run()
  }

  console.warn('[seed] Contas de servidor de demonstração criadas:')
  for (const conta of CONTAS_DEMO) {
    console.warn(`  ${conta.email} / ${conta.senha}`)
  }
})
