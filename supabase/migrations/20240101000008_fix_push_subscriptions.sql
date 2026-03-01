-- Fix push_subscriptions schema to match application expectations.
-- The table was initially created with a subscription jsonb column; the app
-- stores p256dh and auth as separate columns instead.
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS p256dh text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS auth text NOT NULL DEFAULT '';

-- Remove the NOT NULL constraint on the unused jsonb column so existing rows
-- and new inserts don't fail (column retained for backwards compatibility).
ALTER TABLE public.push_subscriptions
  ALTER COLUMN subscription DROP NOT NULL;
