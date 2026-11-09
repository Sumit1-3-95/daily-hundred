-- Sumit's starting shelf. Page counts other than Strategy Rules are approximate; edit them in the app.
insert into public.books (user_id, title, author, total_pages, pages_read, status, finished_on, started_on, sort)
select u.id, b.title, b.author, b.total, b.read, b.status, b.finished::date, b.started::date, b.sort
from auth.users u, (values
  ('Strategy Rules', 'David Yoffie & Michael Cusumano', 250, 150, 'reading', null, null, 0),
  ('Meditations', 'Marcus Aurelius', 254, 0, 'next', null, null, 1),
  ('The Cold Start Problem', 'Andrew Chen', 368, 368, 'read', null, null, 2),
  ('The Almanack of Naval Ravikant', 'Eric Jorgenson', 244, 244, 'read', null, null, 3)
) as b(title, author, total, read, status, finished, started, sort)
where u.email = 'sumit.sharma.na08@gmail.com'
  and not exists (select 1 from public.books x where x.user_id = u.id and x.title = b.title);
