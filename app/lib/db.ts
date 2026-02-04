/**
 * Turso (libSQL) client and shared helpers for API routes.
 * Use only on the server (API routes / server components).
 */

import { createClient, type Client } from '@libsql/client'

const EARLY_SEASONS = ['season1', 'season2', 'season3', 'season4']
const PLAYER_NAMES = {
  early: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad'],
  late: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Tyler', 'Brad'],
  season6: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Graham', 'Tyler', 'Brad'],
} as const

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

/** Returns the list of player names for a season (for API routes / display order). */
export function getPlayerListForSeason(seasonId: string): readonly string[] {
  if (seasonId === 'season6') return PLAYER_NAMES.season6
  if (EARLY_SEASONS.includes(seasonId)) return PLAYER_NAMES.early
  return PLAYER_NAMES.late
}

export { EARLY_SEASONS, PLAYER_NAMES }

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
  const playerList =
    seasonId === 'season6'
      ? PLAYER_NAMES.season6
      : EARLY_SEASONS.includes(seasonId)
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

export function rowToObject<T extends DbRow>(row: DbRow): T {
  return row as T
}
