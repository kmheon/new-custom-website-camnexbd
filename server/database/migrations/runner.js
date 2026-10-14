/**
 * Schema Migration Runner
 * Applies SQL schema migrations idempotently and records them in `schema_migrations`.
 */

const fs = require('fs');
const path = require('path');

function runMigrations(db) {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const appliedRows = db.prepare('SELECT version FROM schema_migrations').all();
    const appliedSet = new Set(appliedRows.map(r => r.version));

    const newlyApplied = [];

    for (const file of files) {
      const version = file.split('_')[0];
      if (!appliedSet.has(version)) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Execute migration inside a transaction
        const executeMigration = db.transaction(() => {
          db.exec(sql);
          db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, file);
        });

        executeMigration();
        newlyApplied.push(file);
        console.log(`[MIGRATION APPLIED] ${file}`);
      }
    }

    return { success: true, applied: newlyApplied };
  } catch (err) {
    console.error('[MIGRATION ERROR]', err.message);
    throw err;
  }
}

module.exports = { runMigrations };

