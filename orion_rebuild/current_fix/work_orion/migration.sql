-- Orion SCM OS — Database Schema Alignment Migration
-- Safe to execute repeatedly on your Supabase SQL Editor.

-- 1. Profiles Table Alignment
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text DEFAULT 'Supply Chain Specialist';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text DEFAULT 'Operations';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure indexes for username and email resolution
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- 2. Organizations Table Alignment
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS industry text DEFAULT 'Supply Chain / Logistics';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS country text DEFAULT 'Global';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS units text DEFAULT 'metric';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
