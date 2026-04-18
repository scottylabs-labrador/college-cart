-- Parking Lot feature: expand allowed values for listing.status
--
-- `listing.status` is backed by the Postgres enum `listing_status_enum`.
-- Prior to this migration the enum held `'active'` and `'sold'`.  The Parking
-- Lot feature adds two more values:
--
--   'draft'     -- a listing saved by the seller but not yet published.
--                  Visible only to its owner via /parking-lot.
--   'archived'  -- a previously active listing the seller has removed from
--                  the marketplace.  Not visible to other users, but the
--                  owner can repost it later from /parking-lot.
--
-- Because the column is an enum, we extend the type rather than adding a
-- CHECK constraint.  `ADD VALUE IF NOT EXISTS` makes this migration safe to
-- re-run.  In Supabase's SQL editor you may need to run each statement
-- individually (ADD VALUE cannot be used in the same transaction as other
-- DDL on some Postgres versions).

-- 1. Extend the enum with the new values.
ALTER TYPE public.listing_status_enum ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.listing_status_enum ADD VALUE IF NOT EXISTS 'archived';

-- 2. Backfill any NULL statuses to 'active' so every row has a valid value.
--    (Enums can never be the empty string, so no '' check is needed.)
UPDATE public.listing
SET status = 'active'
WHERE status IS NULL;

-- 3. Helpful composite index for the Parking Lot / Selling queries.
CREATE INDEX IF NOT EXISTS listing_seller_status_idx
  ON public.listing (seller_id, status);
