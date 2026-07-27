/**
 * Migration script to convert from key-value cells table to relational structure
 * 
 * This script:
 * 1. Creates new relational tables (players, seasons, season_players, scores, calculated_scores)
 * 2. Migrates existing data from the cells table
 * 3. Keeps the old cells table for backward compatibility
 * 
 * Run with: node migrate-to-relational.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'puttingleague.db');

if (!fs.existsSync(dbPath)) {
    console.error('Database not found at:', dbPath);
    process.exit(1);
}

const db = new Database(dbPath);

// Player names mapping (column index to name)
const PLAYER_NAMES = {
    early: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Brad'], // Seasons 1-4
    late: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Tyler', 'Brad'], // Season 5
    eightPlayer: ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Graham', 'Tyler', 'Brad'] // Seasons 6+
};

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=154588723&single=true';

const SEASONS = [
    { id: 'season1', title: 'Season 1', desc: '🏆 Hunter Thomas', status: 'completed', champion: 'Hunter', sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1134880669&single=true', playoffFormat: 'six_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.early },
    { id: 'season2', title: 'Season 2', desc: '🏆 Hunter Thomas', status: 'completed', champion: 'Hunter', sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1204258671&single=true', playoffFormat: 'six_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.early },
    { id: 'season3', title: 'Season 3', desc: '🏆 Hunter Thomas', status: 'completed', champion: 'Hunter', sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=0&single=true', playoffFormat: 'six_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.early },
    { id: 'season4', title: 'Season 4', desc: '🏆 Trevor Staub', status: 'completed', champion: 'Trevor', sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1919204812&single=true', playoffFormat: 'six_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.early },
    { id: 'season5', title: 'Season 5', desc: '🏆 Trevor Staub', status: 'completed', champion: 'Trevor', sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=643864506&single=true', playoffFormat: 'seven_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.late },
    { id: 'season6', title: 'Season 6', desc: '🏆 Hunter Thomas', status: 'completed', champion: 'Hunter', sheetUrl: DEFAULT_SHEET_URL, playoffFormat: 'eight_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.eightPlayer },
    { id: 'season7', title: 'Season 7', desc: '🏆 Hunter Thomas', status: 'completed', champion: 'Hunter', sheetUrl: DEFAULT_SHEET_URL, playoffFormat: 'eight_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.eightPlayer },
    { id: 'season8', title: 'Season 8', desc: 'Current season', status: 'current', champion: null, sheetUrl: DEFAULT_SHEET_URL, playoffFormat: 'eight_player', weeksCount: 10, dropLowestCount: 2, players: PLAYER_NAMES.eightPlayer }
];

function getSeasonConfig(seasonId) {
    return SEASONS.find(season => season.id === seasonId) || SEASONS[SEASONS.length - 1];
}

console.log('Starting migration to relational structure...\n');

try {
    // Step 1: Create new tables
    console.log('Step 1: Creating new tables...');
    
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
            status TEXT NOT NULL DEFAULT 'completed',
            champion_player_id INTEGER,
            sheet_url TEXT,
            playoff_format TEXT NOT NULL DEFAULT 'six_player',
            weeks_count INTEGER NOT NULL DEFAULT 10,
            drop_lowest_count INTEGER NOT NULL DEFAULT 2,
            start_date DATE,
            end_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (champion_player_id) REFERENCES players(id)
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
        CREATE INDEX IF NOT EXISTS idx_scores_player_week ON scores(player_id, week);
        CREATE INDEX IF NOT EXISTS idx_season_players_season ON season_players(season_id);
        CREATE INDEX IF NOT EXISTS idx_season_players_player ON season_players(player_id);
        CREATE INDEX IF NOT EXISTS idx_calculated_scores_season_player ON calculated_scores(season_id, player_id);
    `);
    
    console.log('✓ Tables created\n');

    function addColumnIfMissing(statement) {
        try {
            db.exec(statement);
        } catch (error) {
            if (!String(error.message).toLowerCase().includes('duplicate column')) {
                throw error;
            }
        }
    }

    addColumnIfMissing("ALTER TABLE seasons ADD COLUMN status TEXT DEFAULT 'completed'");
    addColumnIfMissing('ALTER TABLE seasons ADD COLUMN champion_player_id INTEGER');
    addColumnIfMissing('ALTER TABLE seasons ADD COLUMN sheet_url TEXT');
    addColumnIfMissing("ALTER TABLE seasons ADD COLUMN playoff_format TEXT DEFAULT 'six_player'");
    addColumnIfMissing('ALTER TABLE seasons ADD COLUMN weeks_count INTEGER DEFAULT 10');
    addColumnIfMissing('ALTER TABLE seasons ADD COLUMN drop_lowest_count INTEGER DEFAULT 2');
    
    // Step 2: Insert players
    console.log('Step 2: Inserting players...');
    const insertPlayer = db.prepare('INSERT OR IGNORE INTO players (name, display_order) VALUES (?, ?)');
    
    // Insert all unique players
    const allPlayers = [...new Set(SEASONS.flatMap(season => season.players))];
    allPlayers.forEach((name, index) => {
        insertPlayer.run(name, index);
    });
    console.log(`✓ Inserted ${allPlayers.length} players\n`);
    
    // Step 3: Insert seasons
    console.log('Step 3: Inserting seasons...');
    const insertSeason = db.prepare(`
        INSERT OR IGNORE INTO seasons
            (season_id, title, description, status, champion_player_id, sheet_url, playoff_format, weeks_count, drop_lowest_count)
        VALUES (?, ?, ?, ?, (SELECT id FROM players WHERE name = ?), ?, ?, ?, ?)
    `);
    const updateSeason = db.prepare(`
        UPDATE seasons
        SET title = ?, description = ?, status = ?, champion_player_id = (SELECT id FROM players WHERE name = ?),
            sheet_url = ?, playoff_format = ?, weeks_count = ?, drop_lowest_count = ?
        WHERE season_id = ?
    `);
    
    SEASONS.forEach(season => {
        insertSeason.run(season.id, season.title, season.desc, season.status, season.champion, season.sheetUrl, season.playoffFormat, season.weeksCount, season.dropLowestCount);
        updateSeason.run(season.title, season.desc, season.status, season.champion, season.sheetUrl, season.playoffFormat, season.weeksCount, season.dropLowestCount, season.id);
    });
    console.log(`✓ Inserted ${seasons.length} seasons\n`);
    
    // Step 4: Set up season-player relationships
    console.log('Step 4: Setting up season-player relationships...');
    const getSeasonId = db.prepare('SELECT id FROM seasons WHERE season_id = ?');
    const getPlayerId = db.prepare('SELECT id FROM players WHERE name = ?');
    const insertSeasonPlayer = db.prepare(`
        INSERT OR IGNORE INTO season_players (season_id, player_id, display_order)
        VALUES (?, ?, ?)
    `);
    
    SEASONS.forEach(season => {
        const seasonRow = getSeasonId.get(season.id);
        if (!seasonRow) {
            console.warn(`Season ${season.id} not found, skipping...`);
            return;
        }
        const seasonDbId = seasonRow.id;
        
        season.players.forEach((playerName, colIndex) => {
            const playerRow = getPlayerId.get(playerName);
            if (playerRow) {
                insertSeasonPlayer.run(seasonDbId, playerRow.id, colIndex);
            }
        });
    });
    console.log('✓ Season-player relationships created\n');
    
    // Step 5: Migrate existing cell data
    console.log('Step 5: Migrating existing cell data...');
    
    const getCells = db.prepare('SELECT season_id, cell_key, value, is_formula FROM cells');
    const allCells = getCells.all();
    
    const insertScore = db.prepare(`
        INSERT OR REPLACE INTO scores (season_id, player_id, week, score, is_formula, formula_text, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const insertCalculated = db.prepare(`
        INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    let scoresMigrated = 0;
    let calculatedMigrated = 0;
    
    const transaction = db.transaction((cells) => {
        for (const cell of cells) {
            // Parse cell_key: format is "row-col" (e.g., "0-0", "10-2")
            const [rowStr, colStr] = cell.cell_key.split('-');
            const row = parseInt(rowStr, 10);
            const col = parseInt(colStr, 10);
            
            if (isNaN(row) || isNaN(col)) {
                continue; // Skip invalid cell keys
            }
            
            // Get season database ID
            const seasonRow = getSeasonId.get(cell.season_id);
            if (!seasonRow) continue;
            const seasonDbId = seasonRow.id;
            
            // Get player list for this season
            const seasonConfig = getSeasonConfig(cell.season_id);
            const playerList = seasonConfig.players;
            
            if (col >= playerList.length) {
                continue; // Invalid column index
            }
            
            const playerName = playerList[col];
            const playerRow = getPlayerId.get(playerName);
            if (!playerRow) continue;
            const playerDbId = playerRow.id;
            
            // Row 0-9 are weeks 1-10 (scores)
            if (row >= 0 && row < seasonConfig.weeksCount) {
                const week = row + 1; // Convert 0-based to 1-based week
                const scoreValue = cell.value ? parseFloat(cell.value) : null;
                
                insertScore.run(
                    seasonDbId,
                    playerDbId,
                    week,
                    scoreValue,
                    cell.is_formula || 0,
                    cell.is_formula ? cell.value : null
                );
                scoresMigrated++;
            }
            // Row 10 (index 10) is total (sum of weeks 1-10)
            else if (row === seasonConfig.weeksCount) {
                const value = parseFloat(cell.value) || 0;
                insertCalculated.run(seasonDbId, playerDbId, 'total', value);
                calculatedMigrated++;
            }
            // Row 11 (index 11) is total minus two lowest
            else if (row === seasonConfig.weeksCount + 1) {
                const value = parseFloat(cell.value) || 0;
                insertCalculated.run(seasonDbId, playerDbId, 'total_minus_two_lowest', value);
                calculatedMigrated++;
            }
        }
    });
    
    transaction(allCells);
    
    console.log(`✓ Migrated ${scoresMigrated} scores`);
    console.log(`✓ Migrated ${calculatedMigrated} calculated scores\n`);
    
    console.log('Migration completed successfully!');
    console.log('\nNote: The old "cells" table is kept for backward compatibility.');
    console.log('You can remove it later once you\'ve verified the migration worked correctly.');
    
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}
