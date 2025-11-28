// ... existing imports
import { BlogPost, User, Category } from "../types";
import { supabase } from "./supabaseClient";

// Helper: Türkçe karakter destekli slug oluşturucu
const slugify = (text: string): string => {
    const trMap: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O'
    };

    return text
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/\s+/g, '-')     // Boşlukları tire yap
        .replace(/[^\w\-]+/g, '') // Alfanümerik olmayan karakterleri sil
        .replace(/\-\-+/g, '-')   // Tekrarlayan tireleri temizle
        .replace(/^-+/, '')       // Baştaki tireyi temizle
        .replace(/-+$/, '');      // Sondaki tireyi temizle
};

/**
 * LOGIN USER
 */
export const login = async (username: string, pass: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', pass) // Note: In production, use hashed passwords!
            .single();

        if (error || !data) {
            console.error('Login failed:', error);
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            name: data.full_name,
            avatar: data.avatar_url,
            role: data.role || 'reader',
        };
    } catch (err) {
        console.error('Login exception:', err);
        return null;
    }
};

/**
 * GET USER BY ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Error fetching user:', error);
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            name: data.full_name,
            avatar: data.avatar_url,
            role: data.role || 'editor',
        };
    } catch (err) {
        console.error('Get user exception:', err);
        return null;
    }
};

/**
 * GET USER BY USERNAME
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) {
            console.error('Error fetching user by username:', error);
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            name: data.full_name,
            avatar: data.avatar_url,
            role: data.role || 'editor',
        };
    } catch (err) {
        console.error('Get user by username exception:', err);
        return null;
    }
};

/**
 * FETCH POST CONTENT (by title)
 */
export const fetchPostContent = async (title: string): Promise<string> => {
  try {
    // Decode title if it's URL encoded
    const decodedTitle = decodeURIComponent(title);
    
    const { data, error } = await supabase
      .from('posts')
      .select('content')
      .eq('title', decodedTitle)
      .limit(1);

    if (error) {
      console.error('Error fetching post content:', error);
      return '';
    }

    return data?.[0]?.content || '';
  } catch (error) {
    console.error('Unexpected error fetching post content:', error);
    return '';
  }
};

/**
 * FETCH POST BY ID
 */
export const fetchPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, users:author_id(avatar_url)')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching post by id:', error);
      return null;
    }

    // Avatar'ı users tablosundan al
    const authorAvatar = (data.users as any)?.avatar_url || null;

    return {
      id: data.id,
      title: data.title,
      excerpt: data.excerpt || '',
      content: data.content || '',
      author: data.author || 'Unknown',
      authorAvatar: authorAvatar,
      date: new Date(data.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      readTime: data.read_time || '5 dk',
      tags: data.tags || [],
      imageUrl: data.image_url || '',
      status: data.status,
      views: data.views || 0,
      category: data.category
    };
  } catch (error) {
    console.error('Unexpected error fetching post by id:', error);
    return null;
  }
};

/**
 * FETCH RELATED POSTS
 * @param tags - Makalenin tüm kategorileri (tags array)
 */
export const fetchRelatedPosts = async (currentPostId: string, tags?: string[]): Promise<BlogPost[]> => {
  try {
    let query = supabase
      .from('posts')
      .select('*, users:author_id(avatar_url)')
      .neq('id', currentPostId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .limit(3);

    if (tags && tags.length > 0) {
      // tags array içinde herhangi bir kategoriyi ara (overlaps = OR mantığı)
      query = query.overlaps('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }

    return (data || []).map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      author: post.author || 'Unknown',
      authorAvatar: (post.users as any)?.avatar_url || null,
      date: new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      readTime: post.read_time || '5 dk',
      tags: post.tags || [],
      imageUrl: post.image_url || '',
      status: post.status,
      views: post.views || 0,
      category: post.category
    }));
  } catch (error) {
    console.error('Unexpected error fetching related posts:', error);
    return [];
  }
};

/**
 * FETCH CATEGORIES
 */
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
      
    if (error) {
        // If categories table doesn't exist, return defaults
        console.warn('Error fetching categories (using defaults):', error);
        return [
            { id: '1', name: 'Genel', slug: 'genel' },
            { id: '2', name: 'Yazılım', slug: 'yazilim' },
            { id: '3', name: 'DevOps', slug: 'devops' }
        ];
    }
    
    return (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * CREATE POST
 * @returns Created post ID or null on error
 */
export const createPost = async (post: Partial<BlogPost> & { authorId: string }): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                title: post.title,
                content: post.content,
                excerpt: post.excerpt,
                author: post.author,
                author_id: post.authorId,
                image_url: post.imageUrl,
                read_time: post.readTime,
                category: post.category,
                tags: post.tags,
                status: post.status || 'draft'
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return null;
        }
        return data?.id || null;
    } catch (error) {
        console.error('Error creating post:', error);
        return null;
    }
};

