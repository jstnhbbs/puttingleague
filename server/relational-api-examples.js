/**
 * Example API endpoints for the new relational database structure
 * 
 * These endpoints demonstrate how to work with the normalized relational tables.
 * You can integrate these into your main server.js file.
 */

// ============================================================================
// EXAMPLE ENDPOINTS - Add these to your server.js
// ============================================================================

// Get all scores for a specific season
app.get('/api/relational/scores/:seasonId', (req, res) => {
    try {
        const { seasonId } = req.params; // e.g., 'season6'
        
        const stmt = db.prepare(`
            SELECT 
                p.name as player_name,
                s.week,
                s.score,
                s.is_formula,
                s.formula_text,
                sp.display_order
            FROM scores s
            JOIN players p ON s.player_id = p.id
            JOIN seasons se ON s.season_id = se.id
            JOIN season_players sp ON sp.season_id = se.id AND sp.player_id = p.id
            WHERE se.season_id = ?
            ORDER BY sp.display_order, s.week
        `);
        
        const rows = stmt.all(seasonId);
        
        // Transform to a more usable format
        const scoresByPlayer = {};
        rows.forEach(row => {
            if (!scoresByPlayer[row.player_name]) {
                scoresByPlayer[row.player_name] = [];
            }
            scoresByPlayer[row.player_name].push({
                week: row.week,
                score: row.score,
                isFormula: row.is_formula === 1,
                formulaText: row.formula_text
            });
        });
        
        res.json(scoresByPlayer);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Get a specific player's scores for a season
app.get('/api/relational/scores/:seasonId/:playerName', (req, res) => {
    try {
        const { seasonId, playerName } = req.params;
        
        const stmt = db.prepare(`
            SELECT 
                s.week,
                s.score,
                s.is_formula,
                s.formula_text
            FROM scores s
            JOIN players p ON s.player_id = p.id
            JOIN seasons se ON s.season_id = se.id
            WHERE se.season_id = ? AND p.name = ?
            ORDER BY s.week
        `);
        
        const rows = stmt.all(seasonId, playerName);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching player scores:', error);
        res.status(500).json({ error: 'Failed to fetch player scores' });
    }
});

// Save a score
app.post('/api/relational/scores', (req, res) => {
    try {
        const { seasonId, playerName, week, score, isFormula, formulaText } = req.body;
        
        // Get IDs
        const seasonRow = db.prepare('SELECT id FROM seasons WHERE season_id = ?').get(seasonId);
        const playerRow = db.prepare('SELECT id FROM players WHERE name = ?').get(playerName);
        
        if (!seasonRow || !playerRow) {
            return res.status(400).json({ error: 'Invalid season or player' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO scores (season_id, player_id, week, score, is_formula, formula_text, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(season_id, player_id, week) DO UPDATE SET
                score = excluded.score,
                is_formula = excluded.is_formula,
                formula_text = excluded.formula_text,
                updated_at = CURRENT_TIMESTAMP
        `);
        
        stmt.run(
            seasonRow.id,
            playerRow.id,
            week,
            score,
            isFormula ? 1 : 0,
            formulaText || null
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get leaderboard (total minus two lowest)
app.get('/api/relational/leaderboard/:seasonId', (req, res) => {
    try {
        const { seasonId } = req.params;
        
        const stmt = db.prepare(`
            SELECT 
                p.name,
                cs.value as score,
                sp.display_order
            FROM calculated_scores cs
            JOIN players p ON cs.player_id = p.id
            JOIN seasons se ON cs.season_id = se.id
            JOIN season_players sp ON sp.season_id = se.id AND sp.player_id = p.id
            WHERE se.season_id = ? 
              AND cs.calculation_type = 'total_minus_two_lowest'
            ORDER BY cs.value DESC
        `);
        
        const rows = stmt.all(seasonId);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get all players for a season
app.get('/api/relational/players/:seasonId', (req, res) => {
    try {
        const { seasonId } = req.params;
        
        const stmt = db.prepare(`
            SELECT 
                p.id,
                p.name,
                sp.display_order
            FROM season_players sp
            JOIN players p ON sp.player_id = p.id
            JOIN seasons se ON sp.season_id = se.id
            WHERE se.season_id = ?
            ORDER BY sp.display_order
        `);
        
        const rows = stmt.all(seasonId);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Get season statistics
app.get('/api/relational/season-stats/:seasonId', (req, res) => {
    try {
        const { seasonId } = req.params;
        
        const stmt = db.prepare(`
            SELECT 
                p.name,
                COUNT(s.id) as weeks_played,
                AVG(s.score) as average_score,
                MIN(s.score) as lowest_score,
                MAX(s.score) as highest_score,
                SUM(s.score) as total_score,
                cs_total.value as calculated_total,
                cs_drops.value as total_with_drops
            FROM players p
            JOIN season_players sp ON sp.player_id = p.id
            JOIN seasons se ON sp.season_id = se.id
            LEFT JOIN scores s ON s.player_id = p.id AND s.season_id = se.id
            LEFT JOIN calculated_scores cs_total ON cs_total.player_id = p.id 
                AND cs_total.season_id = se.id 
                AND cs_total.calculation_type = 'total'
            LEFT JOIN calculated_scores cs_drops ON cs_drops.player_id = p.id 
                AND cs_drops.season_id = se.id 
                AND cs_drops.calculation_type = 'total_minus_two_lowest'
            WHERE se.season_id = ?
            GROUP BY p.id, p.name, cs_total.value, cs_drops.value
            ORDER BY cs_drops.value DESC
        `);
        
        const rows = stmt.all(seasonId);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching season stats:', error);
        res.status(500).json({ error: 'Failed to fetch season stats' });
    }
});

// Update calculated scores (call this after updating regular scores)
app.post('/api/relational/calculate/:seasonId', (req, res) => {
    try {
        const { seasonId } = req.params;
        
        const seasonRow = db.prepare('SELECT id FROM seasons WHERE season_id = ?').get(seasonId);
        if (!seasonRow) {
            return res.status(400).json({ error: 'Invalid season' });
        }
        
        // Get all scores for this season
        const scores = db.prepare(`
            SELECT player_id, week, score
            FROM scores
            WHERE season_id = ? AND is_formula = 0
            ORDER BY player_id, week
        `).all(seasonRow.id);
        
        // Group by player
        const playerScores = {};
        scores.forEach(score => {
            if (!playerScores[score.player_id]) {
                playerScores[score.player_id] = [];
            }
            if (score.score !== null) {
                playerScores[score.player_id].push(score.score);
            }
        });
        
        // Calculate totals and totals minus two lowest
        const insertTotal = db.prepare(`
            INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
            VALUES (?, ?, 'total', ?, CURRENT_TIMESTAMP)
        `);
        
        const insertDrops = db.prepare(`
            INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
            VALUES (?, ?, 'total_minus_two_lowest', ?, CURRENT_TIMESTAMP)
        `);
        
        const transaction = db.transaction((playerScores, seasonDbId) => {
            for (const [playerId, scores] of Object.entries(playerScores)) {
                const total = scores.reduce((sum, score) => sum + score, 0);
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
        });
        
        transaction(playerScores, seasonRow.id);
        
        res.json({ success: true, message: 'Calculated scores updated' });
    } catch (error) {
        console.error('Error calculating scores:', error);
        res.status(500).json({ error: 'Failed to calculate scores' });
    }
});
