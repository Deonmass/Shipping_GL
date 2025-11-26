import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  // Update document title
  useEffect(() => {
    document.title = 'Page non trouvée - SHIPPING GL';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center py-20 bg-gray-50"
    >
      <div className="container-custom max-w-3xl text-center">
        <h1 className="text-9xl font-bold text-primary-600 mb-6">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Non Trouvée</h2>
        <p className="text-xl text-gray-600 mb-10">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn btn-primary inline-flex items-center">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Link>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;