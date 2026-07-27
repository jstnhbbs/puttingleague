/**
 * Turso (libSQL) client and shared helpers for API routes.
 * Use only on the server (API routes / server components).
 */

import { createClient, type Client } from '@libsql/client'

export const CURRENT_SEASON_ID = 'season8'

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=154588723&single=true'

export type PlayoffFormat = 'six_player' | 'seven_player' | 'eight_player'
export type SeasonStatus = 'completed' | 'current'

export interface SeasonSummary {
  id: string
  title: string
  description: string
  sheetUrl: string
  status: SeasonStatus
  playoffFormat: PlayoffFormat
  weeksCount: number
  dropLowestCount: number
  champion: string | null
}

export interface SeasonPlayer {
  id: number
  name: string
  displayOrder: number
}

type SeedSeason = {
  season_id: string
  title: string
  description: string
  status: SeasonStatus
  champion: string | null
  sheet_url: string
  playoff_format: PlayoffFormat
  weeks_count: number
  drop_lowest_count: number
  players: readonly string[]
}

const PLAYER_CATALOG = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad', 'Tyler', 'Graham'] as const
const ROSTERS = {
  early: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad'],
  season5: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Tyler', 'Brad'],
  eightPlayer: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Graham', 'Tyler', 'Brad'],
} as const

export const SEASON_SEEDS: readonly SeedSeason[] = [
  {
    season_id: 'season1',
    title: 'Season 1',
    description: '🏆 Hunter Thomas',
    status: 'completed',
    champion: 'Hunter',
    sheet_url:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1134880669&single=true',
    playoff_format: 'six_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.early,
  },
  {
    season_id: 'season2',
    title: 'Season 2',
    description: '🏆 Hunter Thomas',
    status: 'completed',
    champion: 'Hunter',
    sheet_url:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1204258671&single=true',
    playoff_format: 'six_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.early,
  },
  {
    season_id: 'season3',
    title: 'Season 3',
    description: '🏆 Hunter Thomas',
    status: 'completed',
    champion: 'Hunter',
    sheet_url:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=0&single=true',
    playoff_format: 'six_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.early,
  },
  {
    season_id: 'season4',
    title: 'Season 4',
    description: '🏆 Trevor Staub',
    status: 'completed',
    champion: 'Trevor',
    sheet_url:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1919204812&single=true',
    playoff_format: 'six_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.early,
  },
  {
    season_id: 'season5',
    title: 'Season 5',
    description: '🏆 Trevor Staub',
    status: 'completed',
    champion: 'Trevor',
    sheet_url:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=643864506&single=true',
    playoff_format: 'seven_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.season5,
  },
  {
    season_id: 'season6',
    title: 'Season 6',
    description: '🏆 Hunter Thomas',
    status: 'completed',
    champion: 'Hunter',
    sheet_url: DEFAULT_SHEET_URL,
    playoff_format: 'eight_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.eightPlayer,
  },
  {
    season_id: 'season7',
    title: 'Season 7',
    description: '🏆 Hunter Thomas',
    status: 'completed',
    champion: 'Hunter',
    sheet_url: DEFAULT_SHEET_URL,
    playoff_format: 'eight_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.eightPlayer,
  },
  {
    season_id: 'season8',
    title: 'Season 8',
    description: 'Current season',
    status: 'current',
    champion: null,
    sheet_url: DEFAULT_SHEET_URL,
    playoff_format: 'eight_player',
    weeks_count: 10,
    drop_lowest_count: 2,
    players: ROSTERS.eightPlayer,
  },
]

let client: Client | null = null
let schemaReady = false

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

async function addColumnIfMissing(db: ReturnType<typeof getDb>, statement: string): Promise<void> {
  try {
    await db.execute(statement)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.toLowerCase().includes('duplicate column')) throw error
  }
}

export async function ensureSeasonSchema(db: ReturnType<typeof getDb>): Promise<void> {
  if (schemaReady) return

  await addColumnIfMissing(db, "ALTER TABLE seasons ADD COLUMN status TEXT DEFAULT 'completed'")
  await addColumnIfMissing(db, 'ALTER TABLE seasons ADD COLUMN champion_player_id INTEGER')
  await addColumnIfMissing(db, 'ALTER TABLE seasons ADD COLUMN sheet_url TEXT')
  await addColumnIfMissing(db, "ALTER TABLE seasons ADD COLUMN playoff_format TEXT DEFAULT 'six_player'")
  await addColumnIfMissing(db, 'ALTER TABLE seasons ADD COLUMN weeks_count INTEGER DEFAULT 10')
  await addColumnIfMissing(db, 'ALTER TABLE seasons ADD COLUMN drop_lowest_count INTEGER DEFAULT 2')

  schemaReady = true
}

