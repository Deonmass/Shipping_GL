import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Mail, Send, X, Heart, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { EventCountdown } from '../admin/EventCountdown';

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  image_url?: string;
  description?: string;
}

interface RightSidebarProps {
  events: Event[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ events }) => {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error(t('news.messages.emailRequired'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newsletterEmail)) {
      toast.error(t('news.messages.emailInvalid'));
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-subscription`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      toast.success(t('news.messages.newsletterSuccess'));
      setNewsletterEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Une erreur est survenue lors de l\'abonnement');
    }
  };

  return (
    <>
      <div className="sticky top-16 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('news.upcomingEvents.title')}
          </h3>
          <div className="space-y-3">
            {events.slice(0, 4).map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 flex items-start">
                  <div className="bg-primary-50 rounded-lg flex flex-col items-center justify-center p-2 min-w-[56px]">
                    <span className="text-xs font-medium text-primary-600">
                      {formatEventDate(event.event_date).split(' ')[1].toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatEventDate(event.event_date).split(' ')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {event.title}
                  </h4>
                  <EventCountdown eventDate={event.event_date} compact={true} />
                </div>
              </div>
            ))}
          </div>
          {events.length > 4 && (
            <button
              onClick={() => setShowAllEvents(true)}
              className="w-full mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('news.upcomingEvents.seeAll')}
            </button>
          )}
        </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('news.newsletter.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('news.newsletter.description')}
        </p>
        <form onSubmit={handleNewsletterSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder={t('news.newsletter.emailPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors text-sm"
          >
            {t('news.newsletter.subscribe')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('news.contact.quickContact')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('news.contact.description')}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-700">
            <Mail className="w-4 h-4 mr-2 text-primary-600" />
            <a href="mailto:info@shippinggreatlakes.com" className="hover:text-primary-600">
              info@shippinggreatlakes.com
            </a>
          </div>
          <div className="flex items-center text-gray-700">
            <Send className="w-4 h-4 mr-2 text-primary-600" />
            <a
              href="https://wa.me/243991074493"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 cursor-pointer"
              onClick={(e) => {
                if (!navigator.userAgent.match(/Android|iPhone|iPad/i)) {
                  e.preventDefault();
                  window.location.href = 'tel:+243991074493';
                }
              }}
            >
              +243 991 074493
            </a>
          </div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.image_url && (
              <div className="relative h-64">
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="relative p-6">
              {!selectedEvent.image_url && (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-primary-600">
                      {formatEventDate(selectedEvent.event_date).split(' ')[1].toUpperCase()}
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatEventDate(selectedEvent.event_date).split(' ')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedEvent.title}
                  </h2>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{selectedEvent.location}</span>
                  </div>
                  <EventCountdown eventDate={selectedEvent.event_date} compact={false} />
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-around py-2 border-b">
                  <button
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
                    onClick={() => toast.success('Événement aimé !')}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium">J'aime</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
                    onClick={() => toast.info('Fonctionnalité de commentaire bientôt disponible')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Commenter</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Lien copié !');
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Partager</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showAllEvents && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllEvents(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('news.upcomingEvents.title')}
              </h2>
              <button
                onClick={() => setShowAllEvents(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => {
                    setShowAllEvents(false);
                    setSelectedEvent(event);
                  }}
                  className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                >
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-primary-50 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        {formatEventDate(event.event_date).split(' ')[1].toUpperCase()}
                      </span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatEventDate(event.event_date).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-gray-900 mb-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{event.location}</span>
                    </div>
                    <EventCountdown eventDate={event.event_date} compact={true} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default RightSidebar;
