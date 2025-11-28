import React, { useEffect, useState, useRef } from 'react';
import { BlogPost, User, Category } from '../types';
import { fetchTrendingPosts, getUsers, createUser, updateUser, deleteUser, softDeletePost, fetchCategories, addCategory, deleteCategory, uploadImage } from '../services/dataService';
import { FileText, Users, Plus, Edit2, Trash2, X, Tag, Upload, Loader2, CheckSquare, Square } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface AdminPanelProps {
    user: User;
    onCreateClick: () => void;
    onEditClick: (post: BlogPost) => void;
    onUserUpdate: (user: User) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onCreateClick, onEditClick, onUserUpdate }) => {
  const { success, error, confirm } = useNotification();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'categories'>('posts');
  
  // Selection State for bulk operations
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // User Create/Edit State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{username: string, password: string, full_name: string, avatar: string, role: 'admin' | 'editor' | 'reader'}>({ 
      username: '', password: '', full_name: '', avatar: '', role: 'editor' 
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Create State
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadPosts();
  }, [user]);

  useEffect(() => {
      if (activeTab === 'users' && user.role === 'admin') {
          loadUsers();
      } else if (activeTab === 'categories') {
          loadCategories();
      }
  }, [activeTab, user]);

  const loadPosts = () => {
      // If editor, only show their posts
      // includeDrafts = true for admin panel to show drafts
      const authorFilter = user.role === 'editor' ? user.name : undefined;
      fetchTrendingPosts(undefined, 1, 100, authorFilter, undefined, true).then(data => {
          setPosts(data);
          setSelectedPosts(new Set()); // Clear selection when posts reload
      });
  }

  const loadUsers = () => {
      getUsers().then(setUsers);
  }

  const loadCategories = () => {
      fetchCategories().then(setCategories);
  }

  // Toggle single post selection
  const togglePostSelection = (postId: string) => {
      const newSelection = new Set(selectedPosts);
      if (newSelection.has(postId)) {
          newSelection.delete(postId);
      } else {
          newSelection.add(postId);
      }
      setSelectedPosts(newSelection);
  };

  // Toggle all posts selection
  const toggleSelectAll = () => {
      if (selectedPosts.size === posts.length) {
          setSelectedPosts(new Set());
      } else {
          setSelectedPosts(new Set(posts.map(p => p.id)));
      }
  };

  // Bulk delete selected posts
  const handleBulkDelete = async () => {
      if (user.role !== 'admin') {
          error('Yetki Hatası', 'Bu işlem için yetkiniz yok.');
          return;
      }
      
      if (selectedPosts.size === 0) {
          error('Seçim Yapılmadı', 'Lütfen silmek istediğiniz makaleleri seçin.');
          return;
      }

      const confirmed = await confirm({
          title: 'Makaleleri Sil',
          message: `${selectedPosts.size} makaleyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
          confirmText: 'Evet, Sil',
          cancelText: 'İptal',
          type: 'danger'
      });

      if (!confirmed) return;

      setIsDeleting(true);
      
      let successCount = 0;
      let failCount = 0;

      for (const postId of selectedPosts) {
          const result = await softDeletePost(postId);
          if (result) {
              successCount++;
          } else {
              failCount++;
          }
      }

      setIsDeleting(false);
      
      if (failCount > 0) {
          error('Kısmi Başarı', `${successCount} makale silindi, ${failCount} makale silinemedi.`);
      } else {
          success('Başarılı', `${successCount} makale başarıyla silindi.`);
      }
      
      loadPosts();
  };

  const handleDeletePost = async (id: string) => {
      if (user.role !== 'admin') {
          error('Yetki Hatası', 'Bu işlem için yetkiniz yok.');
          return;
      }
      
      const confirmed = await confirm({
          title: 'Makaleyi Sil',
          message: 'Bu yazıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
          confirmText: 'Evet, Sil',
          cancelText: 'İptal',
          type: 'danger'
      });
      
      if (confirmed) {
          const result = await softDeletePost(id);
          if (result) {
              success('Başarılı', 'Makale başarıyla silindi.');
              loadPosts();
          } else {
              error('Hata', 'Makale silinirken bir hata oluştu.');
          }
      }
  }

  const handleDeleteUser = async (id: string) => {
      if (user.role !== 'admin') {
          error('Yetki Hatası', 'Bu işlem için yetkiniz yok.');
          return;
      }
      
      const confirmed = await confirm({
          title: 'Kullanıcıyı Sil',
          message: 'Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
          confirmText: 'Evet, Sil',
          cancelText: 'İptal',
          type: 'danger'
      });
      
      if (confirmed) {
          const result = await deleteUser(id);
          if (result) {
              success('Başarılı', 'Kullanıcı başarıyla silindi.');
              loadUsers();
          } else {
              error('Hata', 'Kullanıcı silinirken bir hata oluştu.');
          }
      }
  }

  const openUserModal = (userToEdit?: User) => {
      if (userToEdit) {
          setEditingUser(userToEdit);
          setUserForm({
              username: userToEdit.username,
              password: '', // Don't show password
              full_name: userToEdit.name || '',
              avatar: userToEdit.avatar || '',
              role: userToEdit.role
          });
      } else {
          setEditingUser(null);
          setUserForm({ username: '', password: '', full_name: '', avatar: '', role: 'editor' });
      }
      setIsUserModalOpen(true);
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingUser) {
          // Update existing user
          const result = await updateUser(editingUser.id, {
              username: userForm.username,
              password: userForm.password || undefined, // Only send if changed
              name: userForm.full_name,
              avatar: userForm.avatar,
              role: userForm.role
          });

          if (result) {
              setIsUserModalOpen(false);
              loadUsers();
              success('Başarılı', 'Kullanıcı bilgileri güncellendi.');
              // If the edited user is the current logged-in user, update the app state
              if (editingUser.id === user.id) {
                  onUserUpdate({
                      ...user,
                      username: userForm.username,
                      name: userForm.full_name,
                      avatar: userForm.avatar,
                      role: userForm.role
                  });
              }
          } else {
              error('Hata', 'Kullanıcı güncellenirken bir hata oluştu.');
          }
      } else {
          // Create new user
          if (!userForm.username || !userForm.password) {
              error('Eksik Bilgi', 'Kullanıcı adı ve şifre zorunludur.');
              return;
          }

          const result = await createUser({
              username: userForm.username,
              password: userForm.password,
              name: userForm.full_name,
              avatar: userForm.avatar || `https://ui-avatars.com/api/?name=${userForm.full_name || userForm.username}`,
              role: userForm.role
          });

          if (result) {
              setIsUserModalOpen(false);
              loadUsers();
              success('Başarılı', 'Yeni kullanıcı başarıyla oluşturuldu.');
          } else {
              error('Hata', 'Kullanıcı oluşturulurken bir hata oluştu.');
          }
      }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCategoryName.trim()) {
          error('Eksik Bilgi', 'Kategori adı boş olamaz.');
          return;
      }

      const result = await addCategory(newCategoryName.trim());
      if (result) {
          setNewCategoryName('');
          loadCategories();
          success('Başarılı', `"${newCategoryName.trim()}" kategorisi eklendi.`);
      } else {
          error('Hata', 'Kategori eklenirken bir hata oluştu.');
      }
  }

  const handleDeleteCategory = async (id: string) => {
      if (user.role !== 'admin') {
          error('Yetki Hatası', 'Bu işlem için yetkiniz yok.');
          return;
      }
      
      const confirmed = await confirm({
          title: 'Kategoriyi Sil',
          message: 'Bu kategoriyi silmek istediğinize emin misiniz?',
          confirmText: 'Evet, Sil',
          cancelText: 'İptal',
          type: 'warning'
      });
      
      if (confirmed) {
          const result = await deleteCategory(id);
          if (result) {
              success('Başarılı', 'Kategori başarıyla silindi.');
              loadCategories();
          } else {
              error('Hata', 'Kategori silinirken bir hata oluştu.');
          }
      }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsUploading(true);
          const file = e.target.files[0];
          const publicUrl = await uploadImage(file);
          
          if (publicUrl) {
              setUserForm(prev => ({ ...prev, avatar: publicUrl }));
              success('Başarılı', 'Resim başarıyla yüklendi.');
          } else {
              error('Hata', 'Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
          }
          setIsUploading(false);
      }
  };

  const isAdmin = user.role === 'admin';
  const allSelected = posts.length > 0 && selectedPosts.size === posts.length;
  const someSelected = selectedPosts.size > 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-[80vh] animate-fade-in">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-24">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 px-3">Yönetim Paneli</h2>
            <nav className="space-y-1">
                <button 
                    onClick={() => setActiveTab('posts')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'posts' 
                        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-dark-card' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-card/50'
                    }`}
                >
                    <FileText size={18} />
                    Makaleler
                </button>
                
                {isAdmin && (
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'users' 
                            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-dark-card' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-card/50'
                        }`}
                    >
                        <Users size={18} />
                        Kullanıcılar
                    </button>
                )}

                <button 
                    onClick={() => setActiveTab('categories')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'categories' 
                        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-dark-card' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-card/50'
                    }`}
                >
                    <Tag size={18} />
                    Kategoriler
                </button>

            </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow">
        {activeTab === 'posts' && (
            <>
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Makaleler</h1>
                        {someSelected && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({selectedPosts.size} seçili)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Bulk Delete Button */}
                        {isAdmin && someSelected && (
                            <button 
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                            >
                                {isDeleting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                {isDeleting ? 'Siliniyor...' : `Seçilenleri Sil (${selectedPosts.size})`}
                            </button>
                        )}
                        <button 
                            onClick={onCreateClick}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        >
                            <Plus size={16} />
                            Yeni Yazı Yaz
                        </button>
                    </div>
                </header>

                {/* Posts Table */}
                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden shadow-sm transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                    {isAdmin && (
                                        <th className="px-4 py-3 w-12">
                                            <button 
                                                onClick={toggleSelectAll}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-colors"
                                                title={allSelected ? "Tümünü Kaldır" : "Tümünü Seç"}
                                            >
                                                {allSelected ? (
                                                    <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </th>
                                    )}
                                    <th className="px-6 py-3 font-medium">Başlık</th>
                                    <th className="px-6 py-3 font-medium">Kategori</th>
                                    <th className="px-6 py-3 font-medium">Durum</th>
                                    <th className="px-6 py-3 font-medium">Tarih</th>
                                    <th className="px-6 py-3 font-medium text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                                {posts.map(post => (
                                    <tr 
                                        key={post.id} 
                                        onClick={() => onEditClick(post)}
                                        className={`hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors cursor-pointer ${
                                            selectedPosts.has(post.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                        }`}
                                    >
                                        {isAdmin && (
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => togglePostSelection(post.id)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-colors"
                                                >
                                                    {selectedPosts.has(post.id) ? (
                                                        <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
                                                    ) : (
                                                        <Square size={18} className="text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-gray-200 line-clamp-1">{post.title}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{post.author}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {post.tags && post.tags.length > 0 ? post.tags.join(', ') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                post.status === 'published' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            }`}>
                                                {post.status === 'published' ? 'Yayında' : 'Taslak'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-sans">
                                            {post.date}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => onEditClick(post)} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                                                {isAdmin && (
                                                    <button onClick={() => handleDeletePost(post.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {posts.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            Henüz makale bulunmuyor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}

        {activeTab === 'users' && isAdmin && (
            <>
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcılar</h1>
                    <button 
                        onClick={() => openUserModal()}
                        className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                        <Plus size={16} />
                        Kullanıcı Ekle
                    </button>
                </header>

                {isUserModalOpen && (
                    <div className="mb-8 bg-gray-50 dark:bg-dark-card/50 p-6 rounded-xl border border-gray-100 dark:border-dark-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kullanıcı Adı</label>
                                <input 
                                    type="text" 
                                    value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre {editingUser && <span className="text-xs text-gray-500 font-normal">(Değiştirmek için doldurun)</span>}</label>
                                <input 
                                    type="password" 
                                    value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                                <input 
                                    type="text" 
                                    value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Avatar URL"
                                        value={userForm.avatar} 
                                        onChange={e => setUserForm({...userForm, avatar: e.target.value})}
                                        className="flex-grow px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                    />
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="px-4 py-2 bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors flex items-center gap-2"
                                    >
                                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                        <span className="hidden md:inline">Yükle</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                                <select 
                                    value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                >
                                    <option value="editor">Editör</option>
                                    <option value="admin">Admin</option>
                                    <option value="reader">Okuyucu</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 flex justify-end pt-2">
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">Kaydet</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden shadow-sm transition-colors">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3 font-medium">Kullanıcı</th>
                                <th className="px-6 py-3 font-medium">Rol</th>
                                <th className="px-6 py-3 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name || u.username}`} alt={u.name} className="w-8 h-8 rounded-full bg-gray-200" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-200">{u.name || u.username}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{u.username}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium uppercase">{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openUserModal(u)} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}

        {activeTab === 'categories' && (
             <>
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriler</h1>
                </header>

                <div className="mb-8 bg-white dark:bg-dark-card p-6 rounded-xl border border-gray-100 dark:border-dark-border">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Yeni Kategori Ekle</h3>
                    <form onSubmit={handleAddCategory} className="flex gap-4">
                        <input 
                            type="text" placeholder="Kategori Adı" 
                            value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                            className="flex-grow px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                        <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Ekle</button>
                    </form>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden shadow-sm transition-colors">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3 font-medium">Kategori Adı</th>
                                <th className="px-6 py-3 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                        {cat.name}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isAdmin && (
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        Henüz kategori eklenmemiş.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
