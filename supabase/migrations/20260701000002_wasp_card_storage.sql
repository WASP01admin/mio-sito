-- Private bucket for member photos (shown on the user's own wallet card
-- only, never displayed publicly). Access goes through the service-role
-- client only, so the bucket itself stays non-public.
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', false)
on conflict (id) do nothing;
