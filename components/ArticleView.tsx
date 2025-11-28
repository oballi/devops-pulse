import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Share2, Linkedin, Twitter, Link2, Check } from 'lucide-react';
import { BlogPost, LoadingState, User } from '../types';
import { fetchPostContent, fetchRelatedPosts } from '../services/dataService';
import MarkdownRenderer from './MarkdownRenderer';
import { useNotification } from '../contexts/NotificationContext';

interface ArticleViewProps {
  post: BlogPost;
  user?: User | null;
  onEditClick?: (post: BlogPost) => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ post, user, onEditClick }) => {
  const navigate = useNavigate();
  const { success } = useNotification();
  
  // Kullanıcı admin veya editor ise düzenleme yapabilir
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<LoadingState>(LoadingState.LOADING);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Makale URL'i
  const articleUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/article/${post.id}` 
    : '';

  // Paylaşım fonksiyonları
  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
    setShowShareMenu(false);
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(post.title)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setLinkCopied(true);
      success('Link Kopyalandı', 'Makale linki panoya kopyalandı.');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = articleUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      success('Link Kopyalandı', 'Makale linki panoya kopyalandı.');
      setTimeout(() => setLinkCopied(false), 2000);
    }
    setShowShareMenu(false);
  };

  // Menü dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showShareMenu && !target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      setLoading(LoadingState.LOADING);
      // Scroll to top
      window.scrollTo(0, 0);

      // Eğer post.content zaten varsa direkt kullan, yoksa fetch et
      let text = post.content || '';
      
      if (!text) {
        text = await fetchPostContent(post.title);
      }
      
      const related = await fetchRelatedPosts(post.id, post.tags);
      
      if (isMounted) {
        setContent(text);
        setRelatedPosts(related);
        setLoading(LoadingState.SUCCESS);
      }
    };

    loadContent();

    // Progress bar listener
    const handleScroll = () => {
        const totalScroll = document.documentElement.scrollTop;
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scroll = `${totalScroll / windowHeight}`;
        const progressBar = document.getElementById('progressBar');
        
        if (progressBar) {
            progressBar.style.transform = `scaleX(${scroll})`;
        }
    }

    window.addEventListener('scroll', handleScroll);

    return () => { 
        isMounted = false; 
        window.removeEventListener('scroll', handleScroll);
    };
  }, [post]);

  const handleRelatedPostClick = (relatedPost: BlogPost) => {
    navigate(`/article/${relatedPost.id}`);
  };

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 animate-fade-in relative">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
        <div 
            id="progressBar" 
            className="h-full bg-black dark:bg-white origin-left transform scale-x-0 transition-transform duration-100"
        ></div>
      </div>

      {/* Article Header */}
      <header className="mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 leading-tight font-sans tracking-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-between border-b border-t border-gray-100 dark:border-dark-border py-6">
            <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ring-2 ring-white dark:ring-dark-bg shadow-sm">
                    <img src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.author}`} alt={post.author} className="w-full h-full object-cover" />
                 </div>
                 <div>
                     <p className="font-medium text-gray-900 dark:text-gray-100 font-sans">{post.author}</p>
                     <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-sans">
                        <span>{post.readTime}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                     </div>
                 </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Paylaşım Butonu */}
                <div className="relative share-menu-container">
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-border transition-colors border border-gray-200 dark:border-dark-border"
                    >
                        <Share2 size={16} />
                        <span className="hidden sm:inline">Paylaş</span>
                    </button>
                    
                    {/* Paylaşım Menüsü */}
                    {showShareMenu && (
                        <div className="absolute right-0 top-12 w-48 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-xl rounded-xl py-2 z-50 animate-scale-in">
                            <button 
                                onClick={shareOnLinkedIn}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-border flex items-center gap-3 transition-colors"
                            >
                                <Linkedin size={18} className="text-[#0A66C2]" />
                                <span>LinkedIn'de Paylaş</span>
                            </button>
                            <button 
                                onClick={shareOnTwitter}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-border flex items-center gap-3 transition-colors"
                            >
                                <Twitter size={18} className="text-[#1DA1F2]" />
                                <span>X'te Paylaş</span>
                            </button>
                            <div className="border-t border-gray-100 dark:border-dark-border my-1"></div>
                            <button 
                                onClick={copyLink}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-border flex items-center gap-3 transition-colors"
                            >
                                {linkCopied ? (
                                    <>
                                        <Check size={18} className="text-green-500" />
                                        <span>Kopyalandı!</span>
                                    </>
                                ) : (
                                    <>
                                        <Link2 size={18} className="text-gray-400" />
                                        <span>Linki Kopyala</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Düzenleme Butonu - Sadece admin/editor için */}
                {canEdit && onEditClick && (
                    <button
                        onClick={() => onEditClick(post)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-border transition-colors border border-gray-200 dark:border-dark-border"
                    >
                        <Edit2 size={16} />
                        <span className="hidden sm:inline">Düzenle</span>
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {loading === LoadingState.LOADING ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-gray-100 dark:bg-dark-card rounded w-full"></div>
            <div className="h-4 bg-gray-100 dark:bg-dark-card rounded w-5/6"></div>
            <div className="h-4 bg-gray-100 dark:bg-dark-card rounded w-4/6"></div>
            <div className="h-64 bg-gray-100 dark:bg-dark-card rounded-lg w-full mt-8"></div>
            <div className="space-y-4 mt-8">
                 <div className="h-4 bg-gray-100 dark:bg-dark-card rounded w-full"></div>
                 <div className="h-4 bg-gray-100 dark:bg-dark-card rounded w-11/12"></div>
                 <div className="h-4 bg-gray-100 dark:bg-dark-card rounded w-full"></div>
            </div>
            <div className="flex items-center justify-center pt-10">
                <p className="text-gray-400 dark:text-gray-500 font-serif italic">Makale yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div>
            <MarkdownRenderer content={content} />
            
            {/* Tags footer */}
            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-dark-border">
                <div className="flex flex-wrap gap-2 mb-8">
                    {post.tags.map(tag => (
                        <span key={tag} className="px-4 py-2 bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent dark:border-dark-border">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            
            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="mt-20 pt-12 border-t border-gray-200 dark:border-dark-border">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 font-sans">İlginizi Çekebilir</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {relatedPosts.map(relatedPost => (
                             <div 
                                key={relatedPost.id} 
                                className="group cursor-pointer" 
                                onClick={() => handleRelatedPostClick(relatedPost)}
                             > 
                                <div className="flex gap-4 items-start">
                                    {/* Resim sadece varsa göster */}
                                    {relatedPost.imageUrl && (
                                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-card">
                                            <img 
                                                src={relatedPost.imageUrl} 
                                                alt={relatedPost.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        {relatedPost.tags && relatedPost.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                {relatedPost.tags.map(tag => (
                                                    <span 
                                                        key={tag} 
                                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider"
                                                    >
                                                        {tag}
                                                        {relatedPost.tags.indexOf(tag) < relatedPost.tags.length - 1 && (
                                                            <span className="text-gray-400 dark:text-gray-500 mx-1">•</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                            {relatedPost.title}
                                        </h4>
                                        {relatedPost.excerpt && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                                                {relatedPost.excerpt}
                                            </p>
                                        )}
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ArticleView;
