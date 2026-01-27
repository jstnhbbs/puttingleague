'use client'

import { useEffect, useState } from 'react'
import { fetchCells, checkHealth, type Cell } from '../lib/api'
import styles from './PlayoffBracket.module.css'

const COLUMN_NAMES = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad', 'Tyler']
const COLS = 7
const ROW_12_INDEX = 11 // Row 12 is index 11 (0-based)

interface LeaderboardEntry {
    name: string
    score: number
    colIndex: number
}

interface BracketGame {
    id: string
    round: number
    team1?: string
    team2?: string
    winner?: string
    isBye?: boolean
    waitingFor?: string
}

export function PlayoffBracket() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [useDatabase, setUseDatabase] = useState(false)
    const [mounted, setMounted] = useState(false)

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

        console.log('Calculating playoff bracket scores from', Object.keys(cells).length, 'cells')

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
        console.log('Playoff bracket sorted:', sorted)
        return sorted
    }

    useEffect(() => {
        setMounted(true)
        
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

    // Generate bracket structure based on template
    const generateBracket = (): BracketGame[] => {
        if (leaderboard.length < 7) {
            return []
        }

        const games: BracketGame[] = []
        
        // Play-In Round: 6th vs 7th
        games.push({
            id: 'playin-g1',
            round: 0, // Play-In is round 0
            team1: leaderboard[5]?.name || '6th Seed',
            team2: leaderboard[6]?.name || '7th Seed',
        })
        
        // Round 1:
        // Game 1: 3rd seed (alone, waiting for play-in winner)
        games.push({
            id: 'r1-g1',
            round: 1,
            team1: leaderboard[2]?.name || '3rd Seed',
            isBye: true, // Shown alone, waiting for play-in winner
        })
        
        // Game 2: 4th vs 5th
        games.push({
            id: 'r1-g2',
            round: 1,
            team1: leaderboard[3]?.name || '4th Seed',
            team2: leaderboard[4]?.name || '5th Seed',
        })
        
        // Round 2:
        // Game 1: 1st seed (bye, alone, waiting for lower seed round 1 winner - which is 4th vs 5th)
        games.push({
            id: 'r2-g1',
            round: 2,
            team1: leaderboard[0]?.name || '1st Seed',
            isBye: true,
            waitingFor: '4th/5th', // Lower seeded winner
        })
        
        // Game 2: 2nd seed (bye, alone, waiting for higher seed round 1 winner - which is play-in winner vs 3rd)
        games.push({
            id: 'r2-g2',
            round: 2,
            team1: leaderboard[1]?.name || '2nd Seed',
            isBye: true,
            waitingFor: 'Play-In/3rd', // Higher seeded winner
        })
        
        // Finals: Winner of Round 2, game 1 vs Winner of Round 2, game 2
        games.push({
            id: 'finals-g1',
            round: 3, // Finals is round 3
            team1: `Winner: R2-G1`,
            team2: `Winner: R2-G2`,
        })
        
        return games
    }

    const bracketGames = generateBracket()

    if (!mounted || isLoading) {
        return (
            <div className={styles.bracket}>
                <h3 className={styles.title}>Playoff Bracket</h3>
                <p className={styles.loading}>Loading...</p>
            </div>
        )
    }

    if (!useDatabase || leaderboard.length < 7) {
        return (
            <div className={styles.bracket}>
                <h3 className={styles.title}>Playoff Bracket</h3>
                <p className={styles.unavailable}>
                    {!useDatabase 
                        ? 'Database unavailable' 
                        : 'Need at least 7 players for playoff bracket'}
                </p>
            </div>
        )
    }

    return (
        <div className={styles.bracket}>
            <h3 className={styles.title}>Playoff Bracket</h3>
            <div className={styles.bracketContainer}>
                {/* Play-In Round */}
                <div className={styles.round}>
                    <h4 className={styles.roundTitle}>Play-In</h4>
                    <div className={styles.games}>
                        {bracketGames
                            .filter(game => game.round === 0)
                            .map((game) => (
                                <div key={game.id} className={styles.game}>
                                    <div className={styles.seed}>6</div>
                                    <div className={styles.team}>{game.team1}</div>
                                    <div className={styles.vs}>vs</div>
                                    <div className={styles.seed}>7</div>
                                    <div className={styles.team}>{game.team2}</div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Round 1 */}
                <div className={styles.round}>
                    <h4 className={styles.roundTitle}>Round 1</h4>
                    <div className={styles.games}>
                        {bracketGames
                            .filter(game => game.round === 1)
                            .map((game, index) => (
                                <div key={game.id} className={`${styles.game} ${game.isBye ? styles.bye : ''}`}>
                                    {index === 0 ? (
                                        // First game: 3rd seed alone (waiting for play-in winner)
                                        <>
                                            <div className={styles.seed}>3</div>
                                            <div className={styles.team}>{game.team1}</div>
                                        </>
                                    ) : (
                                        // Second game: 4th vs 5th
                                        <>
                                            <div className={styles.seed}>4</div>
                                            <div className={styles.team}>{game.team1}</div>
                                            <div className={styles.vs}>vs</div>
                                            <div className={styles.seed}>5</div>
                                            <div className={styles.team}>{game.team2}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>

                {/* Round 2 */}
                <div className={styles.round}>
                    <h4 className={styles.roundTitle}>Round 2</h4>
                    <div className={styles.games}>
                        {bracketGames
                            .filter(game => game.round === 2)
                            .map((game, index) => (
                                <div key={game.id} className={`${styles.game} ${styles.bye}`}>
                                    <div className={styles.seed}>{index === 0 ? '1' : '2'}</div>
                                    <div className={styles.team}>{game.team1}</div>
                                    {game.waitingFor && (
                                        <div className={styles.waitingFor}>vs Winner: {game.waitingFor}</div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>

                {/* Finals */}
                <div className={styles.round}>
                    <h4 className={styles.roundTitle}>Finals</h4>
                    <div className={styles.games}>
                        {bracketGames
                            .filter(game => game.round === 3)
                            .map((game) => (
                                <div key={game.id} className={styles.game}>
                                    <div className={styles.team}>{game.team1}</div>
                                    <div className={styles.vs}>vs</div>
                                    <div className={styles.team}>{game.team2}</div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
