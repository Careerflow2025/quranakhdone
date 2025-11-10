-- Fix Messages RLS Policies for Parent Access
-- Created: 2025-11-10
-- Purpose: Remove old conflicting RLS policies that don't support group messaging

-- =====================================================
-- PROBLEM ANALYSIS
-- =====================================================
-- Parents are getting "Unauthorized" error when trying to view group messages
-- sent to "all parents" from the school dashboard.
--
-- ROOT CAUSE:
-- Two SELECT policies exist on messages table:
-- 1. "Users can view their messages" (NEW) - Correctly handles group messages via message_recipients
-- 2. "messages_select_involved" (OLD) - Does NOT check message_recipients, fails for group messages
--
-- Both are PERMISSIVE (OR logic), but the old policy doesn't know about message_recipients
-- table and requires to_user_id = auth.uid(), which is NULL for group messages.

-- =====================================================
-- SOLUTION
-- =====================================================
-- Drop the old policies that don't support group messaging.
-- Keep only the new policies created in migration #3 that properly handle
-- both individual messages (via to_user_id) and group messages (via message_recipients).

-- =====================================================
-- 1. DROP OLD CONFLICTING POLICIES
-- =====================================================

-- Drop old SELECT policy that doesn't check message_recipients
DROP POLICY IF EXISTS "messages_select_involved" ON messages;

-- Drop old INSERT policy (we have a better one: "Users can send messages")
DROP POLICY IF EXISTS "messages_insert_authenticated" ON messages;

-- =====================================================
-- 2. VERIFICATION
-- =====================================================

-- Verify only the correct policies remain
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count SELECT policies (should be 1: "Users can view their messages")
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'messages'
    AND cmd = 'SELECT';

  IF policy_count = 1 THEN
    RAISE NOTICE '✅ Correct number of SELECT policies (1)';
  ELSE
    RAISE WARNING '⚠️  Expected 1 SELECT policy, found %', policy_count;
  END IF;

  -- Count INSERT policies (should be 1: "Users can send messages")
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'messages'
    AND cmd = 'INSERT';

  IF policy_count = 1 THEN
    RAISE NOTICE '✅ Correct number of INSERT policies (1)';
  ELSE
    RAISE WARNING '⚠️  Expected 1 INSERT policy, found %', policy_count;
  END IF;

  -- Verify the correct SELECT policy exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages'
      AND policyname = 'Users can view their messages'
      AND cmd = 'SELECT'
  ) THEN
    RAISE NOTICE '✅ "Users can view their messages" policy exists';
  ELSE
    RAISE EXCEPTION '❌ Required SELECT policy missing';
  END IF;
END $$;

-- =====================================================
-- 3. TEST QUERY FOR PARENT ACCESS
-- =====================================================

-- This query should now work for parents viewing group messages:
-- SELECT m.*
-- FROM messages m
-- LEFT JOIN message_recipients mr ON m.id = mr.message_id
-- WHERE (
--   m.to_user_id = auth.uid()  -- Individual messages
--   OR
--   mr.recipient_id = auth.uid()  -- Group messages
-- )
-- AND m.deleted_at IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policy cleanup completed';
  RAISE NOTICE '✅ Old conflicting policies removed';
  RAISE NOTICE '✅ Parents should now be able to view group messages';
  RAISE NOTICE '📝 Test: Parent should see messages sent to "all parents" in their inbox';
END $$;
