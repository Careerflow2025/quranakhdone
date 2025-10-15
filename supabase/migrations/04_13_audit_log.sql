BEGIN;
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id),
  role TEXT,
  event_key TEXT NOT NULL,
  entity_id UUID,
  entity_type TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_admin_only ON public.audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role='school_admin' AND school_id=audit_log.school_id));
COMMIT;