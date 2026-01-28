const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your GitHub Pages domain and ngrok
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://jstnhbbs.github.io', // Your GitHub Pages URL
        /\.github\.io$/, // Allow any GitHub Pages subdomain
        /\.ngrok-free\.app$/, // Allow any ngrok free tier URL
        /\.ngrok\.io$/, // Allow any ngrok paid tier URL
        /\.ngrok-app\.dev$/ // Allow ngrok app dev URLs
    ],
    credentials: true
}));

app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'puttingleague.db');
const db = new Database(dbPath);

// Player names mapping (column index to name)
const PLAYER_NAMES = {
    early: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad'], // Seasons 1-4
    late: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad', 'Tyler'] // Seasons 5-6
};

const EARLY_SEASONS = ['season1', 'season2', 'season3', 'season4'];

// Create relational tables
db.exec(`
  -- Players table
  CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Seasons table
  CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Season-Player junction table
  CREATE TABLE IF NOT EXISTS season_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      display_order INTEGER,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(season_id, player_id)
  );
  
  -- Scores table
  CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      week INTEGER NOT NULL,
      score REAL,
      is_formula INTEGER DEFAULT 0,
      formula_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(season_id, player_id, week)
  );
  
  -- Calculated scores table
  CREATE TABLE IF NOT EXISTS calculated_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      calculation_type TEXT NOT NULL,
      value REAL NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(season_id, player_id, calculation_type)
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_scores_season_player ON scores(season_id, player_id);
  CREATE INDEX IF NOT EXISTS idx_scores_season_week ON scores(season_id, week);
  CREATE INDEX IF NOT EXISTS idx_season_players_season ON season_players(season_id);
  CREATE INDEX IF NOT EXISTS idx_season_players_player ON season_players(player_id);
  CREATE INDEX IF NOT EXISTS idx_calculated_scores_season_player ON calculated_scores(season_id, player_id);
`);

// Initialize players and seasons if they don't exist
try {
    // Insert players
    const insertPlayer = db.prepare('INSERT OR IGNORE INTO players (name, display_order) VALUES (?, ?)');
    const allPlayers = [...new Set([...PLAYER_NAMES.early, ...PLAYER_NAMES.late])];
    allPlayers.forEach((name, index) => {
        insertPlayer.run(name, index);
    });

    // Insert seasons
    const insertSeason = db.prepare('INSERT OR IGNORE INTO seasons (season_id, title, description) VALUES (?, ?, ?)');
    const seasons = [
        { id: 'season1', title: 'Season 1', desc: '🏆 Hunter Thomas' },
        { id: 'season2', title: 'Season 2', desc: '🏆 Hunter Thomas' },
        { id: 'season3', title: 'Season 3', desc: '🏆 Hunter Thomas' },
        { id: 'season4', title: 'Season 4', desc: '🏆 Trevor Staub' },
        { id: 'season5', title: 'Season 5', desc: '🏆 Trevor Staub' },
        { id: 'season6', title: 'Season 6', desc: 'View Season 6' }
    ];
    seasons.forEach(season => {
        insertSeason.run(season.id, season.title, season.desc);
    });

    // Set up season-player relationships
    const getSeasonId = db.prepare('SELECT id FROM seasons WHERE season_id = ?');
    const getPlayerId = db.prepare('SELECT id FROM players WHERE name = ?');
    const insertSeasonPlayer = db.prepare('INSERT OR IGNORE INTO season_players (season_id, player_id, display_order) VALUES (?, ?, ?)');

    seasons.forEach(season => {
        const seasonRow = getSeasonId.get(season.id);
        if (seasonRow) {
            const playerList = EARLY_SEASONS.includes(season.id) ? PLAYER_NAMES.early : PLAYER_NAMES.late;
            playerList.forEach((playerName, colIndex) => {
                const playerRow = getPlayerId.get(playerName);
                if (playerRow) {
                    insertSeasonPlayer.run(seasonRow.id, playerRow.id, colIndex);
                }
            });
        }
    });
} catch (error) {
    console.error('Error initializing players/seasons:', error);
}

