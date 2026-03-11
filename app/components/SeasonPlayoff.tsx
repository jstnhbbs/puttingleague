'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchCells, fetchPlayoffScores, savePlayoffScore, checkHealth } from '../lib/api'
import { getLeaderboardFromCells, type LeaderboardEntry } from '../lib/playoffUtils'
import styles from './SeasonPlayoff.module.css'

type GameId = 'r1g1' | 'r1g2' | 'r1last' | 'finals' | 'playin' | 'r2g1' | 'r2g2'

interface GameScore {
  score1: string
  score2: string
}

const DEFAULT_SCORES: Record<GameId, GameScore> = {
  r1g1: { score1: '', score2: '' },
  r1g2: { score1: '', score2: '' },
  r1last: { score1: '', score2: '' },
  finals: { score1: '', score2: '' },
  playin: { score1: '', score2: '' },
  r2g1: { score1: '', score2: '' },
  r2g2: { score1: '', score2: '' },
}

const EARLY_SEASONS = ['season1', 'season2', 'season3', 'season4'] as const
const EARLY_COLUMN_NAMES = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad']
const SEASON5_COLUMNS = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Tyler', 'Brad']

function getWinner(score1: string, score2: string, name1: string, name2: string): string | null {
  const a = parseFloat(score1)
  const b = parseFloat(score2)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  if (a > b) return name1
  if (b > a) return name2
  return null
}

type SupportedSeasonId = typeof EARLY_SEASONS[number] | 'season5'

interface SeasonPlayoffProps {
  seasonId: string
  isAuthenticated: boolean
}

