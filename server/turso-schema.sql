-- Turso / libSQL schema for Putting League (matches server.js)
-- Run once: turso db shell puttingleague < server/turso-schema.sql

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS season_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    display_order INTEGER,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(season_id, player_id)
);

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

CREATE INDEX IF NOT EXISTS idx_scores_season_player ON scores(season_id, player_id);
CREATE INDEX IF NOT EXISTS idx_scores_season_week ON scores(season_id, week);
CREATE INDEX IF NOT EXISTS idx_season_players_season ON season_players(season_id);
CREATE INDEX IF NOT EXISTS idx_season_players_player ON season_players(player_id);
CREATE INDEX IF NOT EXISTS idx_calculated_scores_season_player ON calculated_scores(season_id, player_id);

-- Seed players
INSERT OR IGNORE INTO players (name, display_order) VALUES ('Hunter', 0), ('Trevor', 1), ('Konner', 2), ('Silas', 3), ('Jason', 4), ('Brad', 5), ('Tyler', 6);

-- Seed seasons
INSERT OR IGNORE INTO seasons (season_id, title, description) VALUES
  ('season1', 'Season 1', '🏆 Hunter Thomas'),
  ('season2', 'Season 2', '🏆 Hunter Thomas'),
  ('season3', 'Season 3', '🏆 Hunter Thomas'),
  ('season4', 'Season 4', '🏆 Trevor Staub'),
  ('season5', 'Season 5', '🏆 Trevor Staub'),
  ('season6', 'Season 6', 'View Season 6');

-- Season–player links (seasons 1–4: 6 players; 5–6: 7 players)
INSERT OR IGNORE INTO season_players (season_id, player_id, display_order)
SELECT s.id, p.id, p.display_order FROM seasons s, players p
WHERE s.season_id IN ('season1','season2','season3','season4') AND p.name != 'Tyler'
UNION ALL
SELECT s.id, p.id, p.display_order FROM seasons s, players p
WHERE s.season_id IN ('season5','season6');
