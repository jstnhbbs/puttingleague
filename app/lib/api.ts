// API configuration
// Change this to your Mac mini's IP address or domain
// For local development: 'http://localhost:3001'
// For production: 'http://100.72.185.61:3001' or your domain
// Or use ngrok: 'https://recreational-independence-merely-barriers.trycloudflare.com'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://recreational-independence-merely-barriers.trycloudflare.com'

export interface Cell {
    value: string
    isFormula: boolean
}

export interface CellsResponse {
    [key: string]: Cell
}

// Fetch all cells from the server
export async function fetchCells(): Promise<CellsResponse> {
    try {
        console.log('Fetching cells from:', `${API_URL}/api/cells`)
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`${API_URL}/api/cells`, {
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
        console.log('Fetched cells:', Object.keys(data).length, 'cells')
        return data
    } catch (error) {
        console.error('Error fetching cells:', error)
        // Fallback to empty object if server is unavailable
        return {}
    }
}

// Save a single cell to the server
export async function saveCell(cellKey: string, cell: Cell): Promise<boolean> {
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
            }),
        })
        return response.ok
    } catch (error) {
        console.error('Error saving cell:', error)
        return false
    }
}

// Save multiple cells to the server (batch)
export async function saveCells(cells: Record<string, Cell>): Promise<boolean> {
    try {
        const cellCount = Object.keys(cells).length
        console.log(`Saving ${cellCount} cells to:`, `${API_URL}/api/cells/batch`)

        const response = await fetch(`${API_URL}/api/cells/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cells }),
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

        const result = await response.json()
        console.log('Successfully saved cells:', result)
        return true
    } catch (error) {
        console.error('Error saving cells:', error)
        return false
    }
}

// Delete a cell from the server
export async function deleteCell(cellKey: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/cells/${cellKey}`, {
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

        const data = await response.json()
        console.log('Health check passed:', data)
        return true
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Health check timed out after 5 seconds')
        } else {
            console.warn('Health check error:', error)
        }
        return false
    }
}
