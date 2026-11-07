import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const caminhoBanco = process.env.DB_PATH || '.data/ajuda-belem.db'
const pasta = dirname(caminhoBanco)
if (!existsSync(pasta)) {
  mkdirSync(pasta, { recursive: true })
}

const sqlite = new Database(caminhoBanco)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: process.env.DB_MIGRATIONS_PATH || 'server/database/migrations' })
