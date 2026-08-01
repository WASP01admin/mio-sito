-- Fix: search_associations now also searches by code
create or replace function search_associations(search_query text, result_limit int default 10)
returns setof associations
language sql
stable
as $$
  select *
  from associations
  where search_vector @@ plainto_tsquery('simple', search_query)
     or code ilike '%' || search_query || '%'
     or name % search_query
     or city % search_query
  order by
    case
      when code ilike search_query then 0  -- exact match on code wins
      when code ilike search_query || '%' then 1  -- code starts with query
      else 2
    end,
    greatest(similarity(name, search_query), similarity(city, search_query)) desc,
    ts_rank(search_vector, plainto_tsquery('simple', search_query)) desc
  limit result_limit;
$$;
