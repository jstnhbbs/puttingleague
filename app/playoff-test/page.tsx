'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { fetchCells, checkHealth } from '../lib/api'
import { getLeaderboardFromCells, type LeaderboardEntry } from '../lib/playoffUtils'
import styles from './page.module.css'

const EARLY_SEASONS = ['season1', 'season2', 'season3', 'season4'] as const
const EARLY_COLUMN_NAMES = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad']

type GameId = 'r1g1' | 'r1g2' | 'r1last' | 'finals'

interface GameScore {
  score1: string
  score2: string
}

const DEFAULT_SCORES: Record<GameId, GameScore> = {
  r1g1: { score1: '', score2: '' },
  r1g2: { score1: '', score2: '' },
  r1last: { score1: '', score2: '' },
  finals: { score1: '', score2: '' },
}

function getWinner(score1: string, score2: string, name1: string, name2: string): string | null {
  const a = parseFloat(score1)
  const b = parseFloat(score2)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  if (a > b) return name1
  if (b > a) return name2
  return null
}

export default function PlayoffTestPage() {
  const [seasonId, setSeasonId] = useState<string>('season1')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [scores, setScores] = useState<Record<GameId, GameScore>>(DEFAULT_SCORES)
  const [isLoading, setIsLoading] = useState(true)
  const [useDatabase, setUseDatabase] = useState(false)

  const loadSeason = useCallback(async () => {
    setIsLoading(true)
    const dbAvailable = await checkHealth()
    setUseDatabase(dbAvailable)
    if (!dbAvailable) {
      setLeaderboard([])
      setIsLoading(false)
      return
    }
    try {
      const cells = await fetchCells(seasonId)
      const entries = getLeaderboardFromCells(cells, EARLY_COLUMN_NAMES)
      setLeaderboard(entries)
    } catch (e) {
      console.error('Error loading season:', e)
      setLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    loadSeason()
  }, [loadSeason])

  const setGameScore = (game: GameId, side: 'score1' | 'score2', value: string) => {
    setScores((prev) => ({
      ...prev,
      [game]: { ...prev[game], [side]: value },
    }))
  }

  const seed = (n: number): LeaderboardEntry | undefined => leaderboard.find((e) => e.seed === n)
  const name = (n: number): string => seed(n)?.name ?? `Seed ${n}`

  const r1g1Winner = getWinner(scores.r1g1.score1, scores.r1g1.score2, name(1), name(4))
  const r1g2Winner = getWinner(scores.r1g2.score1, scores.r1g2.score2, name(2), name(3))
  const r1lastWinner = getWinner(scores.r1last.score1, scores.r1last.score2, name(5), name(6))
  const finalsWinner = getWinner(scores.finals.score1, scores.finals.score2, r1g1Winner ?? 'TBD', r1g2Winner ?? 'TBD')

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>
        <h1 className={styles.title}>Playoff Bracket (6‑player test)</h1>
        <p className={styles.subtitle}>
          Seasons 1–4: top 4 seeds play semifinals + finals; seeds 5 & 6 play last‑place match.
        </p>

        <div className={styles.seasonSelect}>
          <label htmlFor="season">Season</label>
          <select
            id="season"
            value={seasonId}
            onChange={(e) => {
              setSeasonId(e.target.value)
              setScores(DEFAULT_SCORES)
            }}
          >
            {EARLY_SEASONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('season', 'Season ')}
              </option>
            ))}
          </select>
        </div>

        {!useDatabase && (
          <p className={styles.unavailable}>Database unavailable. Connect to load season data.</p>
        )}

        {isLoading && <p className={styles.loading}>Loading…</p>}

        {!isLoading && useDatabase && leaderboard.length > 0 && (
          <div className={styles.bracket}>
            {/* Round 1: Semifinals + Last place */}
            <section className={styles.round}>
              <h2 className={styles.roundTitle}>Round 1</h2>
              <div className={styles.games}>
                {/* Semifinal 1: 1 vs 4 */}
                <div className={styles.game}>
                  <div className={styles.slot}>
                    <span className={styles.seed}>1</span>
                    <span className={styles.name}>{name(1)}</span>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.r1g1.score1}
                      onChange={(e) => setGameScore('r1g1', 'score1', e.target.value)}
                      min={0}
                      aria-label={`${name(1)} score`}
                    />
                  </div>
                  <span className={styles.vs}>vs</span>
                  <div className={styles.slot}>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.r1g1.score2}
                      onChange={(e) => setGameScore('r1g1', 'score2', e.target.value)}
                      min={0}
                      aria-label={`${name(4)} score`}
                    />
                    <span className={styles.name}>{name(4)}</span>
                    <span className={styles.seed}>4</span>
                  </div>
                  {r1g1Winner && (
                    <p className={styles.gameLabel}>Winner: <span className={styles.winner}>{r1g1Winner}</span></p>
                  )}
                </div>

                {/* Semifinal 2: 2 vs 3 */}
                <div className={styles.game}>
                  <div className={styles.slot}>
                    <span className={styles.seed}>2</span>
                    <span className={styles.name}>{name(2)}</span>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.r1g2.score1}
                      onChange={(e) => setGameScore('r1g2', 'score1', e.target.value)}
                      min={0}
                      aria-label={`${name(2)} score`}
                    />
                  </div>
                  <span className={styles.vs}>vs</span>
                  <div className={styles.slot}>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.r1g2.score2}
                      onChange={(e) => setGameScore('r1g2', 'score2', e.target.value)}
                      min={0}
                      aria-label={`${name(3)} score`}
                    />
                    <span className={styles.name}>{name(3)}</span>
                    <span className={styles.seed}>3</span>
                  </div>
                  {r1g2Winner && (
                    <p className={styles.gameLabel}>Winner: <span className={styles.winner}>{r1g2Winner}</span></p>
                  )}
                </div>

                {/* Last place: 5 vs 6 */}
                <div className={styles.game}>
                  <div className={styles.slot}>
                    <span className={styles.seed}>5</span>
                    <span className={styles.name}>{name(5)}</span>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.r1last.score1}
                      onChange={(e) => setGameScore('r1last', 'score1', e.target.value)}
                      min={0}
                      aria-label={`${name(5)} score`}
                    />
                  </div>
                  <span className={styles.vs}>vs</span>
                  <div className={styles.slot}>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.r1last.score2}
                      onChange={(e) => setGameScore('r1last', 'score2', e.target.value)}
                      min={0}
                      aria-label={`${name(6)} score`}
                    />
                    <span className={styles.name}>{name(6)}</span>
                    <span className={styles.seed}>6</span>
                  </div>
                  {r1lastWinner && (
                    <p className={styles.gameLabel}>
                      Winner: <span className={styles.winner}>{r1lastWinner}</span> (loser is last place)
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Finals */}
            <section className={styles.round}>
              <h2 className={styles.roundTitle}>Finals</h2>
              <div className={styles.games}>
                <div className={`${styles.game} ${finalsWinner ? styles.gameChampion : ''}`}>
                  <div className={styles.slot}>
                    <span className={styles.name}>{r1g1Winner ?? 'Winner 1v4'}</span>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.finals.score1}
                      onChange={(e) => setGameScore('finals', 'score1', e.target.value)}
                      min={0}
                      aria-label="Finals score 1"
                    />
                  </div>
                  <span className={styles.vs}>vs</span>
                  <div className={styles.slot}>
                    <input
                      type="number"
                      className={styles.scoreInput}
                      placeholder="—"
                      value={scores.finals.score2}
                      onChange={(e) => setGameScore('finals', 'score2', e.target.value)}
                      min={0}
                      aria-label="Finals score 2"
                    />
                    <span className={styles.name}>{r1g2Winner ?? 'Winner 2v3'}</span>
                  </div>
                  {finalsWinner && (
                    <p className={styles.gameLabel}>Champion: <span className={styles.winner}>{finalsWinner}</span></p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {!isLoading && useDatabase && leaderboard.length === 0 && (
          <p className={styles.unavailable}>No score data for this season yet.</p>
        )}
      </div>
    </main>
  )
}
