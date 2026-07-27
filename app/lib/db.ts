/**
 * Turso (libSQL) client and shared helpers for API routes.
 * Use only on the server (API routes / server components).
 */

import { createClient, type Client } from '@libsql/client'
import { isEightPlayerSeason } from './seasons'

const EARLY_SEASONS = ['season1', 'season2', 'season3', 'season4'] as const
const PLAYER_NAMES = {
  early: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad'],
  late: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Tyler', 'Brad'],
  season6: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Graham', 'Tyler', 'Brad'],
} as const

const SEASON_CATALOG: { season_id: string; title: string; description: string }[] = [
  { season_id: 'season1', title: 'Season 1', description: '🏆 Hunter Thomas' },
  { season_id: 'season2', title: 'Season 2', description: '🏆 Hunter Thomas' },
  { season_id: 'season3', title: 'Season 3', description: '🏆 Hunter Thomas' },
  { season_id: 'season4', title: 'Season 4', description: '🏆 Trevor Staub' },
  { season_id: 'season5', title: 'Season 5', description: '🏆 Trevor Staub' },
  { season_id: 'season6', title: 'Season 6', description: '🏆 Hunter Thomas' },
  { season_id: 'season7', title: 'Season 7', description: 'Current season' },
]

let client: Client | null = null

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    if (!url || !authToken) {
      throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
    }
    client = createClient({ url, authToken })
  }
  return client
}

export function isTursoConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)
}

/**
 * Inserts/updates canonical season rows (titles, champion lines). Safe to call on each API request.
 */
export async function ensureSeasonCatalog(db: ReturnType<typeof getDb>): Promise<void> {
  for (const s of SEASON_CATALOG) {
    await db.execute(
      'INSERT OR IGNORE INTO seasons (season_id, title, description) VALUES (?, ?, ?)',
      [s.season_id, s.title, s.description]
    )
    await db.execute('UPDATE seasons SET title = ?, description = ? WHERE season_id = ?', [
      s.title,
      s.description,
      s.season_id,
    ])
  }
}

/** Returns the list of player names for a season (for API routes / display order). */
export function getPlayerListForSeason(seasonId: string): readonly string[] {
  if (isEightPlayerSeason(seasonId)) return PLAYER_NAMES.season6
  if (EARLY_SEASONS.includes(seasonId as (typeof EARLY_SEASONS)[number])) return PLAYER_NAMES.early
  return PLAYER_NAMES.late
}

export { EARLY_SEASONS, PLAYER_NAMES }
export { isEightPlayerSeason } from './seasons'

export type CellKeyRelational = {
  row: number
  col: number
  playerName: string
  week: number | null
  isTotal: boolean
  isTotalMinusTwoLowest: boolean
}

export function cellKeyToRelational(
  cellKey: string,
  seasonId: string
): CellKeyRelational | null {
  const [rowStr, colStr] = cellKey.split('-')
  const row = parseInt(rowStr, 10)
  const col = parseInt(colStr, 10)
  if (Number.isNaN(row) || Number.isNaN(col)) return null
  const playerList = isEightPlayerSeason(seasonId)
    ? PLAYER_NAMES.season6
    : EARLY_SEASONS.includes(seasonId as (typeof EARLY_SEASONS)[number])
      ? PLAYER_NAMES.early
      : PLAYER_NAMES.late
  if (col >= playerList.length) return null
  return {
    row,
    col,
    playerName: playerList[col],
    week: row >= 0 && row <= 9 ? row + 1 : null,
    isTotal: row === 10,
    isTotalMinusTwoLowest: row === 11,
  }
}

export function relationalToCellKey(row: number, col: number): string {
  return `${row}-${col}`
}

/** Row shape from Turso (column names as keys) */
export type DbRow = Record<string, unknown>
