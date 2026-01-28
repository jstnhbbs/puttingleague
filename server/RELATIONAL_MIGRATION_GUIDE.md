# Relational Database Migration Guide

## Overview

This guide explains how to migrate from the current key-value cell storage to a normalized relational database structure.

## Why Migrate?

**Current Structure (Key-Value):**
- Stores data as `cell_key` (e.g., "0-0", "1-2") with values
- Hard to query (e.g., "get all scores for Hunter in Season 6")
- Difficult to generate statistics
- No referential integrity

**New Structure (Relational):**
- Normalized tables with proper relationships
- Easy to query player stats, season comparisons, etc.
- Better performance with indexes
- Type-safe data (REAL for scores, INTEGER for weeks)
- Extensible for future features

## Database Schema

See `database-schema.md` for the complete schema design.

### Key Tables:

1. **`players`** - All players (Hunter, Trevor, etc.)
2. **`seasons`** - All seasons (season1, season2, etc.)
3. **`season_players`** - Which players participated in which seasons
4. **`scores`** - Individual week scores (player + season + week)
5. **`calculated_scores`** - Calculated totals (row 11) and totals minus two lowest (row 12)

## Migration Steps

### Step 1: Review the Schema

Read `database-schema.md` to understand the structure.

### Step 2: Backup Your Database

```bash
cd server
cp data/puttingleague.db data/puttingleague.db.backup
```

### Step 3: Run the Migration

```bash
cd server
node migrate-to-relational.js
```

This will:
- Create all new tables
- Insert players and seasons
- Set up season-player relationships
- Migrate existing cell data to the new structure
- **Keep the old `cells` table** for backward compatibility

### Step 4: Verify the Migration

You can verify the migration worked by checking:

```sql
-- Check players
SELECT * FROM players;

-- Check seasons
SELECT * FROM seasons;

-- Check scores for a season
SELECT p.name, s.week, s.score 
FROM scores s
JOIN players p ON s.player_id = p.id
JOIN seasons se ON s.season_id = se.id
WHERE se.season_id = 'season6'
ORDER BY p.name, s.week;

-- Check leaderboard
SELECT p.name, cs.value
FROM calculated_scores cs
JOIN players p ON cs.player_id = p.id
JOIN seasons se ON cs.season_id = se.id
WHERE se.season_id = 'season6' 
  AND cs.calculation_type = 'total_minus_two_lowest'
ORDER BY cs.value DESC;
```

### Step 5: Update Your API (Optional)

You can gradually migrate your API endpoints to use the new relational structure. See `relational-api-examples.js` for example endpoints.

**Option A: Keep Both Systems**
- Keep existing `/api/cells` endpoints working
- Add new `/api/relational/*` endpoints
- Gradually migrate frontend to use new endpoints

**Option B: Full Migration**
- Update all endpoints to use relational structure
- Remove old `cells` table after verification

## Example Queries

### Get all scores for Season 6
```sql
SELECT 
    p.name as player,
    s.week,
    s.score
FROM scores s
JOIN players p ON s.player_id = p.id
JOIN seasons se ON s.season_id = se.id
WHERE se.season_id = 'season6'
ORDER BY p.name, s.week;
```

### Get player's average score across all seasons
```sql
SELECT 
    p.name,
    COUNT(DISTINCT s.season_id) as seasons_played,
    AVG(s.score) as avg_score,
    SUM(s.score) as total_score
FROM scores s
JOIN players p ON s.player_id = p.id
GROUP BY p.id, p.name
ORDER BY avg_score DESC;
```

### Get season comparison
```sql
SELECT 
    se.season_id,
    se.title,
    COUNT(DISTINCT s.player_id) as players,
    COUNT(s.id) as total_scores,
    AVG(s.score) as avg_score
FROM scores s
JOIN seasons se ON s.season_id = se.id
GROUP BY se.id, se.season_id, se.title
ORDER BY se.season_id;
```

## Benefits After Migration

1. **Better Queries**: Easy to get player stats, season comparisons, etc.
2. **Performance**: Indexes optimize common queries
3. **Data Integrity**: Foreign keys ensure consistency
4. **Extensibility**: Easy to add features like:
   - Player profiles
   - Historical statistics
   - Season comparisons
   - Player rankings over time
5. **Type Safety**: Proper data types (REAL for scores, INTEGER for weeks)

## Rollback Plan

If something goes wrong:

1. Stop the server
2. Restore the backup:
   ```bash
   cd server
   cp data/puttingleague.db.backup data/puttingleague.db
   ```
3. The old `cells` table is still there, so your existing code will continue to work

## Next Steps

1. **Run the migration** when ready
2. **Test thoroughly** with your existing data
3. **Gradually migrate** API endpoints (or keep both systems)
4. **Update frontend** to use new endpoints if desired
5. **Remove old `cells` table** once confident (optional)

## Questions?

- Check `database-schema.md` for schema details
- Check `relational-api-examples.js` for API examples
- The migration script includes detailed logging to help debug issues
