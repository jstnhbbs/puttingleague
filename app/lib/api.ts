// API configuration
// Change this to your Mac mini's IP address or domain
// For local development: 'http://localhost:3001'
// For production: 'http://100.72.185.61:3001' or your domain
// Or use ngrok: 'https://valanced-unintervening-ronald.ngrok-free.dev'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://valanced-unintervening-ronald.ngrok-free.dev'

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
        const response = await fetch(`${API_URL}/api/cells`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            console.error('Failed to fetch cells:', response.status, response.statusText)
            throw new Error(`Failed to fetch cells: ${response.status}`)
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
        const response = await fetch(`${API_URL}/api/health`)
        return response.ok
    } catch (error) {
        return false
    }
}
