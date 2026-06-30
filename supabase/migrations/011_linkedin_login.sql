-- LinkedIn as login (Wave 4). LinkedIn connect now doubles as a login: a given
-- LinkedIn identity (linkedin_sub) maps to exactly one account, and connecting
-- an already-known identity signs the user into that account.
--
-- Two changes make this work:
--   1. linkedin_sub is unique - one LinkedIn identity owns at most one account,
--      so the server can resolve "whose account is this?" unambiguously.
--   2. access_token becomes nullable - "Disconnect" clears the publish token but
--      KEEPS the row, preserving the linkedin_sub -> account mapping. Without this
--      a passwordless user who disconnects could never log back in via LinkedIn.
--
-- "Connected for publishing" therefore means: row exists AND access_token IS NOT NULL.

alter table public.linkedin_connections alter column access_token drop not null;

alter table public.linkedin_connections add constraint linkedin_connections_sub_key unique (linkedin_sub);
