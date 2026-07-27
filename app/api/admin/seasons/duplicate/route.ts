import { NextRequest, NextResponse } from 'next/server'
import { duplicateSeason, getDb, isTursoConfigured } from '../../../../lib/db'
import { isAdminRequest, unauthorizedResponse } from '../../../../lib/adminSession'

type DuplicateSeasonBody = {
  sourceSeasonId?: string
  targetSeasonNumber?: number
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as DuplicateSeasonBody | null
  const sourceSeasonId = typeof body?.sourceSeasonId === 'string' ? body.sourceSeasonId.trim().toLowerCase() : ''
  const targetSeasonNumber =
    body?.targetSeasonNumber != null && Number.isInteger(Number(body.targetSeasonNumber))
      ? Number(body.targetSeasonNumber)
      : undefined

  if (!/^season\d+$/.test(sourceSeasonId) || (targetSeasonNumber != null && targetSeasonNumber < 1)) {
    return NextResponse.json({ error: 'Invalid duplicate request' }, { status: 400 })
  }

  try {
    const season = await duplicateSeason(getDb(), sourceSeasonId, targetSeasonNumber)
    return NextResponse.json({ season }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/seasons/duplicate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate season' },
      { status: 500 }
    )
  }
}
