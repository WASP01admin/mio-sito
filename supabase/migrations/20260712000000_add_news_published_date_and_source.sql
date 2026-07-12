-- Add published_date and original_source fields to association_news table
alter table association_news
  add column if not exists published_date date,
  add column if not exists original_source text;

-- Create index for published_date queries
create index if not exists association_news_published_date_idx on association_news(published_date desc);
