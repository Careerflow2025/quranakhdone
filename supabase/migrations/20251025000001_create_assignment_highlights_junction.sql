-- Migration: Create assignment_highlights junction table
-- Purpose: Enable many-to-many relationship between assignments and highlights
-- Date: 2025-10-25

-- Create assignment_highlights junction table
create table if not exists assignment_highlights (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  highlight_id uuid not null references highlights(id) on delete cascade,
  created_at timestamptz default now(),

  -- Prevent duplicate assignment-highlight links
  unique (assignment_id, highlight_id)
);

-- Enable Row Level Security
alter table assignment_highlights enable row level security;

-- RLS Policy: Users can only read assignment-highlight links from their school
create policy "read_assignment_highlights_same_school"
  on assignment_highlights for select
  using (
    exists (
      select 1 from assignments a
      join profiles p on p.school_id = a.school_id
      where a.id = assignment_highlights.assignment_id
        and p.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only insert assignment-highlight links for their school
create policy "insert_assignment_highlights_same_school"
  on assignment_highlights for insert
  with check (
    exists (
      select 1 from assignments a
      join profiles p on p.school_id = a.school_id
      where a.id = assignment_highlights.assignment_id
        and p.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only delete assignment-highlight links from their school
create policy "delete_assignment_highlights_same_school"
  on assignment_highlights for delete
  using (
    exists (
      select 1 from assignments a
      join profiles p on p.school_id = a.school_id
      where a.id = assignment_highlights.assignment_id
        and p.user_id = auth.uid()
    )
  );

-- Performance indexes for fast lookups
create index idx_assignment_highlights_assignment
  on assignment_highlights(assignment_id);

create index idx_assignment_highlights_highlight
  on assignment_highlights(highlight_id);

-- Comments for documentation
comment on table assignment_highlights is 'Junction table linking assignments to highlights (many-to-many relationship)';
comment on column assignment_highlights.assignment_id is 'Foreign key to assignments table';
comment on column assignment_highlights.highlight_id is 'Foreign key to highlights table';
comment on column assignment_highlights.created_at is 'Timestamp when the link was created';