// Helper function to convert cell_key (row-col) to relational data
function cellKeyToRelational(cellKey, seasonId) {
    const [rowStr, colStr] = cellKey.split('-');
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);

    if (isNaN(row) || isNaN(col)) return null;

    const playerList = EARLY_SEASONS.includes(seasonId) ? PLAYER_NAMES.early : PLAYER_NAMES.late;
    if (col >= playerList.length) return null;

    return {
        row,
        col,
        playerName: playerList[col],
        week: row >= 0 && row <= 9 ? row + 1 : null,
        isTotal: row === 10,
        isTotalMinusTwoLowest: row === 11
    };
}

// Helper function to convert relational data to cell_key format
function relationalToCellKey(row, col) {
    return `${row}-${col}`;
}

// Get all cells for a specific season (converted from relational to cell format for backward compatibility)
app.get('/api/cells', (req, res) => {
    try {
        const seasonId = req.query.season || 'season6';
        console.log(`[${new Date().toISOString()}] GET /api/cells?season=${seasonId}`);

        res.setHeader('Content-Type', 'application/json');

        // Get season database ID
        const seasonRow = db.prepare('SELECT id FROM seasons WHERE season_id = ?').get(seasonId);
        if (!seasonRow) {
            return res.json({}); // Return empty if season doesn't exist
        }

        const seasonDbId = seasonRow.id;
        const playerList = EARLY_SEASONS.includes(seasonId) ? PLAYER_NAMES.early : PLAYER_NAMES.late;
        const cells = {};

        // Get all scores for this season
        const scoresStmt = db.prepare(`
            SELECT p.name, s.week, s.score, s.is_formula, s.formula_text, sp.display_order
            FROM scores s
            JOIN players p ON s.player_id = p.id
            JOIN season_players sp ON sp.season_id = s.season_id AND sp.player_id = p.id
            WHERE s.season_id = ?
            ORDER BY sp.display_order, s.week
        `);
        const scores = scoresStmt.all(seasonDbId);

        // Convert scores to cell format
        scores.forEach(score => {
            const colIndex = playerList.indexOf(score.name);
            if (colIndex !== -1) {
                const row = score.week - 1; // Convert week (1-10) to row (0-9)
                const cellKey = relationalToCellKey(row, colIndex);
                cells[cellKey] = {
                    value: score.score !== null ? String(score.score) : '',
                    isFormula: score.is_formula === 1
                };
            }
        });

        // Get calculated scores (row 10 = total, row 11 = total minus two lowest)
        const calculatedStmt = db.prepare(`
            SELECT p.name, cs.calculation_type, cs.value, sp.display_order
            FROM calculated_scores cs
            JOIN players p ON cs.player_id = p.id
            JOIN season_players sp ON sp.season_id = cs.season_id AND sp.player_id = p.id
            WHERE cs.season_id = ?
            ORDER BY sp.display_order
        `);
        const calculated = calculatedStmt.all(seasonDbId);

        // Convert calculated scores to cell format
        calculated.forEach(calc => {
            const colIndex = playerList.indexOf(calc.name);
            if (colIndex !== -1) {
                const row = calc.calculation_type === 'total' ? 10 : 11;
                const cellKey = relationalToCellKey(row, colIndex);
                cells[cellKey] = {
                    value: String(calc.value),
                    isFormula: false
                };
            }
        });

        console.log(`[${new Date().toISOString()}] Returning ${Object.keys(cells).length} cells for season ${seasonId}`);
        res.json(cells);
    } catch (error) {
        console.error('Error fetching cells:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Failed to fetch cells' });
    }
});

