alter table associations
  add column if not exists email_secondary text,
  add column if not exists facebook_url text,
  add column if not exists contact_person text,
  add column if not exists notes_1 text,
  add column if not exists notes_2 text;
