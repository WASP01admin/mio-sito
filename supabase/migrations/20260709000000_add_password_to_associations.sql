-- Add password field to associations table for admin display
alter table associations
  add column if not exists password text;
