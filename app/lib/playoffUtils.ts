import type { Cell } from './api'

const ROW_12_INDEX = 11

function getCellKey(row: number, col: number): string {
  return `${row}-${col}`
}

function sumRange(
  cells: Record<string, Cell>,
  startRow: number,
  endRow: number,
  col: number
): number {
  let sum = 0
  for (let r = startRow; r <= endRow; r++) {
    const key = getCellKey(r, col)
    const cell = cells[key]
    if (cell && cell.value.trim() !== '') {
      const numValue = parseFloat(cell.value) || 0
      if (!Number.isNaN(numValue)) sum += numValue
    }
  }
  return sum
}

type GetRow12 = (col: number) => number

function getCellValue(
  cells: Record<string, Cell>,
  row: number,
  col: number,
  getRow12: GetRow12
): string {
  if (row === 10) return String(sumRange(cells, 0, 9, col))
  if (row === 11) return String(getRow12(col))
  const key = getCellKey(row, col)
  const cell = cells[key]
  if (!cell) return ''
  if (cell.isFormula) {
    try {
      let formula = cell.value.replace(/=/g, '').trim()
      const sumRegex = /SUM\(([A-H])(\d+):([A-H])(\d+)\)/gi
      formula = formula.replace(sumRegex, (_m, startCol: string, startRow: string, endCol: string, endRow: string) => {
        const startColIndex = startCol.charCodeAt(0) - 65
        const endColIndex = endCol.charCodeAt(0) - 65
        const startRowIndex = parseInt(startRow, 10) - 1
        const endRowIndex = parseInt(endRow, 10) - 1
        if (startColIndex === endColIndex) return String(sumRange(cells, startRowIndex, endRowIndex, startColIndex))
        return '0'
      })
      let evaluated = formula
      const cellRefRegex = /([A-H])(\d+)/g
      evaluated = evaluated.replace(cellRefRegex, (_m, colLetter: string, rowNum: string) => {
        const colIndex = colLetter.charCodeAt(0) - 65
        const rowIndex = parseInt(rowNum, 10) - 1
        const refKey = getCellKey(rowIndex, colIndex)
        const refCell = cells[refKey]
        if (refCell && !refCell.isFormula) return refCell.value || '0'
        if (rowIndex === 10) return String(sumRange(cells, 0, 9, colIndex))
        if (rowIndex === 11) return String(getRow12(colIndex))
        return '0'
      })
      if (/^[0-9+\-*/().\s]+$/.test(evaluated)) return String(Function(`"use strict"; return (${evaluated})`)())
      return cell.value
    } catch {
      return cell.value
    }
  }
  return cell.value
}

function calculateTotalMinusTwo(
  cells: Record<string, Cell>,
  col: number,
  getRow12: GetRow12
): number {
  const values: number[] = []
  for (let r = 0; r <= 9; r++) {
    const valStr = getCellValue(cells, r, col, getRow12)
    if (valStr.trim() === '') continue
    const num = parseFloat(valStr)
    if (!Number.isNaN(num)) values.push(num)
  }
  if (values.length < 2) return values.reduce((s, v) => s + v, 0)
  const total = values.reduce((s, v) => s + v, 0)
  const sorted = [...values].sort((a, b) => a - b)
  return total - sorted[0] - sorted[1]
}

export interface LeaderboardEntry {
  name: string
  score: number
  seed: number
}

export type LeaderboardCalculation = 'total' | 'total_minus_two_lowest'

export interface GetLeaderboardOptions {
  calculation?: LeaderboardCalculation
}

/**
 * Compute seeded leaderboard (1-based) from season cells using row 12 (total minus two lowest).
 */
export function getLeaderboardFromCells(
  cells: Record<string, Cell>,
  columnNames: string[],
  options: GetLeaderboardOptions = {}
): LeaderboardEntry[] {
  const cols = columnNames.length
  // Tie the knot: getRow12 uses calculateTotalMinusTwo which uses getCellValue which uses getRow12
  const getRow12: GetRow12 = (col) => calculateTotalMinusTwo(cells, col, getRow12)
  const scores: { name: string; score: number }[] = []
  const calculation: LeaderboardCalculation = options.calculation ?? 'total_minus_two_lowest'
  const targetRowIndex = calculation === 'total' ? 10 : ROW_12_INDEX
  for (let c = 0; c < cols; c++) {
    const val = getCellValue(cells, targetRowIndex, c, getRow12)
    const score = parseFloat(val) || 0
    scores.push({ name: columnNames[c] ?? `Player ${c + 1}`, score })
  }
  const sorted = [...scores].sort((a, b) => b.score - a.score)
  return sorted.map((s, i) => ({ ...s, seed: i + 1 }))
}
