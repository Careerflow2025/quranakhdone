BEGIN;
-- Ensure storage bucket for annotated renders exists (manual Supabase step: create bucket `annotated-renders`)
-- Adjust RLS policies for annotations
DROP POLICY IF EXISTS annotations_school_isolation ON public.annotations;
CREATE POLICY annotations_school_isolation_select ON public.annotations
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY annotations_school_isolation_insert ON public.annotations
  FOR INSERT TO authenticated
  WITH CHECK (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- Annotated renders policies
DROP POLICY IF EXISTS annotated_renders_isolation ON public.annotated_renders;
CREATE POLICY annotated_renders_select ON public.annotated_renders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s JOIN users u ON s.parent_user_id = u.id WHERE annotated_renders.student_id = s.id AND (u.id = auth.uid() OR s.school_id IN (SELECT school_id FROM users WHERE id = auth.uid()))));
COMMIT;