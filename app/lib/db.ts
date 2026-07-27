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

export interface SeasonWithPlayers extends SeasonSummary {
  players: SeasonPlayer[]
}

export interface PlayerSummary {
  id: number
  name: string
  displayOrder: number
}

export type EditableSeasonInput = {
  id: string
  title: string
  description: string
  sheetUrl: string
  status: SeasonStatus
  playoffFormat: PlayoffFormat
  weeksCount: number
  dropLowestCount: number
  champion: string | null
  players: Array<{
    name: string
    displayOrder: number
  }>
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
let catalogReady = false
let catalogPromise: Promise<void> | null = null

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
  if (catalogReady) return
  if (catalogPromise) return catalogPromise

  catalogPromise = syncSeasonCatalog(db)
    .then(() => {
      catalogReady = true
    })
    .catch((error) => {
      catalogPromise = null
      throw error
    })

  return catalogPromise
}

async function syncSeasonCatalog(db: ReturnType<typeof getDb>): Promise<void> {
  await ensureSeasonSchema(db)

  if (await isSeasonCatalogCurrent(db)) return

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

    await ensureSeasonPlayerRelationships(db, season.season_id, season.players)
  }
}

async function isSeasonCatalogCurrent(db: ReturnType<typeof getDb>): Promise<boolean> {
  const result = await db.execute(
    `SELECT
       (SELECT COUNT(*) FROM players WHERE name IN ('Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad', 'Tyler', 'Graham')) AS player_count,
       (SELECT COUNT(*) FROM seasons WHERE season_id IN ('season1', 'season2', 'season3', 'season4', 'season5', 'season6', 'season7', 'season8')) AS season_count`
  )
  const row = (result.rows as DbRow[])[0]

  return (
    Number(row?.player_count ?? 0) === PLAYER_CATALOG.length &&
    Number(row?.season_count ?? 0) === SEASON_SEEDS.length
  )
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

export async function getSeasonsWithPlayers(db: ReturnType<typeof getDb>): Promise<SeasonWithPlayers[]> {
  await ensureSeasonCatalog(db)

  const result = await db.execute(
    `SELECT s.season_id, s.title, s.description, s.status, s.sheet_url, s.playoff_format,
            s.weeks_count, s.drop_lowest_count, champion.name AS champion,
            p.id AS player_id, p.name AS player_name, sp.display_order AS player_display_order
     FROM seasons s
     LEFT JOIN players champion ON champion.id = s.champion_player_id
     LEFT JOIN season_players sp ON sp.season_id = s.id
     LEFT JOIN players p ON p.id = sp.player_id
     ORDER BY CAST(REPLACE(s.season_id, 'season', '') AS INTEGER), sp.display_order`
  )

  return rowsToSeasonsWithPlayers(result.rows as DbRow[])
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

export async function getSeasonWithPlayers(
  db: ReturnType<typeof getDb>,
  seasonId: string
): Promise<SeasonWithPlayers | null> {
  await ensureSeasonCatalog(db)

  const result = await db.execute(
    `SELECT s.season_id, s.title, s.description, s.status, s.sheet_url, s.playoff_format,
            s.weeks_count, s.drop_lowest_count, champion.name AS champion,
            p.id AS player_id, p.name AS player_name, sp.display_order AS player_display_order
     FROM seasons s
     LEFT JOIN players champion ON champion.id = s.champion_player_id
     LEFT JOIN season_players sp ON sp.season_id = s.id
     LEFT JOIN players p ON p.id = sp.player_id
     WHERE s.season_id = ?
     ORDER BY sp.display_order`,
    [seasonId]
  )

  return rowsToSeasonsWithPlayers(result.rows as DbRow[])[0] ?? null
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

export async function getPlayers(db: ReturnType<typeof getDb>): Promise<PlayerSummary[]> {
  await ensureSeasonCatalog(db)

  const result = await db.execute('SELECT id, name, display_order FROM players ORDER BY display_order, name')
  return (result.rows as DbRow[]).map((row) => ({
    id: Number(row.id),
    name: String(row.name ?? ''),
    displayOrder: Number(row.display_order ?? 0),
  }))
}

export async function saveEditableSeason(
  db: ReturnType<typeof getDb>,
  currentSeasonId: string,
  input: EditableSeasonInput
): Promise<SeasonWithPlayers> {
  await ensureSeasonCatalog(db)

  const seasonIdChanged = currentSeasonId !== input.id
  if (seasonIdChanged) {
    const existing = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [input.id])
    if (existing.rows.length > 0) {
      throw new Error(`Season ${input.id} already exists`)
    }
  }

  if (input.status === 'current') {
    await db.execute("UPDATE seasons SET status = 'completed' WHERE season_id <> ?", [currentSeasonId])
  }

  const championId = input.champion ? await getOrCreatePlayerId(db, input.champion) : null
  await db.execute(
    `UPDATE seasons
     SET season_id = ?, title = ?, description = ?, status = ?, champion_player_id = ?, sheet_url = ?,
         playoff_format = ?, weeks_count = ?, drop_lowest_count = ?
     WHERE season_id = ?`,
    [
      input.id,
      input.title,
      input.description,
      input.status,
      championId,
      input.sheetUrl,
      input.playoffFormat,
      input.weeksCount,
      input.dropLowestCount,
      currentSeasonId,
    ]
  )

  const seasonResult = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [input.id])
  const seasonRow = (seasonResult.rows as DbRow[])[0]
  if (!seasonRow) throw new Error(`Season ${input.id} was not found`)
  const seasonDbId = Number(seasonRow.id)

  await db.execute('DELETE FROM season_players WHERE season_id = ?', [seasonDbId])
  for (const player of input.players) {
    const playerId = await getOrCreatePlayerId(db, player.name)
    await db.execute(
      `INSERT INTO season_players (season_id, player_id, display_order)
       VALUES (?, ?, ?)
       ON CONFLICT(season_id, player_id) DO UPDATE SET display_order = excluded.display_order`,
      [seasonDbId, playerId, player.displayOrder]
    )
  }

  const season = await getSeasonWithPlayers(db, input.id)
  if (!season) throw new Error(`Season ${input.id} could not be loaded`)
  return season
}

export async function duplicateSeason(
  db: ReturnType<typeof getDb>,
  sourceSeasonId: string,
  targetSeasonNumber?: number
): Promise<SeasonWithPlayers> {
  await ensureSeasonCatalog(db)

  const source = await getSeasonWithPlayers(db, sourceSeasonId)
  if (!source) throw new Error(`Season ${sourceSeasonId} was not found`)

  const nextNumber = targetSeasonNumber ?? (await getNextSeasonNumber(db))
  const targetSeasonId = `season${nextNumber}`
  const existing = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [targetSeasonId])
  if (existing.rows.length > 0) throw new Error(`Season ${nextNumber} already exists`)

  await db.execute("UPDATE seasons SET status = 'completed'")
  await db.execute(
    `INSERT INTO seasons
     (season_id, title, description, status, champion_player_id, sheet_url, playoff_format, weeks_count, drop_lowest_count)
     VALUES (?, ?, ?, 'current', NULL, ?, ?, ?, ?)`,
    [
      targetSeasonId,
      `Season ${nextNumber}`,
      'Current season',
      source.sheetUrl,
      source.playoffFormat,
      source.weeksCount,
      source.dropLowestCount,
    ]
  )

  const seasonResult = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [targetSeasonId])
  const seasonDbId = Number((seasonResult.rows as DbRow[])[0]?.id)
  for (const player of source.players) {
    await db.execute(
      `INSERT INTO season_players (season_id, player_id, display_order)
       VALUES (?, ?, ?)`,
      [seasonDbId, player.id, player.displayOrder]
    )
  }

  const season = await getSeasonWithPlayers(db, targetSeasonId)
  if (!season) throw new Error(`Season ${targetSeasonId} could not be loaded`)
  return season
}

