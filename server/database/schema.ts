import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo', { enum: ['cidadao', 'servidor'] }).notNull(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  cpf: text('cpf').unique(),
  telefone: text('telefone'),
  papel: text('papel', { enum: ['atendente', 'gestor'] }),
  secretaria: text('secretaria'),
  criadoEm: text('criado_em').notNull(),
})

export const solicitacoes = sqliteTable('solicitacoes', {
  protocolo: text('protocolo').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  categoria: text('categoria').notNull(),
  rua: text('rua').notNull(),
  numero: text('numero').notNull(),
  bairro: text('bairro').notNull(),
  complemento: text('complemento'),
  pontoReferencia: text('ponto_referencia'),
  descricao: text('descricao').notNull(),
  fotos: text('fotos'),
  risco: text('risco', { enum: ['sim', 'nao', 'nao_sei'] }),
  nome: text('nome').notNull(),
  email: text('email').notNull(),
  telefone: text('telefone').notNull(),
  cpf: text('cpf'),
  status: text('status', { enum: ['aberto', 'em_analise', 'encaminhado', 'em_execucao', 'concluido'] }).notNull(),
  criadoEm: text('criado_em').notNull(),
}, table => [
  index('solicitacoes_email_idx').on(table.email),
  index('solicitacoes_cpf_idx').on(table.cpf),
  index('solicitacoes_user_id_idx').on(table.userId),
])

export const historicoSolicitacao = sqliteTable('historico_solicitacao', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  protocolo: text('protocolo').notNull().references(() => solicitacoes.protocolo),
  status: text('status').notNull(),
  data: text('data').notNull(),
  mensagem: text('mensagem').notNull(),
}, table => [
  index('historico_protocolo_idx').on(table.protocolo),
])
