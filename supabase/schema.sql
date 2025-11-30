-- --------------------------------------------------------
-- Supabase Database Schema
-- Synced with actual Supabase project state
-- --------------------------------------------------------

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing if needed

-- --------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    role TEXT DEFAULT 'editor'
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    author TEXT DEFAULT 'Admin',
    category TEXT DEFAULT 'Genel',
    image_url TEXT,
    status TEXT DEFAULT 'published',
    views INTEGER DEFAULT 0,
    read_time TEXT DEFAULT '5 dk okuma',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES public.users(id),
    slug TEXT UNIQUE
);

-- --------------------------------------------------------
-- 2. Storage Buckets
-- --------------------------------------------------------

-- Create 'images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 3. Security Policies (RLS)
-- --------------------------------------------------------

-- Note: RLS is currently disabled for tables in the project.
-- To enable, uncomment the following lines:
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Storage Policies (Example for 'images' bucket)
-- Allow public read access to 'images' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Allow authenticated uploads to 'images' bucket
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' );
