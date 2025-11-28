import React, { useEffect, useState } from 'react';
import { getUserByUsername } from '../services/dataService';
import { User } from '../types';

// Hakkımda sayfasında gösterilecek kullanıcı adı
const ABOUT_USERNAME = 'admin';

const AboutView: React.FC = () => {
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthor = async () => {
      const user = await getUserByUsername(ABOUT_USERNAME);
      setAuthor(user);
      setLoading(false);
    };
    loadAuthor();
  }, []);

  // Fallback avatar
  const avatarUrl = author?.avatar || `https://ui-avatars.com/api/?name=Ömer+Faruk+Ballı&background=000&color=fff&size=256`;
  const authorName = author?.name || 'Ömer Faruk Ballı';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-dark-card shadow-lg mb-6">
          {loading ? (
            <div className="w-full h-full bg-gray-200 dark:bg-dark-card animate-pulse" />
          ) : (
            <img 
              src={avatarUrl} 
              alt={authorName} 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-sans">{authorName}</h1>
        <p className="text-l text-gray-600 dark:text-gray-400 font-serif italic">
          DevOps Engineer & Teknoloji Tutkunu
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none mb-12">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">
            Merhaba! Ben Ömer Faruk Ballı. 1994 yılında doğdum. Teknolojiye olan merakım ve sürekli öğrenme tutkumla yazılım geliştirme dünyasında yolculuğuma devam ediyorum.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            Şu anda <strong>Innova</strong> şirketinde profesyonel kariyerimi sürdürmekteyim. DevOps süreçleri, modern yazılım mimarileri ve bulut teknolojileri üzerine çalışmaktan keyif alıyorum. Bu blogda da edindiğim tecrübeleri ve öğrendiğim yeni teknolojileri paylaşmayı hedefliyorum.
        </p>
      </div>

      {/* İletişim Bölümü */}
      <div className="border-t border-gray-200 dark:border-dark-border pt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sans">İletişim</h2>
        <a 
          href="mailto:farukomerballi@gmail.com" 
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <span>farukomerballi@gmail.com</span>
        </a>
      </div>
    </div>
  );
};

export default AboutView;
