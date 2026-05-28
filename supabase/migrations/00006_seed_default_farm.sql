-- Migration 00006 — Ferme par défaut LanaFarm + config initiale
-- UUID fixe : à reporter dans LANAFARM_FARM_ID et NEXT_PUBLIC_LANAFARM_FARM_ID

insert into public.farms (id, name)
values ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'LanaFarm')
on conflict (id) do nothing;

insert into public.farm_profiles (farm_id, nom, ville, telephone)
values ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'LanaFarm', 'Conakry', '+224 000 00 00 00')
on conflict (farm_id) do nothing;

insert into public.farm_preferences (farm_id, prix_plateau_gnf, capacite_plateau)
values ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 37000, 30)
on conflict (farm_id) do nothing;

insert into public.farm_seuils (farm_id, stock_magasin_faible_plateaux, tresorerie_en_attente_max_gnf, pertes_hebdo_max_pct)
values ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 20, 1000000, 5)
on conflict (farm_id) do nothing;

insert into public.categories_depense (farm_id, id, label, actif, is_default) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'alimentation', 'Alimentation animale', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'main-d-oeuvre', 'Main d''œuvre', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'transport', 'Transport', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'emballage', 'Emballage / Plateaux', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'sante', 'Santé / Vétérinaire', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'infrastructure', 'Infrastructure / Entretien', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'divers', 'Divers', true, true)
on conflict (farm_id, id) do nothing;

insert into public.methodes_paiement (farm_id, id, label, actif, is_default) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'cash', 'Espèces', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'virement', 'Virement bancaire', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'orange-money', 'Orange Money', true, true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'mtn-money', 'MTN Money', true, true)
on conflict (farm_id, id) do nothing;
