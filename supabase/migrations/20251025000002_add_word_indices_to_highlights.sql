-- Migration: Add word-level indices to highlights table
-- Purpose: Enable single-word highlighting instead of only full ayah highlights
-- Date: 2025-10-25

-- Add word_start and word_end columns to highlights table
alter table highlights
  add column if not exists word_start int,
  add column if not exists word_end int;

-- Create index for performance on word-level queries
create index if not exists idx_highlights_word_range
  on highlights(ayah_start, word_start, word_end);

-- Comments for documentation
comment on column highlights.word_start is 'Starting word index within the ayah (0-based). NULL means entire ayah.';
comment on column highlights.word_end is 'Ending word index within the ayah (0-based). NULL means entire ayah.';
