-- Turso / libSQL schema for Putting League (matches server.js)
-- Run once: turso db shell puttingleague < server/turso-schema.sql
CREATE TABLE
    IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_order INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS seasons (
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
        FOREIGN KEY (champion_player_id) REFERENCES players (id)
    );

CREATE TABLE
    IF NOT EXISTS season_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        display_order INTEGER,
        FOREIGN KEY (season_id) REFERENCES seasons (id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        UNIQUE (season_id, player_id)
    );

CREATE TABLE
    IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        week INTEGER NOT NULL,
        score REAL,
        is_formula INTEGER DEFAULT 0,
        formula_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (season_id) REFERENCES seasons (id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        UNIQUE (season_id, player_id, week)
    );

CREATE TABLE
    IF NOT EXISTS calculated_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        calculation_type TEXT NOT NULL,
        value REAL NOT NULL,
        calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (season_id) REFERENCES seasons (id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        UNIQUE (season_id, player_id, calculation_type)
    );

CREATE INDEX IF NOT EXISTS idx_scores_season_player ON scores (season_id, player_id);

CREATE INDEX IF NOT EXISTS idx_scores_season_week ON scores (season_id, week);

CREATE INDEX IF NOT EXISTS idx_season_players_season ON season_players (season_id);

CREATE INDEX IF NOT EXISTS idx_season_players_player ON season_players (player_id);

CREATE INDEX IF NOT EXISTS idx_calculated_scores_season_player ON calculated_scores (season_id, player_id);

-- Seed players (Season 6 has 8; others use subset)
INSERT
OR IGNORE INTO players (name, display_order)
VALUES
    ('Hunter', 0),
    ('Trevor', 1),
    ('Konner', 2),
    ('Silas', 3),
    ('Jason', 4),
    ('Brad', 5),
    ('Tyler', 6),
    ('Graham', 7);

-- Seed seasons
INSERT
OR IGNORE INTO seasons (
    season_id,
    title,
    description,
    status,
    champion_player_id,
    sheet_url,
    playoff_format,
    weeks_count,
    drop_lowest_count
)
VALUES
    ('season1', 'Season 1', '🏆 Hunter Thomas', 'completed', (SELECT id FROM players WHERE name = 'Hunter'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1134880669&single=true', 'six_player', 10, 2),
    ('season2', 'Season 2', '🏆 Hunter Thomas', 'completed', (SELECT id FROM players WHERE name = 'Hunter'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1204258671&single=true', 'six_player', 10, 2),
    ('season3', 'Season 3', '🏆 Hunter Thomas', 'completed', (SELECT id FROM players WHERE name = 'Hunter'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=0&single=true', 'six_player', 10, 2),
    ('season4', 'Season 4', '🏆 Trevor Staub', 'completed', (SELECT id FROM players WHERE name = 'Trevor'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1919204812&single=true', 'six_player', 10, 2),
    ('season5', 'Season 5', '🏆 Trevor Staub', 'completed', (SELECT id FROM players WHERE name = 'Trevor'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=643864506&single=true', 'seven_player', 10, 2),
    ('season6', 'Season 6', '🏆 Hunter Thomas', 'completed', (SELECT id FROM players WHERE name = 'Hunter'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=154588723&single=true', 'eight_player', 10, 2),
    ('season7', 'Season 7', '🏆 Hunter Thomas', 'completed', (SELECT id FROM players WHERE name = 'Hunter'), 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=154588723&single=true', 'eight_player', 10, 2),
    ('season8', 'Season 8', 'Current season', 'current', NULL, 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=154588723&single=true', 'eight_player', 10, 2);

UPDATE seasons
SET
    title = CASE season_id
        WHEN 'season1' THEN 'Season 1'
        WHEN 'season2' THEN 'Season 2'
        WHEN 'season3' THEN 'Season 3'
        WHEN 'season4' THEN 'Season 4'
        WHEN 'season5' THEN 'Season 5'
        WHEN 'season6' THEN 'Season 6'
        WHEN 'season7' THEN 'Season 7'
        WHEN 'season8' THEN 'Season 8'
        ELSE title
    END,
    status = CASE season_id WHEN 'season8' THEN 'current' ELSE 'completed' END,
    champion_player_id = CASE season_id
        WHEN 'season4' THEN (SELECT id FROM players WHERE name = 'Trevor')
        WHEN 'season5' THEN (SELECT id FROM players WHERE name = 'Trevor')
        WHEN 'season8' THEN NULL
        ELSE (SELECT id FROM players WHERE name = 'Hunter')
    END,
    playoff_format = CASE season_id
        WHEN 'season5' THEN 'seven_player'
        WHEN 'season6' THEN 'eight_player'
        WHEN 'season7' THEN 'eight_player'
        WHEN 'season8' THEN 'eight_player'
        ELSE 'six_player'
    END,
    weeks_count = 10,
    drop_lowest_count = 2
WHERE season_id IN ('season1', 'season2', 'season3', 'season4', 'season5', 'season6', 'season7', 'season8');

-- Season–player links (seasons 1–4: 6 players; season5: 7; seasons 6 and later: 8)
INSERT
OR IGNORE INTO season_players (season_id, player_id, display_order)
SELECT
    s.id,
    p.id,
    p.display_order
FROM
    seasons s,
    players p
WHERE
    s.season_id IN ('season1', 'season2', 'season3', 'season4')
    AND p.name != 'Tyler'
UNION ALL
SELECT
    s.id,
    p.id,
    p.display_order
FROM
    seasons s,
    players p
WHERE
    s.season_id = 'season5'
    AND p.name != 'Graham'
UNION ALL
SELECT
    s.id,
    p.id,
    p.display_order
FROM
    seasons s,
    players p
WHERE
    s.season_id IN ('season6', 'season7', 'season8');
