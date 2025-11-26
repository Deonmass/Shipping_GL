/*
  # Seed Test Data for News and Partners
  
  This migration creates sample data for testing:
  
  1. Partner Categories
    - International Organizations
    - Humanitarian Organizations
    - Transport & Logistics
    - Development Agencies
  
  2. Sample Partners
    - Create partners in each category
    - All with 'approved' status for visibility
  
  3. News Posts
    - Create sample news articles
    - Various categories (operations, conferences, events, official)
    - Include test author
  
  4. News Events
    - Create upcoming events
    - Different locations and dates
*/

-- ============================================
-- STEP 1: CREATE PARTNER CATEGORIES
-- ============================================

INSERT INTO partner_categories (name, slug, description) VALUES
  ('Organisations Internationales', 'international', 'Organisations internationales et agences des Nations Unies'),
  ('Organisations Humanitaires', 'humanitarian', 'ONG et organisations humanitaires'),
  ('Transport & Logistique', 'transport', 'Compagnies de transport maritime et logistique'),
  ('Agences de Développement', 'development', 'Agences de coopération et développement')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 2: CREATE SAMPLE PARTNERS
-- ============================================

-- Get category IDs
DO $$
DECLARE
  cat_international uuid;
  cat_humanitarian uuid;
  cat_transport uuid;
  cat_development uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_international FROM partner_categories WHERE slug = 'international';
  SELECT id INTO cat_humanitarian FROM partner_categories WHERE slug = 'humanitarian';
  SELECT id INTO cat_transport FROM partner_categories WHERE slug = 'transport';
  SELECT id INTO cat_development FROM partner_categories WHERE slug = 'development';

  -- Insert partners
  INSERT INTO partners (company_name, description, logo_url, category_id, website, phone, email, status) VALUES
    -- International
    ('UNICEF', 'Fonds des Nations Unies pour l''enfance - Partenaire stratégique pour la logistique humanitaire', 
     'https://www.1min30.com/wp-content/uploads/2018/03/Couleur-logo-UNICEF.jpg', 
     cat_international, 'https://www.unicef.org', '+1 212-326-7000', 'contact@unicef.org', 'approved'),
    
    ('PNUD', 'Programme des Nations Unies pour le développement - Support logistique pour projets de développement',
     'https://tunisia.un.org/sites/default/files/styles/large/public/2022-11/UNDP%20Logo_0.jpg',
     cat_international, 'https://www.undp.org', '+1 212-906-5000', 'info@undp.org', 'approved'),
    
    ('UNFPA', 'Fonds des Nations Unies pour la population - Partenaire pour la distribution de fournitures médicales',
     'https://www.matininfos.net/wp-content/uploads/2019/04/Logo-UNFPA-660x330.jpg',
     cat_international, 'https://www.unfpa.org', '+1 212-297-5000', 'contact@unfpa.org', 'approved'),
    
    -- Humanitarian
    ('Médecins Sans Frontières', 'Organisation médicale humanitaire internationale - Partenaire logistique santé',
     'https://upload.wikimedia.org/wikipedia/fr/thumb/6/69/MSF.svg/1200px-MSF.svg.png',
     cat_humanitarian, 'https://www.msf.org', '+33 1 40 21 29 29', 'contact@msf.org', 'approved'),
    
    ('Mercy Corps', 'Organisation humanitaire internationale - Partenaire réponse d''urgence',
     'https://upload.wikimedia.org/wikipedia/commons/9/96/MC_New_Logo_Horizontal_PMS_186_PC_10-15.jpg',
     cat_humanitarian, 'https://www.mercycorps.org', '+1 503-896-5000', 'info@mercycorps.org', 'approved'),
    
    -- Transport
    ('CMA CGM', 'Leader mondial du transport maritime conteneurisé - Partenaire transport',
     'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/CMA_CGM_logo.svg/1280px-CMA_CGM_logo.svg.png',
     cat_transport, 'https://www.cma-cgm.com', '+33 4 88 91 90 00', 'contact@cma-cgm.com', 'approved'),
    
    ('Maersk', 'Compagnie maritime internationale - Partenaire logistique global',
     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Maersk_Group_Logo.svg/2560px-Maersk_Group_Logo.svg.png',
     cat_transport, 'https://www.maersk.com', '+45 33 63 33 63', 'info@maersk.com', 'approved'),
    
    -- Development
    ('USAID', 'Agence américaine pour le développement international - Partenaire programmes développement',
     'https://agsci.oregonstate.edu/sites/agscid7/files/media/usaid-logo-png.png',
     cat_development, 'https://www.usaid.gov', '+1 202-712-0000', 'info@usaid.gov', 'approved'),
    
    ('Enabel', 'Agence belge de développement - Partenaire projets coopération',
     'https://logovectorseek.com/wp-content/uploads/2020/09/enabel-belgian-development-agency-logo-vector.png',
     cat_development, 'https://www.enabel.be', '+32 2 505 37 00', 'info@enabel.be', 'approved')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- STEP 3: CREATE SAMPLE NEWS POSTS
-- ============================================

