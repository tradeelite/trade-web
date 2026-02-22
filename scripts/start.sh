#!/bin/sh
set -e

DB_PATH="/app/data/trade.db"

# Initialize database if it doesn't exist
if [ ! -f "$DB_PATH" ]; then
  echo "🗄️  Initializing database..."
  node -e "
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');

    const db = new Database('$DB_PATH');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Read and execute migration SQL
    const migrationDir = path.join(process.cwd(), 'drizzle');
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log('  Running migration:', file);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      // Split by statement breakpoint comments
      const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        db.exec(stmt);
      }
    }

    // Set default settings
    const insert = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
    insert.run('data_provider', 'yahoo');
    insert.run('theme', 'system');

    db.close();
    console.log('✅ Database initialized successfully');
  "
else
  echo "✅ Database exists at $DB_PATH"
fi

echo "🚀 Starting Trade App on port ${PORT:-8080}..."
exec node server.js
