import React, {useState, useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {
    Search,
    ChevronDown,
    Calendar as CalendarIcon,
    FileText,
    Tag,
    TrendingUp,
    MessageCircle,
    Share2,
} from 'lucide-react';

interface FilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onCategorySelect: (categoryId: string) => void;
    onDateRangeSelect: (start: Date | null, end: Date | null) => void;
    onSortChange: (sortType: 'likes' | 'comments' | 'shares') => void;
    selectedCategory: string;
    selectedSort: string;
    categories: Array<{ id: string; name: string }>;
    posts: Array<{ id: string; title: string }>;
    onPostSelect: (postId: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
                                                 searchTerm,
                                                 onSearchChange,
                                                 onCategorySelect,
                                                 onDateRangeSelect,
                                                 onSortChange,
                                                 selectedCategory,
                                                 selectedSort,
                                                 posts,
                                                 categories,
                                                 onPostSelect
                                             }) => {
    const {t} = useTranslation();
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const categoryRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setShowCategoryMenu(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSortMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const getCategoryName = (categoryId: string) => {
        if (categoryId === 'all') return t('news.filters.category');
        const category = categories.find(c => c?.id?.toString() === categoryId?.toString());
        return category?.name || t('news.filters.category');
    };

    const getSortLabel = (sortType: string) => {
        switch (sortType) {
            case 'likes':
                return t('news.filters.mostLiked');
            case 'comments':
                return t('news.filters.mostCommented');
            case 'shares':
                return t('news.filters.mostShared');
            default:
                return t('news.filters.sortBy');
        }
    };

    const filteredSuggestions = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const handleDateRangeApply = () => {
        onDateRangeSelect(startDate, endDate);
        setShowCalendar(false);
    };

    const clearDateRange = () => {
        setStartDate(null);
        setEndDate(null);
        onDateRangeSelect(null, null);
        setShowCalendar(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 sticky top-20 z-40">
            <div className="flex flex-col space-y-3">
                <div className="relative" ref={searchRef}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                    <input
                        type="search"
                        placeholder={t('news.search.placeholder')}
                        value={searchTerm}
                        onChange={(e) => {
                            onSearchChange(e.target.value);
                            setShowSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-full border-0 focus:ring-2 focus:ring-primary-500 text-sm"
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-50">
                            {filteredSuggestions.map((post) => (
                                <button
                                    key={post.id}
                                    onClick={() => {
                                        onPostSelect(post.id);
                                        setShowSuggestions(false);
                                        onSearchChange('');
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                    <p className="text-sm text-gray-900 line-clamp-2">{post.title}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-around space-x-2">
                    <div ref={categoryRef} className="relative flex-1">
                        <button
                            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-700 border border-gray-200"
                        >
                            <Tag className="w-5 h-5 text-blue-500"/>
                            <span className="text-sm font-medium">{getCategoryName(selectedCategory)}</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`}/>
                        </button>

                        {showCategoryMenu && (
                            <div
                                className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-50 min-w-full">
                                <button
                                    onClick={() => {
                                        onCategorySelect('all');
                                        setShowCategoryMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                        selectedCategory === 'all' ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                                    }`}
                                >
                                    <span className="text-sm font-medium">{t('news.filters.allCategories')}</span>
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            onCategorySelect(category.id);
                                            setShowCategoryMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                            selectedCategory === category.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                                        }`}
                                    >
                                        <span className="text-sm font-medium">{category.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div ref={calendarRef} className="relative flex-1">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-700 border border-gray-200"
                        >
                            <CalendarIcon className="w-5 h-5 text-green-500"/>
                            <span className="text-sm font-medium">{t('news.filters.event')}</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${showCalendar ? 'rotate-180' : ''}`}/>
                        </button>

                        {showCalendar && (
                            <div
                                className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-max">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('news.filters.startDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate?.toISOString().split('T')[0] || ''}
                                            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('news.filters.endDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate?.toISOString().split('T')[0] || ''}
                                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="flex space-x-2 pt-2">
                                        <button
                                            onClick={clearDateRange}
                                            className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            {t('news.filters.clear')}
                                        </button>
                                        <button
                                            onClick={handleDateRangeApply}
                                            className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                        >
                                            {t('news.filters.apply')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={sortRef} className="relative flex-1">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-700 border border-gray-200"
                        >
                            <FileText className="w-5 h-5 text-orange-500"/>
                            <span className="text-sm font-medium">{getSortLabel(selectedSort)}</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`}/>
                        </button>

                        {showSortMenu && (
                            <div
                                className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-full">
                                <button
                                    onClick={() => {
                                        onSortChange('likes');
                                        setShowSortMenu(false);
                                    }}
                                    className={`w-full flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                        selectedSort === 'likes' ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                                    }`}
                                >
                                    <TrendingUp className="w-4 h-4"/>
                                    <span className="text-sm font-medium">{t('news.filters.mostLiked')}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onSortChange('comments');
                                        setShowSortMenu(false);
                                    }}
                                    className={`w-full flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                        selectedSort === 'comments' ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                                    }`}
                                >
                                    <MessageCircle className="w-4 h-4"/>
                                    <span className="text-sm font-medium">{t('news.filters.mostCommented')}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onSortChange('shares');
                                        setShowSortMenu(false);
                                    }}
                                    className={`w-full flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors ${
                                        selectedSort === 'shares' ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                                    }`}
                                >
                                    <Share2 className="w-4 h-4"/>
                                    <span className="text-sm font-medium">{t('news.filters.mostShared')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
