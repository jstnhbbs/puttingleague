'use client'

import { useEffect, useState } from 'react'
import { fetchCells, checkHealth, type Cell } from '../lib/api'
import styles from './Leaderboard.module.css'

const COLUMN_NAMES = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad', 'Tyler']
const COLS = 7
const ROW_12_INDEX = 11 // Row 12 is index 11 (0-based)

interface LeaderboardEntry {
    name: string
    score: number
    colIndex: number
}

export function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [useDatabase, setUseDatabase] = useState(false)

    // Helper to get cell key
    const getCellKey = (row: number, col: number): string => `${row}-${col}`

    // Sum a range of cells (same as test page)
    const sumRange = (cells: Record<string, Cell>, startRow: number, endRow: number, col: number): number => {
        let sum = 0
        for (let r = startRow; r <= endRow; r++) {
            const key = getCellKey(r, col)
            const cell = cells[key]
            if (cell && cell.value.trim() !== '') {
                const numValue = parseFloat(cell.value) || 0
                if (!isNaN(numValue)) {
                    sum += numValue
                }
            }
        }
        return sum
    }

    // Get cell value, handling formulas (same logic as test page)
    const getCellValue = (cells: Record<string, Cell>, row: number, col: number): string => {
        // Row 11 (index 10) automatically sums rows 1-10 (indices 0-9)
        if (row === 10) {
            const sum = sumRange(cells, 0, 9, col)
            return String(sum)
        }

        // Row 12 (index 11) calculates total minus two lowest scores
        if (row === 11) {
            const result = calculateTotalMinusTwoLowest(cells, col)
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
                        return String(sumRange(cells, startRowIndex, endRowIndex, startColIndex))
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
                        return String(sumRange(cells, 0, 9, colIndex))
                    }
                    // For row 12, get the calculated total minus two lowest
                    if (rowIndex === 11) {
                        return String(calculateTotalMinusTwoLowest(cells, colIndex))
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

    const calculateTotalMinusTwoLowest = (cells: Record<string, Cell>, col: number): number => {
        // Get all values from rows 1-10 (indices 0-9), only including cells with actual values
        const values: number[] = []
        for (let r = 0; r <= 9; r++) {
            const key = getCellKey(r, col)
            const cell = cells[key]
            if (cell && cell.value.trim() !== '') {
                // Get the numeric value, handling formulas
                let numValue: number
                if (cell.isFormula) {
                    const calculated = getCellValue(cells, r, col)
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

    const calculateRow12Scores = (cells: Record<string, Cell>): LeaderboardEntry[] => {
        const scores: LeaderboardEntry[] = []

        console.log('Calculating leaderboard scores from', Object.keys(cells).length, 'cells')

        for (let col = 0; col < COLS; col++) {
            // Get row 12 value using the same getCellValue function as test page
            // This ensures we use the exact same calculation logic
            const row12Value = getCellValue(cells, ROW_12_INDEX, col)
            const score = parseFloat(row12Value) || 0

            console.log(`Player ${COLUMN_NAMES[col]}: ${score} (from row 12 value: ${row12Value})`)

            scores.push({
                name: COLUMN_NAMES[col] || `Player ${col + 1}`,
                score: score,
                colIndex: col
            })
        }

        // Sort by score descending (highest first)
        const sorted = scores.sort((a, b) => b.score - a.score)
        console.log('Leaderboard sorted:', sorted)
        return sorted
    }

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                setIsLoading(true)

                const dbAvailable = await checkHealth()
                setUseDatabase(dbAvailable)

                if (dbAvailable) {
                    try {
                        const cells = await fetchCells()
                        const scores = calculateRow12Scores(cells)
                        setLeaderboard(scores)
                    } catch (error) {
                        console.error('Error loading leaderboard:', error)
                        setLeaderboard([])
                    }
                } else {
                    setLeaderboard([])
                }
            } catch (error) {
                console.error('Error in loadLeaderboard:', error)
                setLeaderboard([])
            } finally {
                setIsLoading(false)
            }
        }

        loadLeaderboard()
        // Only refresh on page load, not automatically
    }, [])

    if (isLoading) {
        return (
            <div className={styles.leaderboard}>
                <h3 className={styles.title}>Leaderboard</h3>
                <p className={styles.loading}>Loading...</p>
            </div>
        )
    }

    if (!useDatabase) {
        return (
            <div className={styles.leaderboard}>
                <h3 className={styles.title}>Leaderboard</h3>
                <p className={styles.unavailable}>Database unavailable</p>
            </div>
        )
    }

    return (
        <div className={styles.leaderboard}>
            <h3 className={styles.title}>Leaderboard (w/ Drops)</h3>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.rankHeader}>Rank</th>
                        <th className={styles.nameHeader}>Player</th>
                        <th className={styles.scoreHeader}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={entry.colIndex} className={styles.row}>
                            <td className={styles.rank}>
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && `${index + 1}`}
                            </td>
                            <td className={styles.name}>{entry.name}</td>
                            <td className={styles.score}>{entry.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
