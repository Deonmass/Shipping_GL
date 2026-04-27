import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {motion} from 'framer-motion';
import {Globe, Users, Clock, Heart, Loader, BadgeCheck, X} from 'lucide-react';
import {UseGetOpenCertifications} from "../services";

const heroBg = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80';


const AnimatedNumber = ({value}: { value: string }) => {
    const [count, setCount] = useState(0);
    const target = parseInt(value) || 0;
    const isNumber = !isNaN(target);

    useEffect(() => {
        if (!isNumber) return;

        const duration = 2000; // 2 secondes
        const step = Math.ceil(target / (duration / 16)); // 60fps

        const timer = setInterval(() => {
            setCount((prev: number) => {
                const newCount = prev + step;
                if (newCount >= target) {
                    clearInterval(timer);
                    return target;
                }
                return newCount;
            });
        }, 16);

        return () => clearInterval(timer);
    }, [target, isNumber]);

    return <>{isNumber ? count : value}</>;
};

const stats = [
    {value: '10', label: 'Années d\'expérience', icon: <Clock className="w-8 h-8"/>},
    {value: '500', label: 'Clients satisfaits', icon: <Users className="w-8 h-8"/>},
    {value: '50', label: 'Pays desservis', icon: <Globe className="w-8 h-8"/>},
    {value: '24/7', label: 'Support client', icon: <Heart className="w-8 h-8"/>}
];

const EngagementPage: React.FC = () => {
    const {t} = useTranslation();
    const {isLoading: isGettingCertifications, data: certifications} = UseGetOpenCertifications()
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (isGettingCertifications) {
        return (
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="min-h-screen bg-gray-50 flex items-center justify-center"
            >
                <Loader className="w-12 h-12 text-primary-600 animate-spin"/>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.5}}
            className="bg-gray-50"
        >
            {/* Hero Section */}
            <section className="relative py-48 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroBg}
                        alt="Engagement"
                        className="w-full h-full object-cover scale-110"
                    />
                    <div className="absolute inset-0 bg-red-900/70 mix-blend-multiply"/>
                </div>

                <div className="container-custom relative z-10 text-center px-4">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5, delay: 0.2}}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h1
                            className="text-3xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.3}}
                        >
                            Notre Engagement envers l'Excellence
                        </motion.h1>
                        <motion.p
                            className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto mb-8"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.4}}
                        >
                            Découvrez nos engagements envers la qualité, l'environnement et la responsabilité sociale.
                        </motion.p>
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.5}}
                        >
                            <button
                                className="bg-white text-red-700 font-semibold px-8 py-3 rounded-full hover:bg-red-50 transition-colors duration-300 transform hover:scale-105">
                                En savoir plus
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-gradient-to-r from-red-600 to-red-800 text-white">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-xl"
                                initial={{opacity: 0, y: 20}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{duration: 0.5, delay: index * 0.1}}
                            >
                                <div className="text-4xl font-bold mb-2 flex items-center justify-center">
                                    {stat.icon}
                                    <span className="ml-2">
                    <AnimatedNumber value={stat.value}/>
                                        {stat.value.includes('+') && '+'}
                  </span>
                                </div>
                                <p className="text-red-100">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Certifications Section */}
            <section className="py-20 bg-white">
                <div className="container-custom px-4">
                    <div className="text-center mb-16">
                        <motion.h2
                            className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                            initial={{opacity: 0, y: 20}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true}}
                            transition={{duration: 0.5}}
                        >
                            Nos Certifications & Engagements
                        </motion.h2>
                        <div className="w-20 h-1 bg-red-600 mx-auto mb-6"></div>
                        <motion.p
                            className="text-gray-600 max-w-3xl mx-auto"
                            initial={{opacity: 0, y: 20}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true}}
                            transition={{duration: 0.5, delay: 0.2}}
                        >
                            Découvrez nos engagements envers l'excellence, la qualité et le développement durable
                        </motion.p>
                    </div>

                    {!certifications?.responseData?.data?.length ?
                        <div className="text-center py-12">
                            <p className="text-gray-600 text-lg">Aucune donnée disponible pour le moment.</p>
                        </div>
                        :
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {certifications?.responseData?.data.map((cert, index) => (
                                <motion.div
                                    key={index}
                                    className={`p-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:bg-red-100`}
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.5, delay: index * 0.1}}
                                >
                                    <div
                                        className={`w-32 h-32 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto cursor-pointer transition-transform duration-300 hover:scale-110`}
                                        onClick={() => cert.image_url && setSelectedImage(cert.image_url)}
                                    >
                                        {cert.image_url ? (
                                            <img
                                                src={cert.image_url}
                                                alt={cert?.image_url}
                                                className="w-24 h-24 object-contain rounded-full"
                                            />
                                        ) : (
                                            <BadgeCheck className="w-16 h-16"/>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-3 text-center text-gray-900">{cert.title}</h3>
                                    <p className="text-gray-600 text-center text-justify">{cert.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    }
                </div>
            </section>

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            <X className="w-6 h-6 text-gray-800" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Certification agrandie"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </motion.div>
                </div>
            )}

        </motion.div>
    );
};

export default EngagementPage;
