-- --------------------------------------------------------
-- Supabase Database Schema
-- Generated based on application logic (types.ts & dataService.ts)
-- --------------------------------------------------------

-- 1. Users Table
-- Kullanıcı bilgilerini tutar.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Not: Prod ortamında hashlenmiş olmalı
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'reader' CHECK (role IN ('admin', 'editor', 'reader')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Categories Table
-- Blog kategorilerini tutar.
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Posts Table
-- Blog yazılarını tutar.
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE, -- SEO dostu URL için
    content TEXT,
    excerpt TEXT,
    author TEXT, -- Denormalize yazar adı (opsiyonel)
    author_id UUID REFERENCES public.users(id),
    image_url TEXT,
    read_time TEXT,
    category TEXT, -- Kategori adı (veya ID'si)
    tags TEXT[], -- Etiketler array olarak tutulur
    status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'deleted')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete için
);

-- 4. Storage (Opsiyonel)
-- 'images' adında bir bucket oluşturulmalı ve public erişim verilmeli.

-- --------------------------------------------------------
-- RLS (Row Level Security) Policies (Örnek)
-- --------------------------------------------------------

-- Posts tablosu için okuma izni (herkes okuyabilir)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (status = 'published' AND deleted_at IS NULL);

-- Sadece giriş yapmış kullanıcılar yazı ekleyebilir
CREATE POLICY "Authenticated users can insert posts" 
ON public.posts FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Yazarlar sadece kendi yazılarını güncelleyebilir
CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);
