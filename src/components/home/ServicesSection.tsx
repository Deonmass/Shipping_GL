import React from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {motion} from 'framer-motion';
import {UseGetOpenServices} from "../../services";
import {ServiceIcon} from "../../pages/ServicesPage.tsx";

interface ServiceCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    link: string;
    delay: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({icon, title, description, link, delay}) => {
    return (
        <motion.div
            className="card group relative overflow-hidden bg-white rounded-xl shadow-lg h-full transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: "-100px"}}
            transition={{duration: 0.5, delay}}
            whileHover={{
                scale: 1.03,
                transition: { duration: 0.3 }
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-8 h-full flex flex-col">
                <motion.div 
                    className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 transform group-hover:scale-110"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.7 }}
                >
                    {icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-primary-600 transition-colors duration-300">{title}</h3>
                <p className="text-gray-600 mb-6 flex-grow line-clamp-3 group-hover:text-gray-700 transition-colors duration-300">{description}</p>
                <Link 
                    to={link}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group-hover:translate-x-1 transition-transform duration-300 w-fit"
                >
                    <span className="mr-2">En savoir plus</span>
                    <motion.span 
                        animate={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center"
                    >
                        <ArrowRight className="w-4 h-4"/>
                    </motion.span>
                </Link>
            </div>
        </motion.div>
    );
};

const ServicesSection: React.FC = () => {
    const {t} = useTranslation();

    const {data: services, isLoading: isGettingServices} = UseGetOpenServices({favorite: "1"})


    return (
        <section
            className="section relative min-h-screen scroll-snap-align-start flex items-start pt-16 bg-white"
            id="services"
            style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url(/image copy.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            <div className="container-custom py-8 md:py-12">
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial={{opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, margin: "-50px"}}
                    transition={{duration: 0.5}}
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 -mt-[65px]">{t('home.services.title')}</h2>
                    <p className="text-gray-600 mx-auto max-w-3xl text-center md:text-lg">
                        {t('home.services.subtitle')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    {isGettingServices ? <div>Chargement ...</div> : null}
                    {services?.responseData?.data?.map((service: any, index: number) => (
                        <ServiceCard
                            key={index}
                            icon={ServiceIcon(service.code)}
                            title={service.title}
                            description={service?.description}
                            link="/services"
                            delay={service.delay}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;