-- Create sample news with admin as author
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT user_id INTO admin_user_id FROM admins LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO news_posts (title, content, short_description, category, author_id, author_name, image_url, is_published, is_pinned) VALUES
      (
        'Nouvelle ligne maritime vers l''Afrique centrale',
        'SHIPPING GL annonce l''ouverture d''une nouvelle ligne maritime directe reliant l''Europe à plusieurs ports d''Afrique centrale. Cette ligne permettra de réduire les délais de livraison de 30% et d''améliorer la fiabilité des approvisionnements pour nos partenaires humanitaires et commerciaux.

Notre flotte modernisée, équipée des dernières technologies de suivi en temps réel, garantit une traçabilité complète des marchandises du port d''origine jusqu''à la destination finale. Cette initiative s''inscrit dans notre engagement à faciliter le commerce et l''aide humanitaire en Afrique.

Les premiers navires de cette ligne seront opérationnels dès le mois prochain, avec des départs hebdomadaires depuis les principaux ports européens.',
        'Ouverture d''une nouvelle route maritime directe pour améliorer les délais de livraison en Afrique centrale.',
        'operations',
        admin_user_id,
        'Administrator',
        'https://images.pexels.com/photos/906494/pexels-photo-906494.jpeg',
        true,
        true
      ),
      (
        'Partenariat stratégique avec UNICEF',
        'SHIPPING GL est fier d''annoncer le renouvellement de son partenariat avec l''UNICEF pour les trois prochaines années. Ce partenariat renforcé permettra d''acheminer des fournitures essentielles vers les zones les plus difficiles d''accès en Afrique.

Dans le cadre de cet accord, nous nous engageons à fournir des services logistiques à tarif préférentiel pour le transport de vaccins, médicaments, fournitures scolaires et équipements d''urgence. Notre expertise en chaîne du froid et notre réseau de distribution seront mis au service de cette noble cause.

Ce partenariat témoigne de notre engagement envers le développement durable et l''amélioration des conditions de vie des populations les plus vulnérables.',
        'Renouvellement du partenariat avec UNICEF pour l''acheminement d''aide humanitaire.',
        'partnerships',
        admin_user_id,
        'Administrator',
        'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg',
        true,
        false
      ),
      (
        'Conférence internationale sur la logistique humanitaire',
        'SHIPPING GL participera à la Conférence Internationale sur la Logistique Humanitaire qui se tiendra à Bruxelles le mois prochain. Notre directeur général, accompagné de notre équipe d''experts, présentera nos innovations en matière de gestion de la chaîne d''approvisionnement humanitaire.

Au programme: tables rondes, ateliers pratiques et sessions de networking avec les acteurs majeurs du secteur humanitaire. Nous partagerons notre expérience de 15 ans dans le transport de marchandises sensibles et notre approche innovante de la logistique last-mile.

Cette conférence sera l''occasion de renforcer nos partenariats existants et d''explorer de nouvelles collaborations pour améliorer l''efficacité de l''aide humanitaire mondiale.',
        'Participation à la conférence internationale sur la logistique humanitaire à Bruxelles.',
        'conferences',
        admin_user_id,
        'Administrator',
        'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg',
        true,
        false
      ),
      (
        'Investissement dans une flotte écologique',
        'Dans le cadre de notre politique de développement durable, SHIPPING GL annonce un investissement majeur de 50 millions d''euros dans l''acquisition de navires nouvelle génération à faible émission de carbone.

Ces nouveaux navires, équipés de moteurs hybrides et de technologies de réduction des émissions, permettront de diminuer notre empreinte carbone de 40% d''ici 2027. Cette initiative s''inscrit dans notre engagement envers les Objectifs de Développement Durable des Nations Unies.

Le premier navire de cette nouvelle flotte sera mis en service au début de l''année prochaine sur notre ligne principale Afrique-Europe.',
        'Investissement de 50 millions d''euros dans une flotte de navires écologiques.',
        'official',
        admin_user_id,
        'Administrator',
        'https://images.pexels.com/photos/1434577/pexels-photo-1434577.jpeg',
        true,
        false
      ),
      (
        'Formation du personnel aux normes internationales',
        'SHIPPING GL a organisé une session de formation intensive pour l''ensemble de son personnel opérationnel sur les dernières normes internationales de sécurité maritime et de gestion des marchandises dangereuses.

Plus de 200 employés ont participé à ces formations qui couvrent les standards IMDG, les procédures d''urgence et les meilleures pratiques en matière de sécurité. Ces formations sont essentielles pour maintenir notre certification ISO et garantir les plus hauts standards de qualité à nos clients.

Un programme de formation continue sera mis en place pour assurer une mise à jour régulière des compétences de nos équipes.',
        'Formation du personnel aux normes internationales de sécurité maritime.',
        'events',
        admin_user_id,
        'Administrator',
        'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg',
        true,
        false
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- STEP 4: CREATE SAMPLE NEWS EVENTS
-- ============================================

INSERT INTO news_events (title, description, event_date, location, category) VALUES
  (
    'Conférence Logistique Humanitaire 2025',
    'Conférence internationale réunissant les acteurs majeurs de la logistique humanitaire',
    (CURRENT_DATE + INTERVAL '45 days')::timestamptz,
    'Bruxelles, Belgique',
    'conferences'
  ),
  (
    'Salon Maritime International',
    'Présentation des nouvelles technologies maritimes et opportunités de networking',
    (CURRENT_DATE + INTERVAL '60 days')::timestamptz,
    'Rotterdam, Pays-Bas',
    'events'
  ),
  (
    'Formation ISO 9001:2015',
    'Session de formation sur les standards ISO pour le personnel logistique',
    (CURRENT_DATE + INTERVAL '30 days')::timestamptz,
    'Kinshasa, RDC',
    'events'
  ),
  (
    'Assemblée Générale Annuelle',
    'Réunion annuelle des actionnaires et présentation des résultats',
    (CURRENT_DATE + INTERVAL '90 days')::timestamptz,
    'Siège SHIPPING GL',
    'meetings'
  )
ON CONFLICT DO NOTHING;