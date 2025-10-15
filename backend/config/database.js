const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection with better error handling
let db;
try {
  db = new Database(dbPath, {
    verbose: console.log,
    fileMustExist: false
  });

  // Enable foreign keys and WAL mode for better concurrency
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  console.log('✅ Connected to SQLite database');
} catch (err) {
  console.error('❌ Failed to connect to database:', err);
  process.exit(1);
}

// Initialize database schema if needed
const initDatabase = () => {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');

  if (fs.existsSync(schemaPath)) {
    try {
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Split by semicolons but be careful with triggers
      const statements = schema.split(/;\s*$/m).filter(s => s.trim());

      const transaction = db.transaction(() => {
        statements.forEach((statement) => {
          if (statement.trim()) {
            try {
              db.exec(statement);
            } catch (err) {
              if (!err.message.includes('already exists')) {
                console.error('Error executing statement:', err.message);
              }
            }
          }
        });
      });

      transaction();
      console.log('✅ Database schema initialized');
    } catch (err) {
      console.error('❌ Failed to initialize database schema:', err);
    }
  } else {
    console.log('⚠️  No schema.sql found, assuming database is already set up');
  }
};

// Initialize on first run
initDatabase();

// Export both the db directly and as a dbManager object
module.exports = {
  getDb: () => db,
  db: db,
  close: () => {
    if (db) {
      db.close();
      console.log('Database connection closed');
    }
  },
  dbPath: dbPath
};

// Also export db directly for backward compatibility
module.exports.default = db;