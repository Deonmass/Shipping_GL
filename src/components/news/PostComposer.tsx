import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Image, Calendar, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PostComposerProps {
  onPostCreated?: () => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showExpanded, setShowExpanded] = useState(false);
  const [postContent, setPostContent] = useState('');

  const handleSubmit = () => {
    if (!postContent.trim()) {
      toast.error(t('news.messages.contentRequired'));
      return;
    }

    toast.success(t('news.messages.postCreated'));
    setPostContent('');
    setShowExpanded(false);
    onPostCreated?.();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <button
            onClick={() => setShowExpanded(true)}
            className="w-full text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            {t('news.composer.placeholder')}
          </button>
        </div>
      </div>

      {!showExpanded && (
        <div className="flex items-center justify-around mt-3 pt-3 border-t border-gray-200">
          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <Image className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">{t('news.composer.photo')}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">{t('news.composer.event')}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <FileText className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{t('news.composer.article')}</span>
          </button>
        </div>
      )}

      {showExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('news.composer.create')}</h3>
              <button
                onClick={() => setShowExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.email?.split('@')[0] || 'User'}
                  </p>
                </div>
              </div>

              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={t('news.composer.whatOnMind')}
                className="w-full p-3 border-0 resize-none focus:ring-0 text-gray-900 placeholder-gray-400"
                rows={6}
                autoFocus
              />

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Image className="w-5 h-5 text-green-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!postContent.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    postContent.trim()
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t('news.composer.publish')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComposer;
