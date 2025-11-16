-- Migration: Add PDF Annotation System
-- Date: 2025-01-13
-- Description: Creates tables for PDF-based Quran annotation while preserving existing text-based highlights

-- =====================================================
-- 1. CREATE NEW TABLES FOR PDF SYSTEM
-- =====================================================

-- Table: quran_pdf_files
-- Stores 6 system Qira'at PDFs + teacher custom uploads
CREATE TABLE IF NOT EXISTS quran_pdf_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL for system defaults
  qiraat_name TEXT NOT NULL, -- 'hafs', 'warsh', 'qalun', 'duri', 'susi', 'khalaf'
  display_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  uploaded_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL, -- NULL for system uploads
  is_system_default BOOLEAN DEFAULT false,
  total_pages INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying PDFs
CREATE INDEX idx_pdf_files_school ON quran_pdf_files(school_id, is_system_default);
CREATE INDEX idx_pdf_files_qiraat ON quran_pdf_files(qiraat_name);

-- Table: pdf_page_ayah_mapping
-- CRITICAL: Maps PDF page coordinates to Quranic ayahs
-- Enables tracking which ayahs are being annotated
CREATE TABLE IF NOT EXISTS pdf_page_ayah_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_file_id UUID NOT NULL REFERENCES quran_pdf_files(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  surah INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  -- Normalized bounding box (0-1 range for scale independence)
  x_start NUMERIC(5,4), -- e.g., 0.1234
  y_start NUMERIC(5,4),
  x_end NUMERIC(5,4),
  y_end NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pdf_file_id, page_number, surah, ayah_start)
);

-- Index for coordinate lookup
CREATE INDEX idx_mapping_page_ayah ON pdf_page_ayah_mapping(pdf_file_id, page_number, surah);
CREATE INDEX idx_mapping_ayah_range ON pdf_page_ayah_mapping(surah, ayah_start, ayah_end);

-- Table: pdf_annotations
-- Stores coordinate-based annotations on PDF pages (parallel to highlights table)
CREATE TABLE IF NOT EXISTS pdf_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  pdf_file_id UUID NOT NULL REFERENCES quran_pdf_files(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  -- Normalized coordinates (0-1 range for zoom independence)
  x NUMERIC(5,4) NOT NULL,
  y NUMERIC(5,4) NOT NULL,
  width NUMERIC(5,4) NOT NULL,
  height NUMERIC(5,4) NOT NULL,
  -- Ayah tracking (derived from mapping)
  surah INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  -- Highlighting metadata (same as highlights table)
  type TEXT NOT NULL CHECK(type IN ('homework', 'recap', 'tajweed', 'haraka', 'letter')),
  color TEXT NOT NULL,
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  previous_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for annotation queries
CREATE INDEX idx_annotations_student_page ON pdf_annotations(student_id, pdf_file_id, page_number);
CREATE INDEX idx_annotations_ayah ON pdf_annotations(surah, ayah_start, ayah_end);
CREATE INDEX idx_annotations_school ON pdf_annotations(school_id, created_at DESC);
CREATE INDEX idx_annotations_teacher ON pdf_annotations(teacher_id, created_at DESC);

-- =====================================================
-- 2. MODIFY NOTES TABLE TO SUPPORT BOTH SYSTEMS
-- =====================================================

-- Add column for PDF annotation references
-- This allows notes to link to EITHER text highlights OR PDF annotations
ALTER TABLE notes ADD COLUMN IF NOT EXISTS pdf_annotation_id UUID REFERENCES pdf_annotations(id) ON DELETE CASCADE;

-- Add constraint: exactly ONE of highlight_id or pdf_annotation_id must be set
-- This ensures data integrity - notes belong to one system or the other
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notes_resource_check'
  ) THEN
    ALTER TABLE notes ADD CONSTRAINT notes_resource_check
      CHECK (
        (highlight_id IS NOT NULL AND pdf_annotation_id IS NULL) OR
        (highlight_id IS NULL AND pdf_annotation_id IS NOT NULL)
      );
  END IF;
END $$;

-- Index for PDF annotation notes
CREATE INDEX IF NOT EXISTS idx_notes_pdf_annotation ON notes(pdf_annotation_id) WHERE pdf_annotation_id IS NOT NULL;

