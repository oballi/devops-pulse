import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const success = await onLogin(email, password);
    if (!success) {
      setError('Hatalı kullanıcı adı veya şifre.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-dark-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border transition-colors">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-sans">Yönetici Girişi</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
            İçerik yönetimi paneline erişmek için giriş yapın.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all"
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all"
              placeholder="••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-3 px-4 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                ← Ana Sayfaya Dön
            </a>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
