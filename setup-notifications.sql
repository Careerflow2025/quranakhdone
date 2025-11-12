-- Execute this SQL in Supabase SQL Editor to create notifications table

-- Create notifications table for real-time notification badges
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

  -- Section and notification details
  section text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,

  -- Optional metadata for navigation
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Read status
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON public.notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_section ON public.notifications(section);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_section_unread ON public.notifications(user_id, section, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications from their school
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND school_id IN (
      SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND school_id IN (
      SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND school_id IN (
      SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- System/Admin can create notifications (via service role)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND school_id IN (
      SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.notifications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to mark all notifications as read for a user in a specific section
CREATE OR REPLACE FUNCTION public.mark_section_notifications_read(
  p_user_id uuid,
  p_section text
)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET
    read = true,
    read_at = now()
  WHERE
    user_id = p_user_id
    AND section = p_section
    AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification counts per section for a user
CREATE OR REPLACE FUNCTION public.get_unread_notification_counts(p_user_id uuid)
RETURNS TABLE(section text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.section,
    COUNT(*)::bigint
  FROM public.notifications n
  WHERE
    n.user_id = p_user_id
    AND n.read = false
  GROUP BY n.section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_section_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_counts TO authenticated;
