import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import {X, Loader, ChevronLeft, ChevronRight} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {toast} from 'react-hot-toast';
import {supabase} from '../lib/supabase';
import LeftSidebar from '../components/news/LeftSidebar';
import PostCard from '../components/news/PostCard';
import RightSidebar from '../components/news/RightSidebar';
import FilterBar from '../components/news/FilterBar';
import {
    UseGetOpenCategories,
    UseGetOpenEvents, UseGetOpenPostLikes,
    UseGetOpenPosts,
    UseVisitorCommentPost,
    UseVisitorLikePost
} from "../services";
import {removeAuthVisitorData} from "../utils";

interface Post {
    id: string;
    title: string;
    content: string;
    short_description: string;
    image_url?: string;
    image_urls?: string[];
    category_id: string;
    author_name: string;
    author_avatar?: string;
    created_at: string;
    likes_count?: number;
    comments_count?: number;
    is_liked?: boolean;
    category_name?: string;
}


const NewsPage: React.FC = () => {
    const {t, i18n} = useTranslation();
    const {visitor} = useAuth();
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState<'likes' | 'comments' | 'shares' | ''>('');
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({start: null, end: null});
    const [shares, setShares] = useState<{ [key: string]: number }>({});

    const {data: posts, isLoading: isGettingPosts, refetch: reGetPosts} = UseGetOpenPosts()
    const {data: categories, isLoading: isGettingCategories} = UseGetOpenCategories({type: "news"})
    const {data: events, isLoading: isGettingEvents} = UseGetOpenEvents()

    const {isPending: isLiking, mutate: likePost, data: likeResult} = UseVisitorLikePost()
    const {data: visitorLikes, refetch: reGetVisitorLikes} = UseGetOpenPostLikes({format: "visitor_array", visitor_id: visitor?.id, enabled: !!visitor,})

    useEffect(() => {
        document.title = 'Actualités - SHIPPING GL';
    }, [i18n.language]);

    useEffect(() => {
        // Reset slider when opening a new post
        setCurrentSlide(0);
    }, [selectedPost]);

    useEffect(() => {
        if (likeResult) {
            if (likeResult?.responseData?.error) {
                toast.error(likeResult?.responseData?.message || "Une erreur s'est produite ! Reesayez");
            } else {
                reGetPosts()
                reGetVisitorLikes()
            }
        }
    }, [likeResult]);


    const handleLike = async (postId: string) => {
        if (!visitor) {
            toast.error(t('news.messages.loginRequired'));
            return;
        }
        likePost({ post_id: postId, })
    };

    const handleShare = (postId: string) => {
        handleShareCount(postId);
        const url = `${window.location.origin}/actualites/${postId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Lien copié dans le presse-papiers !');
        }).catch(() => {
            toast.error('Erreur lors de la copie du lien');
        });
    };

    const handlePostSelect = (postId: string) => {
        const post = posts?.responseData?.data?.find(p => p.id === postId);
        if (post) {
            setSelectedPost(post);
        }
    };

    const handleShareCount = (postId: string) => {
        setShares(prev => ({
            ...prev,
            [postId]: (prev[postId] || 0) + 1
        }));
    };

    const filteredAndSortedPosts = (() => {
        let filtered = posts?.responseData?.data?.filter((post: any) => {
            const matchesCategory = selectedCategory === 'all' || post.category_id === selectedCategory;
            const matchesSearch = searchTerm === '' ||
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.short_description.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                const postDate = new Date(post.created_at);
                if (dateRange.start && postDate < dateRange.start) matchesDate = false;
                if (dateRange.end && postDate > dateRange.end) matchesDate = false;
            }

            return matchesCategory && matchesSearch && matchesDate;
        });

        if (sortType) {
            filtered = [...filtered].sort((a, b) => {
                switch (sortType) {
                    case 'likes':
                        return (b.likes_count || 0) - (a.likes_count || 0);
                    case 'comments':
                        return (b.comments_count || 0) - (a.comments_count || 0);
                    case 'shares':
                        return (shares[b.id] || 0) - (shares[a.id] || 0);
                    default:
                        return 0;
                }
            });
        }

        return filtered;
    })();

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="min-h-screen bg-gray-100"
        >
            <div className="pt-20 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-3 hidden lg:block">
                            <div className="sticky top-20">
                                <LeftSidebar
                                    isLoading={isGettingCategories}
                                    data={categories?.responseData?.data}
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={setSelectedCategory}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-6">
                            <FilterBar
                                categories={categories?.responseData?.data || []}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onCategorySelect={setSelectedCategory}
                                onDateRangeSelect={(start, end) => setDateRange({start, end})}
                                onSortChange={setSortType}
                                selectedCategory={selectedCategory}
                                selectedSort={sortType}
                                posts={posts?.responseData?.data?.map((p: any) => ({id: p.id, title: p.title})) || []}
                                onPostSelect={handlePostSelect}
                            />

                            {isGettingPosts ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader className="w-8 h-8 text-primary-600 animate-spin"/>
                                </div>
                            ) : filteredAndSortedPosts?.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                                    <p className="text-gray-500">{t('news.noResults')}</p>
                                </div>
                            ) : (
                                <div>
                                    {filteredAndSortedPosts?.map((post: any) => (
                                        <PostCard
                                            key={post.id}
                                            post={{
                                                ...post,
                                                is_liked: !!(visitorLikes?.responseData?.data[`${post?.id}`])
                                            }}
                                            onLike={handleLike}
                                            onShare={handleShare}
                                            onReadMore={() => setSelectedPost(post)}
                                            categoryLabel={post?.category_name}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-3 hidden lg:block">
                            <RightSidebar events={events?.responseData?.data || []}/>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedPost && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedPost(null)}
                    >
                        <motion.div
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.95, opacity: 0}}
                            className="bg-white rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {(selectedPost?.image_urls && selectedPost?.image_urls.length > 0) ? (
                                <div className="relative">
                                    <img
                                        src={selectedPost.image_urls[currentSlide]}
                                        alt={`${selectedPost.title} ${currentSlide + 1}`}
                                        className="w-full h-96 object-cover"
                                    />
                                    {selectedPost.image_urls.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentSlide((s) => (s - 1 + selectedPost.image_urls!.length) % selectedPost.image_urls!.length)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                                                aria-label="Précédent"
                                            >
                                                <ChevronLeft className="w-6 h-6"/>
                                            </button>
                                            <button
                                                onClick={() => setCurrentSlide((s) => (s + 1) % selectedPost.image_urls!.length)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                                                aria-label="Suivant"
                                            >
                                                <ChevronRight className="w-6 h-6"/>
                                            </button>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                                {selectedPost.image_urls.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentSlide(i)}
                                                        className={`w-2.5 h-2.5 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                                                        aria-label={`Aller à l'image ${i + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setSelectedPost(null)}
                                        className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                                    >
                                        <X className="w-6 h-6"/>
                                    </button>
                                </div>
                            ) : (
                                selectedPost.image_url && (
                                    <div className="relative">
                                        <img
                                            src={selectedPost.image_url}
                                            alt={selectedPost.title}
                                            className="w-full h-96 object-cover"
                                        />
                                        <button
                                            onClick={() => setSelectedPost(null)}
                                            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                                        >
                                            <X className="w-6 h-6"/>
                                        </button>
                                    </div>
                                )
                            )}

                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500">
                    {new Date(selectedPost.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                  </span>
                                    <span
                                        className="px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {selectedPost?.category_name}
                  </span>
                                </div>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                    {selectedPost.title}
                                </h2>

                                <div className="prose max-w-none mb-8">
                                    <div
                                        className="text-gray-700 leading-relaxed text-lg ql-editor"
                                        dangerouslySetInnerHTML={{__html: selectedPost.content}}
                                    />
                                </div>

                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-500">
                                        Publié par <span
                                        className="font-medium text-gray-900">{selectedPost.author_name}</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default NewsPage;
