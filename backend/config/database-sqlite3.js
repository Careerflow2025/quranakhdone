const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../db/quranakh.db');
    this.ensureDbDirectory();
    this.db = null;
    this.initializeDatabase();
  }

  ensureDbDirectory() {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  initializeDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database');
        
        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON');
        this.db.run('PRAGMA journal_mode = WAL');
        
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    const schema = `
      -- Schools table
      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,
        timezone TEXT DEFAULT 'Africa/Casablanca',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Users/Profiles table
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('owner','admin','teacher','student','parent')),
        display_name TEXT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Teachers
      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        bio TEXT,
        active BOOLEAN DEFAULT 1
      );

      -- Students
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        dob DATE,
        gender TEXT,
        active BOOLEAN DEFAULT 1
      );

      -- Parents
      CREATE TABLE IF NOT EXISTS parents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE
      );

      -- Parent-Student relationships
      CREATE TABLE IF NOT EXISTS parent_students (
        parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        PRIMARY KEY (parent_id, student_id)
      );

      -- Classes
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        room TEXT,
        schedule_json TEXT NOT NULL DEFAULT '{}',
        created_by TEXT REFERENCES teachers(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Class teachers
      CREATE TABLE IF NOT EXISTS class_teachers (
        class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
        teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
        PRIMARY KEY (class_id, teacher_id)
      );

      -- Class enrollments
      CREATE TABLE IF NOT EXISTS class_enrollments (
        class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
        student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
        PRIMARY KEY (class_id, student_id)
      );

      -- Quran scripts
      CREATE TABLE IF NOT EXISTS quran_scripts (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL
      );

      -- Quran ayahs
      CREATE TABLE IF NOT EXISTS quran_ayahs (
        id TEXT PRIMARY KEY,
        script_id TEXT NOT NULL REFERENCES quran_scripts(id) ON DELETE CASCADE,
        surah INTEGER NOT NULL,
        ayah INTEGER NOT NULL,
        text TEXT NOT NULL,
        token_positions TEXT NOT NULL,
        UNIQUE (script_id, surah, ayah)
      );

      -- Highlights
      CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        script_id TEXT NOT NULL REFERENCES quran_scripts(id),
        ayah_id TEXT NOT NULL REFERENCES quran_ayahs(id),
        token_start INTEGER NOT NULL,
        token_end INTEGER NOT NULL,
        mistake_type TEXT NOT NULL CHECK (mistake_type IN ('recap','tajweed','haraka','letter')),
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Notes
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        highlight_id TEXT NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
        author_user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('text','audio')),
        text TEXT,
        audio_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Assignments
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        created_by_teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','viewed','submitted','reviewed','completed','reopened')),
        due_at DATETIME NOT NULL,
        late BOOLEAN DEFAULT 0,
        reopen_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Assignment events
      CREATE TABLE IF NOT EXISTS assignment_events (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        actor_user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        from_status TEXT,
        to_status TEXT,
        meta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Assignment submissions
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Assignment attachments
      CREATE TABLE IF NOT EXISTS assignment_attachments (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        uploader_user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Rubrics
      CREATE TABLE IF NOT EXISTS rubrics (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT
      );

      -- Rubric criteria
      CREATE TABLE IF NOT EXISTS rubric_criteria (
        id TEXT PRIMARY KEY,
        rubric_id TEXT NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1,
        max_score REAL NOT NULL DEFAULT 100
      );

      -- Assignment rubrics
      CREATE TABLE IF NOT EXISTS assignment_rubrics (
        assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        rubric_id TEXT NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
        PRIMARY KEY (assignment_id, rubric_id)
      );

      -- Grades
      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        criterion_id TEXT NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
        score REAL NOT NULL,
        max_score REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Ayah mastery
      CREATE TABLE IF NOT EXISTS ayah_mastery (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        script_id TEXT NOT NULL REFERENCES quran_scripts(id),
        ayah_id TEXT NOT NULL REFERENCES quran_ayahs(id),
        level TEXT NOT NULL DEFAULT 'unknown' CHECK (level IN ('unknown','learning','proficient','mastered')),
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, script_id, ayah_id)
      );

      -- Refresh tokens
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
          return;
        }

        // Create indexes
        const indexes = [
          'CREATE INDEX IF NOT EXISTS idx_assignments_student_due ON assignments(student_id, due_at)',
          'CREATE INDEX IF NOT EXISTS idx_highlights_student_ayah ON highlights(student_id, ayah_id)',
          'CREATE INDEX IF NOT EXISTS idx_grades_assignment_student ON grades(assignment_id, student_id)',
          'CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_id)',
          'CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)'
        ];

        let completed = 0;
        indexes.forEach(indexSql => {
          this.db.run(indexSql, (err) => {
            if (err) console.error('Index creation error:', err);
            completed++;
            if (completed === indexes.length) {
              // Insert default script if not exists
              this.insertDefaultData().then(resolve).catch(reject);
            }
          });
        });
      });
    });
  }

  async insertDefaultData() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id FROM quran_scripts WHERE code = ?', ['uthmani-hafs'], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          this.db.run(`
            INSERT INTO quran_scripts (id, code, display_name) 
            VALUES (?, ?, ?)
          `, ['uthmani-hafs-001', 'uthmani-hafs', 'Uthmani Hafs'], (err) => {
            if (err) {
              console.error('Error inserting default script:', err);
              reject(err);
            } else {
              console.log('Database initialized successfully with default script');
              resolve();
            }
          });
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  }

  // Promisify common database methods for easier async/await usage
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  getDb() {
    return this;
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create and export a singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;