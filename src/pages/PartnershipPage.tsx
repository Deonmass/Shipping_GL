import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { User, Building2, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { physicalPartnerSchema, legalPartnerSchema } from '../lib/schemas/partner';
import type { PhysicalPartnerForm, LegalPartnerForm } from '../lib/schemas/partner';

const PartnershipPage = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPartner, setExistingPartner] = useState<any>(null);

  // Get account type from localStorage
  useEffect(() => {
    const storedType = localStorage.getItem('accountType');
    if (storedType === 'physical' || storedType === 'legal') {
      setSelectedTab(storedType === 'physical' ? 0 : 1);
    }
  }, []);

  const {
    register: registerPhysical,
    handleSubmit: handleSubmitPhysical,
    control: controlPhysical,
    setValue: setValuePhysical,
    formState: { errors: errorsPhysical }
  } = useForm<PhysicalPartnerForm>({
    resolver: zodResolver(physicalPartnerSchema)
  });

  const {
    register: registerLegal,
    handleSubmit: handleSubmitLegal,
    control: controlLegal,
    setValue: setValueLegal,
    formState: { errors: errorsLegal }
  } = useForm<LegalPartnerForm>({
    resolver: zodResolver(legalPartnerSchema)
  });

  useEffect(() => {
    const fetchPartnerData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('partners')
          .select(`
            *,
            companies (*)
          `)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setExistingPartner(data);
          setSelectedTab(data.partner_type === 'physical' ? 0 : 1);

          // Pre-fill form data
          if (data.partner_type === 'physical') {
            setValuePhysical('firstName', data.first_name);
            setValuePhysical('lastName', data.last_name);
            setValuePhysical('gender', data.gender);
            setValuePhysical('profession', data.profession);
            setValuePhysical('phone', data.phone);
            setValuePhysical('nif', data.nif);
            setValuePhysical('importExportNumber', data.import_export_number);
            setValuePhysical('country', data.country);
            setValuePhysical('city', data.city);
            setValuePhysical('streetAddress', data.street_address);
            setValuePhysical('addressReferences', data.address_references);
          } else {
            setValueLegal('companyName', data.company_name);
            setValueLegal('rccm', data.companies?.rccm);
            setValueLegal('businessSector', data.companies?.business_sector);
            setValueLegal('isFreightForwarder', data.companies?.is_freight_forwarder);
            setValueLegal('nif', data.companies?.nif);
            setValueLegal('importExportNumber', data.companies?.import_export_number);
            setValueLegal('phone', data.phone);
            setValueLegal('country', data.country);
            setValueLegal('city', data.city);
            setValueLegal('streetAddress', data.street_address);
            setValueLegal('addressReferences', data.address_references);
          }
        }
      } catch (error) {
        console.error('Error fetching partner data:', error);
      }
    };

    fetchPartnerData();
  }, [setValuePhysical, setValueLegal]);

  const onSubmitPhysical = async (data: PhysicalPartnerForm) => {
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Mise à jour en cours...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const partnerCode = existingPartner?.partner_code || `P${Date.now().toString(36).toUpperCase()}`;

      const partnerData = {
        id: existingPartner?.id,
        partner_code: partnerCode,
        partner_type: 'physical',
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender,
        profession: data.profession,
        profile_photo: data.profilePhoto,
        email: user.email,
        phone: data.phone,
        nif: data.nif,
        import_export_number: data.importExportNumber,
        country: data.country,
        city: data.city,
        street_address: data.streetAddress,
        address_references: data.addressReferences,
        username: user.email,
        user_id: user.id
      };

      const { error } = await supabase
        .from('partners')
        .upsert(partnerData);

      if (error) throw error;

      toast.dismiss(loadingToast);
      toast.success('Profil mis à jour avec succès !');
      navigate('/profil');
      
    } catch (error: any) {
      console.error('Error updating partner:', error);
      toast.error(error.message || 'Une erreur est survenue');
      setErrorMessage(error.message || 'Une erreur est survenue lors de la mise à jour');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitLegal = async (data: LegalPartnerForm) => {
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Mise à jour en cours...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const partnerCode = existingPartner?.partner_code || `L${Date.now().toString(36).toUpperCase()}`;

      const companyData = {
        id: existingPartner?.companies?.id,
        name: data.companyName,
        rccm: data.rccm,
        business_sector: data.businessSector,
        is_freight_forwarder: data.isFreightForwarder,
        nif: data.nif,
        import_export_number: data.importExportNumber,
        country: data.country,
        city: data.city,
        street_address: data.streetAddress,
        address_references: data.addressReferences
      };

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .upsert(companyData)
        .select()
        .single();

      if (companyError) throw companyError;

      const partnerData = {
        id: existingPartner?.id,
        partner_code: partnerCode,
        partner_type: 'legal',
        company_name: data.companyName,
        email: user.email,
        phone: data.phone,
        country: data.country,
        city: data.city,
        street_address: data.streetAddress,
        address_references: data.addressReferences,
        username: user.email,
        user_id: user.id,
        company_id: company.id
      };

      const { error: partnerError } = await supabase
        .from('partners')
        .upsert(partnerData);

      if (partnerError) throw partnerError;

      toast.dismiss(loadingToast);
      toast.success('Profil mis à jour avec succès !');
      navigate('/profil');
      
    } catch (error: any) {
      console.error('Error updating partner:', error);
      toast.error(error.message || 'Une erreur est survenue');
      setErrorMessage(error.message || 'Une erreur est survenue lors de la mise à jour');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mise à jour du profil</h1>

          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-4 mb-8">
              <Tab
                className={({ selected }) =>
                  `flex-1 py-4 px-6 rounded-lg transition-colors ${
                    selected
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center justify-center">
                  <User className="w-6 h-6 mr-2" />
                  <span>Personne Physique</span>
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  `flex-1 py-4 px-6 rounded-lg transition-colors ${
                    selected
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center justify-center">
                  <Building2 className="w-6 h-6 mr-2" />
                  <span>Personne Morale</span>
                </div>
              </Tab>
            </Tab.List>

            <Tab.Panels>
              <Tab.Panel>
                <form onSubmit={handleSubmitPhysical(onSubmitPhysical)} className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Informations Personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prénom
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('firstName')}
                          className={`input ${errorsPhysical.firstName ? 'border-red-500' : ''}`}
                        />
                        {errorsPhysical.firstName && (
                          <p className="mt-1 text-sm text-red-600">{errorsPhysical.firstName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('lastName')}
                          className={`input ${errorsPhysical.lastName ? 'border-red-500' : ''}`}
                        />
                        {errorsPhysical.lastName && (
                          <p className="mt-1 text-sm text-red-600">{errorsPhysical.lastName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Genre
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              {...registerPhysical('gender')}
                              value="male"
                              className="form-radio text-primary-600"
                            />
                            <span className="ml-2">Homme</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              {...registerPhysical('gender')}
                              value="female"
                              className="form-radio text-primary-600"
                            />
                            <span className="ml-2">Femme</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profession
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('profession')}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone
                        </label>
                        <Controller
                          name="phone"
                          control={controlPhysical}
                          render={({ field }) => (
                            <PhoneInput
                              country={'cd'}
                              value={field.value}
                              onChange={field.onChange}
                              inputClass="input !w-full"
                              buttonClass="!bg-gray-100"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NIF
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('nif')}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro Import/Export
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('importExportNumber')}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Adresse</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pays
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('country')}
                          className={`input ${errorsPhysical.country ? 'border-red-500' : ''}`}
                        />
                        {errorsPhysical.country && (
                          <p className="mt-1 text-sm text-red-600">{errorsPhysical.country.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('city')}
                          className={`input ${errorsPhysical.city ? 'border-red-500' : ''}`}
                        />
                        {errorsPhysical.city && (
                          <p className="mt-1 text-sm text-red-600">{errorsPhysical.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('streetAddress')}
                          className={`input ${errorsPhysical.streetAddress ? 'border-red-500' : ''}`}
                        />
                        {errorsPhysical.streetAddress && (
                          <p className="mt-1 text-sm text-red-600">{errorsPhysical.streetAddress.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Références
                        </label>
                        <input
                          type="text"
                          {...registerPhysical('addressReferences')}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Mise à jour en cours...' : 'Mettre à jour'}
                  </button>
                </form>
              </Tab.Panel>

              <Tab.Panel>
                <form onSubmit={handleSubmitLegal(onSubmitLegal)} className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Informations de l'Entreprise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom de l'entreprise
                        </label>
                        <input
                          type="text"
                          {...registerLegal('companyName')}
                          className={`input ${errorsLegal.companyName ? 'border-red-500' : ''}`}
                        />
                        {errorsLegal.companyName && (
                          <p className="mt-1 text-sm text-red-600">{errorsLegal.companyName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RCCM
                        </label>
                        <input
                          type="text"
                          {...registerLegal('rccm')}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secteur d'activité
                        </label>
                        <input
                          type="text"
                          {...registerLegal('businessSector')}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transitaire
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...registerLegal('isFreightForwarder')}
                            className="form-checkbox h-5 w-5 text-primary-600"
                          />
                          <span className="ml-2">Oui</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone
                        </label>
                        <Controller
                          name="phone"
                          control={controlLegal}
                          render={({ field }) => (
                            <PhoneInput
                              country={'cd'}
                              value={field.value}
                              onChange={field.onChange}
                              inputClass="input !w-full"
                              buttonClass="!bg-gray-100"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NIF
                        </label>
                        <input
                          type="text"
                          {...registerLegal('nif')}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro Import/Export
                        </label>
                        <input
                          type="text"
                          {...registerLegal('importExportNumber')}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Adresse</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pays
                        </label>
                        <input
                          type="text"
                          {...registerLegal('country')}
                          className={`input ${errorsLegal.country ? 'border-red-500' : ''}`}
                        />
                        {errorsLegal.country && (
                          <p className="mt-1 text-sm text-red-600">{errorsLegal.country.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville
                        </label>
                        <input
                          type="text"
                          {...registerLegal('city')}
                          className={`input ${errorsLegal.city ? 'border-red-500' : ''}`}
                        />
                        {errorsLegal.city && (
                          <p className="mt-1 text-sm text-red-600">{errorsLegal.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          {...registerLegal('streetAddress')}
                          className={`input ${errorsLegal.streetAddress ? 'border-red-500' : ''}`}
                        />
                        {errorsLegal.streetAddress && (
                          <p className="mt-1 text-sm text-red-600">{errorsLegal.streetAddress.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Références
                        </label>
                        <input
                          type="text"
                          {...registerLegal('addressReferences')}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Mise à jour en cours...' : 'Mettre à jour'}
                  </button>
                </form>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold">Erreur</h3>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600">{errorMessage}</p>
            <div className="mt-6">
              <button
                onClick={() => setShowError(false)}
                className="btn btn-primary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipPage;