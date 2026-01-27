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

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS cells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id TEXT NOT NULL DEFAULT 'season6',
    cell_key TEXT NOT NULL,
    value TEXT NOT NULL,
    is_formula INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(season_id, cell_key)
  );
  
  CREATE INDEX IF NOT EXISTS idx_season_cell_key ON cells(season_id, cell_key);
  CREATE INDEX IF NOT EXISTS idx_season_id ON cells(season_id);
`);

// Migration: Add season_id column if it doesn't exist (for existing databases)
try {
    const tableInfo = db.prepare("PRAGMA table_info(cells)").all();
    const hasSeasonId = tableInfo.some(col => col.name === 'season_id');

    if (!hasSeasonId) {
        console.log('Migrating database: Adding season_id column...');
        db.exec(`
          -- Create new table with season_id
          CREATE TABLE cells_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season_id TEXT NOT NULL DEFAULT 'season6',
            cell_key TEXT NOT NULL,
            value TEXT NOT NULL,
            is_formula INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(season_id, cell_key)
          );
          
          -- Migrate existing data to season6
          INSERT INTO cells_new (season_id, cell_key, value, is_formula, updated_at)
          SELECT 'season6', cell_key, value, is_formula, updated_at FROM cells;
          
          -- Drop old table
          DROP TABLE cells;
          
          -- Rename new table
          ALTER TABLE cells_new RENAME TO cells;
          
          -- Recreate indexes
          CREATE INDEX IF NOT EXISTS idx_season_cell_key ON cells(season_id, cell_key);
          CREATE INDEX IF NOT EXISTS idx_season_id ON cells(season_id);
        `);
        console.log('Migration complete: All existing data moved to season6');
    }
} catch (error) {
    console.error('Migration error:', error);
}

// Get all cells for a specific season
app.get('/api/cells', (req, res) => {
    try {
        const seasonId = req.query.season || 'season6';
        console.log(`[${new Date().toISOString()}] GET /api/cells?season=${seasonId} - Request from: ${req.headers.origin || req.headers.referer || 'unknown'}`);

        // Ensure we return JSON
        res.setHeader('Content-Type', 'application/json');

        const stmt = db.prepare('SELECT cell_key, value, is_formula FROM cells WHERE season_id = ?');
        const rows = stmt.all(seasonId);

        const cells = {};
        rows.forEach(row => {
            cells[row.cell_key] = {
                value: row.value,
                isFormula: row.is_formula === 1
            };
        });

        console.log(`[${new Date().toISOString()}] Returning ${Object.keys(cells).length} cells for season ${seasonId}`);
        res.json(cells);
    } catch (error) {
        console.error('Error fetching cells:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Failed to fetch cells' });
    }
});

// Save a single cell
app.post('/api/cells', (req, res) => {
    try {
        const { cellKey, value, isFormula, seasonId = 'season6' } = req.body;

        if (!cellKey) {
            return res.status(400).json({ error: 'cellKey is required' });
        }

        const stmt = db.prepare(`
      INSERT INTO cells (season_id, cell_key, value, is_formula, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(season_id, cell_key) DO UPDATE SET
        value = excluded.value,
        is_formula = excluded.is_formula,
        updated_at = CURRENT_TIMESTAMP
    `);

        stmt.run(seasonId, cellKey, value || '', isFormula ? 1 : 0);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving cell:', error);
        res.status(500).json({ error: 'Failed to save cell' });
    }
});

// Save multiple cells (batch update)
app.post('/api/cells/batch', (req, res) => {
    try {
        const seasonId = req.body.seasonId || 'season6';
        console.log(`[${new Date().toISOString()}] POST /api/cells/batch?season=${seasonId} - Request from: ${req.headers.origin || req.headers.referer || 'unknown'}`);
        const { cells } = req.body;

        if (!cells || typeof cells !== 'object') {
            console.error('Invalid request: cells object is required');
            return res.status(400).json({ error: 'cells object is required' });
        }

        const cellCount = Object.keys(cells).length;
        console.log(`Saving ${cellCount} cells to database for season ${seasonId}...`);

        const stmt = db.prepare(`
      INSERT INTO cells (season_id, cell_key, value, is_formula, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(season_id, cell_key) DO UPDATE SET
        value = excluded.value,
        is_formula = excluded.is_formula,
        updated_at = CURRENT_TIMESTAMP
    `);

        const transaction = db.transaction((cells, seasonId) => {
            for (const [cellKey, cell] of Object.entries(cells)) {
                stmt.run(seasonId, cellKey, cell.value || '', cell.isFormula ? 1 : 0);
            }
        });

        transaction(cells, seasonId);

        console.log(`Successfully saved ${cellCount} cells for season ${seasonId}`);
        res.json({ success: true, count: cellCount });
    } catch (error) {
        console.error('Error saving cells:', error);
        res.status(500).json({ error: 'Failed to save cells' });
    }
});

// Delete a cell
app.delete('/api/cells/:cellKey', (req, res) => {
    try {
        const { cellKey } = req.params;
        const seasonId = req.query.season || 'season6';
        const stmt = db.prepare('DELETE FROM cells WHERE season_id = ? AND cell_key = ?');
        const result = stmt.run(seasonId, cellKey);

        res.json({ success: true, deleted: result.changes > 0 });
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