export function SeasonPlayoff({ seasonId, isAuthenticated }: SeasonPlayoffProps) {
  const isEarly = EARLY_SEASONS.includes(seasonId as (typeof EARLY_SEASONS)[number])
  const isSeason5 = seasonId === 'season5'

  if (!isEarly && !isSeason5) {
    return null
  }

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
      setScores(DEFAULT_SCORES)
      setIsLoading(false)
      return
    }
    try {
      const cells = await fetchCells(seasonId)
      const columnNames =
        isEarly ? EARLY_COLUMN_NAMES : isSeason5 ? SEASON5_COLUMNS : EARLY_COLUMN_NAMES
      const entries = getLeaderboardFromCells(cells, columnNames)
      setLeaderboard(entries)

      const playoff = await fetchPlayoffScores(seasonId)
      const nextScores: Record<GameId, GameScore> = { ...DEFAULT_SCORES }
      ;(Object.keys(nextScores) as GameId[]).forEach((gameKey) => {
        const data = playoff[gameKey]
        if (data) {
          nextScores[gameKey] = {
            score1: data.score1 != null ? String(data.score1) : '',
            score2: data.score2 != null ? String(data.score2) : '',
          }
        }
      })
      setScores(nextScores)
    } catch (e) {
      console.error('Error loading playoff data:', e)
      setLeaderboard([])
      setScores(DEFAULT_SCORES)
    } finally {
      setIsLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    loadSeason()
  }, [loadSeason])

  const setGameScore = (game: GameId, side: 'score1' | 'score2', value: string) => {
    if (!isAuthenticated) return
    setScores((prev) => {
      const updated: Record<GameId, GameScore> = {
        ...prev,
        [game]: { ...prev[game], [side]: value },
      }
      const current = updated[game]
      const s1 = parseFloat(current.score1)
      const s2 = parseFloat(current.score2)
      void savePlayoffScore(
        game,
        {
          score1: !Number.isNaN(s1) ? s1 : null,
          score2: !Number.isNaN(s2) ? s2 : null,
        },
        seasonId
      )
      return updated
    })
  }

  const seed = (n: number): LeaderboardEntry | undefined => leaderboard.find((e) => e.seed === n)
  const name = (n: number): string => seed(n)?.name ?? `Seed ${n}`

  const r1g1Winner = getWinner(scores.r1g1.score1, scores.r1g1.score2, name(1), name(4))
  const r1g2Winner = getWinner(scores.r1g2.score1, scores.r1g2.score2, name(2), name(3))
  const r1lastWinner = getWinner(scores.r1last.score1, scores.r1last.score2, name(5), name(6))
  const finalsWinner = getWinner(
    scores.finals.score1,
    scores.finals.score2,
    r1g1Winner ?? 'Winner 1v4',
    r1g2Winner ?? 'Winner 2v3'
  )

  return (
    <section className={styles.wrapper} aria-label="Season playoffs">
      <h2 className={styles.title}>Playoffs</h2>
      {isEarly && (
        <p className={styles.subtitle}>
          Seeds 1–4 play semifinals and finals; seeds 5 &amp; 6 play for last place.
        </p>
      )}
      {isSeason5 && (
        <p className={styles.subtitle}>
          6 vs 7 play in; Round 1 is 3 vs play‑in winner and 4 vs 5; Round 2 is 1 vs lower‑seeded
          winner and 2 vs higher‑seeded winner; Finals between Round‑2 winners.
        </p>
      )}

      {!useDatabase && (
        <p className={styles.unavailable}>Database unavailable. Connect to load playoff data.</p>
      )}

      {isLoading && <p className={styles.loading}>Loading playoff data…</p>}

      {/* Early seasons (1–4): 6‑player bracket */}
      {!isLoading && useDatabase && leaderboard.length > 0 && isEarly && (
        <div className={styles.bracket}>
          {/* Round 1: Semifinals + Last place */}
          <div className={styles.round}>
            <h3 className={styles.roundTitle}>Round 1</h3>
            <div className={styles.games}>
              {/* Semifinal 1: 1 vs 4 */}
              <div className={styles.game}>
                <div className={styles.slot}>
                  <span className={styles.seed}>1</span>
                  <span className={styles.name}>{name(1)}</span>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.r1g1.score1}
                    onChange={(e) => setGameScore('r1g1', 'score1', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(1)} score`}
                  />
                </div>
                <span className={styles.vs}>vs</span>
                <div className={styles.slot}>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.r1g1.score2}
                    onChange={(e) => setGameScore('r1g1', 'score2', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(4)} score`}
                  />
                  <span className={styles.name}>{name(4)}</span>
                  <span className={styles.seed}>4</span>
                </div>
                {r1g1Winner && (
                  <p className={styles.gameLabel}>
                    Winner: <span className={styles.winner}>{r1g1Winner}</span>
                  </p>
                )}
              </div>

              {/* Semifinal 2: 2 vs 3 */}
              <div className={styles.game}>
                <div className={styles.slot}>
                  <span className={styles.seed}>2</span>
                  <span className={styles.name}>{name(2)}</span>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.r1g2.score1}
                    onChange={(e) => setGameScore('r1g2', 'score1', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(2)} score`}
                  />
                </div>
                <span className={styles.vs}>vs</span>
                <div className={styles.slot}>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.r1g2.score2}
                    onChange={(e) => setGameScore('r1g2', 'score2', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(3)} score`}
                  />
                  <span className={styles.name}>{name(3)}</span>
                  <span className={styles.seed}>3</span>
                </div>
                {r1g2Winner && (
                  <p className={styles.gameLabel}>
                    Winner: <span className={styles.winner}>{r1g2Winner}</span>
                  </p>
                )}
              </div>

              {/* Last place: 5 vs 6 */}
              <div className={styles.game}>
                <div className={styles.slot}>
                  <span className={styles.seed}>5</span>
                  <span className={styles.name}>{name(5)}</span>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.r1last.score1}
                    onChange={(e) => setGameScore('r1last', 'score1', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(5)} score`}
                  />
                </div>
                <span className={styles.vs}>vs</span>
                <div className={styles.slot}>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.r1last.score2}
                    onChange={(e) => setGameScore('r1last', 'score2', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
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
          </div>

          {/* Finals - early seasons */}
          <div className={styles.round}>
            <h3 className={styles.roundTitle}>Finals</h3>
            <div className={styles.games}>
              <div className={`${styles.game} ${finalsWinner ? styles.gameChampion : ''}`}>
                <div className={styles.slot}>
                  <span className={styles.name}>{r1g1Winner ?? 'Winner 1v4'}</span>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.finals.score1}
                    onChange={(e) => setGameScore('finals', 'score1', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label="Finals score 1"
                  />
                </div>
                <span className={styles.vs}>vs</span>
                <div className={styles.slot}>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.finals.score2}
                    onChange={(e) => setGameScore('finals', 'score2', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label="Finals score 2"
                  />
                  <span className={styles.name}>{r1g2Winner ?? 'Winner 2v3'}</span>
                </div>
                {finalsWinner && (
                  <p className={styles.gameLabel}>
                    Champion: <span className={styles.winner}>{finalsWinner}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Season 5: 7‑player bracket with play‑in */}
      {!isLoading && useDatabase && leaderboard.length > 0 && isSeason5 && (
        <div className={styles.bracket}>
          {/* Play‑In: 6 vs 7 */}
          <div className={styles.round}>
            <h3 className={styles.roundTitle}>Play‑In</h3>
            <div className={styles.games}>
              <div className={styles.game}>
                <div className={styles.slot}>
                  <span className={styles.seed}>6</span>
                  <span className={styles.name}>{name(6)}</span>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.playin.score1}
                    onChange={(e) => setGameScore('playin', 'score1', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(6)} score`}
                  />
                </div>
                <span className={styles.vs}>vs</span>
                <div className={styles.slot}>
                  <input
                    type="number"
                    className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                    placeholder="—"
                    value={scores.playin.score2}
                    onChange={(e) => setGameScore('playin', 'score2', e.target.value)}
                    min={0}
                    disabled={!isAuthenticated}
                    aria-label={`${name(7)} score`}
                  />
                  <span className={styles.name}>{name(7)}</span>
                  <span className={styles.seed}>7</span>
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const playInWinner = getWinner(scores.playin.score1, scores.playin.score2, name(6), name(7))
            const r1g1WinnerS5 = getWinner(
              scores.r1g1.score1,
              scores.r1g1.score2,
              name(3),
              playInWinner ?? 'Play‑In winner'
            )
            const r1g2WinnerS5 = getWinner(scores.r1g2.score1, scores.r1g2.score2, name(4), name(5))

            const getSeedNum = (playerName: string | null): number | null => {
              if (!playerName) return null
              const entry = leaderboard.find((e) => e.name === playerName)
              return entry ? entry.seed : null
            }

            const sA = getSeedNum(r1g1WinnerS5)
            const sB = getSeedNum(r1g2WinnerS5)
            let lowerWinner: string | null = null
            let higherWinner: string | null = null
            if (r1g1WinnerS5 && r1g2WinnerS5 && sA != null && sB != null) {
              if (sA < sB) {
                lowerWinner = r1g1WinnerS5
                higherWinner = r1g2WinnerS5
              } else {
                lowerWinner = r1g2WinnerS5
                higherWinner = r1g1WinnerS5
              }
            }

            const r2g1Winner = getWinner(
              scores.r2g1.score1,
              scores.r2g1.score2,
              name(1),
              lowerWinner ?? 'Lower‑seed R1 winner'
            )
            const r2g2Winner = getWinner(
              scores.r2g2.score1,
              scores.r2g2.score2,
              name(2),
              higherWinner ?? 'Higher‑seed R1 winner'
            )
            const finalsWinnerS5 = getWinner(
              scores.finals.score1,
              scores.finals.score2,
              r2g1Winner ?? 'Winner side 1',
              r2g2Winner ?? 'Winner side 2'
            )

            return (
              <>
                {/* Round 1 */}
                <div className={styles.round}>
                  <h3 className={styles.roundTitle}>Round 1</h3>
                  <div className={styles.games}>
                    {/* Game: 3 vs Play‑in winner */}
                    <div className={styles.game}>
                      <div className={styles.slot}>
                        <span className={styles.seed}>3</span>
                        <span className={styles.name}>{name(3)}</span>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r1g1.score1}
                          onChange={(e) => setGameScore('r1g1', 'score1', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`${name(3)} score`}
                        />
                      </div>
                      <span className={styles.vs}>vs</span>
                      <div className={styles.slot}>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r1g1.score2}
                          onChange={(e) => setGameScore('r1g1', 'score2', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`Play‑In winner score`}
                        />
                        <span className={styles.name}>{playInWinner ?? 'Play‑In winner'}</span>
                      </div>
                      {r1g1WinnerS5 && (
                        <p className={styles.gameLabel}>
                          Winner: <span className={styles.winner}>{r1g1WinnerS5}</span>
                        </p>
                      )}
                    </div>

                    {/* Game: 4 vs 5 */}
                    <div className={styles.game}>
                      <div className={styles.slot}>
                        <span className={styles.seed}>4</span>
                        <span className={styles.name}>{name(4)}</span>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r1g2.score1}
                          onChange={(e) => setGameScore('r1g2', 'score1', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`${name(4)} score`}
                        />
                      </div>
                      <span className={styles.vs}>vs</span>
                      <div className={styles.slot}>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r1g2.score2}
                          onChange={(e) => setGameScore('r1g2', 'score2', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`${name(5)} score`}
                        />
                        <span className={styles.name}>{name(5)}</span>
                        <span className={styles.seed}>5</span>
                      </div>
                      {r1g2WinnerS5 && (
                        <p className={styles.gameLabel}>
                          Winner: <span className={styles.winner}>{r1g2WinnerS5}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Round 2 */}
                <div className={styles.round}>
                  <h3 className={styles.roundTitle}>Round 2</h3>
                  <div className={styles.games}>
                    {/* Game: 1 vs lower‑seed R1 winner */}
                    <div className={styles.game}>
                      <div className={styles.slot}>
                        <span className={styles.seed}>1</span>
                        <span className={styles.name}>{name(1)}</span>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r2g1.score1}
                          onChange={(e) => setGameScore('r2g1', 'score1', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`${name(1)} score`}
                        />
                      </div>
                      <span className={styles.vs}>vs</span>
                      <div className={styles.slot}>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r2g1.score2}
                          onChange={(e) => setGameScore('r2g1', 'score2', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`Lower‑seed R1 winner score`}
                        />
                        <span className={styles.name}>{lowerWinner ?? 'Lower‑seed R1 winner'}</span>
                      </div>
                      {r2g1Winner && (
                        <p className={styles.gameLabel}>
                          Winner: <span className={styles.winner}>{r2g1Winner}</span>
                        </p>
                      )}
                    </div>

                    {/* Game: 2 vs higher‑seed R1 winner */}
                    <div className={styles.game}>
                      <div className={styles.slot}>
                        <span className={styles.seed}>2</span>
                        <span className={styles.name}>{name(2)}</span>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r2g2.score1}
                          onChange={(e) => setGameScore('r2g2', 'score1', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`${name(2)} score`}
                        />
                      </div>
                      <span className={styles.vs}>vs</span>
                      <div className={styles.slot}>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.r2g2.score2}
                          onChange={(e) => setGameScore('r2g2', 'score2', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label={`Higher‑seed R1 winner score`}
                        />
                        <span className={styles.name}>{higherWinner ?? 'Higher‑seed R1 winner'}</span>
                      </div>
                      {r2g2Winner && (
                        <p className={styles.gameLabel}>
                          Winner: <span className={styles.winner}>{r2g2Winner}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Finals */}
                <div className={styles.round}>
                  <h3 className={styles.roundTitle}>Finals</h3>
                  <div className={styles.games}>
                    <div className={`${styles.game} ${finalsWinnerS5 ? styles.gameChampion : ''}`}>
                      <div className={styles.slot}>
                        <span className={styles.name}>{r2g1Winner ?? 'Winner 1 side'}</span>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.finals.score1}
                          onChange={(e) => setGameScore('finals', 'score1', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label="Finals score 1"
                        />
                      </div>
                      <span className={styles.vs}>vs</span>
                      <div className={styles.slot}>
                        <input
                          type="number"
                          className={`${styles.scoreInput} ${!isAuthenticated ? styles.viewOnly : ''}`}
                          placeholder="—"
                          value={scores.finals.score2}
                          onChange={(e) => setGameScore('finals', 'score2', e.target.value)}
                          min={0}
                          disabled={!isAuthenticated}
                          aria-label="Finals score 2"
                        />
                        <span className={styles.name}>{r2g2Winner ?? 'Winner 2 side'}</span>
                      </div>
                      {finalsWinnerS5 && (
                        <p className={styles.gameLabel}>
                          Champion: <span className={styles.winner}>{finalsWinnerS5}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {!isLoading && useDatabase && leaderboard.length === 0 && (
        <p className={styles.unavailable}>No playoff scores for this season yet.</p>
      )}
    </section>
  )
}

