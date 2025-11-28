import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image, ArrowLeft, Loader2, Code, Link, ChevronDown, Check, Save } from 'lucide-react';
import { BlogPost, User, Category } from '../types';
import { createPost, updatePost, fetchCategories } from '../services/dataService';
import { useNotification } from '../contexts/NotificationContext';

interface EditorViewProps {
  user: User;
  post?: BlogPost;
  onPublish: (post: BlogPost) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'editor_draft';

const EditorView: React.FC<EditorViewProps> = ({ user, post, onPublish, onCancel }) => {
  const { success, error, warning, confirm } = useNotification();
  
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || post?.excerpt || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(post?.tags || ['Genel']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null); // Kaydedilmiş taslak ID'si
  
  // Refs for current values (to use in beforeunload)
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const selectedCategoriesRef = useRef(selectedCategories);
  
  // Keep refs updated
  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    selectedCategoriesRef.current = selectedCategories;
  }, [title, content, selectedCategories]);

  // İçerik var mı kontrolü - post düzenleniyorsa veya draftId varsa unsaved değil
  const hasUnsavedContent = !!(title || content) && !post && !draftId;

  useEffect(() => {
      fetchCategories().then(setCategories);
      
      // Restore draft if no post is being edited and a draft exists
      if (!post) {
          const savedDraft = localStorage.getItem(DRAFT_KEY);
          if (savedDraft) {
              try {
                  const draft = JSON.parse(savedDraft);
                  // Simple check to see if draft is not too old (optional, but good practice)
                  // For now, just restore it
                  if (window.confirm('Kaydedilmemiş bir taslağınız bulundu. Yüklemek ister misiniz?')) {
                      setTitle(draft.title || '');
                      setContent(draft.content || '');
                      setSelectedCategories(draft.selectedCategories || ['Genel']);
                  } else {
                      localStorage.removeItem(DRAFT_KEY);
                  }
              } catch (e) {
                  console.error('Error parsing draft', e);
              }
          }
      }
  }, []);

  useEffect(() => {
      if (post && !post.content) {
          import('../services/dataService').then(({ fetchPostContent }) => {
              fetchPostContent(post.title).then(c => setContent(c));
          });
      } else if (post?.content) {
          setContent(post.content);
      }
  }, [post]);

  // Auto-save effect (localStorage'a)
  useEffect(() => {
      if (post) return; // Don't auto-save if editing an existing post

      const interval = setInterval(() => {
          if (title || content) {
              const draft = {
                  title,
                  content,
                  selectedCategories,
                  timestamp: new Date().toISOString()
              };
              localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
              setLastSaved(new Date());
          }
      }, 5000);

      return () => clearInterval(interval);
  }, [title, content, selectedCategories, post]);

  // Taslağı veritabanına kaydetme fonksiyonu
  const saveDraftToDatabase = useCallback(async (): Promise<boolean> => {
      if (!title || !content) return false;
      
      const readTime = `${Math.ceil(content.split(' ').length / 200)} dk okuma`;
      const primaryCategory = selectedCategories[0] || 'Genel';
      
      const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
      const firstImageUrl = imageMatch ? imageMatch[1] : '';

      let plainText = content.replace(/!\[.*?\]\(.*?\)/g, '');
      plainText = plainText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
      plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2');
      plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2');
      plainText = plainText.replace(/```[\s\S]*?```/g, '');
      plainText = plainText.replace(/`.*?`/g, '');
      plainText = plainText.replace(/#+\s/g, '');
      
      const excerpt = plainText.trim().substring(0, 150) + (plainText.length > 150 ? '...' : '');

      // Eğer draftId varsa güncelle, yoksa yeni oluştur
      if (draftId) {
          const updateResult = await updatePost(draftId, {
              title,
              content,
              excerpt,
              imageUrl: firstImageUrl,
              readTime,
              category: primaryCategory,
              tags: selectedCategories
          });
          
          if (updateResult) {
              localStorage.removeItem(DRAFT_KEY);
              return true;
          }
          return false;
      } else {
          const newDraftId = await createPost({
              title,
              content,
              excerpt,
              author: user.name,
              authorId: user.id,
              imageUrl: firstImageUrl,
              readTime,
              status: 'draft',
              category: primaryCategory,
              tags: selectedCategories
          });
          
          if (newDraftId) {
              setDraftId(newDraftId); // Sonraki kaydetmelerde güncelleme yapılsın
              localStorage.removeItem(DRAFT_KEY);
              return true;
          }
          return false;
      }
  }, [title, content, selectedCategories, user, draftId]);

  // Tarayıcı/sekme kapatılırken uyarı ver
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if ((titleRef.current || contentRef.current) && !post) {
              // Taslağı localStorage'a kaydet
              const draft = {
                  title: titleRef.current,
                  content: contentRef.current,
                  selectedCategories: selectedCategoriesRef.current,
                  timestamp: new Date().toISOString()
              };
              localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
              
              e.preventDefault();
              e.returnValue = '';
              return '';
          }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [post]);

  const toggleCategory = (catName: string) => {
      if (selectedCategories.includes(catName)) {
          setSelectedCategories(prev => prev.filter(c => c !== catName));
      } else {
          setSelectedCategories(prev => [...prev, catName]);
      }
  }

  const handlePublish = async () => {
    if (!title || !content) return;

    setIsPublishing(true);

    const readTime = `${Math.ceil(content.split(' ').length / 200)} dk okuma`;
    const primaryCategory = selectedCategories[0] || 'Genel';
    
    // Extract first image from markdown content
    const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
    const firstImageUrl = imageMatch ? imageMatch[1] : '';

    // Strip markdown for excerpt
    // Remove images
    let plainText = content.replace(/!\[.*?\]\(.*?\)/g, '');
    // Remove links but keep text
    plainText = plainText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Remove bold/italic
    plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2');
    plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2');
    // Remove code blocks
    plainText = plainText.replace(/```[\s\S]*?```/g, '');
    plainText = plainText.replace(/`.*?`/g, '');
    // Remove headings
    plainText = plainText.replace(/#+\s/g, '');
    
    const excerpt = plainText.trim().substring(0, 150) + (plainText.length > 150 ? '...' : '');
    
    let postId: string | null = null;

    if (post) {
        // Güncelleme
        const updateResult = await updatePost(post.id, {
            title,
            content,
            excerpt,
            imageUrl: firstImageUrl,
            readTime,
            category: primaryCategory,
            tags: selectedCategories
        });
        if (updateResult) {
            postId = post.id;
        }
    } else {
        // Yeni makale oluştur
        postId = await createPost({
            title,
            content,
            excerpt,
            author: user.name,
            authorId: user.id,
            imageUrl: firstImageUrl,
            readTime,
            status: 'published',
            category: primaryCategory,
            tags: selectedCategories
        });
    }

    if (postId) {
        // Clear draft on successful publish
        localStorage.removeItem(DRAFT_KEY);
        
        onPublish({
            id: postId,
            title,
            excerpt,
            content,
            author: user.name,
            date: post?.date || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            readTime,
            tags: selectedCategories,
            imageUrl: firstImageUrl,
            status: 'published',
            views: post?.views || 0,
            category: primaryCategory
        });
    } else {
        error('Hata', 'Makale yayınlanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
    
    setIsPublishing(false);
  };

  const insertMarkdown = (type: 'code' | 'link' | 'image') => {
      let textToInsert = '';
      if (type === 'code') textToInsert = '\n```javascript\n// code here\n```\n';
      if (type === 'link') textToInsert = '[Link Text](url)';
      if (type === 'image') textToInsert = '\n![Image Alt](url)\n';

      setContent(prev => prev + textToInsert);
  }

  const handleCancel = async () => {
      // Eğer içerik varsa, taslak olarak kaydet
      if (hasUnsavedContent) {
          const shouldSaveDraft = await confirm({
              title: 'Taslak Olarak Kaydet',
              message: 'Yazınız taslak olarak kaydedilsin mi? Daha sonra Admin Panelinden devam edebilirsiniz.',
              confirmText: 'Evet, Kaydet',
              cancelText: 'Kaydetme',
              type: 'info'
          });
          
          if (shouldSaveDraft) {
              const saved = await saveDraftToDatabase();
              if (saved) {
                  success('Taslak Kaydedildi', 'Yazınız taslak olarak kaydedildi.');
              } else {
                  warning('Uyarı', 'Taslak kaydedilemedi, yerel olarak saklandı.');
              }
          }
      }
      onCancel();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col animate-fade-in relative">
      
      {/* Editor Header */}
      <div className="flex justify-between items-center mb-12 sticky top-0 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm z-10 py-4 border-b border-transparent transition-all">
         <button onClick={handleCancel} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={24} />
         </button>
         
         <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                 <span className="text-sm text-gray-400 font-sans">
                    {post ? 'Düzenleniyor' : 'Yeni Yazı'}
                 </span>
                 {!post && lastSaved && (
                     <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                         <Save size={10} />
                         Taslak kaydedildi {lastSaved.toLocaleTimeString()}
                     </span>
                 )}
             </div>
             
             <div className="relative group z-50">
                 <button 
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-card rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                 >
                     {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Kategori Seç'}
                     <ChevronDown size={14} />
                 </button>
                 
                 {showCategoryDropdown && (
                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-lg shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
                         {categories.map(cat => (
                             <button 
                                key={cat.id}
                                onClick={() => toggleCategory(cat.name)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg/50 flex items-center justify-between"
                             >
                                 <span>{cat.name}</span>
                                 {selectedCategories.includes(cat.name) && <Check size={14} className="text-green-600" />}
                             </button>
                         ))}
                     </div>
                 )}
             </div>

             <button 
                onClick={handlePublish}
                disabled={!title || !content || isPublishing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
             >
                {isPublishing && <Loader2 size={16} className="animate-spin" />}
                {isPublishing ? 'Yayınlanıyor...' : 'Yayınla'}
             </button>
         </div>
      </div>

      {/* Editor Content */}
      <div className="flex-grow space-y-6">
        
        {/* Markdown Toolbar */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-2 mb-4 overflow-x-auto">
            <button onClick={() => insertMarkdown('code')} className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Kod Bloğu"><Code size={18} /></button>
            <button onClick={() => insertMarkdown('link')} className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Link"><Link size={18} /></button>
            <button onClick={() => insertMarkdown('image')} className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Resim"><Image size={18} /></button>
        </div>

        {/* Title */}
        <textarea
            placeholder="Başlık"
            value={title}
            onChange={(e) => {
                setTitle(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            className="w-full text-4xl md:text-5xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 border-none outline-none resize-none bg-transparent overflow-hidden font-sans leading-tight"
            rows={1}
        />

        {/* Body */}
        <textarea
            placeholder="Hikayeni anlat..."
            value={content}
            onChange={(e) => {
                setContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            className="w-full text-xl text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 border-none outline-none resize-none bg-transparent font-serif leading-relaxed min-h-[400px]"
        />
      </div>
    </div>
  );
};

export default EditorView;