import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram, Linkedin, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="mt-0">
              <img 
                src="/logo_white.png" 
                alt="SHIPPING GL"
                className="h-30 w-auto"
                style={{ marginLeft: '-68px', marginTop: '-31px' }}

              />
            </div>
            <div className="flex space-x-4 pt-4">
              <a href="#" className="text-gray-400 hover:text-accent-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">{t('footer.services.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/services#air-freight" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.services.airFreight')}
                </Link>
              </li>
              <li>
                <Link to="/services#sea-freight" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.services.seaFreight')}
                </Link>
              </li>
              <li>
                <Link to="/services#transport" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.services.transport')}
                </Link>
              </li>
              <li>
                <Link to="/services#warehousing" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.services.warehousing')}
                </Link>
              </li>
              <li>
                <Link to="/services#moving" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.services.moving')}
                </Link>
              </li>
              <li>
                <Link to="/services#customs" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.services.customs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">{t('footer.resources.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.resources.faq')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.resources.blog')}
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-400 hover:text-accent-400 transition-colors">
                  {t('footer.resources.news')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">{t('footer.contact.title')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-accent-400 flex-shrink-0" />
                <span className="text-gray-400">+243 991 074493</span>
              </li>
              <li className="flex items-center">
                <Globe className="w-5 h-5 mr-3 text-accent-400 flex-shrink-0" />
                <a href="https://www.shippinggreatlakes.com" className="text-gray-400 hover:text-accent-400 transition-colors">
                  www.shippinggreatlakes.com
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-accent-400 flex-shrink-0" />
                <a href="mailto:info@shippinggreatlakes.com" className="text-gray-400 hover:text-accent-400 transition-colors">
                  info@shippinggreatlakes.com
                </a>
              </li>
              <li className="flex items-center">
                <Clock className="w-5 h-5 mr-3 text-accent-400 flex-shrink-0" />
                <span className="text-gray-400">{t('footer.contact.hours')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            {t('footer.copyright').replace('2025', currentYear.toString())}
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6 items-center">
            <Link to="/privacy" className="text-gray-500 text-sm hover:text-accent-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 text-sm hover:text-accent-400 transition-colors">
              Terms of Service
            </Link>
            <Link 
              to="/admin-login" 
              className="text-gray-500 hover:text-accent-400 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">Espace Membre</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;