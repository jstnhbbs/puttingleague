// API configuration
// Change this to your Mac mini's IP address or domain
// For local development: 'http://localhost:3001'
// For production: 'http://YOUR_MAC_MINI_IP:3001' or your domain
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    const response = await fetch(`${API_URL}/api/cells`)
    if (!response.ok) {
      throw new Error('Failed to fetch cells')
    }
    return await response.json()
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
    const response = await fetch(`${API_URL}/api/cells/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cells }),
    })
    return response.ok
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