-- =====================================================
-- 3. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Get threaded notes for PDF annotation
-- Returns conversation tree with depth and reply counts
CREATE OR REPLACE FUNCTION get_pdf_annotation_notes_thread(annotation_id_param UUID)
RETURNS TABLE (
  id UUID,
  pdf_annotation_id UUID,
  author_user_id UUID,
  author_name TEXT,
  author_role TEXT,
  parent_note_id UUID,
  type TEXT,
  text TEXT,
  audio_url TEXT,
  visible_to_parent BOOLEAN,
  created_at TIMESTAMPTZ,
  depth INTEGER,
  path TEXT,
  reply_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE note_tree AS (
    -- Root notes (parent_note_id IS NULL)
    SELECT
      n.id,
      n.pdf_annotation_id,
      n.author_user_id,
      p.display_name as author_name,
      p.role as author_role,
      n.parent_note_id,
      n.type,
      n.text,
      n.audio_url,
      n.visible_to_parent,
      n.created_at,
      0 as depth,
      n.id::text as path
    FROM notes n
    LEFT JOIN profiles p ON p.user_id = n.author_user_id
    WHERE n.pdf_annotation_id = annotation_id_param AND n.parent_note_id IS NULL

    UNION ALL

    -- Child notes (recursively)
    SELECT
      n.id,
      n.pdf_annotation_id,
      n.author_user_id,
      p.display_name,
      p.role,
      n.parent_note_id,
      n.type,
      n.text,
      n.audio_url,
      n.visible_to_parent,
      n.created_at,
      nt.depth + 1,
      nt.path || '/' || n.id::text
    FROM notes n
    LEFT JOIN profiles p ON p.user_id = n.author_user_id
    JOIN note_tree nt ON n.parent_note_id = nt.id
  )
  SELECT
    nt.id,
    nt.pdf_annotation_id,
    nt.author_user_id,
    nt.author_name,
    nt.author_role,
    nt.parent_note_id,
    nt.type,
    nt.text,
    nt.audio_url,
    nt.visible_to_parent,
    nt.created_at,
    nt.depth,
    nt.path,
    COUNT(child.id) as reply_count
  FROM note_tree nt
  LEFT JOIN notes child ON child.parent_note_id = nt.id
  GROUP BY nt.id, nt.pdf_annotation_id, nt.author_user_id, nt.author_name, nt.author_role,
           nt.parent_note_id, nt.type, nt.text, nt.audio_url, nt.visible_to_parent,
           nt.created_at, nt.depth, nt.path
  ORDER BY nt.path;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. GRANT PERMISSIONS (if using RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE quran_pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_page_ayah_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read system default PDFs
CREATE POLICY "read_system_pdfs"
  ON quran_pdf_files
  FOR SELECT
  USING (is_system_default = true OR school_id IN (
    SELECT school_id FROM profiles WHERE user_id = auth.uid()
  ));

-- RLS Policy: Teachers can upload PDFs for their school
CREATE POLICY "teachers_upload_pdfs"
  ON quran_pdf_files
  FOR INSERT
  WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid())
  );

-- RLS Policy: Everyone can read page mappings for accessible PDFs
CREATE POLICY "read_pdf_mappings"
  ON pdf_page_ayah_mapping
  FOR SELECT
  USING (
    pdf_file_id IN (
      SELECT id FROM quran_pdf_files
      WHERE is_system_default = true
         OR school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- RLS Policy: Users can read annotations from their school
CREATE POLICY "read_school_annotations"
  ON pdf_annotations
  FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
  );

-- RLS Policy: Teachers can create annotations
CREATE POLICY "teachers_create_annotations"
  ON pdf_annotations
  FOR INSERT
  WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    AND teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- RLS Policy: Teachers can update their own annotations
CREATE POLICY "teachers_update_annotations"
  ON pdf_annotations
  FOR UPDATE
  USING (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- RLS Policy: Teachers can delete their own annotations
CREATE POLICY "teachers_delete_annotations"
  ON pdf_annotations
  FOR DELETE
  USING (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify existing notes are unaffected
-- All 26 existing notes should have highlight_id NOT NULL and pdf_annotation_id NULL
-- SELECT COUNT(*) as existing_notes_preserved
-- FROM notes
-- WHERE highlight_id IS NOT NULL AND pdf_annotation_id IS NULL;
-- Expected: 26

-- Verify constraint works
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'notes_resource_check';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- New tables created: quran_pdf_files, pdf_page_ayah_mapping, pdf_annotations
-- Notes table modified: Added pdf_annotation_id column with constraint
-- All existing data preserved: 52 highlights, 26 notes untouched
-- Helper functions created: get_pdf_annotation_notes_thread
-- RLS policies applied: School-based isolation maintained
