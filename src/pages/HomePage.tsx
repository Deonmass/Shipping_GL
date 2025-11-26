import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Ship, Plane, Package, PartyPopper, SettingsIcon as Confetti } from 'lucide-react';

// Components
import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import AboutSection from '../components/home/AboutSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import SliderSection from '../components/home/SliderSection';
import CtaSection from '../components/home/CtaSection';

const LoadingAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Animated logistics icons */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: step === 0 ? 1 : 0, scale: step === 0 ? 1 : 0.5 }}
            transition={{ duration: 0.4 }}
          >
            <Truck className="w-16 h-16 text-primary-600" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: step === 1 ? 1 : 0, scale: step === 1 ? 1 : 0.5 }}
            transition={{ duration: 0.4 }}
          >
            <Ship className="w-16 h-16 text-primary-600" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: step === 2 ? 1 : 0, scale: step === 2 ? 1 : 0.5 }}
            transition={{ duration: 0.4 }}
          >
            <Plane className="w-16 h-16 text-primary-600" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: step === 3 ? 1 : 0, scale: step === 3 ? 1 : 0.5 }}
            transition={{ duration: 0.4 }}
          >
            <Package className="w-16 h-16 text-primary-600" />
          </motion.div>
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
          className="w-48 h-1 bg-primary-600 mx-auto rounded-full"
        />
      </div>
    </div>
  );
};

const Fireworks = () => {
  const [fireworks, setFireworks] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFireworks(prev => {
        const newFirework = {
          id: Date.now(),
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`
          }
        };
        return [...prev, newFirework];
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setFireworks(prev => prev.filter(fw => Date.now() - fw.id < 2000));
    }, 2000);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <>
      {fireworks.map(firework => (
        <div
          key={firework.id}
          className="firework"
          style={firework.style}
        />
      ))}
    </>
  );
};

const AnniversaryModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
    >
      <Fireworks />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 relative overflow-hidden"
      >
        {/* Celebration icons */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-4"
        >
          <PartyPopper className="w-8 h-8 text-primary-600" />
        </motion.div>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 right-4"
        >
          <Confetti className="w-8 h-8 text-primary-600" />
        </motion.div>

        {/* Anniversary content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-primary-600 mb-4">
            10 Ans d'Excellence !
          </h2>
          <p className="text-xl text-gray-700 mb-6">
            Depuis une décennie, SHIPPING GL s'engage à fournir des solutions logistiques
            innovantes et fiables à travers l'Afrique et le monde.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            Merci à nos clients, partenaires et employés pour leur confiance et leur
            soutien continu dans cette aventure extraordinaire.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="btn btn-primary"
          >
            Continuer vers le site
          </motion.button>
        </motion.div>

        {/* Animated decorations */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute -bottom-12 -left-12 w-24 h-24 bg-primary-100 rounded-full opacity-50"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5,
          }}
          className="absolute -top-12 -right-12 w-24 h-24 bg-accent-100 rounded-full opacity-50"
        />
      </motion.div>
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showAnniversary, setShowAnniversary] = useState(false);

  useEffect(() => {
    document.title = 'SHIPPING GL - Solutions Logistiques & Agence en Douane';
    
    // Simulate loading
    const loadingTimer = setTimeout(() => {
      setLoading(false);
      setShowAnniversary(true);
    }, 3000);

    return () => {
      clearTimeout(loadingTimer);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingAnimation />}
        {showAnniversary && <AnniversaryModal onClose={() => setShowAnniversary(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <SliderSection />
        <CtaSection />
      </motion.div>
    </>
  );
};

export default HomePage;