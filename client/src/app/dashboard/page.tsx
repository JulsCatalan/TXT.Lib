// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  FileText, 
  Share2, 
  LogOut,
  Loader2,
  Search,
  Filter,
  BarChart3,
  Star,
  User
} from 'lucide-react';
import { getTexts, logout, getSharedWithMe, getFavorites } from '../../utils/api';
import { Text, SharedText } from '../../types';
import TextCard from '../../components/TextCard';
import SharedTextCard from '../../components/SharedTextCard';
import CreateTextModal from '../../components/CreateTextModal';
import SharedTextsModal from '../../components/SharedTextsModal';
import AnalyticsModal from '../../components/AnalyticsModal';
import FavoriteModal from '../../components/FavoriteModal';
import ProfileModal from '../../components/ProfileModal';

export default function DashboardPage() {
  const router = useRouter();
  const [texts, setTexts] = useState<Text[]>([]);
  const [sharedTexts, setSharedTexts] = useState<SharedText[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSharedModal, setShowSharedModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [favorites, setFavorites] = useState<Text[]>([]);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [myTexts, shared] = await Promise.all([
        getTexts(),
        getSharedWithMe()
      ]);
      setTexts(myTexts);
      setSharedTexts(shared);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleTextCreated = () => {
    setShowCreateModal(false);
    loadData(); // Recargar la lista después de crear
  };

  const handleTextUpdated = () => {
    loadData(); // Recargar la lista después de actualizar
  };

  // ===== Favoritos =====
  const loadFavorites = async () => {
    try {
      const favs: { favorite_id: string; favorited_at: string; text: Text }[] = await getFavorites();
      setFavorites(favs.map((f) => f.text));
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    }
  };

  const handleOpenFavorites = async () => {
    await loadFavorites();
    setShowFavoriteModal(true);
  };

  // ===== Filtrado =====
  const filteredTexts = texts.filter((text) => {
    const matchesSearch = text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         text.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || text.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSharedTexts = sharedTexts.filter((item) => {
    const matchesSearch = item.text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.text.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.text.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const allCategories = [
    ...texts.map(t => t.category).filter(Boolean),
    ...sharedTexts.map(s => s.text.category).filter(Boolean)
  ];
  const categories = Array.from(new Set(allCategories));
  const totalFiltered = filteredTexts.length + filteredSharedTexts.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Header */}
      <header className="border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">TXT.Lib</h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </button>

            <button
              onClick={handleOpenFavorites}
              className="flex items-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Favoritos</span>
            </button>

            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            <button
              onClick={() => setShowSharedModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Compartidos</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Buscar textos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-900 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:border-gray-700 transition"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-3 bg-black border border-gray-900 rounded-lg text-white focus:outline-none focus:border-gray-700 transition appearance-none cursor-pointer"
            >
              <option value="all">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat!}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Texto
          </button>
        </div>

        {/* Texts Grid */}
        {totalFiltered === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-800" />
            <h3 className="text-xl font-semibold mb-2">No hay textos</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterCategory !== 'all' 
                ? 'No se encontraron textos con esos filtros'
                : 'Crea tu primer texto para comenzar'}
            </p>
            {!searchQuery && filterCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Crear Texto
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mis Textos */}
            {filteredTexts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-200">Mis Textos 
                  <span className='text-blue-500'> -</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTexts.map((text) => (
                    <TextCard 
                      key={text.id} 
                      text={text}
                      onUpdated={handleTextUpdated}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Textos Compartidos Conmigo */}
            {filteredSharedTexts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-200">Compartidos Conmigo
                  <span className='text-purple-500'> -</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSharedTexts.map((sharedText) => (
                    <SharedTextCard 
                      key={sharedText.share_id} 
                      sharedText={sharedText}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateTextModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTextCreated}
        />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {showAnalytics && (
        <AnalyticsModal onClose={() => setShowAnalytics(false)} />
      )}

      {showFavoriteModal && (
        <FavoriteModal
          favorites={favorites}
          onClose={() => setShowFavoriteModal(false)}
        />
      )}

      {showSharedModal && (
        <SharedTextsModal
          onClose={() => setShowSharedModal(false)}
        />
      )}
    </div>
  );
}