/**
 * UPDATE POST
 */
export const updatePost = async (id: string, post: Partial<BlogPost>): Promise<boolean> => {
    try {
        const updates: any = {};
        
        if (post.title) updates.title = post.title;
        if (post.content) updates.content = post.content;
        if (post.excerpt) updates.excerpt = post.excerpt;
        if (post.imageUrl) updates.image_url = post.imageUrl;
        if (post.readTime) updates.read_time = post.readTime;
        if (post.category) updates.category = post.category;
        if (post.tags) updates.tags = post.tags;
        if (post.status) updates.status = post.status;

        const { error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating post:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating post:', error);
        return false;
    }
};

/**
 * FETCH TRENDING POSTS
 * @param includeDrafts - Admin paneli için taslakları da dahil et
 */
export const fetchTrendingPosts = async (
    category?: string,
    page: number = 1,
    limit: number = 6,
    author?: string,
    searchQuery?: string,
    includeDrafts: boolean = false
): Promise<BlogPost[]> => {
    try {
        let query = supabase
            .from('posts')
            .select('*, users:author_id(avatar_url)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // Taslakları dahil etme durumuna göre filtrele
        if (!includeDrafts) {
            query = query.eq('status', 'published');
        } else {
            // Sadece published ve draft olanları getir (deleted hariç)
            query = query.in('status', ['published', 'draft']);
        }

        if (category && category !== 'Tümü') {
            // tags array içinde kategoriyi ara
            query = query.contains('tags', [category]);
        }
        
        if (author) {
             query = query.eq('author', author);
        }
        
        if (searchQuery) {
            // Başlık, içerik, excerpt veya tags'te ara
            // tags array olduğu için cs (contains) kullanıyoruz
            query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching trending posts:', error);
            return [];
        }

        return (data || []).map(post => ({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt || '',
            content: post.content || '',
            author: post.author || 'Unknown',
            authorAvatar: (post.users as any)?.avatar_url || null,
            date: new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            readTime: post.read_time || '5 dk',
            tags: post.tags || [],
            imageUrl: post.image_url || '',
            status: post.status,
            views: post.views || 0,
            category: post.category
        }));
    } catch (error) {
        console.error('Unexpected error fetching trending posts:', error);
        return [];
    }
};

/**
 * GET USERS
 */
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return (data || []).map(u => ({
            id: u.id,
            username: u.username,
            name: u.full_name,
            avatar: u.avatar_url,
            role: u.role
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

/**
 * CREATE USER
 */
export const createUser = async (user: Partial<User>): Promise<boolean> => {
     try {
        const { error } = await supabase.from('users').insert({
            username: user.username,
            password: user.password,
            full_name: user.name,
            avatar_url: user.avatar,
            role: user.role,
        });
        
        if (error) {
             console.error('Error creating user:', error);
             return false;
        }
        return true;
     } catch (error) {
         console.error('Error creating user:', error);
         return false;
     }
}

/**
 * UPDATE USER
 */
export const updateUser = async (id: string, user: Partial<User>): Promise<boolean> => {
    try {
        const updates: any = {};
        if (user.username) updates.username = user.username;
        if (user.password) updates.password = user.password;
        if (user.name) updates.full_name = user.name;
        if (user.avatar) updates.avatar_url = user.avatar;
        if (user.role) updates.role = user.role;

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating user:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
};

/**
 * DELETE USER
 */
export const deleteUser = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) {
            console.error('Error deleting user:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
};

/**
 * SOFT DELETE POST
 */
export const softDeletePost = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('posts')
            .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
            .eq('id', id);

        if (error) {
            console.error('Error deleting post:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
};

/**
 * ADD CATEGORY
 */
export const addCategory = async (name: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('categories')
            .insert({ name });
            
        if (error) {
            console.error('Error adding category:', error);
            return false;
        }
        return true;
    } catch (error) {
         console.error('Error adding category:', error);
         return false;
    }
};

/**
 * DELETE CATEGORY
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
            console.error('Error deleting category:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        return false;
    }
};

/**
 * UPLOAD IMAGE
 */
export const uploadImage = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return null;
        }

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
};
