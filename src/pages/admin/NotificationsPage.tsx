import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

type NotificationType = 'like' | 'post' | 'comment' | 'partner' | 'user' | 'other' | 'update' | 'quote';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  short_description: string;
  image_url?: string;
  image_urls?: string[];
  category: string;
  author_name: string;
  created_at: string;
}

interface AdminNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any | null;
  is_read: boolean;
  created_at: string;
}

const typeLabels: Record<NotificationType, string> = {
  like: 'Nouveau like',
  post: 'Nouveau post',
  comment: 'Nouveau commentaire',
  partner: 'Nouveau partenaire',
  user: 'Nouvel utilisateur',
  other: 'Autre notification',
  update: 'Mise à jour du site',
  quote: 'Demande de devis',
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [theme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('admin_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [displayUnread, setDisplayUnread] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );

  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteEmailLoading, setQuoteEmailLoading] = useState(false);
  const [quoteEmailSaving, setQuoteEmailSaving] = useState(false);

  useEffect(() => {
    const loadQuoteSettings = async () => {
      if (selectedType !== 'quote') return;
      setQuoteEmailLoading(true);
      try {
        const { data, error } = await supabase
          .from('quote_settings')
          .select('notification_email')
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        setQuoteEmail((data as any)?.notification_email || '');
      } catch (e) {
        console.warn('Erreur chargement quote_settings:', e);
      } finally {
        setQuoteEmailLoading(false);
      }
    };

    loadQuoteSettings();
  }, [selectedType]);

  const handleSaveQuoteEmail = async () => {
    if (!quoteEmail.trim()) {
      toast.error("Veuillez renseigner une adresse email de réception");
      return;
    }
    try {
      setQuoteEmailSaving(true);
      const { data } = await supabase
        .from('quote_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (data && (data as any).id) {
        const { error } = await supabase
          .from('quote_settings')
          .update({ notification_email: quoteEmail.trim(), updated_at: new Date().toISOString() })
          .eq('id', (data as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quote_settings')
          .insert([{ notification_email: quoteEmail.trim() }]);
        if (error) throw error;
      }

      toast.success('Adresse de réception mise à jour');
    } catch (e: any) {
      console.error('Erreur enregistrement quote_settings:', e);
      toast.error(e?.message || "Erreur lors de la mise à jour de l'adresse");
    } finally {
      setQuoteEmailSaving(false);
    }
  };
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      toast.error("Impossible de marquer la notification comme lue");
    }
  };

  const openPostFromNotification = async (notification: AdminNotification) => {
    const data: any = notification.data || {};
    const postId = data.post_id;
    if (!postId) {
      setExpandedId(prev => (prev === notification.id ? null : notification.id));
      return;
    }

    try {
      setPostLoading(true);
      const { data: post, error } = await supabase
        .from('news_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (error || !post) {
        toast.error("Impossible de charger le post associé");
        console.error('Error loading post for notification:', error);
        return;
      }
      let displayAuthor = post.author_name as string | null | undefined;

      // Tenter de reconstruire le nom complet (nom + postnom + prénom) depuis la table users si author_id est présent
      if (post.author_id) {
        try {
          const { data: author } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', post.author_id)
            .maybeSingle();

          if (author && typeof author.full_name === 'string' && author.full_name.trim().length > 0) {
            displayAuthor = author.full_name.trim();
          }
        } catch (e) {
          console.warn('Unable to resolve full author name from users table:', e);
        }
      }

      setSelectedPost({
        id: post.id,
        title: post.title,
        content: post.content,
        short_description: post.short_description,
        image_url: post.image_url,
        image_urls: post.image_urls,
        category: post.category,
        author_name: displayAuthor || post.author_name,
        created_at: post.created_at,
      });
    } catch (e) {
      console.error('Unexpected error loading post for notification:', e);
      toast.error("Erreur lors du chargement du post");
    } finally {
      setPostLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setMarkingAll(true);

    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Toutes les notifications sont marquées comme lues');
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      toast.error("Impossible de marquer toutes les notifications comme lues");
    } finally {
      setMarkingAll(false);
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const selectedTypeParam = searchParams.get('type');

  const selectedType: NotificationType | null =
    selectedTypeParam && ['like', 'post', 'comment', 'partner', 'user', 'other', 'update', 'quote'].includes(selectedTypeParam)
      ? (selectedTypeParam as NotificationType)
      : null;

  const filteredNotifications = selectedType
    ? notifications.filter(n => n.type === selectedType)
    : notifications;

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;

  const totalCount = filteredNotifications.length;

  const perTypeCounts = filteredNotifications.reduce(
    (acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      if (!n.is_read) {
        acc[`${n.type}_unread`] = (acc[`${n.type}_unread`] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Animation douce des chiffres des cartes de résumé pendant le chargement
  useEffect(() => {
    if (!loading) {
      setDisplayTotal(totalCount);
      setDisplayUnread(unreadCount);
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const jitter = (value: number, maxDelta: number, min: number, max: number) => {
      const delta = (Math.random() * 2 - 1) * maxDelta;
      return clamp(Math.round(value + delta), min, max);
    };

    const interval = setInterval(() => {
      setDisplayTotal(prev => jitter(prev || 0, 15, 0, 99999));
      setDisplayUnread(prev => jitter(prev || 0, 8, 0, 99999));
    }, 900);

    return () => clearInterval(interval);
  }, [loading, totalCount, unreadCount]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between mt-20">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Notifications
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {unreadCount > 0
              ? `${unreadCount} notification(s) non lue(s) dans ce filtre`
              : 'Toutes les notifications de ce filtre sont lues'}
          </p>
        </div>

      {selectedType === 'quote' && (
        <div
          className={`mb-4 rounded-lg border p-4 flex flex-col gap-3 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Adresse de réception des demandes de devis
              </h2>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Les demandes envoyées depuis la page Services seront redirigées vers cette adresse.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center mt-2">
            <input
              type="email"
              value={quoteEmail}
              onChange={(e) => setQuoteEmail(e.target.value)}
              placeholder="adresse@example.com"
              className={`flex-1 min-w-[220px] rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              disabled={quoteEmailLoading || quoteEmailSaving}
            />
            <button
              type="button"
              onClick={handleSaveQuoteEmail}
              disabled={quoteEmailLoading || quoteEmailSaving}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {quoteEmailSaving ? 'Enregistrement...' : 'Définir l\'adresse de réception'}
            </button>
          </div>
        </div>
      )}
      {/* Modal de détail du post (optionnel, pour les notifications liées aux posts) */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <h2 className="text-lg font-semibold">Détail du post</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className={`p-1.5 rounded-full ${
                  theme === 'dark'
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-100'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postLoading ? (
              <div
                className={`py-12 flex items-center justify-center ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Chargement du post...
              </div>
            ) : (
              <div className="p-6">
                {/* Image de couverture */}
                {(() => {
                  const cover = selectedPost.image_urls?.[0] || selectedPost.image_url;
                  if (!cover) return null;
                  return (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={cover}
                        alt={selectedPost.title}
                        className="w-full max-h-72 object-cover"
                      />
                    </div>
                  );
                })()}

                <div
                  className={`mb-4 flex items-center justify-between text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <span>
                    {new Date(selectedPost.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      theme === 'dark'
                        ? 'bg-primary-900/60 text-primary-200'
                        : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {selectedPost.category}
                  </span>
                </div>

                <h3
                  className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {selectedPost.title}
                </h3>

                <div className="prose max-w-none mb-6">
                  <div
                    className={`${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-700'
                    } leading-relaxed text-sm ql-editor`}
                    dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                  />
                </div>

                <div
                  className={`border-t pt-3 text-sm ${
                    theme === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
                  }`}
                >
                  <span>
                    Publié par{' '}
                    <span
                      className={theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-900'}
                    >
                      {selectedPost.author_name}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAll}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              unreadCount === 0 || markingAll
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {markingAll && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            Marquer tout comme lu
          </button>
        </div>
      </div>

      {/* Résumé chiffré - style cartes pleines en dégradé */}
      <div className="mb-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total (bleu) */}
        <div className="rounded-xl px-4 py-4 text-sm shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="font-semibold mb-1 flex items-center justify-between">
            <span>Total (filtre courant)</span>
          </div>
          <div className="text-3xl font-extrabold">{totalCount}</div>
          <div className="mt-1 text-xs opacity-90">{unreadCount} non lue(s)</div>
        </div>

        {/* Non lues (rouge) */}
        <div className="rounded-xl px-4 py-4 text-sm shadow-md bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="font-semibold mb-1">Non lues (filtre courant)</div>
          <div className="text-3xl font-extrabold">{unreadCount}</div>
          <div className="mt-1 text-xs opacity-90">Toutes catégories confondues</div>
        </div>

        {/* Par type (violet, vert, orange, etc.) */}
        {(['like', 'comment', 'post', 'partner', 'update', 'quote'] as NotificationType[]).map((t) => {
          const count = perTypeCounts[t] || 0;
          const unread = perTypeCounts[`${t}_unread`] || 0;
          if (count === 0) return null;

          const gradientMap: Record<'like' | 'comment' | 'post' | 'partner' | 'update' | 'quote', string> = {
            like: 'from-pink-500 to-pink-600',
            comment: 'from-sky-500 to-sky-600',
            post: 'from-emerald-500 to-emerald-600',
            partner: 'from-indigo-500 to-indigo-600',
            update: 'from-amber-500 to-amber-600',
            quote: 'from-purple-500 to-purple-600',
          };

          const gradientClasses = gradientMap[t as 'like' | 'comment' | 'post' | 'partner' | 'update'];

          return (
            <div
              key={t}
              className={`rounded-xl px-4 py-4 text-sm shadow-md bg-gradient-to-r ${gradientClasses} text-white`}
            >
              <div className="font-semibold mb-1">{typeLabels[t]}</div>
              <div className="text-3xl font-extrabold">{count}</div>
              <div className="mt-1 text-xs opacity-90">{unread} non lue(s)</div>
            </div>
          );
        })}
      </div>

      <div
        className={`rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Chargement des notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-8 h-8 mb-3" />
            <p>Aucune notification pour le moment.</p>
          </div>
        ) : (
          <ul className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {filteredNotifications.map(notification => (
              <li
                key={notification.id}
                className={`p-4 flex items-start gap-3 ${
                  theme === 'dark'
                    ? !notification.is_read
                      ? 'bg-gray-800'
                      : 'bg-gray-900'
                    : !notification.is_read
                      ? 'bg-slate-50'
                      : 'bg-white'
                }`}
              >
                <div className="mt-1">
                  {notification.is_read ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-1" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm px-2 py-0.5 rounded-full ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-200'
                            : 'bg-slate-100 text-gray-800'
                        }`}
                      >
                        {typeLabels[notification.type] || notification.type}
                      </span>
                      <span
                        className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {(notification.data && (notification.data as any).user_name) || notification.title}
                      </span>
                    </div>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {notification.created_at
                        ? format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: fr })
                        : ''}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => openPostFromNotification(notification)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-100 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-slate-50'
                      }`}
                    >
                      {(notification.data as any)?.post_id ? 'Voir le post' : 'Voir'}
                    </button>

                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary-600 text-white hover:bg-primary-700"
                      >
                        Marquer comme lue
                      </button>
                    )}
                  </div>

                  {expandedId === notification.id && (
                    <div
                      className={`mt-3 rounded-md text-xs p-4 border ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-700 text-gray-200'
                          : 'bg-slate-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="font-semibold mb-2 text-sm">Détails de la notification</div>
                      <div className="mb-1 text-sm">
                        <span className="font-medium">Titre :</span> {notification.title}
                      </div>
                      <div className="mb-3 text-sm">
                        <span className="font-medium">Message :</span> {notification.message}
                      </div>

                      {notification.data && (
                        <div className="space-y-1 text-[12px] opacity-90">
                          {typeof (notification.data as any).user_name === 'string' && (
                            <div>
                              <span className="font-medium">Auteur :</span>{' '}
                              {(notification.data as any).user_name}
                            </div>
                          )}
                          {typeof (notification.data as any).post_title === 'string' && (
                            <div>
                              <span className="font-medium">Post :</span>{' '}
                              {(notification.data as any).post_title}
                            </div>
                          )}
                          {typeof (notification.data as any).post_id !== 'undefined' && (
                            <div className="mt-2">
                              <span className="font-medium">Identifiant du contenu :</span>{' '}
                              {(notification.data as any).post_id}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
