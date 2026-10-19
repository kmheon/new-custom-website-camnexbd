const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

async function main() {
  const sqliteDbPath = path.join(__dirname, '..', 'camnex_dev.db');
  const ddlPath = path.join(__dirname, '..', 'scratch', 'mysql_schema_generated.sql');
  const outputSqlPath = path.join(__dirname, '..', 'camnex_dev_mysql_dump.sql');

  console.log('=================================================================');
  console.log('CamneX Bangladesh: SQLite to MySQL Migration Script');
  console.log('=================================================================\n');

  if (!fs.existsSync(sqliteDbPath)) {
    console.error('Error: camnex_dev.db not found at', sqliteDbPath);
    process.exit(1);
  }

  const db = new Database(sqliteDbPath, { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();

  console.log(`[1/4] Loaded source database: ${sqliteDbPath}`);
  console.log(`      Total tables found: ${tables.length}`);

  let ddlSql = '';
  if (fs.existsSync(ddlPath)) {
    ddlSql = fs.readFileSync(ddlPath, 'utf8');
  }

  // Generate complete standalone MySQL dump
  console.log('[2/4] Generating complete standalone MySQL dump with data...');
  const dumpLines = [
    '-- =============================================================================',
    '-- CamneX Platform: Standalone MySQL Development Database Dump',
    `-- Generated on: ${new Date().toISOString()}`,
    '-- Source: camnex_dev.db (Anonymized Catalog Copy)',
    '-- Character Set: utf8mb4 | Engine: InnoDB',
    '-- =============================================================================\n',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n',
    ddlSql,
    '\n-- =============================================================================',
    '-- DATA INSERT STATEMENTS',
    '-- =============================================================================\n'
  ];

  let totalMigratedRows = 0;
  const tableStats = [];

  for (const t of tables) {
    const tableName = t.name;
    const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
    tableStats.push({ table: tableName, rows: rows.length });
    
    if (rows.length === 0) continue;
    
    totalMigratedRows += rows.length;
    const cols = Object.keys(rows[0]);
    
    dumpLines.push(`-- Table: ${tableName} (${rows.length} rows)`);
    
    // Chunk inserts into batches of 50
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const valuesList = [];
      
      for (const row of chunk) {
        const valStrings = cols.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return String(val);
          if (typeof val === 'boolean') return val ? '1' : '0';
          // Escape string
          const escaped = String(val)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/\0/g, '\\0');
          return `'${escaped}'`;
        });
        valuesList.push(`(${valStrings.join(', ')})`);
      }
      
      dumpLines.push(`INSERT IGNORE INTO \`${tableName}\` (\`${cols.join('`, `')}\`) VALUES\n${valuesList.join(',\n')};`);
    }
    dumpLines.push('');
  }

  dumpLines.push('SET FOREIGN_KEY_CHECKS = 1;');
  dumpLines.push('-- End of Migration Dump');

  fs.writeFileSync(outputSqlPath, dumpLines.join('\n'), 'utf8');
  const stat = fs.statSync(outputSqlPath);
  console.log(`[3/4] Successfully generated ${outputSqlPath} (${(stat.size / 1024).toFixed(1)} KB)`);

  console.log('\n[4/4] Data Migration Reconciliation Summary:');
  console.log('-----------------------------------------------------------------');
  console.log('Table Name                    | SQLite Source | MySQL Export DDL');
  console.log('-----------------------------------------------------------------');
  for (const stat of tableStats) {
    console.log(`${stat.table.padEnd(29)} | ${String(stat.rows).padStart(13)} | ${stat.rows > 0 ? String(stat.rows).padStart(16) : '       0 (empty)'}`);
  }
  console.log('-----------------------------------------------------------------');
  console.log(`Total Records Across All Tables: ${totalMigratedRows}`);
  console.log('Total Tables Processed:         ', tables.length);
  console.log('-----------------------------------------------------------------');
  console.log('\nMigration dump ready for direct import into MySQL via cPanel phpMyAdmin or CLI.');

  db.close();

  // If MySQL credentials are provided in environment, attempt live import with full-database safety check
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    console.log('\n[LIVE IMPORT] MySQL environment detected. Connecting to MySQL host:', process.env.DB_HOST);
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
      });

      // Comprehensive Safety Check across ENTIRE database (not just products table)
      const [existingTables] = await connection.query("SHOW TABLES");
      if (existingTables && existingTables.length > 0) {
        const tableKey = Object.keys(existingTables[0])[0];
        const populated = [];
        let totalExistingRows = 0;

        for (const row of existingTables) {
          const tbl = row[tableKey];
          try {
            const [[{ count }]] = await connection.query(`SELECT COUNT(*) as count FROM \`${tbl}\``);
            if (count > 0) {
              populated.push(`${tbl} (${count})`);
              totalExistingRows += count;
            }
          } catch (_) {}
        }

        if (totalExistingRows > 0 && !process.argv.includes('--force') && !process.argv.includes('--overwrite')) {
          console.warn(`\n[SAFETY GUARD] Target database '${process.env.DB_NAME}' already contains existing data:`);
          console.warn(`               Found ${totalExistingRows} total rows across ${populated.length} tables:`);
          console.warn(`               ${populated.slice(0, 6).join(', ')}${populated.length > 6 ? '...' : ''}`);
          console.warn('[SAFETY GUARD] Automatic live import aborted to prevent accidental overwrite.');
          console.warn('[SAFETY GUARD] Run: node scripts/migrate_sqlite_to_mysql.js --force to confirm re-import.');
          await connection.end();
          return;
        }
      }

      console.log('[LIVE IMPORT] Executing migration dump...');
      await connection.query(fs.readFileSync(outputSqlPath, 'utf8'));
      console.log('[LIVE IMPORT] Completed successfully!');
      await connection.end();
    } catch (err) {
      console.error('[LIVE IMPORT ERROR]', err.message);
    }
  }
}

main().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