// Save a single cell (converted from cell format to relational)
app.post('/api/cells', (req, res) => {
    try {
        const { cellKey, value, isFormula, seasonId = 'season6' } = req.body;

        if (!cellKey) {
            return res.status(400).json({ error: 'cellKey is required' });
        }

        const rel = cellKeyToRelational(cellKey, seasonId);
        if (!rel) {
            return res.status(400).json({ error: 'Invalid cellKey format' });
        }

        // Get IDs
        const seasonRow = db.prepare('SELECT id FROM seasons WHERE season_id = ?').get(seasonId);
        const playerRow = db.prepare('SELECT id FROM players WHERE name = ?').get(rel.playerName);

        if (!seasonRow || !playerRow) {
            return res.status(400).json({ error: 'Invalid season or player' });
        }

        // Save to appropriate table
        if (rel.week !== null) {
            // Regular score (weeks 1-10)
            const stmt = db.prepare(`
                INSERT INTO scores (season_id, player_id, week, score, is_formula, formula_text, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(season_id, player_id, week) DO UPDATE SET
                    score = excluded.score,
                    is_formula = excluded.is_formula,
                    formula_text = excluded.formula_text,
                    updated_at = CURRENT_TIMESTAMP
            `);
            const scoreValue = value ? parseFloat(value) : null;
            stmt.run(seasonRow.id, playerRow.id, rel.week, scoreValue, isFormula ? 1 : 0, isFormula ? value : null);
        } else if (rel.isTotal) {
            // Row 10: Total
            const stmt = db.prepare(`
                INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
                VALUES (?, ?, 'total', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET
                    value = excluded.value,
                    calculated_at = CURRENT_TIMESTAMP
            `);
            const calcValue = parseFloat(value) || 0;
            stmt.run(seasonRow.id, playerRow.id, calcValue);
        } else if (rel.isTotalMinusTwoLowest) {
            // Row 11: Total minus two lowest
            const stmt = db.prepare(`
                INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
                VALUES (?, ?, 'total_minus_two_lowest', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET
                    value = excluded.value,
                    calculated_at = CURRENT_TIMESTAMP
            `);
            const calcValue = parseFloat(value) || 0;
            stmt.run(seasonRow.id, playerRow.id, calcValue);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving cell:', error);
        res.status(500).json({ error: 'Failed to save cell' });
    }
});

// Save multiple cells (batch update) - converted from cell format to relational
app.post('/api/cells/batch', (req, res) => {
    try {
        const seasonId = req.body.seasonId || 'season6';
        console.log(`[${new Date().toISOString()}] POST /api/cells/batch?season=${seasonId}`);
        const { cells } = req.body;

        if (!cells || typeof cells !== 'object') {
            console.error('Invalid request: cells object is required');
            return res.status(400).json({ error: 'cells object is required' });
        }

        const cellCount = Object.keys(cells).length;
        console.log(`Saving ${cellCount} cells to database for season ${seasonId}...`);

        // Get season and player IDs
        const seasonRow = db.prepare('SELECT id FROM seasons WHERE season_id = ?').get(seasonId);
        if (!seasonRow) {
            return res.status(400).json({ error: 'Invalid season' });
        }
        const seasonDbId = seasonRow.id;

        // Prepare statements
        const insertScore = db.prepare(`
            INSERT INTO scores (season_id, player_id, week, score, is_formula, formula_text, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(season_id, player_id, week) DO UPDATE SET
                score = excluded.score,
                is_formula = excluded.is_formula,
                formula_text = excluded.formula_text,
                updated_at = CURRENT_TIMESTAMP
        `);

        const insertCalculated = db.prepare(`
            INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET
                value = excluded.value,
                calculated_at = CURRENT_TIMESTAMP
        `);

        const getPlayerId = db.prepare('SELECT id FROM players WHERE name = ?');

        const transaction = db.transaction((cells, seasonId, seasonDbId) => {
            const playersToRecalculate = new Set();

            for (const [cellKey, cell] of Object.entries(cells)) {
                const rel = cellKeyToRelational(cellKey, seasonId);
                if (!rel) continue;

                const playerRow = getPlayerId.get(rel.playerName);
                if (!playerRow) continue;

                if (rel.week !== null) {
                    // Regular score - mark player for recalculation
                    const scoreValue = cell.value ? parseFloat(cell.value) : null;
                    insertScore.run(
                        seasonDbId,
                        playerRow.id,
                        rel.week,
                        scoreValue,
                        cell.isFormula ? 1 : 0,
                        cell.isFormula ? cell.value : null
                    );
                    playersToRecalculate.add(playerRow.id);
                } else if (rel.isTotal) {
                    // Row 10: Total (manually set)
                    const calcValue = parseFloat(cell.value) || 0;
                    insertCalculated.run(seasonDbId, playerRow.id, 'total', calcValue);
                } else if (rel.isTotalMinusTwoLowest) {
                    // Row 11: Total minus two lowest (manually set)
                    const calcValue = parseFloat(cell.value) || 0;
                    insertCalculated.run(seasonDbId, playerRow.id, 'total_minus_two_lowest', calcValue);
                }
            }

            // Recalculate totals for players whose scores changed
            const recalculatePlayer = db.prepare(`
                SELECT score FROM scores 
                WHERE season_id = ? AND player_id = ? AND is_formula = 0 AND score IS NOT NULL
                ORDER BY week
            `);
            const insertTotal = db.prepare(`
                INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
                VALUES (?, ?, 'total', ?, CURRENT_TIMESTAMP)
            `);
            const insertDrops = db.prepare(`
                INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
                VALUES (?, ?, 'total_minus_two_lowest', ?, CURRENT_TIMESTAMP)
            `);

            for (const playerId of playersToRecalculate) {
                const scores = recalculatePlayer.all(seasonDbId, playerId).map(r => r.score);
                if (scores.length > 0) {
                    const total = scores.reduce((sum, s) => sum + s, 0);
                    insertTotal.run(seasonDbId, playerId, total);

                    if (scores.length >= 2) {
                        const sorted = [...scores].sort((a, b) => a - b);
                        const twoLowest = sorted.slice(0, 2);
                        const totalMinusTwoLowest = total - (twoLowest[0] + twoLowest[1]);
                        insertDrops.run(seasonDbId, playerId, totalMinusTwoLowest);
                    } else {
                        insertDrops.run(seasonDbId, playerId, total);
                    }
                }
            }
        });

        transaction(cells, seasonId, seasonDbId);

        console.log(`Successfully saved ${cellCount} cells for season ${seasonId}`);
        res.json({ success: true, count: cellCount });
    } catch (error) {
        console.error('Error saving cells:', error);
        res.status(500).json({ error: 'Failed to save cells' });
    }
});

// Delete a cell (converted from cell format to relational)
app.delete('/api/cells/:cellKey', (req, res) => {
    try {
        const { cellKey } = req.params;
        const seasonId = req.query.season || 'season6';

        const rel = cellKeyToRelational(cellKey, seasonId);
        if (!rel) {
            return res.status(400).json({ error: 'Invalid cellKey format' });
        }

        // Get IDs
        const seasonRow = db.prepare('SELECT id FROM seasons WHERE season_id = ?').get(seasonId);
        const playerRow = db.prepare('SELECT id FROM players WHERE name = ?').get(rel.playerName);

        if (!seasonRow || !playerRow) {
            return res.status(400).json({ error: 'Invalid season or player' });
        }

        let deleted = false;
        if (rel.week !== null) {
            // Delete score
            const stmt = db.prepare('DELETE FROM scores WHERE season_id = ? AND player_id = ? AND week = ?');
            const result = stmt.run(seasonRow.id, playerRow.id, rel.week);
            deleted = result.changes > 0;
        } else if (rel.isTotal) {
            // Delete calculated total
            const stmt = db.prepare('DELETE FROM calculated_scores WHERE season_id = ? AND player_id = ? AND calculation_type = ?');
            const result = stmt.run(seasonRow.id, playerRow.id, 'total');
            deleted = result.changes > 0;
        } else if (rel.isTotalMinusTwoLowest) {
            // Delete calculated total minus two lowest
            const stmt = db.prepare('DELETE FROM calculated_scores WHERE season_id = ? AND player_id = ? AND calculation_type = ?');
            const result = stmt.run(seasonRow.id, playerRow.id, 'total_minus_two_lowest');
            deleted = result.changes > 0;
        }

        res.json({ success: true, deleted });
    } catch (error) {
        console.error('Error deleting cell:', error);
        res.status(500).json({ error: 'Failed to delete cell' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Accessible at http://localhost:${PORT} or http://YOUR_IP:${PORT}`);
    console.log(`Database: ${dbPath}`);
});
