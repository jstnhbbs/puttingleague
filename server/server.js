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
    cell_key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    is_formula INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_cell_key ON cells(cell_key);
`);

// Get all cells
app.get('/api/cells', (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] GET /api/cells - Request from: ${req.headers.origin || req.headers.referer || 'unknown'}`);

        // Ensure we return JSON
        res.setHeader('Content-Type', 'application/json');

        const stmt = db.prepare('SELECT cell_key, value, is_formula FROM cells');
        const rows = stmt.all();

        const cells = {};
        rows.forEach(row => {
            cells[row.cell_key] = {
                value: row.value,
                isFormula: row.is_formula === 1
            };
        });

        console.log(`[${new Date().toISOString()}] Returning ${Object.keys(cells).length} cells`);
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
        const { cellKey, value, isFormula } = req.body;

        if (!cellKey) {
            return res.status(400).json({ error: 'cellKey is required' });
        }

        const stmt = db.prepare(`
      INSERT INTO cells (cell_key, value, is_formula, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cell_key) DO UPDATE SET
        value = excluded.value,
        is_formula = excluded.is_formula,
        updated_at = CURRENT_TIMESTAMP
    `);

        stmt.run(cellKey, value || '', isFormula ? 1 : 0);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving cell:', error);
        res.status(500).json({ error: 'Failed to save cell' });
    }
});

// Save multiple cells (batch update)
app.post('/api/cells/batch', (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] POST /api/cells/batch - Request from: ${req.headers.origin || req.headers.referer || 'unknown'}`);
        const { cells } = req.body;

        if (!cells || typeof cells !== 'object') {
            console.error('Invalid request: cells object is required');
            return res.status(400).json({ error: 'cells object is required' });
        }

        const cellCount = Object.keys(cells).length;
        console.log(`Saving ${cellCount} cells to database...`);

        const stmt = db.prepare(`
      INSERT INTO cells (cell_key, value, is_formula, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cell_key) DO UPDATE SET
        value = excluded.value,
        is_formula = excluded.is_formula,
        updated_at = CURRENT_TIMESTAMP
    `);

        const transaction = db.transaction((cells) => {
            for (const [cellKey, cell] of Object.entries(cells)) {
                stmt.run(cellKey, cell.value || '', cell.isFormula ? 1 : 0);
            }
        });

        transaction(cells);

        console.log(`Successfully saved ${cellCount} cells`);
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
        const stmt = db.prepare('DELETE FROM cells WHERE cell_key = ?');
        const result = stmt.run(cellKey);

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
