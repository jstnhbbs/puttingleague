'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import styles from './TestPageContent.module.css'
import { fetchCells, saveCells, checkHealth, type Cell as APICell } from '../../lib/api'

interface Cell {
    value: string
    isFormula: boolean
}

const ROWS = 12
// Set your password here - change this to your desired password
const EDIT_PASSWORD = 'admin123' // Change this to your password

// Get column configuration based on season
const getColumnConfig = (seasonId: string) => {
    // Seasons 1-4: 6 columns (without Tyler)
    // Season 5: 7 columns (with Tyler)
    // Season 6: 8 columns (with Tyler + 8th player)
    const isEarlySeason = ['season1', 'season2', 'season3', 'season4'].includes(seasonId)
    if (isEarlySeason) {
        return {
            cols: 6,
            columnNames: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad']
        }
    }
    if (seasonId === 'season6') {
        return {
            cols: 8,
            columnNames: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Graham', 'Tyler','Brad']
        }
    }
    return {
        cols: 7,
        columnNames: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Tyler', 'Brad',]
    }
}

// Get storage key for a specific season
const getStorageKey = (seasonId: string) => `testPageCells_${seasonId}`

interface TestPageContentProps {
    sheetTitle: string
    seasonId: string
}

export default function TestPageContent({ sheetTitle, seasonId }: TestPageContentProps) {
    const [cells, setCells] = useState<Record<string, Cell>>({})
    const [selectedCell, setSelectedCell] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [passwordInput, setPasswordInput] = useState<string>('')
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false) // Default to false - view-only mode
    const [passwordError, setPasswordError] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [useDatabase, setUseDatabase] = useState<boolean>(false)

    // Get column configuration for this season
    const { cols: COLS, columnNames } = getColumnConfig(seasonId)

    // Check if database is available and load cells
    useEffect(() => {
        const loadCells = async () => {
            setIsLoading(true)

            // First, try to use the database
            console.log(`Checking database availability for season ${seasonId}...`)
            const dbAvailable = await checkHealth()
            console.log('Database available:', dbAvailable)
            setUseDatabase(dbAvailable)

            if (dbAvailable) {
                try {
                    console.log(`Loading cells from database for season ${seasonId}...`)
                    const savedCells = await fetchCells(seasonId)
                    if (Object.keys(savedCells).length > 0) {
                        console.log('Loaded', Object.keys(savedCells).length, 'cells from database')
                        setCells(savedCells)
                    } else {
                        console.log('No cells in database, checking localStorage...')
                        loadFromLocalStorage()
                    }
                } catch (error) {
                    console.error('Error loading from database, falling back to localStorage:', error)
                    // Fallback to localStorage
                    loadFromLocalStorage()
                }
            } else {
                console.log('Database not available, loading from localStorage...')
                // Fallback to localStorage if database is not available
                loadFromLocalStorage()
            }

            setIsLoading(false)
        }

        const loadFromLocalStorage = () => {
            try {
                const storageKey = getStorageKey(seasonId)
                const savedCells = localStorage.getItem(storageKey)
                if (savedCells) {
                    const parsed = JSON.parse(savedCells)
                    console.log('Loaded', Object.keys(parsed).length, 'cells from localStorage')
                    setCells(parsed)
                } else {
                    console.log('No cells in localStorage either')
                }
            } catch (error) {
                console.error('Error loading cells from localStorage:', error)
            }
        }

        loadCells()
    }, [seasonId])

    // Save cells to database or localStorage whenever they change
    useEffect(() => {
        if (Object.keys(cells).length === 0) return // Don't save empty state

        const saveData = async () => {
            const storageKey = getStorageKey(seasonId)
            if (useDatabase) {
                try {
                    console.log(`Attempting to save to database for season ${seasonId}...`)
                    const success = await saveCells(cells, seasonId)
                    if (success) {
                        console.log('Successfully saved to database')
                    } else {
                        console.warn('Failed to save to database, falling back to localStorage')
                        // Fallback to localStorage
                        try {
                            localStorage.setItem(storageKey, JSON.stringify(cells))
                        } catch (e) {
                            console.error('Error saving to localStorage:', e)
                        }
                    }
                } catch (error) {
                    console.error('Error saving to database, falling back to localStorage:', error)
                    // Fallback to localStorage
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(cells))
                    } catch (e) {
                        console.error('Error saving to localStorage:', e)
                    }
                }
            } else {
                // Use localStorage as fallback
                console.log('Database not available, saving to localStorage')
                try {
                    localStorage.setItem(storageKey, JSON.stringify(cells))
                } catch (error) {
                    console.error('Error saving cells to localStorage:', error)
                }
            }
        }

        // Debounce saves to avoid too many API calls
        const timeoutId = setTimeout(saveData, 500)
        return () => clearTimeout(timeoutId)
    }, [cells, useDatabase, seasonId])

    // Check for existing authentication on mount
    useEffect(() => {
        const authStatus = localStorage.getItem('testPageAuth')
        if (authStatus === 'authenticated') {
            setIsAuthenticated(true)
            setShowPasswordPrompt(false)
        } else {
            // Default to view-only mode
            setIsAuthenticated(false)
            setShowPasswordPrompt(false)
        }
    }, [])

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordInput === EDIT_PASSWORD) {
            setIsAuthenticated(true)
            setShowPasswordPrompt(false)
            setPasswordError('')
            localStorage.setItem('testPageAuth', 'authenticated')
        } else {
            setPasswordError('Incorrect password. This page is view-only.')
            setPasswordInput('')
        }
    }

    const handleLogout = () => {
        setIsAuthenticated(false)
        setShowPasswordPrompt(false) // Don't show prompt, just go back to view-only
        localStorage.removeItem('testPageAuth')
    }

    const handleUnlockClick = () => {
        setShowPasswordPrompt(true)
        setPasswordError('')
        setPasswordInput('')
    }

    const handleRefresh = async () => {
        setIsLoading(true)
        const dbAvailable = await checkHealth()
        setUseDatabase(dbAvailable)

        if (dbAvailable) {
            try {
                const savedCells = await fetchCells(seasonId)
                if (Object.keys(savedCells).length > 0) {
                    setCells(savedCells)
                    alert(`Refreshed! Loaded ${Object.keys(savedCells).length} cells from database for ${seasonId}.`)
                } else {
                    alert(`Database is empty for ${seasonId}. No cells found.`)
                }
            } catch (error) {
                console.error('Error refreshing:', error)
                alert('Error refreshing from database. Check console for details.')
            }
        } else {
            alert('Database is not available. Check if the server is running.')
        }
        setIsLoading(false)
    }

    const getCellKey = (row: number, col: number) => `${row}-${col}`

    const sumRange = (startRow: number, endRow: number, col: number): number => {
        let sum = 0
        for (let r = startRow; r <= endRow; r++) {
            const key = getCellKey(r, col)
            const cell = cells[key]
            if (cell) {
                const value = cell.isFormula ? getCellValue(r, col) : cell.value
                const numValue = parseFloat(value) || 0
                sum += numValue
            }
        }
        return sum
    }

    const calculateTotalMinusTwoLowest = (col: number): number => {
        // Get all values from rows 1-10 (indices 0-9), only including cells with actual values
        const values: number[] = []
        for (let r = 0; r <= 9; r++) {
            const key = getCellKey(r, col)
            const cell = cells[key]
            if (cell && cell.value.trim() !== '') {
                // Get the numeric value, handling formulas
                let numValue: number
                if (cell.isFormula) {
                    const calculated = getCellValue(r, col)
                    numValue = parseFloat(calculated) || 0
                } else {
                    numValue = parseFloat(cell.value) || 0
                }
                // Only add if it's a valid number (not NaN)
                if (!isNaN(numValue)) {
                    values.push(numValue)
                }
            }
        }

        // Need at least 2 values to subtract two lowest
        if (values.length < 2) {
            // If less than 2 values, return the sum (or 0 if no values)
            return values.reduce((sum, val) => sum + val, 0)
        }

        // Calculate total
        const total = values.reduce((sum, val) => sum + val, 0)

        // Find two lowest values
        const sortedValues = [...values].sort((a, b) => a - b)
        const twoLowest = sortedValues.slice(0, 2)
        const sumOfTwoLowest = twoLowest[0] + twoLowest[1]

        // Return total minus two lowest
        return total - sumOfTwoLowest
    }

    const getCellValue = (row: number, col: number): string => {
        // Row 11 (index 10) automatically sums rows 1-10 (indices 0-9)
        if (row === 10) {
            const sum = sumRange(0, 9, col)
            return String(sum)
        }

        // Row 12 (index 11) calculates total minus two lowest scores
        if (row === 11) {
            const result = calculateTotalMinusTwoLowest(col)
            return String(result)
        }

        const key = getCellKey(row, col)
        const cell = cells[key]
        if (!cell) return ''

        if (cell.isFormula) {
            try {
                // Simple formula evaluation (supports basic math operations)
                let formula = cell.value.replace(/=/g, '').trim()

                // Handle SUM function (e.g., SUM(A1:A10))
                const sumRegex = /SUM\(([A-H])(\d+):([A-H])(\d+)\)/gi
                formula = formula.replace(sumRegex, (match, startCol, startRow, endCol, endRow) => {
                    const startColIndex = startCol.charCodeAt(0) - 65
                    const endColIndex = endCol.charCodeAt(0) - 65
                    const startRowIndex = parseInt(startRow) - 1
                    const endRowIndex = parseInt(endRow) - 1

                    // Only handle same column ranges for now
                    if (startColIndex === endColIndex) {
                        return String(sumRange(startRowIndex, endRowIndex, startColIndex))
                    }
                    return '0'
                })

                // Replace cell references like A1, B2, etc. with actual values
                let evaluated = formula
                const cellRefRegex = /([A-H])(\d+)/g
                evaluated = evaluated.replace(cellRefRegex, (match, colLetter, rowNum) => {
                    const colIndex = colLetter.charCodeAt(0) - 65 // A=0, B=1, etc.
                    const rowIndex = parseInt(rowNum) - 1
                    const refKey = getCellKey(rowIndex, colIndex)
                    const refCell = cells[refKey]
                    if (refCell && !refCell.isFormula) {
                        return refCell.value || '0'
                    }
                    // For row 11, get the calculated sum
                    if (rowIndex === 10) {
                        return String(sumRange(0, 9, colIndex))
                    }
                    // For row 12, get the calculated total minus two lowest
                    if (rowIndex === 11) {
                        return String(calculateTotalMinusTwoLowest(colIndex))
                    }
                    return '0'
                })

                // Evaluate the formula (basic safety check)
                if (/^[0-9+\-*/().\s]+$/.test(evaluated)) {
                    const result = Function(`"use strict"; return (${evaluated})`)()
                    return String(result)
                }
                return cell.value
            } catch {
                return cell.value
            }
        }
        return cell.value
    }

    const handleCellChange = useCallback((row: number, col: number, value: string) => {
        // Only allow editing if authenticated
        if (!isAuthenticated) {
            return
        }
        // Row 11 (index 10) and Row 12 (index 11) are read-only
        if (row === 10 || row === 11) {
            return
        }

        const key = getCellKey(row, col)
        const isFormula = value.startsWith('=')

        setCells(prev => ({
            ...prev,
            [key]: {
                value: value,
                isFormula: isFormula
            }
        }))
    }, [isAuthenticated])

    const handleCellFocus = (row: number, col: number) => {
        // Only allow editing if authenticated
        if (!isAuthenticated) {
            return
        }
        // Row 11 (index 10) and Row 12 (index 11) are read-only
        if (row === 10 || row === 11) {
            return
        }
        setSelectedCell(getCellKey(row, col))
    }

    const handleCellBlur = () => {
        setSelectedCell(null)
    }

    // Highlight: 2 lowest scores per column (red), highest score per row (green). Only score rows 0-9.
    const getNumericValue = (r: number, c: number): number | null => {
        if (r < 0 || r > 9) return null
        const v = getCellValue(r, c)
        const n = parseFloat(v)
        return Number.isNaN(n) ? null : n
    }
    const lowInColumn = new Set<string>()
    for (let c = 0; c < COLS; c++) {
        const entries: { row: number; value: number }[] = []
        for (let r = 0; r <= 9; r++) {
            const n = getNumericValue(r, c)
            if (n !== null) entries.push({ row: r, value: n })
        }
        entries.sort((a, b) => (a.value !== b.value ? a.value - b.value : a.row - b.row))
        entries.slice(0, 2).forEach(({ row }) => lowInColumn.add(getCellKey(row, c)))
    }
    const highInRow = new Set<string>()
    for (let r = 0; r <= 9; r++) {
        const entries: { col: number; value: number }[] = []
        for (let c = 0; c < COLS; c++) {
            const n = getNumericValue(r, c)
            if (n !== null) entries.push({ col: c, value: n })
        }
        if (entries.length === 0) continue
        const maxVal = Math.max(...entries.map((e) => e.value))
        entries.filter((e) => e.value === maxVal).forEach(({ col }) => highInRow.add(getCellKey(r, col)))
    }

    // Customize column headers here
    const getColumnLetter = (col: number) => columnNames[col] || `Col ${col + 1}`

    // Customize row headers here
    // Rows 1-10 are regular rounds, row 11 is sum, row 12 is total minus two lowest
    const rowNames = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Total', 'w/ Drops']
    const getRowLabel = (row: number) => rowNames[row] || `Row ${row + 1}`

    // Password prompt overlay (shown as modal when user clicks unlock)

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/" className={styles.backLink}>
                        ← Back to Home
                    </Link>
                    <div className={styles.headerRow}>
                        <h1 className={styles.title}>{sheetTitle}</h1>
                        <div className={styles.headerButtons}>
                            {useDatabase && (
                                <span className={styles.dbStatus} title="Connected to database">
                                    ● Database
                                </span>
                            )}
                            <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh data from database">
                                🔄 Refresh
                            </button>
                            {!isAuthenticated && (
                                <button onClick={handleUnlockClick} className={styles.unlockButton}>
                                    🔓 Unlock Editing
                                </button>
                            )}
                            {isAuthenticated && (
                                <button onClick={handleLogout} className={styles.logoutButton}>
                                    🔒 Lock Editing
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <p className={styles.subtitle}>
                    {isAuthenticated
                        ? ' '
                        : 'View-only mode - Enter password to edit'}
                </p>
                {isLoading && (
                    <p className={styles.loading}>Loading data...</p>
                )}

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.cornerCell}></th>
                                {Array.from({ length: COLS }, (_, i) => (
                                    <th key={i} className={styles.headerCell}>
                                        {getColumnLetter(i)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: ROWS }, (_, row) => (
                                <tr key={row}>
                                    <td className={styles.rowHeader}>{getRowLabel(row)}</td>
                                    {Array.from({ length: COLS }, (_, col) => {
                                        const key = getCellKey(row, col)
                                        const cell = cells[key]
                                        const isRow11 = row === 10
                                        const isRow12 = row === 11
                                        const isCalculatedRow = isRow11 || isRow12

                                        // For calculated rows (11 and 12), always show the calculated value
                                        const displayValue = isCalculatedRow
                                            ? getCellValue(row, col)
                                            : (cell?.isFormula
                                                ? getCellValue(row, col)
                                                : (cell?.value || ''))
                                        const editValue = cell?.value || ''
                                        const isSelected = selectedCell === key
                                        const isHigh = highInRow.has(key)
                                        const isLow = lowInColumn.has(key)
                                        const highlightClass = isHigh ? styles.cellHighlightHigh : isLow ? styles.cellHighlightLow : ''

                                        return (
                                            <td key={col} className={`${styles.cell} ${isCalculatedRow ? styles.sumRow : ''} ${!isAuthenticated ? styles.viewOnly : ''} ${highlightClass}`}>
                                                {isSelected && !isCalculatedRow && isAuthenticated ? (
                                                    <input
                                                        type="text"
                                                        className={styles.input}
                                                        value={editValue}
                                                        onChange={(e) => handleCellChange(row, col, e.target.value)}
                                                        onBlur={handleCellBlur}
                                                        autoFocus
                                                        placeholder="Enter value or formula"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`${styles.cellContent} ${isCalculatedRow ? styles.sumCell : ''} ${!isAuthenticated ? styles.viewOnlyCell : ''}`}
                                                        onClick={() => handleCellFocus(row, col)}
                                                        title={
                                                            !isAuthenticated
                                                                ? 'View-only mode - Enter password to edit'
                                                                : isRow11
                                                                    ? `Sum of ${getColumnLetter(col)}1-${getColumnLetter(col)}10`
                                                                    : isRow12
                                                                        ? `Total of ${getColumnLetter(col)}1-${getColumnLetter(col)}10 minus two lowest scores`
                                                                        : (cell?.isFormula ? `Formula: ${cell.value}` : '')
                                                        }
                                                    >
                                                        {displayValue || (!isCalculatedRow && isAuthenticated && <span className={styles.placeholder}>Click to edit</span>)}
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.instructions}>
                    <h3>Instructions:</h3>
                    <ul>
                        {isAuthenticated ? (
                            <>
                                <li>Click any cell to edit (except rows 11 and 12)</li>
                                <li>Enter numbers directly (e.g., 123, 45.67)</li>
                                <li><strong>Row 11: Automatically sums rows 1-10 for each column</strong></li>
                                <li><strong>Row 12: Total of rows 1-10 minus the two lowest scores in that column</strong></li>
                            </>
                        ) : (
                            <>
                                <li>This page is in view-only mode</li>
                                <li>Click "Unlock Editing" to enable editing with admin password</li>
                                <li>All calculations (rows 11 and 12) are still visible and update automatically</li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Password prompt modal overlay */}
                {showPasswordPrompt && !isAuthenticated && (
                    <div className={styles.modalOverlay} onClick={() => {
                        setShowPasswordPrompt(false)
                        setPasswordError('')
                        setPasswordInput('')
                    }}>
                        <div className={styles.passwordPrompt} onClick={(e) => e.stopPropagation()}>
                            <h2 className={styles.passwordTitle}>Enter Admin Password</h2>
                            <p className={styles.passwordSubtitle}>Enter the password to unlock editing mode.</p>
                            <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className={styles.passwordInput}
                                    placeholder="Enter password"
                                    autoFocus
                                />
                                {passwordError && (
                                    <p className={styles.passwordError}>{passwordError}</p>
                                )}
                                <div className={styles.passwordButtons}>
                                    <button type="submit" className={styles.passwordButton}>
                                        Unlock Editing
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.viewOnlyButton}
                                        onClick={() => {
                                            setShowPasswordPrompt(false)
                                            setPasswordError('')
                                            setPasswordInput('')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