export function getFallbackSeasons(): SeasonSummary[] {
  return SEASON_SEEDS.map((season) => ({
    id: season.season_id,
    title: season.title,
    description: season.description,
    sheetUrl: season.sheet_url,
    status: season.status,
    playoffFormat: season.playoff_format,
    weeksCount: season.weeks_count,
    dropLowestCount: season.drop_lowest_count,
    champion: season.champion,
  }))
}

export function getFallbackSeason(seasonId: string): SeasonSummary | null {
  return getFallbackSeasons().find((season) => season.id === seasonId) ?? null
}

export function getFallbackSeasonPlayers(seasonId: string): SeasonPlayer[] {
  const seed = SEASON_SEEDS.find((season) => season.season_id === seasonId)
  return [...(seed?.players ?? ROSTERS.eightPlayer)].map((name, displayOrder) => ({
    id: displayOrder,
    name,
    displayOrder,
  }))
}

export function getCurrentSeasonId(): string {
  return getFallbackSeasons().find((season) => season.status === 'current')?.id ?? CURRENT_SEASON_ID
}

/**
 * Inserts/updates canonical players, seasons, and season-player display order.
 * Safe to call on each API request.
 */
export async function ensureSeasonCatalog(db: ReturnType<typeof getDb>): Promise<void> {
  await ensureSeasonSchema(db)

  for (let displayOrder = 0; displayOrder < PLAYER_CATALOG.length; displayOrder++) {
    const playerName = PLAYER_CATALOG[displayOrder]
    await db.execute('INSERT OR IGNORE INTO players (name, display_order) VALUES (?, ?)', [
      playerName,
      displayOrder,
    ])
    await db.execute('UPDATE players SET display_order = ? WHERE name = ?', [displayOrder, playerName])
  }

  for (const season of SEASON_SEEDS) {
    const championResult = season.champion
      ? await db.execute('SELECT id FROM players WHERE name = ?', [season.champion])
      : null
    const championId = championResult ? ((championResult.rows as DbRow[])[0]?.id as number | undefined) ?? null : null

    await db.execute(
      `INSERT OR IGNORE INTO seasons
       (season_id, title, description, status, champion_player_id, sheet_url, playoff_format, weeks_count, drop_lowest_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        season.season_id,
        season.title,
        season.description,
        season.status,
        championId,
        season.sheet_url,
        season.playoff_format,
        season.weeks_count,
        season.drop_lowest_count,
      ]
    )
    await db.execute(
      `UPDATE seasons
       SET title = ?, description = ?, status = ?, champion_player_id = ?, sheet_url = ?,
           playoff_format = ?, weeks_count = ?, drop_lowest_count = ?
       WHERE season_id = ?`,
      [
        season.title,
        season.description,
        season.status,
        championId,
        season.sheet_url,
        season.playoff_format,
        season.weeks_count,
        season.drop_lowest_count,
        season.season_id,
      ]
    )

    await ensureSeasonPlayerRelationships(db, season.season_id, season.players)
  }
}

export async function ensureSeasonPlayerRelationships(
  db: ReturnType<typeof getDb>,
  seasonId: string,
  fallbackPlayers?: readonly string[]
): Promise<void> {
  const seed = SEASON_SEEDS.find((season) => season.season_id === seasonId)
  const playerNames = fallbackPlayers ?? seed?.players ?? ROSTERS.eightPlayer

  const seasonResult = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [seasonId])
  const seasonRow = (seasonResult.rows as DbRow[])[0]
  if (!seasonRow) return
  const seasonDbId = seasonRow.id as number

  for (let displayOrder = 0; displayOrder < playerNames.length; displayOrder++) {
    const playerName = playerNames[displayOrder]
    const playerResult = await db.execute('SELECT id FROM players WHERE name = ?', [playerName])
    const playerRow = (playerResult.rows as DbRow[])[0]
    if (!playerRow) continue
    const playerId = playerRow.id as number

    await db.execute(
      `INSERT INTO season_players (season_id, player_id, display_order)
       VALUES (?, ?, ?)
       ON CONFLICT(season_id, player_id) DO UPDATE SET display_order = excluded.display_order`,
      [seasonDbId, playerId, displayOrder]
    )
  }
}

export async function getSeasonPlayers(
  db: ReturnType<typeof getDb>,
  seasonId: string
): Promise<SeasonPlayer[]> {
  await ensureSeasonCatalog(db)

  const result = await db.execute(
    `SELECT p.id, p.name, sp.display_order
     FROM seasons s
     JOIN season_players sp ON sp.season_id = s.id
     JOIN players p ON p.id = sp.player_id
     WHERE s.season_id = ?
     ORDER BY sp.display_order`,
    [seasonId]
  )

  return (result.rows as DbRow[]).map((row) => ({
    id: row.id as number,
    name: String(row.name ?? ''),
    displayOrder: row.display_order as number,
  }))
}

export async function getSeasonSummaries(db: ReturnType<typeof getDb>): Promise<SeasonSummary[]> {
  await ensureSeasonCatalog(db)

  const result = await db.execute(
    `SELECT s.season_id, s.title, s.description, s.status, s.sheet_url, s.playoff_format,
            s.weeks_count, s.drop_lowest_count, p.name AS champion
     FROM seasons s
     LEFT JOIN players p ON p.id = s.champion_player_id
     ORDER BY CAST(REPLACE(s.season_id, 'season', '') AS INTEGER)`
  )

  return (result.rows as DbRow[]).map(rowToSeasonSummary)
}

export async function getSeasonSummary(
  db: ReturnType<typeof getDb>,
  seasonId: string
): Promise<SeasonSummary | null> {
  await ensureSeasonCatalog(db)

  const result = await db.execute(
    `SELECT s.season_id, s.title, s.description, s.status, s.sheet_url, s.playoff_format,
            s.weeks_count, s.drop_lowest_count, p.name AS champion
     FROM seasons s
     LEFT JOIN players p ON p.id = s.champion_player_id
     WHERE s.season_id = ?`,
    [seasonId]
  )
  const row = (result.rows as DbRow[])[0]
  return row ? rowToSeasonSummary(row) : null
}

export async function getCurrentSeason(db: ReturnType<typeof getDb>): Promise<SeasonSummary | null> {
  await ensureSeasonCatalog(db)

  const result = await db.execute(
    `SELECT s.season_id, s.title, s.description, s.status, s.sheet_url, s.playoff_format,
            s.weeks_count, s.drop_lowest_count, p.name AS champion
     FROM seasons s
     LEFT JOIN players p ON p.id = s.champion_player_id
     WHERE s.status = 'current'
     ORDER BY CAST(REPLACE(s.season_id, 'season', '') AS INTEGER) DESC
     LIMIT 1`
  )
  const row = (result.rows as DbRow[])[0]
  return row ? rowToSeasonSummary(row) : null
}

function rowToSeasonSummary(row: DbRow): SeasonSummary {
  return {
    id: String(row.season_id ?? ''),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    sheetUrl: String(row.sheet_url ?? ''),
    status: (String(row.status ?? 'completed') === 'current' ? 'current' : 'completed') as SeasonStatus,
    playoffFormat: String(row.playoff_format ?? 'six_player') as PlayoffFormat,
    weeksCount: Number(row.weeks_count ?? 10),
    dropLowestCount: Number(row.drop_lowest_count ?? 2),
    champion: row.champion != null ? String(row.champion) : null,
  }
}

export type CellKeyRelational = {
  row: number
  col: number
  playerName: string
  week: number | null
  isTotal: boolean
  isTotalMinusTwoLowest: boolean
}

export async function cellKeyToRelational(
  db: ReturnType<typeof getDb>,
  cellKey: string,
  seasonId: string
): Promise<CellKeyRelational | null> {
  const [rowStr, colStr] = cellKey.split('-')
  const row = parseInt(rowStr, 10)
  const col = parseInt(colStr, 10)
  if (Number.isNaN(row) || Number.isNaN(col)) return null

  const playerList = await getSeasonPlayers(db, seasonId)
  const player = playerList[col]
  if (!player) return null
  const season = (await getSeasonSummary(db, seasonId)) ?? getFallbackSeason(seasonId)
  const weeksCount = season?.weeksCount ?? 10
  const totalRowIndex = weeksCount
  const dropsRowIndex = weeksCount + 1

  return {
    row,
    col,
    playerName: player.name,
    week: row >= 0 && row < weeksCount ? row + 1 : null,
    isTotal: row === totalRowIndex,
    isTotalMinusTwoLowest: row === dropsRowIndex,
  }
}

export function relationalToCellKey(row: number, col: number): string {
  return `${row}-${col}`
}

/** Row shape from Turso (column names as keys) */
export type DbRow = Record<string, unknown>
