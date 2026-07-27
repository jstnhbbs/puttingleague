'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  checkAdminSession,
  loginAdmin,
  logoutAdmin,
  type SeasonPlayer,
  type SeasonSummary,
} from '../../lib/api'
import styles from './SeasonAdminContent.module.css'

type PlayerSummary = {
  id: number
  name: string
  displayOrder: number
}

type AdminSeasonsResponse = {
  seasons?: SeasonSummary[]
  players?: PlayerSummary[]
  error?: string
}

type EditableSeason = SeasonSummary

const PLAYOFF_FORMAT_LABELS: Record<SeasonSummary['playoffFormat'], string> = {
  six_player: '6 players',
  seven_player: '7 players',
  eight_player: '8 players',
}

export default function SeasonAdminContent() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')
  const [draft, setDraft] = useState<EditableSeason | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      const sessionIsValid = await checkAdminSession()
      if (cancelled) return
      setAuthenticated(sessionIsValid)
      setCheckingSession(false)
      if (sessionIsValid) void loadAdminData()
    }

    void initialize()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedSeason = useMemo(
    () => seasons.find((season) => season.id === selectedSeasonId) ?? null,
    [seasons, selectedSeasonId]
  )

  const sortedSeasons = useMemo(
    () =>
      [...seasons].sort((a, b) => {
        return getSeasonNumber(b.id) - getSeasonNumber(a.id)
      }),
    [seasons]
  )

  async function loadAdminData(preferredSeasonId?: string) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/seasons', {
        method: 'GET',
        credentials: 'include',
      })
      const data = (await response.json().catch(() => null)) as AdminSeasonsResponse | null

      if (response.status === 401) {
        setAuthenticated(false)
        setSeasons([])
        setDraft(null)
        return
      }

      if (!response.ok) {
        throw new Error(data?.error ?? 'Unable to load seasons')
      }

      const loadedSeasons = data?.seasons ?? []
      setSeasons(loadedSeasons)
      setPlayers(data?.players ?? [])

      const nextSelectedId =
        preferredSeasonId ??
        selectedSeasonId ??
        loadedSeasons.find((season) => season.status === 'current')?.id ??
        loadedSeasons[loadedSeasons.length - 1]?.id ??
        ''
      const nextSelected =
        loadedSeasons.find((season) => season.id === nextSelectedId) ??
        loadedSeasons.find((season) => season.status === 'current') ??
        loadedSeasons[loadedSeasons.length - 1] ??
        null

      setSelectedSeasonId(nextSelected?.id ?? '')
      setDraft(nextSelected ? cloneSeason(nextSelected) : null)
    } catch (loadError) {
      console.error('Failed to load admin seasons:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load seasons')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError(null)
    setSaving(true)

    const result = await loginAdmin(password)
    setSaving(false)

    if (!result.success) {
      setAuthError(result.error ?? 'Unable to unlock admin')
      return
    }

    setPassword('')
    setAuthenticated(true)
    await loadAdminData()
  }

  async function handleLogout() {
    await logoutAdmin()
    setAuthenticated(false)
    setDraft(null)
    setSeasons([])
  }

  function handleSelectSeason(seasonId: string) {
    const nextSeason = seasons.find((season) => season.id === seasonId)
    setSelectedSeasonId(seasonId)
    setDraft(nextSeason ? cloneSeason(nextSeason) : null)
    setMessage(null)
    setError(null)
  }

  function updateDraft<K extends keyof EditableSeason>(key: K, value: EditableSeason[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  function updatePlayer(index: number, name: string) {
    setDraft((current) => {
      if (!current) return current
      const nextPlayers = [...current.players]
      nextPlayers[index] = {
        ...nextPlayers[index],
        name,
      }
      return { ...current, players: normalizePlayerOrder(nextPlayers) }
    })
  }

  function movePlayer(index: number, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.players.length) return current

      const nextPlayers = [...current.players]
      const [player] = nextPlayers.splice(index, 1)
      nextPlayers.splice(targetIndex, 0, player)
      return { ...current, players: normalizePlayerOrder(nextPlayers) }
    })
  }

  function removePlayer(index: number) {
    setDraft((current) => {
      if (!current) return current
      return { ...current, players: normalizePlayerOrder(current.players.filter((_, i) => i !== index)) }
    })
  }

  function addPlayer() {
    const name = newPlayerName.trim()
    if (!name || !draft) return
    if (draft.players.some((player) => player.name.toLowerCase() === name.toLowerCase())) {
      setError(`${name} is already in this season`)
      return
    }

    setDraft({
      ...draft,
      players: normalizePlayerOrder([
        ...draft.players,
        {
          id: 0,
          name,
          displayOrder: draft.players.length,
        },
      ]),
    })
    setNewPlayerName('')
    setError(null)
  }

  async function saveSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft || !selectedSeason) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`/api/admin/seasons/${encodeURIComponent(selectedSeason.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(draft),
      })
      const data = (await response.json().catch(() => null)) as { season?: SeasonSummary; error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? 'Unable to save season')
      }

      const savedId = data?.season?.id ?? draft.id
      setMessage(`${data?.season?.title ?? draft.title} saved`)
      await loadAdminData(savedId)
    } catch (saveError) {
      console.error('Failed to save season:', saveError)
      setError(saveError instanceof Error ? saveError.message : 'Unable to save season')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateSelectedSeason() {
    if (!selectedSeason) return

    setDuplicating(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/admin/seasons/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sourceSeasonId: selectedSeason.id }),
      })
      const data = (await response.json().catch(() => null)) as { season?: SeasonSummary; error?: string } | null

      if (!response.ok || !data?.season) {
        throw new Error(data?.error ?? 'Unable to duplicate season')
      }

      setMessage(`${selectedSeason.title} duplicated to ${data.season.title}`)
      await loadAdminData(data.season.id)
    } catch (duplicateError) {
      console.error('Failed to duplicate season:', duplicateError)
      setError(duplicateError instanceof Error ? duplicateError.message : 'Unable to duplicate season')
    } finally {
      setDuplicating(false)
    }
  }

  if (checkingSession) {
    return (
      <main className={styles.main}>
        <section className={styles.authCard}>
          <h1 className={styles.title}>Season Admin</h1>
          <p className={styles.muted}>Checking session...</p>
        </section>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className={styles.main}>
        <section className={styles.authCard}>
          <Link href="/" className={styles.backLink}>
            Back to home
          </Link>
          <h1 className={styles.title}>Season Admin</h1>
          <form onSubmit={handleLogin} className={styles.authForm}>
            <label className={styles.label} htmlFor="admin-password">
              Admin password
            </label>
            <input
              id="admin-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            {authError && <p className={styles.error}>{authError}</p>}
            <button className={styles.primaryButton} type="submit" disabled={saving || !password}>
              Unlock
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            Back to home
          </Link>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Season Admin</h1>
          </div>
          <button className={styles.secondaryButton} type="button" onClick={handleLogout}>
            Lock
          </button>
        </header>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <section className={styles.toolbar}>
          <label className={styles.label} htmlFor="season-picker">
            Season
          </label>
          <select
            id="season-picker"
            className={styles.select}
            value={selectedSeasonId}
            onChange={(event) => handleSelectSeason(event.target.value)}
            disabled={loading || seasons.length === 0}
          >
            {sortedSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.title}
              </option>
            ))}
          </select>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => void loadAdminData(selectedSeasonId)}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => void duplicateSelectedSeason()}
            disabled={!selectedSeason || duplicating}
          >
            {duplicating ? 'Duplicating...' : 'Duplicate selected'}
          </button>
        </section>

        {draft && (
          <form className={styles.editorGrid} onSubmit={saveSeason}>
            <section className={styles.panel}>
              <h2 className={styles.sectionTitle}>Season Details</h2>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Season number</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={getSeasonNumber(draft.id) || ''}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      updateDraft('id', Number.isInteger(value) && value > 0 ? `season${value}` : draft.id)
                    }}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Title</span>
                  <input
                    className={styles.input}
                    value={draft.title}
                    onChange={(event) => updateDraft('title', event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Status</span>
                  <select
                    className={styles.select}
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft('status', event.target.value as EditableSeason['status'])
                    }
                  >
                    <option value="current">Current</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Champion</span>
                  <select
                    className={styles.select}
                    value={draft.champion ?? ''}
                    onChange={(event) => updateDraft('champion', event.target.value || null)}
                  >
                    <option value="">None</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Playoff format</span>
                  <select
                    className={styles.select}
                    value={draft.playoffFormat}
                    onChange={(event) =>
                      updateDraft('playoffFormat', event.target.value as EditableSeason['playoffFormat'])
                    }
                  >
                    {Object.entries(PLAYOFF_FORMAT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Weeks</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    max="20"
                    value={draft.weeksCount}
                    onChange={(event) => updateDraft('weeksCount', Number(event.target.value))}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Drops</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    max={Math.max(0, draft.weeksCount - 1)}
                    value={draft.dropLowestCount}
                    onChange={(event) => updateDraft('dropLowestCount', Number(event.target.value))}
                  />
                </label>
                <label className={`${styles.field} ${styles.wideField}`}>
                  <span className={styles.label}>Description</span>
                  <input
                    className={styles.input}
                    value={draft.description}
                    onChange={(event) => updateDraft('description', event.target.value)}
                  />
                </label>
                <label className={`${styles.field} ${styles.fullField}`}>
                  <span className={styles.label}>Sheet URL</span>
                  <input
                    className={styles.input}
                    value={draft.sheetUrl}
                    onChange={(event) => updateDraft('sheetUrl', event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.sectionTitle}>Players</h2>
              <datalist id="player-names">
                {players.map((player) => (
                  <option key={player.id} value={player.name} />
                ))}
              </datalist>

              <div className={styles.playerList}>
                {draft.players.map((player, index) => (
                  <div className={styles.playerRow} key={`${player.name}-${index}`}>
                    <span className={styles.orderNumber}>{index + 1}</span>
                    <input
                      className={styles.input}
                      list="player-names"
                      value={player.name}
                      onChange={(event) => updatePlayer(index, event.target.value)}
                    />
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconButton}
                        type="button"
                        onClick={() => movePlayer(index, -1)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        Up
                      </button>
                      <button
                        className={styles.iconButton}
                        type="button"
                        onClick={() => movePlayer(index, 1)}
                        disabled={index === draft.players.length - 1}
                        title="Move down"
                      >
                        Down
                      </button>
                      <button
                        className={styles.dangerButton}
                        type="button"
                        onClick={() => removePlayer(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.addPlayerRow}>
                <input
                  className={styles.input}
                  list="player-names"
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
                  placeholder="Player name"
                />
                <button className={styles.secondaryButton} type="button" onClick={addPlayer}>
                  Add player
                </button>
              </div>
            </section>

            <div className={styles.actions}>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save season'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

function cloneSeason(season: SeasonSummary): EditableSeason {
  return {
    ...season,
    players: season.players.map((player) => ({ ...player })),
  }
}

function normalizePlayerOrder(players: SeasonPlayer[]): SeasonPlayer[] {
  return players.map((player, index) => ({ ...player, displayOrder: index }))
}

function getSeasonNumber(seasonId: string): number {
  const match = seasonId.match(/\d+$/)
  return match ? Number(match[0]) : 0
}
