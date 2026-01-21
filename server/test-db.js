// Quick test script to verify database is working
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'puttingleague.db');

console.log('Testing database connection...');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file does not exist!');
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  
  // Test reading
  const stmt = db.prepare('SELECT COUNT(*) as count FROM cells');
  const result = stmt.get();
  console.log('✅ Database connection successful');
  console.log(`📊 Total cells in database: ${result.count}`);
  
  // Show some sample cells
  const sampleStmt = db.prepare('SELECT cell_key, value, is_formula FROM cells LIMIT 5');
  const samples = sampleStmt.all();
  
  if (samples.length > 0) {
    console.log('\n📝 Sample cells:');
    samples.forEach(cell => {
      console.log(`  - ${cell.cell_key}: "${cell.value}" (formula: ${cell.is_formula === 1})`);
    });
  } else {
    console.log('\n⚠️  No cells found in database');
  }
  
  db.close();
  console.log('\n✅ Database test complete');
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}
