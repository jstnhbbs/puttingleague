/**
 * Migrate data from local SQLite (data/puttingleague.db) to Turso.
 *
 * Prerequisites:
 *   1. Turso DB created and schema applied (turso db shell puttingleague < server/turso-schema.sql)
 *   2. Env: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (in .env.local or environment)
 *
 * Run from the server directory (so better-sqlite3 and @libsql/client are found):
 *   cd server
 *   npm install
 *   node migrate-sqlite-to-turso.js
 *
 * The script loads ../.env.local from the project root if present.
 */

const path = require('path')
const fs = require('fs')

// Load .env.local from project root if present
const envLocal = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envLocal)) {
  const content = fs.readFileSync(envLocal, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) {
      const key = m[1]
      const value = m[2].replace(/^["']|["']$/g, '').trim()
      if (!process.env[key]) process.env[key] = value
    }
  })
}

const Database = require('better-sqlite3')
const { createClient } = require('@libsql/client')

const sqlitePath = path.join(__dirname, 'data', 'puttingleague.db')

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Set them or add to .env.local in project root.')
  process.exit(1)
}

if (!fs.existsSync(sqlitePath)) {
  console.error('SQLite database not found at:', sqlitePath)
  process.exit(1)
}

const sqlite = new Database(sqlitePath, { readonly: true })
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  console.log('Reading from SQLite:', sqlitePath)
  console.log('Writing to Turso:', process.env.TURSO_DATABASE_URL?.replace(/\/\/[^@]+@/, '//***@'))

  // 1. Players (preserve id for FKs)
  const players = sqlite.prepare('SELECT id, name, display_order, created_at FROM players ORDER BY id').all()
  console.log('Players:', players.length)
  for (const row of players) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO players (id, name, display_order, created_at) VALUES (?, ?, ?, ?)`,
      args: [row.id, row.name, row.display_order ?? null, row.created_at ?? null],
    })
  }

  // 2. Seasons
  const seasons = sqlite.prepare('SELECT id, season_id, title, description, start_date, end_date, created_at FROM seasons ORDER BY id').all()
  console.log('Seasons:', seasons.length)
  for (const row of seasons) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO seasons (id, season_id, title, description, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.season_id,
        row.title,
        row.description ?? null,
        row.start_date ?? null,
        row.end_date ?? null,
        row.created_at ?? null,
      ],
    })
  }

  // 3. Season_players
  const seasonPlayers = sqlite
    .prepare('SELECT id, season_id, player_id, display_order FROM season_players ORDER BY id')
    .all()
  console.log('Season_players:', seasonPlayers.length)
  for (const row of seasonPlayers) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO season_players (id, season_id, player_id, display_order) VALUES (?, ?, ?, ?)`,
      args: [row.id, row.season_id, row.player_id, row.display_order ?? null],
    })
  }

  // 4. Scores
  const scores = sqlite
    .prepare(
      'SELECT id, season_id, player_id, week, score, is_formula, formula_text, created_at, updated_at FROM scores ORDER BY id'
    )
    .all()
  console.log('Scores:', scores.length)
  for (const row of scores) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO scores (id, season_id, player_id, week, score, is_formula, formula_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.season_id,
        row.player_id,
        row.week,
        row.score ?? null,
        row.is_formula ?? 0,
        row.formula_text ?? null,
        row.created_at ?? null,
        row.updated_at ?? null,
      ],
    })
  }

  // 5. Calculated_scores
  const calculated = sqlite
    .prepare(
      'SELECT id, season_id, player_id, calculation_type, value, calculated_at FROM calculated_scores ORDER BY id'
    )
    .all()
  console.log('Calculated_scores:', calculated.length)
  for (const row of calculated) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO calculated_scores (id, season_id, player_id, calculation_type, value, calculated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.season_id,
        row.player_id,
        row.calculation_type,
        row.value,
        row.calculated_at ?? null,
      ],
    })
  }

  sqlite.close()
  console.log('Done. Data migrated to Turso.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
