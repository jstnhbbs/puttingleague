// API routes are served by the same Next.js/Vercel app.
export const API_URL = ''

export interface Cell {
    value: string
    isFormula: boolean
}

export interface CellsResponse {
    [key: string]: Cell
}

export interface PlayoffScore {
    score1: number | null
    score2: number | null
}

export type PlayoffScoresResponse = Record<string, PlayoffScore>

export interface SeasonPlayer {
    id: number
    name: string
    displayOrder: number
}

export interface SeasonSummary {
    id: string
    title: string
    description: string
    sheetUrl: string
    status: 'completed' | 'current'
    playoffFormat: 'six_player' | 'seven_player' | 'eight_player'
    weeksCount: number
    dropLowestCount: number
    champion: string | null
    players: SeasonPlayer[]
}

export async function fetchSeasons(): Promise<SeasonSummary[]> {
    try {
        const response = await fetch(`${API_URL}/api/seasons`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) throw new Error(`Failed to fetch seasons: ${response.status}`)
        const data = (await response.json()) as { seasons?: SeasonSummary[] }
        return data.seasons ?? []
    } catch (error) {
        console.error('Error fetching seasons:', error)
        return []
    }
}

export async function fetchCurrentSeason(): Promise<SeasonSummary | null> {
    try {
        const response = await fetch(`${API_URL}/api/seasons/current`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) throw new Error(`Failed to fetch current season: ${response.status}`)
        const data = (await response.json()) as { season?: SeasonSummary | null }
        return data.season ?? null
    } catch (error) {
        console.error('Error fetching current season:', error)
        return null
    }
}

export async function fetchSeason(seasonId: string): Promise<SeasonSummary | null> {
    try {
        const response = await fetch(`${API_URL}/api/seasons/${encodeURIComponent(seasonId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) return null
        const data = (await response.json()) as { season?: SeasonSummary | null }
        return data.season ?? null
    } catch (error) {
        console.error('Error fetching season:', error)
        return null
    }
}

export async function checkAdminSession(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/admin/session`, {
            method: 'GET',
            credentials: 'include',
        })
        if (!response.ok) return false
        const data = (await response.json()) as { authenticated?: boolean }
        return data.authenticated === true
    } catch (error) {
        console.error('Error checking admin session:', error)
        return false
    }
}

export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ password }),
        })

        if (!response.ok) {
            const data = (await response.json().catch(() => null)) as { error?: string } | null
            return { success: false, error: data?.error ?? 'Unable to unlock editing' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error logging in admin:', error)
        return { success: false, error: 'Unable to unlock editing' }
    }
}

export async function logoutAdmin(): Promise<void> {
    try {
        await fetch(`${API_URL}/api/admin/session`, {
            method: 'DELETE',
            credentials: 'include',
        })
    } catch (error) {
        console.error('Error logging out admin:', error)
    }
}

// Fetch all cells from the server for a specific season
export async function fetchCells(seasonId: string = 'season8'): Promise<CellsResponse> {
    try {
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`${API_URL}/api/cells?season=${encodeURIComponent(seasonId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const text = await response.text()
            console.error('Failed to fetch cells:', response.status, response.statusText)
            console.error('Response body:', text)
            throw new Error(`Failed to fetch cells: ${response.status} - ${text}`)
        }

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error('Response is not JSON. Content-Type:', contentType)
            console.error('Response body:', text.substring(0, 200))
            throw new Error('Response is not JSON')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching cells:', error)
        // Fallback to empty object if server is unavailable
        return {}
    }
}

// Fetch playoff scores for a specific season
export async function fetchPlayoffScores(seasonId: string = 'season8'): Promise<PlayoffScoresResponse> {
    try {
        const response = await fetch(`${API_URL}/api/playoff?season=${encodeURIComponent(seasonId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            const text = await response.text()
            console.error('Failed to fetch playoff scores:', response.status, response.statusText, text)
            throw new Error(`Failed to fetch playoff scores: ${response.status}`)
        }
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error('Playoff response is not JSON. Content-Type:', contentType)
            console.error('Response body:', text.substring(0, 200))
            throw new Error('Playoff response is not JSON')
        }
        const data = (await response.json()) as PlayoffScoresResponse
        return data
    } catch (error) {
        console.error('Error fetching playoff scores:', error)
        return {}
    }
}

// Save a single playoff game score
export async function savePlayoffScore(
    gameKey: string,
    score: PlayoffScore,
    seasonId: string = 'season8'
): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/playoff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                seasonId,
                gameKey,
                score1: score.score1,
                score2: score.score2,
            }),
        })
        if (!response.ok) {
            const text = await response.text()
            console.error('Failed to save playoff score:', response.status, response.statusText, text)
            return false
        }
        return true
    } catch (error) {
        console.error('Error saving playoff score:', error)
        return false
    }
}

// Save multiple cells to the server (batch) for a specific season
export async function saveCells(cells: Record<string, Cell>, seasonId: string = 'season8'): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/cells/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ cells, seasonId }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Failed to save cells:', response.status, response.statusText, errorText)
            return false
        }

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error('Response is not JSON. Content-Type:', contentType)
            console.error('Response body:', text.substring(0, 500))
            return false
        }

        await response.json()
        return true
    } catch (error) {
        console.error('Error saving cells:', error)
        return false
    }
}

// Check if the API server is available
export async function checkHealth(): Promise<boolean> {
    try {
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.warn('Health check failed:', response.status, response.statusText)
            return false
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Health check returned non-JSON response')
            return false
        }

        await response.json()
        return true
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Health check timed out after 5 seconds')
        } else if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
            console.warn('Health check: API server unreachable.')
        } else {
            console.warn('Health check error:', error instanceof Error ? error.message : error)
        }
        return false
    }
}
