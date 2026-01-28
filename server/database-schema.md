# Database Schema Design for Putting League

## Current Structure
Currently using a key-value approach where cells are stored with keys like "row-col" (e.g., "0-0", "1-2").

## Proposed Relational Structure

### Tables

#### 1. `players` - Store player information
```sql
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER, -- For consistent ordering
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `seasons` - Store season information
```sql
CREATE TABLE seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id TEXT NOT NULL UNIQUE, -- e.g., 'season1', 'season2'
    title TEXT NOT NULL, -- e.g., 'Season 1'
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `season_players` - Junction table for players participating in each season
```sql
CREATE TABLE season_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    display_order INTEGER, -- Column position in the table (0-6)
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(season_id, player_id)
);
```

#### 4. `scores` - Store individual scores
```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    week INTEGER NOT NULL, -- Week number (1-10)
    score REAL, -- The actual score (can be NULL if not entered)
    is_formula INTEGER DEFAULT 0, -- Whether this is a formula cell
    formula_text TEXT, -- The formula if is_formula = 1
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(season_id, player_id, week)
);
```

#### 5. `calculated_scores` - Store calculated values (row 11: total, row 12: total minus two lowest)
```sql
CREATE TABLE calculated_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    calculation_type TEXT NOT NULL, -- 'total' or 'total_minus_two_lowest'
    value REAL NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(season_id, player_id, calculation_type)
);
```

## Indexes for Performance

```sql
CREATE INDEX idx_scores_season_player ON scores(season_id, player_id);
CREATE INDEX idx_scores_season_week ON scores(season_id, week);
CREATE INDEX idx_scores_player_week ON scores(player_id, week);
CREATE INDEX idx_season_players_season ON season_players(season_id);
CREATE INDEX idx_season_players_player ON season_players(player_id);
CREATE INDEX idx_calculated_scores_season_player ON calculated_scores(season_id, player_id);
```

## Migration Strategy

### Phase 1: Create new tables alongside existing `cells` table
- Create all new tables
- Keep existing `cells` table for backward compatibility

### Phase 2: Migrate existing data
- Parse cell_key format (row-col) to extract week and player position
- Map player positions to player names based on season
- Insert into new relational tables

### Phase 3: Update API endpoints
- Create new endpoints for relational queries
- Keep old endpoints for backward compatibility during transition

### Phase 4: Update frontend
- Gradually migrate frontend to use new API endpoints
- Test thoroughly before removing old endpoints

## Example Queries

### Get all scores for a season
```sql
SELECT 
    p.name,
    s.week,
    s.score,
    s.is_formula,
    s.formula_text
FROM scores s
JOIN players p ON s.player_id = p.id
JOIN seasons se ON s.season_id = se.id
WHERE se.season_id = 'season6'
ORDER BY sp.display_order, s.week;
```

### Get leaderboard (total minus two lowest)
```sql
SELECT 
    p.name,
    cs.value as score
FROM calculated_scores cs
JOIN players p ON cs.player_id = p.id
JOIN seasons se ON cs.season_id = se.id
WHERE se.season_id = 'season6' 
  AND cs.calculation_type = 'total_minus_two_lowest'
ORDER BY cs.value DESC;
```

### Get player's scores for a season
```sql
SELECT 
    week,
    score,
    is_formula,
    formula_text
FROM scores
WHERE season_id = (SELECT id FROM seasons WHERE season_id = 'season6')
  AND player_id = (SELECT id FROM players WHERE name = 'Hunter')
ORDER BY week;
```

## Benefits of This Structure

1. **Normalized**: No data duplication, easier to maintain
2. **Queryable**: Easy to get player stats, season comparisons, etc.
3. **Extensible**: Easy to add new features (player profiles, historical stats, etc.)
4. **Type-safe**: Proper data types (REAL for scores, INTEGER for weeks)
5. **Referential Integrity**: Foreign keys ensure data consistency
6. **Performance**: Indexes optimize common queries
