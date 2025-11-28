import React from 'react';
import { BlogPost } from '../types';

interface ArticleCardProps {
  post: BlogPost;
  onClick: (post: BlogPost) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ post, onClick }) => {
  return (
    <article className="group flex flex-col md:flex-row gap-8 py-10 border-b border-gray-100 dark:border-dark-border last:border-0 cursor-pointer" onClick={() => onClick(post)}>
      <div className="flex-1 flex flex-col justify-between order-2 md:order-1">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.author}`} alt={post.author} className="w-full h-full object-cover" />
             </div>
             <span className="text-sm font-medium text-gray-900 dark:text-gray-200 font-sans">{post.author}</span>
             <span className="text-gray-400 text-xs">•</span>
             <span className="text-sm text-gray-500 dark:text-gray-400 font-sans">{post.date}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors font-sans leading-tight">
            {post.title}
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 font-serif leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 text-base">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-wrap">
                {post.tags && post.tags.length > 0 ? (
                    post.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium font-sans border border-transparent dark:border-dark-border">
                            {tag}
                        </span>
                    ))
                ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium font-sans border border-transparent dark:border-dark-border">
                         Genel
                    </span>
                )}
                <span className="text-xs text-gray-400 font-sans ml-2">{post.readTime}</span>
            </div>
        </div>
      </div>

      {post.imageUrl && (
        <div className="md:w-48 md:h-32 flex-shrink-0 order-1 md:order-2">
            <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-48 md:h-full object-cover rounded-md md:rounded filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            />
        </div>
      )}
    </article>
  );
};

export default ArticleCard;