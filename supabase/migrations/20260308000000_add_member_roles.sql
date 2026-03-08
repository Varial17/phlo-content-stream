-- Add new roles to app_role enum
-- Must be in a separate migration from policies that use the new values
-- (PostgreSQL cannot use new enum values in the same transaction as ADD VALUE)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
