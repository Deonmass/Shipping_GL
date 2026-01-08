import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  Globe, Briefcase, Users, Calendar, User as UserIcon,
  Megaphone, Award, Building, Tag
} from 'lucide-react';

interface LeftSidebarProps {
  data: any[];
  isLoading: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ selectedCategory, onCategoryChange, data, isLoading }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const getIconForCategory = (iconName?: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'globe': Globe,
      'briefcase': Briefcase,
      'users': Users,
      'calendar': Calendar,
      'user': UserIcon,
      'megaphone': Megaphone,
      'award': Award,
      'building': Building,
      'tag': Tag
    };
    return iconMap[iconName?.toLowerCase() || 'tag'] || Tag;
  };

  return (
    <div className="h-fit">
      <div className="bg-white rounded-lg shadow-sm">
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.email?.split('@')[0] || 'User'}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <button
                onClick={() => onCategoryChange('all')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  selectedCategory === 'all'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{t('news.categories.all')}</span>
              </button>
              {data?.map(category => {
                const Icon = getIconForCategory(category.icon);
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      selectedCategory === category.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default LeftSidebar;
