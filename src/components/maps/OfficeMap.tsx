import React from 'react';

interface Office {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface OfficeMapProps {
  offices: Office[];
  className?: string;
}

const OfficeMap: React.FC<OfficeMapProps> = ({ offices, className = '' }) => {
  // Si nous avons des bureaux, créons un lien de carte statique OpenStreetMap
  const getMapUrl = () => {
    if (offices.length === 0) {
      // Carte du monde par défaut si aucun bureau
      return 'https://www.openstreetmap.org/export/embed.html?bbox=-180,-60,180,85&layer=mapnik';
    }
    
    // Si un seul bureau, centrer sur ce bureau
    if (offices.length === 1) {
      const office = offices[0];
      return `https://www.openstreetmap.org/export/embed.html?bbox=${office.longitude-5},${office.latitude-5},${office.longitude+5},${office.latitude+5}&layer=mapnik&marker=${office.latitude},${office.longitude}`;
    }
    
    // Si plusieurs bureaux, calculer les bornes
    const lats = offices.map(o => o.latitude);
    const lngs = offices.map(o => o.longitude);
    const bounds = {
      minLat: Math.min(...lats) - 1,
      maxLat: Math.max(...lats) + 1,
      minLng: Math.min(...lngs) - 1,
      maxLng: Math.max(...lngs) + 1,
    };
    
    // Créer des marqueurs pour chaque bureau
    const markers = offices.map(o => `markers=${o.latitude},${o.longitude}`).join('&');
    
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}&layer=mapnik&${markers}`;
  };

  return (
    <div className={`w-full h-96 rounded-lg overflow-hidden ${className}`}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={getMapUrl()}
        className="border-0"
        allowFullScreen
        aria-hidden="false"
        tabIndex={0}
      />
      <div className="mt-2 text-xs text-center text-gray-500">
        <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">
          Voir sur OpenStreetMap
        </a>
      </div>
    </div>
  );
};

export default OfficeMap;
