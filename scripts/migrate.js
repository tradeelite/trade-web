#!/usr/bin/env node

/**
 * Database migration script for Trade App.
 * Creates the SQLite database and runs all Drizzle migrations.
 *
 * Usage: node scripts/migrate.js
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "trade.db");
const MIGRATION_DIR = path.join(process.cwd(), "drizzle");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log("📁 Created data directory");
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Read and execute migration files
const files = fs
  .readdirSync(MIGRATION_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let applied = 0;

for (const file of files) {
  const hash = file.replace(".sql", "");

  // Check if migration already applied
  const existing = db
    .prepare("SELECT id FROM __drizzle_migrations WHERE hash = ?")
    .get(hash);

  if (existing) {
    console.log(`  ⏭  Skipping ${file} (already applied)`);
    continue;
  }

  console.log(`  ▶  Running ${file}...`);
  const sql = fs.readFileSync(path.join(MIGRATION_DIR, file), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  const runMigration = db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt);
    }
    db.prepare("INSERT INTO __drizzle_migrations (hash) VALUES (?)").run(hash);
  });

  runMigration();
  applied++;
  console.log(`  ✅ Applied ${file}`);
}

// Set default settings
const insert = db.prepare(
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)"
);
insert.run("data_provider", "yahoo");
insert.run("theme", "system");

db.close();

console.log(
  `\n✅ Database ready at ${DB_PATH} (${applied} migration${applied !== 1 ? "s" : ""} applied)`
);
