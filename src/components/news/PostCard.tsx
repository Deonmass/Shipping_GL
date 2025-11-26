import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Clock, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import ShareMenu from './ShareMenu';
import { supabase } from '../../lib/supabase';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    short_description: string;
    image_url?: string;
    category: string;
    author_name: string;
    author_avatar?: string;
    created_at: string;
    likes_count?: number;
    comments_count?: number;
    is_liked?: boolean;
  };
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onReadMore: () => void;
  categoryLabel: string;
}

interface Comment {
  id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onReadMore,
  categoryLabel
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, user_name, user_avatar, content, created_at, approved')
        .eq('post_id', post.id)
        .eq('approved', true)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMins} min`;
    } else if (diffInHours < 24) {
      return `${diffInHours} h`;
    } else if (diffInDays < 7) {
      return `${diffInDays} j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      toast.error(t('news.messages.loginRequired'));
      return;
    }
    if (!commentText.trim()) {
      toast.error(t('news.messages.commentRequired'));
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      const userName = userData
        ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Utilisateur'
        : user.email?.split('@')[0] || 'Utilisateur';

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          user_name: userName,
          user_avatar: userData?.avatar_url,
          content: commentText.trim()
        })
        .select()
        .single();

      if (error) throw error;

      const newComment: Comment = {
        id: data.id,
        user_name: userName,
        user_avatar: userData?.avatar_url,
        content: commentText.trim(),
        created_at: data.created_at
      };

      setComments(prev => [newComment, ...prev]);
      setCommentsCount(prev => prev + 1);
      setCommentText('');
      
      try {
        const { error: notifError } = await supabase
          .from('admin_notifications')
          .insert({
            user_id: user.id,
            type: 'comment',
            title: `${userName} a commenté le post "${post.title}"`,
            message: `Commentaire sur le post "${post.title}"`,
            data: {
              post_id: post.id,
              user_id: user.id,
              comment_id: data.id,
              user_name: userName,
              user_email: user.email,
              post_title: post.title,
            },
            is_read: false,
          });

        if (notifError) {
          console.error('Error inserting comment notification:', notifError);
        }
      } catch (e) {
        console.error('Unexpected error inserting comment notification:', e);
      }

      toast.success(t('news.messages.commentAdded'));
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const description = showFullDescription ? post.short_description :
    post.short_description.length > 200
      ? post.short_description.substring(0, 200) + '...'
      : post.short_description;

  const shouldShowSeeMore = post.short_description.length > 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full font-medium">
              {categoryLabel}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">{formatDate(post.created_at)}</span>
          </div>
          <button
            onClick={() => setShowShareMenu(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={onReadMore}>
          {post.title}
        </h3>

        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {description}
          {shouldShowSeeMore && !showFullDescription && (
            <button
              onClick={() => setShowFullDescription(true)}
              className="text-primary-600 hover:text-primary-700 font-medium ml-1"
            >
              {t('news.post.seeMore')}
            </button>
          )}
        </p>
      </div>

      {post.image_url && (
        <div className="cursor-pointer" onClick={onReadMore}>
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-96 object-cover"
          />
        </div>
      )}

      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            {post.likes_count && post.likes_count > 0 ? (
              <>
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </div>
                <span>{post.likes_count}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center space-x-4">
            {commentsCount > 0 ? (
              <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                {commentsCount} {t('news.post.comments')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
              post.is_liked
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{t('news.post.like')}</span>
          </button>

          <button
            onClick={() => {
              setShowComments(!showComments);
              onComment(post.id);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 flex-1 justify-center"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{t('news.post.comment')}</span>
          </button>

          <button
            onClick={() => onShare(post.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 flex-1 justify-center"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">{t('news.post.share')}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('news.commentForm.placeholder')}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-primary-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCommentSubmit();
                    }
                  }}
                />
                {commentText.trim() && (
                  <button
                    onClick={handleCommentSubmit}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {t('news.commentForm.publish')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {comments.length > 0 && (
            <div className="space-y-4 mt-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  {comment.user_avatar ? (
                    <img
                      src={comment.user_avatar}
                      alt={comment.user_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {comment.user_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="font-semibold text-sm text-gray-900">
                        {comment.user_name}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {comment.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-2">
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ShareMenu
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        post={{
          id: post.id,
          title: post.title,
          image_url: post.image_url,
          short_description: post.short_description
        }}
      />
    </motion.div>
  );
};

export default PostCard;
