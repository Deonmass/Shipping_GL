import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
// Import Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface TestimonialProps {
  text: string;
  author: string;
  position: string;
  image: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ text, author, position, image }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-4 flex-shrink-0">
          <img src={image} alt={author} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-xl font-semibold">{author}</h4>
          <p className="text-gray-600">{position}</p>
          <div className="flex text-accent-500 mt-1">
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
          </div>
        </div>
      </div>
      <p className="text-gray-700 italic">"{text}"</p>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      text: t('home.testimonials.testimonial1.text'),
      author: t('Wim Verwilt'),
      position: t('home.testimonials.testimonial1.position'),
      image: 'https://i.postimg.cc/851YkcFS/wim.jpg'
    },
    {
      text: t('home.testimonials.testimonial2.text'),
      author: t('home.testimonials.testimonial2.author'),
      position: t('home.testimonials.testimonial2.position'),
      image: 'https://i.postimg.cc/8P3pd85D/lola.png'
    },
    {
      text: t('home.testimonials.testimonial3.text'),
      author: t('home.testimonials.testimonial3.author'),
      position: t('home.testimonials.testimonial3.position'),
      image: 'https://i.postimg.cc/kXDMtM7f/ops.png'
    }
  ];

  return (
    <section className="section bg-gray-100 min-h-screen scroll-snap-align-start flex items-center">
      <div className="container-custom py-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">{t('home.testimonials.title')}</h2>
          <p className="section-subtitle mx-auto">{t('home.testimonials.subtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            breakpoints={{
              640: {
                slidesPerView: 1
              },
              768: {
                slidesPerView: 2
              },
              1024: {
                slidesPerView: 3
              }
            }}
            className="testimonials-swiper pb-12"
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <Testimonial 
                  text={testimonial.text}
                  author={testimonial.author}
                  position={testimonial.position}
                  image={testimonial.image}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;