export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string; // Full content is loaded on demand
  author: string;
  authorAvatar?: string; // Added authorAvatar
  date: string;
  readTime: string;
  tags: string[];
  imageUrl: string;
  status?: 'published' | 'draft';
  views?: number;
  category?: string;
  deleted_at?: string | null;
}

export interface User {
  id: string;
  username: string;
  name: string; // Maps to full_name
  avatar: string; // Maps to avatar_url
  role: 'admin' | 'editor' | 'reader';
  password?: string; // For creation/update only
}

export interface SiteSettings {
  id?: string;
  site_title: string;
  site_description: string;
  twitter_url?: string;
  github_url?: string;
  linkedin_url?: string;
  contact_email?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ViewState = 'HOME' | 'ARTICLE' | 'LOGIN' | 'ADMIN' | 'EDITOR' | 'ABOUT' | 'CONTACT';
