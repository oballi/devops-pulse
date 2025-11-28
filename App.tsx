import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ArticleCard from './components/ArticleCard';
import ArticleView from './components/ArticleView';
import LoginView from './components/LoginView';
import AdminPanel from './components/AdminPanel';
import EditorView from './components/EditorView';
import AboutView from './components/AboutView';
import { fetchTrendingPosts, login, fetchCategories, fetchPostById } from './services/dataService';
import { BlogPost, LoadingState, User, Category } from './types';
import { Loader2 } from 'lucide-react';
import { useNotification } from './contexts/NotificationContext';

// Home Page Component
const HomePage: React.FC<{
  posts: BlogPost[];
  loading: LoadingState;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onPostClick: (post: BlogPost) => void;
}> = ({ posts, loading, categories, selectedCategory, setSelectedCategory, searchQuery, hasMore, onLoadMore, onPostClick }) => {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-12 animate-fade-in">
      {/* Kategori Filtreleri */}
      <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('Tümü')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedCategory === 'Tümü'
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border'
          }`}
        >
          Tümü
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === category.name
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading === LoadingState.LOADING ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-gray-300 dark:text-gray-600" size={40} />
          <p className="text-gray-400 dark:text-gray-500 font-sans text-sm animate-pulse">İçerik yükleniyor...</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {posts.length > 0 ? (
            posts.map(post => (
              <ArticleCard 
                key={post.id} 
                post={post} 
                onClick={onPostClick} 
              />
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : 'Bu kategoride henüz yazı bulunmuyor.'}
              </p>
            </div>
          )}
        </div>
      )}
      
      {hasMore && posts.length > 0 && (
        <div className="mt-12 text-center">
          <button 
            className="px-8 py-3 bg-white dark:bg-transparent border border-gray-200 dark:border-dark-border rounded-full text-gray-600 dark:text-gray-300 font-medium hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-sans text-sm"
            onClick={onLoadMore}
          >
            Daha Fazla Gör
          </button>
        </div>
      )}
    </div>
  );
};

// Article Page Wrapper - loads article from URL param
interface ArticlePageProps {
  user: User | null;
  onEditClick: (post: BlogPost) => void;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ user, onEditClick }) => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        navigate('/');
        return;
      }
      
      setLoading(true);
      const fetchedPost = await fetchPostById(id);
      
      if (fetchedPost) {
        setPost(fetchedPost);
      } else {
        navigate('/');
      }
      setLoading(false);
    };

    loadPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-gray-300 dark:text-gray-600" size={40} />
        <p className="text-gray-400 dark:text-gray-500 font-sans text-sm animate-pulse">Makale yükleniyor...</p>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return <ArticleView post={post} user={user} onEditClick={onEditClick} />;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error, info, confirm } = useNotification();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.LOADING);
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
    }
    return 'light';
  });

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Check session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user_session');
      }
    }
  }, []);

  // Initialize Home Data
  useEffect(() => {
    const init = async () => {
      setLoading(LoadingState.LOADING);
      const [data, cats] = await Promise.all([
        fetchTrendingPosts(selectedCategory, 1, 5, undefined, searchQuery),
        fetchCategories()
      ]);
      
      setPosts(data);
      setCategories(cats);
      setHasMore(data.length === 5);
      setPage(1);
      setLoading(LoadingState.SUCCESS);
    };
    init();
  }, [selectedCategory, searchQuery]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const newPosts = await fetchTrendingPosts(selectedCategory, nextPage, 5, undefined, searchQuery);
    
    if (newPosts.length > 0) {
      setPosts([...posts, ...newPosts]);
      setPage(nextPage);
      if (newPosts.length < 5) setHasMore(false);
    } else {
      setHasMore(false);
    }
  };

  const handlePostClick = (post: BlogPost) => {
    navigate(`/article/${post.id}`);
  };

  const handleHomeClick = () => {
    setSearchQuery('');
    setSelectedCategory('Tümü');
    navigate('/');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleAdminClick = () => {
    if (user) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  const handleWriteClick = () => {
    if (user) {
      setEditingPost(null);
      navigate('/editor');
    } else {
      navigate('/login');
    }
  };

  const handlePerformLogin = async (username: string, pass: string): Promise<boolean> => {
    const loggedInUser = await login(username, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('user_session', JSON.stringify(loggedInUser));
      success('Hoş Geldiniz!', `${loggedInUser.name || loggedInUser.username} olarak giriş yaptınız.`);
      navigate('/admin');
      return true;
    }
    error('Giriş Başarısız', 'Kullanıcı adı veya şifre hatalı.');
    return false;
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Çıkış Yap',
      message: 'Çıkış yapmak istediğinize emin misiniz?',
      confirmText: 'Evet, Çıkış Yap',
      cancelText: 'İptal',
      type: 'info'
    });
    
    if (confirmed) {
      setUser(null);
      localStorage.removeItem('user_session');
      info('Çıkış Yapıldı', 'Başarıyla çıkış yaptınız.');
      navigate('/');
    }
  };

  const handlePublishPost = async (newPost: BlogPost) => {
    success('Tebrikler! 🎉', 'Makaleniz başarıyla yayınlandı.');
    // Yayınlanan makaleye yönlendir
    navigate(`/article/${newPost.id}`);
    // Anasayfa verilerini arka planda güncelle
    setPage(1);
    fetchTrendingPosts(selectedCategory, 1, 5, undefined, searchQuery).then(data => {
      setPosts(data);
      setHasMore(data.length === 5);
    });
  };

  const handleCancelEdit = () => {
    navigate(-1); // Go back
  };

  const handleAboutClick = () => {
    navigate('/about');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    navigate('/editor');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user_session', JSON.stringify(updatedUser));
  };

  return (
    <Layout 
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      onHomeClick={handleHomeClick} 
      onLoginClick={handleLoginClick}
      onAdminClick={handleAdminClick}
      onLogoutClick={handleLogout}
      onWriteClick={handleWriteClick}
      onAboutClick={handleAboutClick}
      onSearch={handleSearch}
    >
      <Routes>
        <Route path="/" element={
          <HomePage 
            posts={posts}
            loading={loading}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onPostClick={handlePostClick}
          />
        } />
        
        <Route path="/article/:id" element={<ArticlePage user={user} onEditClick={handleEditPost} />} />
        
        <Route path="/login" element={
          <LoginView onLogin={handlePerformLogin} />
        } />
        
        <Route path="/admin" element={
          user ? (
            <AdminPanel 
              user={user} 
              onCreateClick={handleWriteClick} 
              onEditClick={handleEditPost} 
              onUserUpdate={handleUserUpdate}
            />
          ) : (
            <LoginView onLogin={handlePerformLogin} />
          )
        } />
        
        <Route path="/editor" element={
          user ? (
            <EditorView 
              user={user} 
              post={editingPost || undefined} 
              onPublish={handlePublishPost} 
              onCancel={handleCancelEdit} 
            />
          ) : (
            <LoginView onLogin={handlePerformLogin} />
          )
        } />
        
        <Route path="/about" element={<AboutView />} />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={
          <HomePage 
            posts={posts}
            loading={loading}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onPostClick={handlePostClick}
          />
        } />
      </Routes>
    </Layout>
  );
};

export default App;