async function getNextSeasonNumber(db: ReturnType<typeof getDb>): Promise<number> {
  const result = await db.execute(
    `SELECT MAX(CAST(REPLACE(season_id, 'season', '') AS INTEGER)) AS max_season_number
     FROM seasons
     WHERE season_id GLOB 'season[0-9]*'`
  )
  const row = (result.rows as DbRow[])[0]
  return Number(row?.max_season_number ?? 0) + 1
}

async function getOrCreatePlayerId(db: ReturnType<typeof getDb>, playerName: string): Promise<number> {
  const trimmedName = playerName.trim()
  if (!trimmedName) throw new Error('Player name is required')

  const existing = await db.execute('SELECT id FROM players WHERE lower(name) = lower(?)', [trimmedName])
  const existingRow = (existing.rows as DbRow[])[0]
  if (existingRow) return Number(existingRow.id)

  const orderResult = await db.execute('SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM players')
  const nextOrder = Number((orderResult.rows as DbRow[])[0]?.next_order ?? 0)
  await db.execute('INSERT INTO players (name, display_order) VALUES (?, ?)', [trimmedName, nextOrder])

  const created = await db.execute('SELECT id FROM players WHERE lower(name) = lower(?)', [trimmedName])
  const createdRow = (created.rows as DbRow[])[0]
  if (!createdRow) throw new Error(`Player ${trimmedName} could not be created`)
  return Number(createdRow.id)
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

function rowsToSeasonsWithPlayers(rows: DbRow[]): SeasonWithPlayers[] {
  const seasons = new Map<string, SeasonWithPlayers>()

  for (const row of rows) {
    const summary = rowToSeasonSummary(row)
    const existing = seasons.get(summary.id)
    const season = existing ?? { ...summary, players: [] }
    if (!existing) seasons.set(summary.id, season)

    if (row.player_id != null && row.player_name != null) {
      season.players.push({
        id: Number(row.player_id),
        name: String(row.player_name),
        displayOrder: Number(row.player_display_order ?? season.players.length),
      })
    }
  }

  return Array.from(seasons.values())
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
