-- =====================================================
-- RESTRUCTURE HIGHLIGHTS TABLE
-- =====================================================
-- Created: 2025-02-02
-- Purpose: Simplify highlights table structure by replacing ayah_id/token references
--          with direct surah/ayah/word indices for easier querying and compatibility

-- Step 1: Add new columns
ALTER TABLE highlights
  ADD COLUMN IF NOT EXISTS surah INTEGER,
  ADD COLUMN IF NOT EXISTS ayah_start INTEGER,
  ADD COLUMN IF NOT EXISTS ayah_end INTEGER;

-- Step 2: Populate new columns from existing data
-- Extract surah and ayah numbers from the ayah_id relationship
UPDATE highlights h
SET
  surah = qa.surah,
  ayah_start = qa.ayah,
  ayah_end = qa.ayah
FROM quran_ayahs qa
WHERE h.ayah_id = qa.id
  AND h.surah IS NULL; -- Only update rows that haven't been migrated yet

-- Step 3: Make new columns NOT NULL after data migration
ALTER TABLE highlights
  ALTER COLUMN surah SET NOT NULL,
  ALTER COLUMN ayah_start SET NOT NULL,
  ALTER COLUMN ayah_end SET NOT NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_highlights_surah_ayah ON highlights(surah, ayah_start, ayah_end);
CREATE INDEX IF NOT EXISTS idx_highlights_student_surah ON highlights(student_id, surah);

-- Step 5: Add comments
COMMENT ON COLUMN highlights.surah IS 'Surah number (1-114)';
COMMENT ON COLUMN highlights.ayah_start IS 'Starting ayah number';
COMMENT ON COLUMN highlights.ayah_end IS 'Ending ayah number (for multi-ayah highlights)';
COMMENT ON COLUMN highlights.word_start IS 'Starting word index within ayah (0-based). NULL = entire ayah';
COMMENT ON COLUMN highlights.word_end IS 'Ending word index within ayah (0-based). NULL = entire ayah';

-- Step 6: Drop old columns (commented out for safety - uncomment after verification)
-- ALTER TABLE highlights DROP COLUMN IF EXISTS ayah_id;
-- ALTER TABLE highlights DROP COLUMN IF EXISTS token_start;
-- ALTER TABLE highlights DROP COLUMN IF EXISTS token_end;

-- Note: Keep ayah_id, token_start, token_end columns for now as backup
-- They can be dropped in a future migration after verifying the new structure works correctly
