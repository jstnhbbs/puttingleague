import { NextRequest, NextResponse } from 'next/server'
import {
  getDb,
  getFallbackSeason,
  getFallbackSeasonPlayers,
  getSeasonWithPlayers,
  isTursoConfigured,
} from '../../../lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params

  if (!isTursoConfigured()) {
    const season = getFallbackSeason(seasonId)
    return NextResponse.json(
      season ? { season: { ...season, players: getFallbackSeasonPlayers(season.id) } } : { season: null },
      { status: season ? 200 : 404 }
    )
  }

  try {
    const db = getDb()
    const season = await getSeasonWithPlayers(db, seasonId)
    return NextResponse.json(season ? { season } : { season: null }, { status: season ? 200 : 404 })
  } catch (error) {
    console.error('GET /api/seasons/[seasonId] error:', error)
    const season = getFallbackSeason(seasonId)
    return NextResponse.json(
      season ? { season: { ...season, players: getFallbackSeasonPlayers(season.id) } } : { season: null },
      { status: season ? 200 : 404 }
    )
  }
}
