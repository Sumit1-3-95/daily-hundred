-- Daily Hundred: reading collection
-- books: your shelf (reading / next / read). book_notes: a journal entry each time you read.
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  total_pages int not null default 0,
  pages_read int not null default 0,
  status text not null default 'next' check (status in ('reading','next','read')),
  started_on date,
  finished_on date,
  rating int check (rating between 1 and 5),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  day date not null default current_date,
  pages int not null default 0,       -- pages read in this session
  note text,
  created_at timestamptz not null default now()
);
create index if not exists book_notes_book on public.book_notes (book_id, created_at desc);

alter table public.books enable row level security;
alter table public.book_notes enable row level security;
drop policy if exists "own rows" on public.books;
create policy "own rows" on public.books for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own rows" on public.book_notes;
create policy "own rows" on public.book_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
