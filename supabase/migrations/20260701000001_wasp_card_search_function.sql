-- Server-side fuzzy association search: combines full-text search (handles
-- reordered words, e.g. "Cats and Dogs" query matching "Dogs and Cats") with
-- trigram similarity (handles typos). Called via supabase.rpc() so the
-- ranking logic lives in the DB, not duplicated across API routes.
create or replace function search_associations(search_query text, result_limit int default 10)
returns setof associations
language sql
stable
as $$
  select *
  from associations
  where search_vector @@ plainto_tsquery('simple', search_query)
     or name % search_query
     or city % search_query
  order by
    greatest(similarity(name, search_query), similarity(city, search_query)) desc,
    ts_rank(search_vector, plainto_tsquery('simple', search_query)) desc
  limit result_limit;
$$;
