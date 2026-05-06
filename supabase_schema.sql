-- ============================================================
-- Supabase schema for the Community Feedback app
-- Paste this entire file into Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Lecture feedback (one row per submission)
create table if not exists public.lecture_feedback (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  lecture_id   text        not null,
  day          int,
  title        text,
  speaker      text,
  type         text,
  rating       int  not null check (rating between 1 and 5),
  pace         int  check (pace between 0 and 2),
  takeaways    text[],
  comment      text,
  role         text,
  seniority    text,
  game_type    text
);

-- 2. Final survey (one row per submission)
create table if not exists public.final_feedback (
  id              bigserial primary key,
  created_at      timestamptz not null default now(),
  overall         int not null check (overall between 1 and 5),
  recommend       int check (recommend between 1 and 10),
  best_session    text,
  growth          text[],
  network_value   int check (network_value between 1 and 5),
  logistics       int check (logistics between 1 and 5),
  next_action     text,
  highlight       text,
  improve         text,
  role            text,
  seniority       text,
  game_type       text
);

-- 3. Enable Row Level Security and define policies
alter table public.lecture_feedback enable row level security;
alter table public.final_feedback   enable row level security;

-- Allow anyone (anon key) to INSERT submissions.
drop policy if exists "anon can insert lecture feedback" on public.lecture_feedback;
create policy "anon can insert lecture feedback"
  on public.lecture_feedback for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon can insert final feedback" on public.final_feedback;
create policy "anon can insert final feedback"
  on public.final_feedback for insert
  to anon, authenticated
  with check (true);

-- Allow anyone with the anon key to READ submissions.
-- This is fine because the data is anonymous (no names, no emails).
-- The admin page is gated by a PIN at the app level.
-- If you want stricter access, replace these policies with
-- "to authenticated" and require Supabase auth on the admin page.
drop policy if exists "anon can read lecture feedback" on public.lecture_feedback;
create policy "anon can read lecture feedback"
  on public.lecture_feedback for select
  to anon, authenticated
  using (true);

drop policy if exists "anon can read final feedback" on public.final_feedback;
create policy "anon can read final feedback"
  on public.final_feedback for select
  to anon, authenticated
  using (true);

-- Helpful index for filtering admin views
create index if not exists lecture_feedback_lecture_id_idx on public.lecture_feedback (lecture_id);
create index if not exists lecture_feedback_created_at_idx on public.lecture_feedback (created_at desc);
create index if not exists final_feedback_created_at_idx   on public.final_feedback   (created_at desc);
