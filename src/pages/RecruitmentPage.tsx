import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, FileText, Upload, X, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Mock data for job offers
const jobOffers = [
  {
    id: 1,
    title: 'Responsable Logistique',
    location: 'Kinshasa, RDC',
    type: 'CDI',
    description: 'Nous recherchons un(e) Responsable Logistique pour gérer nos opérations à Kinshasa.',
    requirements: [
      'Bac+5 en logistique ou domaine équivalent',
      'Minimum 5 ans d\'expérience dans un poste similaire',
      'Maîtrise des outils de gestion logistique',
      'Excellentes compétences en gestion d\'équipe'
    ],
    publishedDate: '15/11/2023',
    closingDate: '15/12/2023'
  },
  {
    id: 2,
    title: 'Chauffeur Poids Lourd',
    location: 'Goma, RDC',
    type: 'CDD',
    description: 'Recherche de chauffeurs expérimentés pour le transport de marchandises en RDC.',
    requirements: [
      'Permis de conduire poids lourd valide',
      'Minimum 3 ans d\'expérience',
      'Connaissance des routes de la région des Grands Lacs',
      'Aptitude à travailler en équipe'
    ],
    publishedDate: '10/11/2023',
    closingDate: '30/11/2023'
  },
  {
    id: 3,
    title: 'Agent de Douane',
    location: 'Matadi, RDC',
    type: 'CDI',
    description: 'Poste d\'agent de douane pour notre bureau de Matadi.',
    requirements: [
      'Bac+3 en commerce international ou domaine similaire',
      'Expérience en procédures douanières',
      'Maîtrise du français et de l\'anglais',
      'Connaissance des réglementations douanières en RDC'
    ],
    publishedDate: '05/11/2023',
    closingDate: '05/12/2023'
  }
];

const RecruitmentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'offers' | 'cv'>('offers');

  // Mettre à jour l'onglet actif en fonction de l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/cv')) {
      setActiveTab('cv');
    } else {
      setActiveTab('offers');
    }
  }, [location]);

  // Gérer le changement d'onglet
  const handleTabChange = (tab: 'offers' | 'cv') => {
    setActiveTab(tab);
    navigate(tab === 'offers' ? '/recrutement/offres' : '/recrutement/cv');
  };
  const [selectedOffer, setSelectedOffer] = useState<typeof jobOffers[0] | null>(null);
  const [cvForm, setCvForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    message: '',
    cvFile: null as File | null,
    coverLetter: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setCvForm(prev => ({
          ...prev,
          [e.target.name]: file
        }));
      } else {
        toast.error('Veuillez sélectionner un fichier PDF ou Word');
      }
    }
  };

  const handleSubmitCV = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      console.log('CV submitted:', cvForm);
      setCvForm({
        fullName: '',
        email: '',
        phone: '',
        position: '',
        message: '',
        cvFile: null,
        coverLetter: null
      });
      setIsSubmitting(false);
      toast.success('Votre candidature a été envoyée avec succès !');
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-r from-primary-700 to-primary-900">
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Rejoignez notre équipe
            </h1>
            <p className="text-xl text-gray-200">
              Découvrez les opportunités de carrière chez SHIPPING GL
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container-custom">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('offers')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${activeTab === 'offers' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Offres d'emploi
            </button>
            <button
              onClick={() => handleTabChange('cv')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${activeTab === 'cv' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Envoyer votre CV
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-16 bg-gray-50">
        <div className="container-custom">
          {activeTab === 'offers' ? (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Nos offres d'emploi</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobOffers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{offer.title}</h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {offer.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        {offer.location}
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{offer.description}</p>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>Publié le: {offer.publishedDate}</span>
                          <span>Clôture: {offer.closingDate}</span>
                        </div>
                        
                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {jobOffers.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Aucune offre disponible pour le moment</h3>
                  <p className="mt-2 text-gray-600">Revenez plus tard pour découvrir nos nouvelles opportunités.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-8 rounded-lg shadow-md"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous votre CV</h2>
                <p className="text-gray-600 mb-6">
                  Vous ne trouvez pas d'offre correspondant à votre profil ? Envoyez-nous votre candidature spontanée.
                  Notre équipe l'examinera et vous contactera si un poste correspond à vos compétences.
                </p>
                
                <form onSubmit={handleSubmitCV} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={cvForm.fullName}
                        onChange={(e) => setCvForm({...cvForm, fullName: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={cvForm.email}
                        onChange={(e) => setCvForm({...cvForm, email: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={cvForm.phone}
                        onChange={(e) => setCvForm({...cvForm, phone: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                        Poste recherché *
                      </label>
                      <input
                        type="text"
                        id="position"
                        name="position"
                        value={cvForm.position}
                        onChange={(e) => setCvForm({...cvForm, position: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message (facultatif)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={cvForm.message}
                      onChange={(e) => setCvForm({...cvForm, message: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Présentez-vous brièvement et expliquez pourquoi vous souhaitez nous rejoindre..."
                    ></textarea>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CV * (PDF ou Word, max 5MB)
                      </label>
                      <div className="mt-1 flex items-center">
                        <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <span>Télécharger le CV</span>
                          <input
                            type="file"
                            name="cvFile"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="sr-only"
                            required
                          />
                        </label>
                        <span className="ml-4 text-sm text-gray-500">
                          {cvForm.cvFile ? cvForm.cvFile.name : 'Aucun fichier sélectionné'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lettre de motivation (facultatif)
                      </label>
                      <div className="mt-1 flex items-center">
                        <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <span>Télécharger la lettre</span>
                          <input
                            type="file"
                            name="coverLetter"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <span className="ml-4 text-sm text-gray-500">
                          {cvForm.coverLetter ? cvForm.coverLetter.name : 'Aucun fichier sélectionné'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Envoyer ma candidature
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    En soumettant ce formulaire, vous acceptez que vos données personnelles soient traitées conformément à notre politique de confidentialité.
                  </p>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Job Offer Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setSelectedOffer(null)}
                >
                  <span className="sr-only">Fermer</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-2">
                    {selectedOffer.title}
                  </h3>
                  
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {selectedOffer.location}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Briefcase className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {selectedOffer.type}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Description du poste</h4>
                      <p className="text-gray-600">{selectedOffer.description}</p>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Profil recherché</h4>
                      <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        {selectedOffer.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-500">Date de publication</p>
                          <p className="text-gray-900">{selectedOffer.publishedDate}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Date limite de candidature</p>
                          <p className="text-gray-900">{selectedOffer.closingDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOffer(null);
                          setActiveTab('cv');
                        }}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Postuler maintenant
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecruitmentPage;
