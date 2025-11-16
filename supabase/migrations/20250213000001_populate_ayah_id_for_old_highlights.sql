-- =====================================================
-- POPULATE AYAH_ID FOR OLD HIGHLIGHTS
-- =====================================================
-- Created: 2025-02-13
-- Purpose: Fix old highlights to work with MushafPageViewer by populating ayah_id
--          in the format "surah:ayah" that the viewer expects

-- Update highlights that have surah/ayah_start but missing/incorrect ayah_id format
UPDATE highlights
SET ayah_id = surah::text || ':' || ayah_start::text
WHERE surah IS NOT NULL
  AND ayah_start IS NOT NULL
  AND (
    ayah_id IS NULL
    OR ayah_id NOT LIKE '%:%'  -- ayah_id should be in "surah:ayah" format
  );

-- Add index for performance on the new ayah_id format
CREATE INDEX IF NOT EXISTS idx_highlights_ayah_id ON highlights(ayah_id);

-- Add comment
COMMENT ON COLUMN highlights.ayah_id IS 'Ayah identifier in format "surah:ayah" (e.g., "1:1" for Al-Fatiha verse 1)';
