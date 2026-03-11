// API configuration
// When empty, uses same-origin (e.g. Vercel: /api/*). Set for external API (Express + tunnel).
// e.g. NEXT_PUBLIC_API_URL=http://localhost:3001 or https://your-tunnel.trycloudflare.com
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

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

// Fetch all cells from the server for a specific season
export async function fetchCells(seasonId: string = 'season6'): Promise<CellsResponse> {
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

// Save a single cell to the server for a specific season
export async function saveCell(cellKey: string, cell: Cell, seasonId: string = 'season6'): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/cells`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cellKey,
                value: cell.value,
                isFormula: cell.isFormula,
                seasonId,
            }),
        })
        return response.ok
    } catch (error) {
        console.error('Error saving cell:', error)
        return false
    }
}

// Fetch playoff scores for a specific season
export async function fetchPlayoffScores(seasonId: string = 'season6'): Promise<PlayoffScoresResponse> {
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
    seasonId: string = 'season6'
): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/playoff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
export async function saveCells(cells: Record<string, Cell>, seasonId: string = 'season6'): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/cells/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
            // Check if it's ngrok interstitial page
            if (text.includes('ngrok') || text.includes('Visit Site')) {
                console.error('⚠️ ngrok interstitial page detected! You may need to visit the ngrok URL in a browser first to bypass it.')
            }
            return false
        }

        await response.json()
        return true
    } catch (error) {
        console.error('Error saving cells:', error)
        return false
    }
}

// Delete a cell from the server for a specific season
export async function deleteCell(cellKey: string, seasonId: string = 'season6'): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/cells/${cellKey}?season=${encodeURIComponent(seasonId)}`, {
            method: 'DELETE',
        })
        return response.ok
    } catch (error) {
        console.error('Error deleting cell:', error)
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
            console.warn('Health check: API server unreachable. Check that the server is running and NEXT_PUBLIC_API_URL is correct:', API_URL)
        } else {
            console.warn('Health check error:', error instanceof Error ? error.message : error)
        }
        return false
    }
}
