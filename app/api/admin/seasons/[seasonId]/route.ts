import { NextRequest, NextResponse } from 'next/server'
import {
  getDb,
  isTursoConfigured,
  saveEditableSeason,
  type EditableSeasonInput,
  type PlayoffFormat,
  type SeasonStatus,
} from '../../../../lib/db'
import { isAdminRequest, unauthorizedResponse } from '../../../../lib/adminSession'

const PLAYOFF_FORMATS = new Set<PlayoffFormat>(['six_player', 'seven_player', 'eight_player'])
const SEASON_STATUSES = new Set<SeasonStatus>(['completed', 'current'])

type SeasonUpdateBody = Partial<EditableSeasonInput>

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { seasonId } = await params
  const body = (await request.json().catch(() => null)) as SeasonUpdateBody | null
  const input = normalizeSeasonInput(body)

  if (!input) {
    return NextResponse.json({ error: 'Invalid season data' }, { status: 400 })
  }

  try {
    const season = await saveEditableSeason(getDb(), seasonId, input)
    return NextResponse.json({ season })
  } catch (error) {
    console.error('PUT /api/admin/seasons/[seasonId] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save season' },
      { status: 500 }
    )
  }
}

function normalizeSeasonInput(body: SeasonUpdateBody | null): EditableSeasonInput | null {
  if (!body) return null

  const id = normalizeSeasonId(body.id)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const sheetUrl = typeof body.sheetUrl === 'string' ? body.sheetUrl.trim() : ''
  const status = body.status
  const playoffFormat = body.playoffFormat
  const weeksCount = Number(body.weeksCount)
  const dropLowestCount = Number(body.dropLowestCount)
  const champion = typeof body.champion === 'string' && body.champion.trim() ? body.champion.trim() : null
  const players = Array.isArray(body.players)
    ? body.players
        .map((player, index) => ({
          name: typeof player.name === 'string' ? player.name.trim() : '',
          displayOrder: Number.isFinite(Number(player.displayOrder)) ? Number(player.displayOrder) : index,
        }))
        .filter((player) => player.name)
    : []

  const uniquePlayers = new Set(players.map((player) => player.name.toLowerCase()))
  if (
    !id ||
    !title ||
    !SEASON_STATUSES.has(status as SeasonStatus) ||
    !PLAYOFF_FORMATS.has(playoffFormat as PlayoffFormat) ||
    !Number.isInteger(weeksCount) ||
    weeksCount < 1 ||
    weeksCount > 20 ||
    !Number.isInteger(dropLowestCount) ||
    dropLowestCount < 0 ||
    dropLowestCount >= weeksCount ||
    players.length === 0 ||
    uniquePlayers.size !== players.length
  ) {
    return null
  }

  return {
    id,
    title,
    description,
    sheetUrl,
    status: status as SeasonStatus,
    playoffFormat: playoffFormat as PlayoffFormat,
    weeksCount,
    dropLowestCount,
    champion,
    players: players.map((player, index) => ({ ...player, displayOrder: index })),
  }
}

function normalizeSeasonId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  if (/^season\d+$/.test(trimmed)) return trimmed

  const numeric = Number(trimmed)
  if (Number.isInteger(numeric) && numeric > 0) return `season${numeric}`

  return null
}
