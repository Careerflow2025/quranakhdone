-- Pen Annotations Table
-- Professional implementation with container-relative coordinates
-- Created: 2025-01-30

-- Create pen_annotations table
CREATE TABLE IF NOT EXISTS pen_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  script_id TEXT NOT NULL,
  surah INTEGER,
  ayah INTEGER,
  drawing_data JSONB NOT NULL, -- {version, paths: [{points: [{x, y}], color, width}], containerDimensions, timestamp}
  stroke_color TEXT NOT NULL DEFAULT '#FF0000',
  stroke_width INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique annotation per teacher-student-page-script combination
  UNIQUE(teacher_id, student_id, page_number, script_id)
);

-- Create indexes for performance
CREATE INDEX idx_pen_annotations_student ON pen_annotations(student_id);
CREATE INDEX idx_pen_annotations_teacher ON pen_annotations(teacher_id);
CREATE INDEX idx_pen_annotations_school ON pen_annotations(school_id);
CREATE INDEX idx_pen_annotations_page ON pen_annotations(page_number);
CREATE INDEX idx_pen_annotations_lookup ON pen_annotations(student_id, page_number, script_id);

-- Enable Row Level Security
ALTER TABLE pen_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Teachers can insert annotations for students in their school
CREATE POLICY "Teachers can create pen annotations"
  ON pen_annotations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN profiles p ON p.user_id = t.user_id
      WHERE t.id = pen_annotations.teacher_id
        AND p.user_id = auth.uid()
        AND t.school_id = pen_annotations.school_id
    )
  );

-- Teachers can view annotations they created
CREATE POLICY "Teachers can view their pen annotations"
  ON pen_annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN profiles p ON p.user_id = t.user_id
      WHERE t.id = pen_annotations.teacher_id
        AND p.user_id = auth.uid()
    )
  );

-- Teachers can update their own annotations
CREATE POLICY "Teachers can update their pen annotations"
  ON pen_annotations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN profiles p ON p.user_id = t.user_id
      WHERE t.id = pen_annotations.teacher_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN profiles p ON p.user_id = t.user_id
      WHERE t.id = pen_annotations.teacher_id
        AND p.user_id = auth.uid()
    )
  );

-- Teachers can delete their own annotations
CREATE POLICY "Teachers can delete their pen annotations"
  ON pen_annotations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN profiles p ON p.user_id = t.user_id
      WHERE t.id = pen_annotations.teacher_id
        AND p.user_id = auth.uid()
    )
  );

-- Students can view annotations about them (readonly)
CREATE POLICY "Students can view pen annotations about them"
  ON pen_annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.user_id = s.user_id
      WHERE s.id = pen_annotations.student_id
        AND p.user_id = auth.uid()
    )
  );

-- Parents can view annotations about their children (readonly)
CREATE POLICY "Parents can view pen annotations about their children"
  ON pen_annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents pr ON pr.id = ps.parent_id
      JOIN profiles p ON p.user_id = pr.user_id
      WHERE ps.student_id = pen_annotations.student_id
        AND p.user_id = auth.uid()
    )
  );

-- Admins and owners can view all annotations in their school
CREATE POLICY "Admins and owners can view pen annotations in their school"
  ON pen_annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.school_id = pen_annotations.school_id
        AND p.role IN ('admin', 'owner')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pen_annotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_pen_annotation_timestamp
  BEFORE UPDATE ON pen_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_pen_annotation_timestamp();

-- Add comment for documentation
COMMENT ON TABLE pen_annotations IS 'Teacher pen annotations on student Quran pages with zoom-stable container-relative coordinates';
COMMENT ON COLUMN pen_annotations.drawing_data IS 'JSON structure: {version: "2.0", paths: [{points: [{x: 0-100, y: 0-100}], color: "#HEX", width: 1-10}], containerDimensions: {width, height}, timestamp}';
COMMENT ON COLUMN pen_annotations.stroke_color IS 'Primary color of the last stroke (for quick preview)';
COMMENT ON COLUMN pen_annotations.stroke_width IS 'Width of the last stroke (for quick preview)';
