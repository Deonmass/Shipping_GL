import React from 'react';

interface Office {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface OfficeMapProps {
  offices?: Office[];
  className?: string;
  showRDC?: boolean;
}

const OfficeMap: React.FC<OfficeMapProps> = ({ offices = [], className = '', showRDC = false }) => {
  // Coordonnées des villes de RDC
  const rdcCities = [
    { name: 'Kinshasa', lat: -4.4419, lng: 15.2663 },
    { name: 'Lubumbashi', lat: -11.6642, lng: 27.4826 },
    { name: 'Goma', lat: -1.6508, lng: 29.2344 }
  ];

  // Si nous avons des bureaux, créons un lien de carte statique OpenStreetMap
  const getMapUrl = () => {
    // Si showRDC est vrai, afficher la carte de la RDC avec les villes marquées
    if (showRDC) {
      // Bornes pour zoomer sur la RDC
      const bounds = {
        minLng: 12.0,
        maxLng: 32.0,
        minLat: -14.0,
        maxLat: 6.0
      };
      
      // Créer des marqueurs rouges pour les villes de RDC
      const markers = offices.map(city =>
        `markers=${city.latitude},${city.longitude}`
      ).join('&');
      
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}&layer=mapnik&${markers}&marker-color=ff0000&marker-size=l`;
    }

    // Comportement original si showRDC est faux
    if (offices.length === 0) {
      return 'https://www.openstreetmap.org/export/embed.html?bbox=-180,-60,180,85&layer=mapnik';
    }
    
    if (offices.length === 1) {
      const office = offices[0];
      return `https://www.openstreetmap.org/export/embed.html?bbox=${office.longitude-5},${office.latitude-5},${office.longitude+5},${office.latitude+5}&layer=mapnik&marker=${office.latitude},${office.longitude}`;
    }
    
    const lats = offices.map(o => o.latitude);
    const lngs = offices.map(o => o.longitude);
    const bounds = {
      minLat: Math.min(...lats) - 1,
      maxLat: Math.max(...lats) + 1,
      minLng: Math.min(...lngs) - 1,
      maxLng: Math.max(...lngs) + 1,
    };
    
    const markers = offices.map(o => `marker=${o.latitude},${o.longitude}`).join('&');

    return  `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}&layer=mapnik&${markers}`;
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