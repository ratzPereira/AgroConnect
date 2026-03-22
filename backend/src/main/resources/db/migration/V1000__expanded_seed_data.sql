-- ═══════════════════════════════════════════════════════════════
-- V1000 — Expanded Seed Data (All Azores Islands, All Statuses)
-- Builds on V999. All passwords: password123
-- BCrypt hash (strength 12): $2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PART 1 — Structural Entities
-- ═══════════════════════════════════════════════════════════════

-- New Users (IDs 11-15)
INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(11, 'carla.medeiros@email.com', '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT', TRUE, TRUE),
(12, 'tomas.aguiar@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT', TRUE, TRUE),
(13, 'rui.pacheco@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER', TRUE, TRUE),
(14, 'helena.vieira@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER', TRUE, TRUE),
(15, 'bruno.faria@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE);
SELECT setval('users_id_seq', 15);

-- New Client Profiles
INSERT INTO client_profiles (user_id, name, phone, location, parish, municipality, island, farm_type, total_area_ha) VALUES
(11, 'Carla Medeiros', '+351 918 234 567', ST_SetSRID(ST_MakePoint(-28.7150, 38.5300), 4326), 'Horta',    'Horta',    'Faial', 'Viticultura', 6.0),
(12, 'Tomas Aguiar',   '+351 919 345 678', ST_SetSRID(ST_MakePoint(-28.3300, 38.4700), 4326), 'Madalena', 'Madalena', 'Pico',  'Pastagem',    20.0);

-- New Provider Profiles (IDs 4-5)
INSERT INTO provider_profiles (id, user_id, company_name, nif, phone, location, parish, municipality, island, service_radius_km, avg_rating, total_reviews, verified) VALUES
(4, 13, 'Pacheco & Filhos — Agricultura', '509456789', '+351 292 391 234', ST_SetSRID(ST_MakePoint(-28.7200, 38.5350), 4326), 'Flamengos', 'Horta', 'Faial', 35, 4.6, 10, TRUE),
(5, 14, 'Flores Verde — Servicos Rurais', '509567890', '+351 292 590 345', ST_SetSRID(ST_MakePoint(-31.1900, 39.4500), 4326), 'Santa Cruz', 'Santa Cruz das Flores', 'Flores', 20, 4.8, 5, TRUE);
SELECT setval('provider_profiles_id_seq', 5);

-- New Provider Services
INSERT INTO provider_services (provider_id, category_id) VALUES
(4, 1), (4, 3), (4, 5), (4, 6),
(5, 1), (5, 5), (5, 7), (5, 8);

-- New Team Members (IDs 6-8)
INSERT INTO team_members (id, provider_id, user_id, name, email, phone, role, active, joined_at) VALUES
(6, 4, 13, 'Rui Pacheco',   'rui.pacheco@email.com',   '+351 292 391 234', 'MANAGER',  TRUE, NOW() - INTERVAL '400 days'),
(7, 4, 15, 'Bruno Faria',   'bruno.faria@email.com',   '+351 920 456 789', 'OPERATOR', TRUE, NOW() - INTERVAL '100 days'),
(8, 5, 14, 'Helena Vieira', 'helena.vieira@email.com', '+351 292 590 345', 'MANAGER',  TRUE, NOW() - INTERVAL '250 days');
SELECT setval('team_members_id_seq', 8);

-- New Machines (IDs 9-12)
INSERT INTO machines (id, provider_id, name, type, description, status, license_plate, last_maintenance_date, next_maintenance_date) VALUES
(9,  4, 'Massey Ferguson 5710', 'Tractor',    'Tractor 100cv para trabalhos medios',  'AVAILABLE', 'GG-78-HH', '2026-01-10', '2026-07-10'),
(10, 4, 'Grade de discos 24"',  'Alfaia',     'Grade de discos 24 polegadas',         'AVAILABLE', NULL,        '2026-02-05', '2026-08-05'),
(11, 5, 'Kubota M7060',         'Tractor',    'Tractor compacto 70cv',                'AVAILABLE', 'II-90-JJ', '2026-02-20', '2026-08-20'),
(12, 5, 'Rocadora profissional','Ferramenta',  'Rocadora a gasolina 52cc',            'AVAILABLE', NULL,        '2026-03-01', '2026-06-01');
SELECT setval('machines_id_seq', 12);

-- New Inventory (IDs 8-11)
INSERT INTO inventory (id, provider_id, product_name, unit, quantity, min_stock_alert, cost_per_unit) VALUES
(8,  4, 'Gasoleo agricola',     'L',    600,  150, 1.15),
(9,  4, 'Arame farpado',        'UNIT', 30,   10,  25.00),
(10, 5, 'Gasoleo',              'L',    300,  100, 1.55),
(11, 5, 'Sementes de pastagem', 'KG',   50,   15,  8.50);
SELECT setval('inventory_id_seq', 11);


-- ═══════════════════════════════════════════════════════════════
-- PART 2 — Service Requests (42 new, IDs 9-50)
-- ═══════════════════════════════════════════════════════════════

-- ── DRAFT (IDs 9-11): Sao Miguel, Faial, Pico ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(9, 4, 7, 'DRAFT', 'Instalacao de rega gota a gota — 2 hectares',
    'Pretendo instalar sistema de rega gota a gota numa parcela de horticultura. Terreno plano com ponto de agua proximo.',
    ST_SetSRID(ST_MakePoint(-25.6700, 37.7400), 4326),
    'Sao Sebastiao', 'Ponta Delgada', 'Sao Miguel', 2.0, 'hectares', 'LOW',
    '2026-05-01', '2026-05-15',
    '{"area": 2, "system_type": "Gota a gota", "work_type": "Instalacao nova"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(10, 11, 6, 'DRAFT', 'Reparacao de vedacao — 150 metros',
    'Vedacao de arame danificada por temporal. Precisa de reparacao em varios trocos ao longo de 150 metros.',
    ST_SetSRID(ST_MakePoint(-28.7100, 38.5250), 4326),
    'Horta', 'Horta', 'Faial', 150, 'metros', 'MEDIUM',
    '2026-04-20', '2026-04-30',
    '{"length_meters": 150, "fence_type": "Rede de arame", "work_type": "Reparacao"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(11, 12, 1, 'DRAFT', 'Subsolagem de vinha — 3 hectares',
    'Vinha com solo compactado, precisa de subsolagem profunda antes da proxima campanha.',
    ST_SetSRID(ST_MakePoint(-28.3500, 38.4750), 4326),
    'Madalena', 'Madalena', 'Pico', 3.0, 'hectares', 'LOW',
    '2026-05-10', '2026-05-30',
    '{"area": 3, "terrain_type": "Pedregoso", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '1 day');

-- ── PUBLISHED (IDs 12-23): All 9 islands ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(12, 4, 1, 'PUBLISHED', 'Gradagem de terreno — 4 hectares',
    'Terreno ja lavrado precisa de gradagem para partir os torroes antes da sementeira de milho.',
    ST_SetSRID(ST_MakePoint(-25.7200, 37.7800), 4326),
    'Faja de Baixo', 'Ponta Delgada', 'Sao Miguel', 4.0, 'hectares', 'MEDIUM',
    '2026-04-10', '2026-04-20',
    '{"area": 4, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    '2026-04-10 23:59:59', NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(13, 2, 2, 'PUBLISHED', 'Tratamento herbicida em pastagem — 6 hectares',
    'Pastagem com invasao de tabua e junco. Necessito de aplicacao de herbicida selectivo. Produto fornecido por mim.',
    ST_SetSRID(ST_MakePoint(-27.1000, 38.7000), 4326),
    'Sao Bartolomeu', 'Angra do Heroismo', 'Terceira', 6.0, 'hectares', 'MEDIUM',
    '2026-04-05', '2026-04-15',
    '{"area": 6, "crop_type": "Pastagem", "treatment_type": "Herbicida", "product_provided": "Nao, forneco eu"}'::jsonb,
    '2026-04-12 23:59:59', NOW() - INTERVAL '3 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(14, 11, 3, 'PUBLISHED', 'Colheita de batata — 1.5 hectares',
    'Batata pronta para colher. Preciso de maquina de colheita de batata. Terreno acessivel.',
    ST_SetSRID(ST_MakePoint(-28.7200, 38.5350), 4326),
    'Flamengos', 'Horta', 'Faial', 1.5, 'hectares', 'HIGH',
    '2026-04-01', '2026-04-05',
    '{"area": 1.5, "crop_type": "Batata", "method": "Mecanizada"}'::jsonb,
    '2026-04-05 23:59:59', NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(15, 12, 5, 'PUBLISHED', 'Limpeza de terreno vulcanico — 2 hectares',
    'Terreno com mato alto junto a vinha no Pico. Necessita de rocagem e limpeza antes da vindima.',
    ST_SetSRID(ST_MakePoint(-28.3800, 38.4650), 4326),
    'Sao Roque', 'Sao Roque do Pico', 'Pico', 2.0, 'hectares', 'MEDIUM',
    '2026-04-15', '2026-04-25',
    '{"area": 2, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    '2026-04-20 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(16, 3, 4, 'PUBLISHED', 'Transporte de fardos — Sao Jorge',
    'Transporte de 30 fardos de feno da zona da Urzelina para Norte Grande. Distancia de 15km.',
    ST_SetSRID(ST_MakePoint(-28.0700, 38.6500), 4326),
    'Urzelina', 'Velas', 'Sao Jorge', NULL, NULL, 'LOW',
    '2026-04-20', '2026-04-30',
    '{"cargo_type": "Fardos de feno (30 unidades)", "weight_tons": 12, "origin": "Urzelina", "destination": "Norte Grande"}'::jsonb,
    '2026-04-25 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(17, 5, 8, 'PUBLISHED', 'Manutencao de jardim — Santa Maria',
    'Jardim de 300m2 junto a moradia. Precisa de corte de relva, poda de sebes e limpeza geral.',
    ST_SetSRID(ST_MakePoint(-25.0800, 36.9700), 4326),
    'Vila do Porto', 'Vila do Porto', 'Santa Maria', 300, 'm2', 'LOW',
    '2026-04-15', '2026-04-30',
    '{"area": 300, "services": "Corte de relva, poda de sebes, limpeza", "frequency": "Pontual"}'::jsonb,
    '2026-04-20 23:59:59', NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(18, 12, 9, 'PUBLISHED', 'Construcao de muro de pedra — Graciosa',
    'Reconstrucao de muro tradicional em pedra seca. Aproximadamente 50 metros de comprimento.',
    ST_SetSRID(ST_MakePoint(-28.0500, 39.0500), 4326),
    'Santa Cruz', 'Santa Cruz da Graciosa', 'Graciosa', 50, 'metros', 'LOW',
    '2026-05-01', '2026-05-30',
    '{"service_description": "Reconstrucao de muro de pedra seca tradicional, 50 metros, altura media 1.2m"}'::jsonb,
    '2026-05-10 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(19, 5, 1, 'PUBLISHED', 'Lavoura para milho — 3 hectares',
    'Preparacao de solo para sementeira de milho. Terreno foi pastagem durante 5 anos.',
    ST_SetSRID(ST_MakePoint(-25.5500, 37.7800), 4326),
    'Conceicao', 'Ribeira Grande', 'Sao Miguel', 3.0, 'hectares', 'MEDIUM',
    '2026-04-10', '2026-04-20',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Estrada alcatroada"}'::jsonb,
    '2026-04-15 23:59:59', NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(20, 3, 7, 'PUBLISHED', 'Reparacao de sistema de rega — Terceira',
    'Sistema de aspersao com fugas em varios pontos. Preciso de diagnostico e reparacao.',
    ST_SetSRID(ST_MakePoint(-27.0500, 38.7100), 4326),
    'Lajes', 'Praia da Vitoria', 'Terceira', 5.0, 'hectares', 'HIGH',
    '2026-04-01', '2026-04-05',
    '{"area": 5, "system_type": "Aspersao", "work_type": "Reparacao"}'::jsonb,
    '2026-04-05 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(21, 2, 6, 'PUBLISHED', 'Vedacao eletrica para gado — 800 metros',
    'Instalacao de vedacao eletrica em pastagem para rotacao de parcelas.',
    ST_SetSRID(ST_MakePoint(-27.2000, 38.6800), 4326),
    'Terra Cha', 'Angra do Heroismo', 'Terceira', 800, 'metros', 'MEDIUM',
    '2026-04-15', '2026-04-30',
    '{"length_meters": 800, "fence_type": "Eletrica", "work_type": "Instalacao nova"}'::jsonb,
    '2026-04-20 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(22, 11, 5, 'PUBLISHED', 'Limpeza de pasto abandonado — 3 hectares',
    'Pasto abandonado ha 4 anos no Faial. Vegetacao densa com silvas e fetos. Acesso por caminho.',
    ST_SetSRID(ST_MakePoint(-28.7300, 38.5400), 4326),
    'Cedros', 'Horta', 'Faial', 3.0, 'hectares', 'MEDIUM',
    '2026-04-20', '2026-05-05',
    '{"area": 3, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    '2026-04-28 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(23, 4, 2, 'PUBLISHED', 'Fertilizacao de pastagem — 8 hectares',
    'Aplicacao de adubo NPK em pastagem permanente. Produto fornecido pelo prestador.',
    ST_SetSRID(ST_MakePoint(-25.7500, 37.7500), 4326),
    'Arrifes', 'Ponta Delgada', 'Sao Miguel', 8.0, 'hectares', 'LOW',
    '2026-04-20', '2026-05-10',
    '{"area": 8, "crop_type": "Pastagem permanente", "treatment_type": "Fertilizacao", "product_provided": "Sim"}'::jsonb,
    '2026-05-01 23:59:59', NOW() - INTERVAL '1 day');

-- ── WITH_PROPOSALS (IDs 24-27): Terceira, Sao Miguel, Faial, Pico ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(24, 2, 5, 'WITH_PROPOSALS', 'Limpeza de terreno para pastagem — 3 hectares',
    'Terreno com silvas densas e alguns arbustos. Preciso limpar para voltar a usar como pastagem para gado leiteiro.',
    ST_SetSRID(ST_MakePoint(-27.1500, 38.6900), 4326),
    'Sao Mateus', 'Angra do Heroismo', 'Terceira', 3.0, 'hectares', 'HIGH',
    '2026-04-01', '2026-04-10',
    '{"area": 3, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    '2026-04-08 23:59:59', NOW() - INTERVAL '4 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(25, 5, 3, 'WITH_PROPOSALS', 'Colheita de batata-doce — 2 hectares',
    'Batata-doce pronta para colher. Preciso de maquina ou equipa para colheita. Solo arenoso, facil de trabalhar.',
    ST_SetSRID(ST_MakePoint(-25.5300, 37.8000), 4326),
    'Conceicao', 'Ribeira Grande', 'Sao Miguel', 2.0, 'hectares', 'HIGH',
    '2026-04-05', '2026-04-12',
    '{"area": 2, "crop_type": "Batata-doce", "method": "Mista"}'::jsonb,
    '2026-04-10 23:59:59', NOW() - INTERVAL '3 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(26, 11, 1, 'WITH_PROPOSALS', 'Fresagem para horta — 0.5 hectares',
    'Preparacao de solo para horta familiar. Terreno pequeno mas com bom acesso.',
    ST_SetSRID(ST_MakePoint(-28.7150, 38.5280), 4326),
    'Horta', 'Horta', 'Faial', 0.5, 'hectares', 'MEDIUM',
    '2026-04-10', '2026-04-20',
    '{"area": 0.5, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    '2026-04-15 23:59:59', NOW() - INTERVAL '3 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(27, 12, 5, 'WITH_PROPOSALS', 'Limpeza de currais — Pico',
    'Limpeza de vegetacao em redor de currais de vinha tradicionais. Trabalho delicado para nao danificar muros.',
    ST_SetSRID(ST_MakePoint(-28.3400, 38.4700), 4326),
    'Madalena', 'Madalena', 'Pico', 1.0, 'hectares', 'LOW',
    '2026-04-20', '2026-05-05',
    '{"area": 1, "vegetation_type": "Misto", "waste_disposal": "Recolher e transportar"}'::jsonb,
    '2026-04-30 23:59:59', NOW() - INTERVAL '2 days');

-- ── AWARDED (IDs 28-30): Sao Miguel, Terceira, Faial ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(28, 4, 2, 'AWARDED', 'Pulverizacao de chazal — 2 hectares',
    'Tratamento fitossanitario em plantacao de cha. Necessito de pulverizacao com produto biologico.',
    ST_SetSRID(ST_MakePoint(-25.7800, 37.8200), 4326),
    'Maia', 'Ribeira Grande', 'Sao Miguel', 2.0, 'hectares', 'HIGH',
    '2026-03-25', '2026-03-28',
    '{"area": 2, "crop_type": "Cha", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '6 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(29, 3, 1, 'AWARDED', 'Lavoura de terreno para milho — 3 hectares',
    'Preparacao de solo para sementeira de milho forrageiro. Terreno plano, ultima lavoura ha 2 anos.',
    ST_SetSRID(ST_MakePoint(-27.0600, 38.7200), 4326),
    'Fonte do Bastardo', 'Praia da Vitoria', 'Terceira', 3.0, 'hectares', 'MEDIUM',
    '2026-04-01', '2026-04-10',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '5 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(30, 11, 5, 'AWARDED', 'Limpeza de pomar — 1 hectare',
    'Limpeza de mato e silvas em pomar de citrinos abandonado. Acesso razoavel.',
    ST_SetSRID(ST_MakePoint(-28.7050, 38.5300), 4326),
    'Horta', 'Horta', 'Faial', 1.0, 'hectares', 'MEDIUM',
    '2026-04-05', '2026-04-15',
    '{"area": 1, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Recolher e transportar"}'::jsonb,
    NOW() - INTERVAL '4 days');

-- ── IN_PROGRESS (IDs 31-33): Terceira, Sao Miguel, Faial ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(31, 2, 1, 'IN_PROGRESS', 'Subsolagem de pastagem — 4 hectares',
    'Pastagem compactada pelo gado. Precisa de subsolagem profunda para melhorar drenagem e arejamento.',
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6750), 4326),
    'Terra Cha', 'Angra do Heroismo', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-03-20', '2026-03-25',
    '{"area": 4, "terrain_type": "Humido", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '8 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(32, 5, 6, 'IN_PROGRESS', 'Vedacao de pomar — 250 metros',
    'Instalacao de vedacao de rede em redor de pomar para proteger dos coelhos.',
    ST_SetSRID(ST_MakePoint(-25.5100, 37.8100), 4326),
    'Conceicao', 'Ribeira Grande', 'Sao Miguel', 250, 'metros', 'MEDIUM',
    '2026-03-18', '2026-03-25',
    '{"length_meters": 250, "fence_type": "Rede de arame", "work_type": "Instalacao nova"}'::jsonb,
    NOW() - INTERVAL '10 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(33, 11, 3, 'IN_PROGRESS', 'Colheita de inhame — 0.8 hectares',
    'Inhame pronto para colher. Terreno com boa acessibilidade. Colheita manual assistida.',
    ST_SetSRID(ST_MakePoint(-28.7100, 38.5320), 4326),
    'Flamengos', 'Horta', 'Faial', 0.8, 'hectares', 'HIGH',
    '2026-03-20', '2026-03-22',
    '{"area": 0.8, "crop_type": "Inhame", "method": "Manual"}'::jsonb,
    NOW() - INTERVAL '7 days');

-- ── AWAITING_CONFIRMATION (IDs 34-35): Pico, Terceira ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(34, 12, 1, 'AWAITING_CONFIRMATION', 'Lavoura de vinha — 2 hectares',
    'Preparacao de solo entre as filas de vinha. Trabalho delicado para nao danificar as cepas.',
    ST_SetSRID(ST_MakePoint(-28.3600, 38.4680), 4326),
    'Sao Roque', 'Sao Roque do Pico', 'Pico', 2.0, 'hectares', 'MEDIUM',
    '2026-03-15', '2026-03-20',
    '{"area": 2, "terrain_type": "Pedregoso", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '12 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(35, 3, 8, 'AWAITING_CONFIRMATION', 'Poda de arvores de fruto — jardim',
    'Poda de 15 arvores de fruto (macieiras, pereiras e ameixoeiras) num pomar domestico.',
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7300), 4326),
    'Santa Cruz', 'Praia da Vitoria', 'Terceira', 200, 'm2', 'LOW',
    '2026-03-01', '2026-03-10',
    '{"area": 200, "services": "Poda de arvores de fruto (15 arvores)", "frequency": "Pontual"}'::jsonb,
    NOW() - INTERVAL '18 days');

-- ── COMPLETED (IDs 36-40): Sao Jorge, Sao Miguel x2, Terceira, Flores ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(36, 3, 5, 'COMPLETED', 'Limpeza de pastagem — Sao Jorge',
    'Limpeza de 4 hectares de pastagem invadida por incenso e silvas na zona da Urzelina.',
    ST_SetSRID(ST_MakePoint(-28.0800, 38.6600), 4326),
    'Urzelina', 'Velas', 'Sao Jorge', 4.0, 'hectares', 'MEDIUM',
    '2026-02-15', '2026-02-25',
    '{"area": 4, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '40 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(37, 4, 1, 'COMPLETED', 'Fresagem para horta — 0.3 hectares',
    'Preparacao de solo para horta de verao. Fresagem fina para canteiros.',
    ST_SetSRID(ST_MakePoint(-25.6800, 37.7350), 4326),
    'Sao Sebastiao', 'Ponta Delgada', 'Sao Miguel', 0.3, 'hectares', 'LOW',
    '2026-02-20', '2026-03-01',
    '{"area": 0.3, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '35 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(38, 5, 2, 'COMPLETED', 'Adubacao de pastagem — 10 hectares',
    'Aplicacao de adubo quimico NPK em pastagem. Produto fornecido pelo prestador.',
    ST_SetSRID(ST_MakePoint(-25.5200, 37.8050), 4326),
    'Conceicao', 'Ribeira Grande', 'Sao Miguel', 10.0, 'hectares', 'MEDIUM',
    '2026-02-10', '2026-02-20',
    '{"area": 10, "crop_type": "Pastagem", "treatment_type": "Fertilizacao", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '38 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(39, 2, 3, 'COMPLETED', 'Colheita de milho forrageiro — 5 hectares',
    'Milho forrageiro para silagem. Preciso de ceifeira-debulhadora e transporte para silo.',
    ST_SetSRID(ST_MakePoint(-27.1800, 38.7100), 4326),
    'Sao Bartolomeu', 'Angra do Heroismo', 'Terceira', 5.0, 'hectares', 'HIGH',
    '2026-02-05', '2026-02-10',
    '{"area": 5, "crop_type": "Milho forrageiro", "method": "Mecanizada"}'::jsonb,
    NOW() - INTERVAL '45 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(40, 3, 7, 'COMPLETED', 'Instalacao de rega — Flores',
    'Instalacao de sistema de rega por aspersao em pastagem de 3 hectares na ilha das Flores.',
    ST_SetSRID(ST_MakePoint(-31.1900, 39.4500), 4326),
    'Santa Cruz', 'Santa Cruz das Flores', 'Flores', 3.0, 'hectares', 'LOW',
    '2026-01-20', '2026-02-10',
    '{"area": 3, "system_type": "Aspersao", "work_type": "Instalacao nova"}'::jsonb,
    NOW() - INTERVAL '55 days');

-- ── RATED (IDs 41-45): Terceira, Sao Miguel, Pico, Santa Maria, Faial ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(41, 2, 8, 'RATED', 'Manutencao de jardim — Angra',
    'Corte de relva, poda de sebes de buxo e limpeza geral do jardim de 400m2.',
    ST_SetSRID(ST_MakePoint(-27.2150, 38.6600), 4326),
    'Se', 'Angra do Heroismo', 'Terceira', 400, 'm2', 'LOW',
    '2026-01-15', '2026-01-25',
    '{"area": 400, "services": "Corte de relva, poda de sebes de buxo, limpeza", "frequency": "Pontual"}'::jsonb,
    NOW() - INTERVAL '65 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(42, 4, 5, 'RATED', 'Limpeza de terreno — Sao Miguel',
    'Limpeza de 2 hectares de terreno abandonado para posterior uso agricola.',
    ST_SetSRID(ST_MakePoint(-25.6500, 37.7400), 4326),
    'Arrifes', 'Ponta Delgada', 'Sao Miguel', 2.0, 'hectares', 'MEDIUM',
    '2026-01-10', '2026-01-20',
    '{"area": 2, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '70 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(43, 12, 1, 'RATED', 'Lavoura de vinha — Pico',
    'Lavoura entre filas de vinha nos currais do Pico. Trabalho com tractor pequeno.',
    ST_SetSRID(ST_MakePoint(-28.3300, 38.4750), 4326),
    'Madalena', 'Madalena', 'Pico', 1.5, 'hectares', 'LOW',
    '2025-12-15', '2025-12-30',
    '{"area": 1.5, "terrain_type": "Pedregoso", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '90 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(44, 5, 6, 'RATED', 'Vedacao de pastagem — Santa Maria',
    'Instalacao de vedacao de arame para delimitar pastagem de 600 metros.',
    ST_SetSRID(ST_MakePoint(-25.0900, 36.9800), 4326),
    'Vila do Porto', 'Vila do Porto', 'Santa Maria', 600, 'metros', 'MEDIUM',
    '2025-12-01', '2025-12-15',
    '{"length_meters": 600, "fence_type": "Rede de arame", "work_type": "Instalacao nova"}'::jsonb,
    NOW() - INTERVAL '100 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(45, 11, 8, 'RATED', 'Jardinagem completa — Faial',
    'Manutencao completa de jardim: corte de relva, poda, plantacao de flores, limpeza.',
    ST_SetSRID(ST_MakePoint(-28.7200, 38.5300), 4326),
    'Horta', 'Horta', 'Faial', 350, 'm2', 'LOW',
    '2025-11-15', '2025-11-30',
    '{"area": 350, "services": "Corte de relva, poda de sebes, plantacao de flores sazonais", "frequency": "Pontual"}'::jsonb,
    NOW() - INTERVAL '115 days');

-- ── DISPUTED (IDs 46-47): Terceira, Sao Miguel ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(46, 3, 1, 'DISPUTED', 'Gradagem de terreno — Terceira',
    'Gradagem de 2 hectares para preparacao de sementeira. Cliente alega trabalho incompleto.',
    ST_SetSRID(ST_MakePoint(-27.0900, 38.7000), 4326),
    'Lajes', 'Praia da Vitoria', 'Terceira', 2.0, 'hectares', 'MEDIUM',
    '2026-03-01', '2026-03-10',
    '{"area": 2, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '20 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(47, 4, 5, 'DISPUTED', 'Limpeza de terreno — Sao Miguel',
    'Limpeza de 1.5 hectares. Prestador alega que trabalho foi concluido, cliente discorda da qualidade.',
    ST_SetSRID(ST_MakePoint(-25.7000, 37.7600), 4326),
    'Faja de Baixo', 'Ponta Delgada', 'Sao Miguel', 1.5, 'hectares', 'HIGH',
    '2026-03-05', '2026-03-12',
    '{"area": 1.5, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '18 days');

-- ── EXPIRED (IDs 48-49): Santa Maria, Graciosa ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(48, 5, 9, 'EXPIRED', 'Servico diverso — Santa Maria',
    'Necessitava de ajuda para reparacao de tanque de agua em betao. Sem propostas recebidas.',
    ST_SetSRID(ST_MakePoint(-25.0700, 36.9600), 4326),
    'Vila do Porto', 'Vila do Porto', 'Santa Maria', NULL, NULL, 'LOW',
    '2026-02-01', '2026-02-15',
    '{"service_description": "Reparacao de tanque de agua em betao, capacidade 5000L, com fissura no fundo"}'::jsonb,
    '2026-02-15 23:59:59', NOW() - INTERVAL '50 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(49, 12, 4, 'EXPIRED', 'Transporte de uvas — Graciosa',
    'Transporte de uvas para adega cooperativa. Nenhum prestador disponivel na ilha.',
    ST_SetSRID(ST_MakePoint(-28.0450, 39.0450), 4326),
    'Santa Cruz', 'Santa Cruz da Graciosa', 'Graciosa', NULL, NULL, 'MEDIUM',
    '2025-10-01', '2025-10-10',
    '{"cargo_type": "Uvas para vinificacao", "weight_tons": 3, "origin": "Vinha em Guadalupe", "destination": "Adega Cooperativa"}'::jsonb,
    '2025-10-05 23:59:59', NOW() - INTERVAL '170 days');

-- ── CANCELLED (ID 50): Corvo ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, form_data, created_at) VALUES
(50, 3, 9, 'CANCELLED', 'Servico agricola — Corvo',
    'Pedido cancelado pelo cliente. Trabalho ja nao e necessario.',
    ST_SetSRID(ST_MakePoint(-31.1100, 39.7000), 4326),
    'Corvo', 'Corvo', 'Corvo', NULL, NULL, 'LOW',
    '{"service_description": "Reparacao de caminho agricola, cerca de 200 metros, danificado pelas chuvas"}'::jsonb,
    NOW() - INTERVAL '30 days');

SELECT setval('service_requests_id_seq', 50);


-- ═══════════════════════════════════════════════════════════════
-- PART 4 — Proposals (25 new, IDs 6-30)
-- ═══════════════════════════════════════════════════════════════

-- ── WITH_PROPOSALS: Request 24 gets 2 proposals (IDs 6,7); 25→8, 26→9, 27→10 ──

-- Req 24 (Terceira, limpeza) → Provider 1 (AgroServicos Terceira)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(6, 24, 1, 'PENDING', 480.00, 'PER_UNIT', 160.00, 3, 'Limpeza com destroçador florestal montado em tractor. Trabalho completo em 1.5 dias.',
    'Destroçamento completo, trituração no local', 'Remoção de pedras, nivelamento posterior',
    '2026-04-05', '2026-04-08 23:59:59', NOW() - INTERVAL '3 days');

-- Req 24 (Terceira, limpeza) → Provider 3 (Joao Pereira)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(7, 24, 3, 'PENDING', 420.00, 'PER_UNIT', 140.00, 3, 'Roça manual com moto-roçadora e posterior trituração. 2 dias de trabalho com 2 operadores.',
    'Roça completa, trituração dos resíduos', 'Remoção de cepos grandes',
    '2026-04-06', '2026-04-08 23:59:59', NOW() - INTERVAL '2 days');

-- Req 25 (São Miguel, colheita) → Provider 2 (Verde Açores)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(8, 25, 2, 'PENDING', 300.00, 'PER_UNIT', 150.00, 2, 'Colheita mista: máquina para escavar e equipa de 3 para apanha manual. 1 dia completo.',
    'Máquina escavadora, 3 trabalhadores, sacos', 'Transporte para armazém',
    '2026-04-08', '2026-04-10 23:59:59', NOW() - INTERVAL '2 days');

-- Req 26 (Faial, fresagem) → Provider 4 (Pacheco & Filhos)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(9, 26, 4, 'PENDING', 75.00, 'FIXED', 'Fresagem com fresa rotativa montada em tractor. Trabalho rápido, meio dia.',
    'Fresagem fina, 2 passagens', 'Adubação, sementeira',
    '2026-04-14', '2026-04-15 23:59:59', NOW() - INTERVAL '2 days');

-- Req 27 (Pico, limpeza) → Provider 4 (Pacheco & Filhos)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(10, 27, 4, 'PENDING', 180.00, 'FIXED', 'Limpeza cuidadosa com roçadora e trabalho manual junto aos muros. 1.5 dias.',
    'Roça completa, recolha e transporte de resíduos', 'Reparação de muros danificados',
    '2026-04-25', '2026-04-30 23:59:59', NOW() - INTERVAL '1 day');

-- ── AWARDED: Req 28→11, 29→12, 30→13 ──

-- Req 28 (São Miguel, pulverização) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(11, 28, 2, 'ACCEPTED', 240.00, 'PER_UNIT', 120.00, 2, 'Pulverização com atomizador de 400L. Operador certificado para tratamentos fitossanitários.',
    'Mão de obra, tractor com atomizador, deslocação', 'Produto fitossanitário (fornecido pelo cliente)',
    '2026-03-27', NOW() - INTERVAL '5 days');

-- Req 29 (Terceira, lavoura) → Provider 1
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(12, 29, 1, 'ACCEPTED', 360.00, 'PER_UNIT', 120.00, 3, 'Lavoura com charrua de 3 ferros montada em tractor 120cv. 1 dia de trabalho.',
    'Lavoura completa a 30cm de profundidade, gasóleo', 'Gradagem posterior',
    '2026-04-05', NOW() - INTERVAL '4 days');

-- Req 30 (Faial, limpeza) → Provider 4
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(13, 30, 4, 'ACCEPTED', 160.00, 'FIXED', 'Limpeza com roçadora e motosserra para arbustos maiores. Recolha incluída.',
    'Roça, corte de arbustos, recolha de resíduos', 'Podas de árvores de fruto (citricos)',
    '2026-04-10', NOW() - INTERVAL '3 days');

-- ── IN_PROGRESS: Req 31→14, 32→15, 33→16 ──

-- Req 31 (Terceira, subsolagem) → Provider 1
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(14, 31, 1, 'ACCEPTED', 500.00, 'PER_UNIT', 125.00, 4, 'Subsolagem com subsolador de 3 dentes montado em tractor 120cv. 1.5 dias.',
    'Subsolagem a 60cm, gasóleo incluído', 'Drenagem de superfície, gradagem',
    '2026-03-22', NOW() - INTERVAL '7 days');

-- Req 32 (São Miguel, vedação) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(15, 32, 2, 'ACCEPTED', 375.00, 'PER_UNIT', 1.50, 250, 'Instalação de vedação com postes de madeira tratada e rede galvanizada. 2 dias.',
    'Postes, rede, mão de obra, abertura de buracos', 'Portões (orçamento à parte)',
    '2026-03-22', NOW() - INTERVAL '9 days');

-- Req 33 (Faial, colheita) → Provider 4
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(16, 33, 4, 'ACCEPTED', 200.00, 'FIXED', 'Colheita manual de inhame com equipa de 4 pessoas. 1 dia completo.',
    'Equipa de 4, ferramentas, sacos de recolha', 'Transporte para mercado',
    '2026-03-21', NOW() - INTERVAL '6 days');

-- ── AWAITING_CONFIRMATION: Req 34→17, 35→18 ──

-- Req 34 (Pico, lavoura) → Provider 4
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(17, 34, 4, 'ACCEPTED', 280.00, 'PER_UNIT', 140.00, 2, 'Lavoura entre filas com tractor estreito e charrua de 2 ferros. Trabalho cuidadoso.',
    'Lavoura entre filas, gasóleo, operador experiente', 'Reparação de muros de pedra',
    '2026-03-18', NOW() - INTERVAL '11 days');

-- Req 35 (Terceira, poda) → Provider 3
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(18, 35, 3, 'ACCEPTED', 120.00, 'FIXED', 'Poda profissional de 15 árvores de fruto. Trabalho de 1 dia com 2 pessoas.',
    'Poda de formação/frutificação, recolha de ramos', 'Tratamento de feridas de poda (pasta cicatrizante)',
    '2026-03-05', NOW() - INTERVAL '17 days');

-- ── COMPLETED: Req 36→19, 37→20, 38→21, 39→22, 40→23 ──

-- Req 36 (São Jorge, limpeza) → Provider 1
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(19, 36, 1, 'ACCEPTED', 640.00, 'PER_UNIT', 160.00, 4, 'Limpeza com destroçador florestal. Deslocação de equipamento para São Jorge incluída.',
    'Destroçamento, trituração, deslocação inter-ilhas', 'Nivelamento do terreno',
    '2026-02-20', NOW() - INTERVAL '38 days');

-- Req 37 (São Miguel, fresagem) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(20, 37, 2, 'ACCEPTED', 55.00, 'FIXED', 'Fresagem rápida com fresa de 1.5m. Trabalho de 2 horas.',
    'Fresagem fina, 2 passagens cruzadas', 'Adubação, preparação de canteiros',
    '2026-02-25', NOW() - INTERVAL '33 days');

-- Req 38 (São Miguel, adubação) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(21, 38, 2, 'ACCEPTED', 450.00, 'PER_UNIT', 45.00, 10, 'Aplicação de adubo NPK com distribuidor centrifugo montado em tractor. Produto incluído.',
    'Adubo NPK 7-14-14 (500kg), aplicação, mão de obra', 'Análise de solo',
    '2026-02-15', NOW() - INTERVAL '36 days');

-- Req 39 (Terceira, colheita milho) → Provider 1
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(22, 39, 1, 'ACCEPTED', 500.00, 'PER_UNIT', 100.00, 5, 'Colheita com ceifeira-debulhadora e transporte com reboque para silo.',
    'Ceifeira, tractor com reboque, 2 operadores', 'Compactação do silo (feito pelo cliente)',
    '2026-02-08', NOW() - INTERVAL '43 days');

-- Req 40 (Flores, rega) → Provider 5
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(23, 40, 5, 'ACCEPTED', 380.00, 'FIXED', 'Instalação de sistema de aspersão com 12 aspersores. Tubagem e ligações incluídas.',
    'Aspersores, tubagem PVC, válvulas, mão de obra', 'Bomba de água (fornecida pelo cliente)',
    '2026-01-28', NOW() - INTERVAL '53 days');

-- ── RATED: Req 41→24, 42→25, 43→26, 44→27, 45→28 ──

-- Req 41 (Terceira, jardinagem) → Provider 3
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(24, 41, 3, 'ACCEPTED', 90.00, 'FIXED', 'Manutenção completa: corte de relva, poda de sebes, limpeza. Meio dia de trabalho.',
    'Corte de relva, poda, recolha de resíduos', 'Adubação, plantação de novas plantas',
    '2026-01-20', NOW() - INTERVAL '63 days');

-- Req 42 (São Miguel, limpeza) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(25, 42, 2, 'ACCEPTED', 320.00, 'PER_UNIT', 160.00, 2, 'Limpeza completa com destroçador e roçadora. 1 dia de trabalho.',
    'Destroçamento, trituração no local', 'Nivelamento, remoção de pedras',
    '2026-01-15', NOW() - INTERVAL '68 days');

-- Req 43 (Pico, lavoura) → Provider 4
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(26, 43, 4, 'ACCEPTED', 225.00, 'PER_UNIT', 150.00, 1.5, 'Lavoura com tractor estreito adaptado para vinha. Operador com experiência em Pico.',
    'Lavoura cuidadosa entre filas, gasóleo', 'Reparação de muros danificados',
    '2025-12-20', NOW() - INTERVAL '88 days');

-- Req 44 (Santa Maria, vedação) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(27, 44, 2, 'ACCEPTED', 480.00, 'PER_UNIT', 0.80, 600, 'Instalação de vedação com postes e rede galvanizada. Deslocação para Santa Maria incluída.',
    'Postes tratados, rede, mão de obra, deslocação', 'Portões',
    '2025-12-10', NOW() - INTERVAL '98 days');

-- Req 45 (Faial, jardinagem) → Provider 4
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(28, 45, 4, 'ACCEPTED', 110.00, 'FIXED', 'Manutenção completa de jardim com plantação de flores sazonais. 1 dia.',
    'Corte de relva, poda, plantação, limpeza geral', 'Compra de plantas (fornecidas pelo cliente)',
    '2025-11-20', NOW() - INTERVAL '113 days');

-- ── DISPUTED: Req 46→29, 47→30 ──

-- Req 46 (Terceira, gradagem) → Provider 1
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(29, 46, 1, 'ACCEPTED', 240.00, 'PER_UNIT', 120.00, 2, 'Gradagem com grade de discos 28". 1 dia de trabalho.',
    'Gradagem completa, gasóleo', 'Recolha de pedras à superfície',
    '2026-03-05', NOW() - INTERVAL '18 days');

-- Req 47 (São Miguel, limpeza) → Provider 2
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(30, 47, 2, 'ACCEPTED', 240.00, 'PER_UNIT', 160.00, 1.5, 'Limpeza com destroçador. Meio dia de trabalho.',
    'Destroçamento completo, trituração', 'Remoção de entulho',
    '2026-03-08', NOW() - INTERVAL '16 days');

SELECT setval('proposals_id_seq', 30);


-- ═══════════════════════════════════════════════════════════════
-- PART 5 — Transactions (20 new, IDs 4-23)
-- ═══════════════════════════════════════════════════════════════

-- AWARDED (HELD): Req 28→Prop 11, Req 29→Prop 12, Req 30→Prop 13
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(4, 28, 11, 240.00, 0.12, 28.80, 211.20, 'HELD', NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),
(5, 29, 12, 360.00, 0.12, 43.20, 316.80, 'HELD', NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
(6, 30, 13, 160.00, 0.12, 19.20, 140.80, 'HELD', NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days');

-- IN_PROGRESS (HELD): Req 31→Prop 14, Req 32→Prop 15, Req 33→Prop 16
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(7, 31, 14, 500.00, 0.12, 60.00, 440.00, 'HELD', NOW() - INTERVAL '7 days',  NOW() - INTERVAL '7 days'),
(8, 32, 15, 375.00, 0.12, 45.00, 330.00, 'HELD', NOW() - INTERVAL '9 days',  NOW() - INTERVAL '9 days'),
(9, 33, 16, 200.00, 0.12, 24.00, 176.00, 'HELD', NOW() - INTERVAL '6 days',  NOW() - INTERVAL '6 days');

-- AWAITING_CONFIRMATION (HELD): Req 34→Prop 17, Req 35→Prop 18
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(10, 34, 17, 280.00, 0.12, 33.60, 246.40, 'HELD', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(11, 35, 18, 120.00, 0.12, 14.40, 105.60, 'HELD', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days');

-- COMPLETED (RELEASED): Req 36→Prop 19, 37→20, 38→21, 39→22, 40→23
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(12, 36, 19, 640.00, 0.12, 76.80, 563.20, 'RELEASED', NOW() - INTERVAL '38 days', NOW() - INTERVAL '32 days', NOW() - INTERVAL '38 days'),
(13, 37, 20,  55.00, 0.12,  6.60,  48.40, 'RELEASED', NOW() - INTERVAL '33 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '33 days'),
(14, 38, 21, 450.00, 0.12, 54.00, 396.00, 'RELEASED', NOW() - INTERVAL '36 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '36 days'),
(15, 39, 22, 500.00, 0.12, 60.00, 440.00, 'RELEASED', NOW() - INTERVAL '43 days', NOW() - INTERVAL '37 days', NOW() - INTERVAL '43 days'),
(16, 40, 23, 380.00, 0.12, 45.60, 334.40, 'RELEASED', NOW() - INTERVAL '53 days', NOW() - INTERVAL '47 days', NOW() - INTERVAL '53 days');

-- RATED (RELEASED): Req 41→Prop 24, 42→25, 43→26, 44→27, 45→28
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(17, 41, 24,  90.00, 0.12, 10.80,  79.20, 'RELEASED', NOW() - INTERVAL '63 days',  NOW() - INTERVAL '57 days',  NOW() - INTERVAL '63 days'),
(18, 42, 25, 320.00, 0.12, 38.40, 281.60, 'RELEASED', NOW() - INTERVAL '68 days',  NOW() - INTERVAL '62 days',  NOW() - INTERVAL '68 days'),
(19, 43, 26, 225.00, 0.12, 27.00, 198.00, 'RELEASED', NOW() - INTERVAL '88 days',  NOW() - INTERVAL '82 days',  NOW() - INTERVAL '88 days'),
(20, 44, 27, 480.00, 0.12, 57.60, 422.40, 'RELEASED', NOW() - INTERVAL '98 days',  NOW() - INTERVAL '92 days',  NOW() - INTERVAL '98 days'),
(21, 45, 28, 110.00, 0.12, 13.20,  96.80, 'RELEASED', NOW() - INTERVAL '113 days', NOW() - INTERVAL '107 days', NOW() - INTERVAL '113 days');

-- DISPUTED (HELD): Req 46→Prop 29, 47→30
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(22, 46, 29, 240.00, 0.12, 28.80, 211.20, 'HELD', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(23, 47, 30, 240.00, 0.12, 28.80, 211.20, 'HELD', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days');

SELECT setval('transactions_id_seq', 23);


-- ═══════════════════════════════════════════════════════════════
-- PART 6 — Service Executions (17 new, IDs 3-19)
-- ═══════════════════════════════════════════════════════════════

-- IN_PROGRESS (IDs 3-5): checkin only, no checkout/completed
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, created_at) VALUES
(3, 14, ST_SetSRID(ST_MakePoint(-27.2100, 38.6750), 4326), NOW() - INTERVAL '2 days' + INTERVAL '8 hours',  NOW() - INTERVAL '3 days'),
(4, 15, ST_SetSRID(ST_MakePoint(-25.5100, 37.8100), 4326), NOW() - INTERVAL '1 day'  + INTERVAL '9 hours',  NOW() - INTERVAL '2 days'),
(5, 16, ST_SetSRID(ST_MakePoint(-28.7100, 38.5320), 4326), NOW() - INTERVAL '1 day'  + INTERVAL '7 hours',  NOW() - INTERVAL '2 days');

-- AWAITING_CONFIRMATION (IDs 6-7): complete with checkout
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, created_at) VALUES
(6, 17,
    ST_SetSRID(ST_MakePoint(-28.3600, 38.4680), 4326),
    NOW() - INTERVAL '5 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '16 hours',
    'Lavoura entre filas concluída. Cuidado especial junto às cepas mais antigas.',
    '[{"product": "Gasóleo agrícola", "quantity": 30, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '5 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '6 days'),
(7, 18,
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7300), 4326),
    NOW() - INTERVAL '10 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '10 days' + INTERVAL '14 hours',
    'Poda de 15 árvores concluída. Ramos recolhidos e amontoados para queima.',
    '[{"product": "Gasóleo", "quantity": 3, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '10 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '11 days');

-- COMPLETED (IDs 8-12)
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, created_at) VALUES
(8, 19,
    ST_SetSRID(ST_MakePoint(-28.0800, 38.6600), 4326),
    NOW() - INTERVAL '34 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '33 days' + INTERVAL '16 hours',
    'Limpeza completa dos 4 hectares. Vegetação triturada no local. Terreno pronto para pastagem.',
    '[{"product": "Gasóleo agrícola", "quantity": 80, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '33 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '35 days'),
(9, 20,
    ST_SetSRID(ST_MakePoint(-25.6800, 37.7350), 4326),
    NOW() - INTERVAL '29 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '29 days' + INTERVAL '11 hours',
    'Fresagem rápida concluída. Solo fino e uniforme, pronto para canteiros.',
    '[{"product": "Gasóleo agrícola", "quantity": 8, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '29 days' + INTERVAL '11 hours',
    NOW() - INTERVAL '30 days'),
(10, 21,
    ST_SetSRID(ST_MakePoint(-25.5200, 37.8050), 4326),
    NOW() - INTERVAL '32 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '32 days' + INTERVAL '14 hours',
    'Adubação concluída com 500kg de NPK 7-14-14 distribuídos uniformemente.',
    '[{"product": "Adubo NPK 7-14-14", "quantity": 500, "unit": "KG"}, {"product": "Gasóleo agrícola", "quantity": 25, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '32 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '33 days'),
(11, 22,
    ST_SetSRID(ST_MakePoint(-27.1800, 38.7100), 4326),
    NOW() - INTERVAL '39 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '39 days' + INTERVAL '17 hours',
    'Colheita de milho forrageiro concluída. 5 reboques transportados para silo.',
    '[{"product": "Gasóleo agrícola", "quantity": 120, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '39 days' + INTERVAL '17 hours',
    NOW() - INTERVAL '40 days'),
(12, 23,
    ST_SetSRID(ST_MakePoint(-31.1900, 39.4500), 4326),
    NOW() - INTERVAL '49 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '48 days' + INTERVAL '16 hours',
    'Sistema de aspersão instalado com 12 aspersores. Testado e funcional.',
    '[{"product": "Tubagem PVC", "quantity": 200, "unit": "metros"}, {"product": "Aspersores", "quantity": 12, "unit": "UNIT"}]'::jsonb,
    NOW() - INTERVAL '48 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '50 days');

-- RATED (IDs 13-17)
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, created_at) VALUES
(13, 24,
    ST_SetSRID(ST_MakePoint(-27.2150, 38.6600), 4326),
    NOW() - INTERVAL '59 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '59 days' + INTERVAL '13 hours',
    'Manutenção de jardim concluída. Relva cortada, sebes podadas, tudo limpo.',
    '[{"product": "Gasóleo", "quantity": 4, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '59 days' + INTERVAL '13 hours',
    NOW() - INTERVAL '60 days'),
(14, 25,
    ST_SetSRID(ST_MakePoint(-25.6500, 37.7400), 4326),
    NOW() - INTERVAL '64 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '64 days' + INTERVAL '16 hours',
    'Limpeza de 2 hectares concluída. Silvas destroçadas e trituradas no local.',
    '[{"product": "Gasóleo agrícola", "quantity": 40, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '64 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '65 days'),
(15, 26,
    ST_SetSRID(ST_MakePoint(-28.3300, 38.4750), 4326),
    NOW() - INTERVAL '84 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '84 days' + INTERVAL '15 hours',
    'Lavoura de vinha concluída com cuidado. Solo bem revolto entre as filas.',
    '[{"product": "Gasóleo agrícola", "quantity": 35, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '84 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '85 days'),
(16, 27,
    ST_SetSRID(ST_MakePoint(-25.0900, 36.9800), 4326),
    NOW() - INTERVAL '94 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '93 days' + INTERVAL '16 hours',
    'Vedação de 600 metros instalada. 120 postes colocados, rede esticada e grampeada.',
    '[{"product": "Postes madeira tratada", "quantity": 120, "unit": "UNIT"}, {"product": "Rede galvanizada", "quantity": 600, "unit": "metros"}]'::jsonb,
    NOW() - INTERVAL '93 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '95 days'),
(17, 28,
    ST_SetSRID(ST_MakePoint(-28.7200, 38.5300), 4326),
    NOW() - INTERVAL '109 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '109 days' + INTERVAL '15 hours',
    'Jardim completamente renovado. Flores de inverno plantadas, sebes podadas em forma.',
    '[{"product": "Gasóleo", "quantity": 5, "unit": "L"}, {"product": "Terra vegetal", "quantity": 200, "unit": "KG"}]'::jsonb,
    NOW() - INTERVAL '109 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '110 days');

-- DISPUTED (IDs 18-19)
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, created_at) VALUES
(18, 29,
    ST_SetSRID(ST_MakePoint(-27.0900, 38.7000), 4326),
    NOW() - INTERVAL '14 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '14 days' + INTERVAL '15 hours',
    'Gradagem realizada conforme combinado. Cliente discorda alegando passagens insuficientes.',
    '[{"product": "Gasóleo agrícola", "quantity": 30, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '14 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '15 days'),
(19, 30,
    ST_SetSRID(ST_MakePoint(-25.7000, 37.7600), 4326),
    NOW() - INTERVAL '12 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '12 days' + INTERVAL '14 hours',
    'Limpeza realizada. Algumas zonas com vegetação rasteira remanescente que cliente considera insuficiente.',
    '[{"product": "Gasóleo agrícola", "quantity": 20, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '12 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '13 days');

SELECT setval('service_executions_id_seq', 19);


-- ═══════════════════════════════════════════════════════════════
-- PART 7 — Execution Assignments
-- ═══════════════════════════════════════════════════════════════
-- Provider 1 (team: 1=manager/user6, 2=operator/user9; machines: 1,2,3)
-- Provider 2 (team: 3=manager/user7, 4=operator/user10; machines: 4,5,6)
-- Provider 3 (team: 5=manager/user8; machines: 7,8)
-- Provider 4 (team: 6=manager/user13, 7=operator/user15; machines: 9,10)
-- Provider 5 (team: 8=manager/user14; machines: 11,12)

INSERT INTO execution_assignments (execution_id, team_member_id, machine_id) VALUES
-- IN_PROGRESS
(3, 2, 1),   -- Exec 3 (Prop14, Prov1): Carlos Oliveira + New Holland T5.120
(4, 4, 4),   -- Exec 4 (Prop15, Prov2): Miguel Tavares + John Deere 6130M
(5, 7, 9),   -- Exec 5 (Prop16, Prov4): Bruno Faria + Massey Ferguson 5710
-- AWAITING_CONFIRMATION
(6, 6, 9),   -- Exec 6 (Prop17, Prov4): Rui Pacheco + Massey Ferguson 5710
(7, 5, 7),   -- Exec 7 (Prop18, Prov3): João Pereira + Kubota L3560
-- COMPLETED
(8, 2, 3),   -- Exec 8 (Prop19, Prov1): Carlos Oliveira + Destroçador florestal
(9, 4, 6),   -- Exec 9 (Prop20, Prov2): Miguel Tavares + Fresa 2m
(10, 3, 4),  -- Exec 10 (Prop21, Prov2): Ricardo Sousa + John Deere 6130M
(11, 2, 1),  -- Exec 11 (Prop22, Prov1): Carlos Oliveira + New Holland T5.120
(12, 8, 11), -- Exec 12 (Prop23, Prov5): Helena Vieira + Kubota M7060
-- RATED
(13, 5, 7),  -- Exec 13 (Prop24, Prov3): João Pereira + Kubota L3560
(14, 4, 4),  -- Exec 14 (Prop25, Prov2): Miguel Tavares + John Deere 6130M
(15, 6, 9),  -- Exec 15 (Prop26, Prov4): Rui Pacheco + Massey Ferguson 5710
(16, 3, 4),  -- Exec 16 (Prop27, Prov2): Ricardo Sousa + John Deere 6130M
(17, 7, 9),  -- Exec 17 (Prop28, Prov4): Bruno Faria + Massey Ferguson 5710
-- DISPUTED
(18, 1, 2),  -- Exec 18 (Prop29, Prov1): António Mendes + Grade de discos 28"
(19, 4, 4);  -- Exec 19 (Prop30, Prov2): Miguel Tavares + John Deere 6130M


-- ═══════════════════════════════════════════════════════════════
-- PART 8 — Reviews (18 new, IDs 4-21)
-- ═══════════════════════════════════════════════════════════════
-- RATED requests (41-45): 2 reviews each (client + provider) = 10 reviews
-- COMPLETED requests (36-40): client review each = 5 reviews
-- COMPLETED requests (36,37,39): provider review too = 3 reviews
-- Total = 18 reviews

-- Review mapping (author → target):
-- Client reviews target the provider's user_id
-- Provider reviews target the client's user_id
-- Req 41: client=2(João), provider=3(Prov3, user=8)
-- Req 42: client=4(Pedro), provider=2(Prov2, user=7)
-- Req 43: client=12(Tomás), provider=4(Prov4, user=13)
-- Req 44: client=5(Ana), provider=2(Prov2, user=7)
-- Req 45: client=11(Carla), provider=4(Prov4, user=13)
-- Req 36: client=3(Maria), provider=1(Prov1, user=6)
-- Req 37: client=4(Pedro), provider=2(Prov2, user=7)
-- Req 38: client=5(Ana), provider=2(Prov2, user=7)
-- Req 39: client=2(João), provider=1(Prov1, user=6)
-- Req 40: client=3(Maria), provider=5(Prov5, user=14)

-- ── RATED: Request 41 (client=2, provider user=8) ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(4,  41, 2, 8, 5, 'Jardim ficou impecável! O João fez um trabalho excelente na poda das sebes. Muito profissional e pontual.', NOW() - INTERVAL '56 days'),
(5,  41, 8, 2, 5, 'Cliente muito acessível e simpático. Jardim bem cuidado, trabalho agradável. Recomendo.', NOW() - INTERVAL '55 days');

-- ── RATED: Request 42 (client=4, provider user=7) ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(6,  42, 4, 7, 4, 'Bom trabalho na limpeza do terreno. Ficou quase perfeito, apenas uma pequena zona ficou por limpar junto ao muro.', NOW() - INTERVAL '61 days'),
(7,  42, 7, 4, 5, 'Terreno com bom acesso, cliente muito colaborativo. Tudo conforme combinado.', NOW() - INTERVAL '60 days');

-- ── RATED: Request 43 (client=12, provider user=13) ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(8,  43, 12, 13, 5, 'Excelente trabalho! Lavoura feita com muito cuidado entre as cepas. Operador muito experiente com vinhas no Pico.', NOW() - INTERVAL '81 days'),
(9,  43, 13, 12, 5, 'Terreno bem acessível apesar do basalto. Cliente muito prestável e conhecedor da sua vinha.', NOW() - INTERVAL '80 days');

-- ── RATED: Request 44 (client=5, provider user=7) ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(10, 44, 5, 7, 4, 'Vedação bem instalada e robusta. Deslocação para Santa Maria demorou mais do que esperado mas o resultado final é bom.', NOW() - INTERVAL '91 days'),
(11, 44, 7, 5, 4, 'Trabalho em Santa Maria tem custos acrescidos de deslocação. Cliente compreensiva e boa comunicação.', NOW() - INTERVAL '90 days');

-- ── RATED: Request 45 (client=11, provider user=13) ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(12, 45, 11, 13, 5, 'Jardim ficou maravilhoso! As flores de inverno deram um toque especial. Muito satisfeita com o resultado.', NOW() - INTERVAL '106 days'),
(13, 45, 13, 11, 5, 'Jardim bonito e bem organizado. Cliente muito atenciosa e com excelente gosto. Prazer trabalhar ali.', NOW() - INTERVAL '105 days');

-- ── COMPLETED: Request 36 (client=3, provider user=6) — client review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(14, 36, 3, 6, 4, 'Boa limpeza no geral. Deslocação para São Jorge correu bem. Algumas zonas junto aos muros podiam ter ficado melhor.', NOW() - INTERVAL '31 days');

-- ── COMPLETED: Request 36 (provider user=6 → client=3) — provider review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(15, 36, 6, 3, 5, 'Terreno conforme descrito. Cliente acompanhou o trabalho e facilitou logística de deslocação inter-ilhas.', NOW() - INTERVAL '30 days');

-- ── COMPLETED: Request 37 (client=4, provider user=7) — client review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(16, 37, 4, 7, 5, 'Fresagem perfeita! Solo ficou fininho, ideal para os canteiros da horta. Trabalho rápido e eficiente.', NOW() - INTERVAL '27 days');

-- ── COMPLETED: Request 37 (provider user=7 → client=4) — provider review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(17, 37, 7, 4, 5, 'Terreno pequeno mas muito bem acessível. Cliente preparou tudo antes da nossa chegada. Excelente.', NOW() - INTERVAL '26 days');

-- ── COMPLETED: Request 38 (client=5, provider user=7) — client review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(18, 38, 5, 7, 5, 'Aplicação de adubo muito uniforme. Pastagem já mostra sinais de melhoria após 2 semanas. Muito satisfeita.', NOW() - INTERVAL '29 days');

-- ── COMPLETED: Request 39 (client=2, provider user=6) — client review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(19, 39, 2, 6, 4, 'Colheita de milho correu bem no geral. Ceifeira por vezes entupiu mas a equipa resolveu rápido.', NOW() - INTERVAL '36 days');

-- ── COMPLETED: Request 39 (provider user=6 → client=2) — provider review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(20, 39, 6, 2, 5, 'Milho em excelente estado, colheita produtiva. Cliente organizado, silo preparado antecipadamente.', NOW() - INTERVAL '35 days');

-- ── COMPLETED: Request 40 (client=3, provider user=14) — client review ──
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(21, 40, 3, 14, 3, 'Sistema de rega funciona mas a instalação demorou mais do que previsto. Alguns aspersores precisaram de ajuste posterior.', NOW() - INTERVAL '46 days');

SELECT setval('reviews_id_seq', 21);


-- ═══════════════════════════════════════════════════════════════
-- PART 9 — Chat Messages (30, IDs 1-30)
-- ═══════════════════════════════════════════════════════════════
-- 5 conversations (requests 29, 31, 32, 34, 41), 6 messages each
-- Request 29: client=3 (Maria), provider user=6 (Prov1 manager)
-- Request 31: client=2 (João), provider user=6 (Prov1 manager)
-- Request 32: client=5 (Ana), provider user=7 (Prov2 manager)
-- Request 34: client=12 (Tomás), provider user=13 (Prov4 manager)
-- Request 41: client=2 (João), provider user=8 (Prov3 manager)

-- Conversation 1: Request 29 (AWARDED, lavoura Terceira)
INSERT INTO chat_messages (id, request_id, sender_id, content, sent_at) VALUES
(1,  29, 3,  'Boa tarde! Gostaria de saber quando pode começar a lavoura do terreno?', NOW() - INTERVAL '4 days' + INTERVAL '10 hours'),
(2,  29, 6,  'Boa tarde! Podemos começar na próxima segunda-feira se lhe convier.', NOW() - INTERVAL '4 days' + INTERVAL '11 hours'),
(3,  29, 3,  'Segunda está ótimo. O terreno fica na estrada do Biscoito, sabe onde é?', NOW() - INTERVAL '4 days' + INTERVAL '12 hours'),
(4,  29, 6,  'Sim, conheço bem a zona. Vou levar o tractor e a charrua de 3 ferros.', NOW() - INTERVAL '4 days' + INTERVAL '13 hours'),
(5,  29, 3,  'Perfeito. Estarei lá de manhã para abrir o portão. Obrigada!', NOW() - INTERVAL '4 days' + INTERVAL '14 hours'),
(6,  29, 6,  'Combinado. Apareço por volta das 8h. Até segunda!', NOW() - INTERVAL '4 days' + INTERVAL '15 hours');

-- Conversation 2: Request 31 (IN_PROGRESS, subsolagem Terceira)
INSERT INTO chat_messages (id, request_id, sender_id, content, sent_at) VALUES
(7,  31, 2,  'Bom dia. Como está a correr a subsolagem?', NOW() - INTERVAL '1 day' + INTERVAL '10 hours'),
(8,  31, 6,  'Bom dia! Está a correr bem, já fizemos metade. O solo está bastante compactado como disse.', NOW() - INTERVAL '1 day' + INTERVAL '11 hours'),
(9,  31, 2,  'Pois, o gado anda ali há muitos anos. Acham que terminam hoje?', NOW() - INTERVAL '1 day' + INTERVAL '12 hours'),
(10, 31, 6,  'Provavelmente não, o solo está muito duro em algumas zonas. Amanhã de manhã deve ficar tudo pronto.', NOW() - INTERVAL '1 day' + INTERVAL '13 hours'),
(11, 31, 2,  'Sem problema, tomem o tempo que for preciso. O importante é ficar bem feito.', NOW() - INTERVAL '1 day' + INTERVAL '14 hours'),
(12, 31, 6,  'Pode deixar. Amanhã ao final da manhã deverá estar concluído. Avisamos quando terminar.', NOW() - INTERVAL '1 day' + INTERVAL '15 hours');

-- Conversation 3: Request 32 (IN_PROGRESS, vedação São Miguel)
INSERT INTO chat_messages (id, request_id, sender_id, content, sent_at) VALUES
(13, 32, 5,  'Olá! Os postes já estão todos colocados?', NOW() - INTERVAL '2 days' + INTERVAL '9 hours'),
(14, 32, 7,  'Olá! Já colocámos cerca de 40 postes, faltam mais uns 10 na zona de trás do pomar.', NOW() - INTERVAL '2 days' + INTERVAL '10 hours'),
(15, 32, 5,  'Ok. Já pensei melhor e acho que devíamos pôr a rede mais enterrada nessa zona, os coelhos escavam.', NOW() - INTERVAL '2 days' + INTERVAL '11 hours'),
(16, 32, 7,  'Boa ideia, podemos enterrar uns 15cm. Não acrescenta muito trabalho.', NOW() - INTERVAL '2 days' + INTERVAL '12 hours'),
(17, 32, 5,  'Excelente, assim fico mais descansada. Quando acham que terminam?', NOW() - INTERVAL '2 days' + INTERVAL '13 hours'),
(18, 32, 7,  'Se o tempo ajudar, amanhã ao final do dia deve estar tudo pronto e esticado.', NOW() - INTERVAL '2 days' + INTERVAL '14 hours');

-- Conversation 4: Request 34 (AWAITING_CONFIRMATION, lavoura Pico)
INSERT INTO chat_messages (id, request_id, sender_id, content, sent_at) VALUES
(19, 34, 12, 'Boa tarde, o trabalho já está concluído?', NOW() - INTERVAL '5 days' + INTERVAL '17 hours'),
(20, 34, 13, 'Boa tarde! Sim, terminámos hoje ao final da tarde. Correu tudo bem.', NOW() - INTERVAL '5 days' + INTERVAL '18 hours'),
(21, 34, 12, 'Ótimo! Vou ao terreno amanhã de manhã para verificar. Tiveram algum problema?', NOW() - INTERVAL '5 days' + INTERVAL '19 hours'),
(22, 34, 13, 'Nenhum. Apenas nas zonas com mais basalto tivemos de fazer passagens mais lentas.', NOW() - INTERVAL '5 days' + INTERVAL '20 hours'),
(23, 34, 12, 'Percebo. As cepas ficaram todas intactas?', NOW() - INTERVAL '4 days' + INTERVAL '9 hours'),
(24, 34, 13, 'Sim, todas. O operador tem muita experiência com vinhas aqui no Pico.', NOW() - INTERVAL '4 days' + INTERVAL '10 hours');

-- Conversation 5: Request 41 (RATED, jardinagem Terceira)
INSERT INTO chat_messages (id, request_id, sender_id, content, sent_at) VALUES
(25, 41, 2,  'Bom dia João! A relva já precisa de outro corte. Podemos marcar para a próxima semana?', NOW() - INTERVAL '58 days' + INTERVAL '9 hours'),
(26, 41, 8,  'Bom dia! Claro, posso ir na quarta-feira de manhã. Serve-lhe?', NOW() - INTERVAL '58 days' + INTERVAL '10 hours'),
(27, 41, 2,  'Quarta está perfeito. Desta vez também queria que podasse as duas árvores junto ao muro.', NOW() - INTERVAL '58 days' + INTERVAL '11 hours'),
(28, 41, 8,  'Sem problema, levo a motosserra de poda. São árvores grandes?', NOW() - INTERVAL '58 days' + INTERVAL '12 hours'),
(29, 41, 2,  'São dois loureiros, não muito grandes. Só precisam de uma poda de forma.', NOW() - INTERVAL '58 days' + INTERVAL '13 hours'),
(30, 41, 8,  'Perfeito, está combinado então. Quarta às 9h. Até lá!', NOW() - INTERVAL '58 days' + INTERVAL '14 hours');

SELECT setval('chat_messages_id_seq', 30);


-- ═══════════════════════════════════════════════════════════════
-- PART 10 — Notifications (20 total)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO notifications (user_id, type, title, body, data, read, created_at) VALUES
-- WITH_PROPOSALS notifications
(2,  'PROPOSAL_RECEIVED', 'Nova proposta recebida', 'Recebeu uma proposta de AgroServiços Terceira para a limpeza de terreno.', '{"requestId": 24, "proposalId": 6}'::jsonb, FALSE, NOW() - INTERVAL '3 days'),
(2,  'PROPOSAL_RECEIVED', 'Nova proposta recebida', 'Recebeu uma segunda proposta para a limpeza de terreno.', '{"requestId": 24, "proposalId": 7}'::jsonb, FALSE, NOW() - INTERVAL '2 days'),
(5,  'PROPOSAL_RECEIVED', 'Nova proposta recebida', 'Recebeu uma proposta para a colheita de batata-doce.', '{"requestId": 25, "proposalId": 8}'::jsonb, FALSE, NOW() - INTERVAL '2 days'),
(11, 'PROPOSAL_RECEIVED', 'Nova proposta recebida', 'Recebeu uma proposta para a fresagem de horta.', '{"requestId": 26, "proposalId": 9}'::jsonb, TRUE, NOW() - INTERVAL '2 days'),
-- AWARDED notifications
(7,  'PROPOSAL_ACCEPTED', 'Proposta aceite!', 'A sua proposta para pulverização de chazal foi aceite.', '{"requestId": 28, "proposalId": 11}'::jsonb, TRUE, NOW() - INTERVAL '5 days'),
(6,  'PROPOSAL_ACCEPTED', 'Proposta aceite!', 'A sua proposta para lavoura de milho foi aceite.', '{"requestId": 29, "proposalId": 12}'::jsonb, TRUE, NOW() - INTERVAL '4 days'),
(13, 'PROPOSAL_ACCEPTED', 'Proposta aceite!', 'A sua proposta para limpeza de pomar foi aceite.', '{"requestId": 30, "proposalId": 13}'::jsonb, FALSE, NOW() - INTERVAL '3 days'),
-- IN_PROGRESS notifications
(2,  'EXECUTION_STARTED', 'Trabalho iniciado', 'O prestador iniciou a subsolagem da sua pastagem.', '{"requestId": 31}'::jsonb, TRUE, NOW() - INTERVAL '2 days'),
(5,  'EXECUTION_STARTED', 'Trabalho iniciado', 'O prestador iniciou a instalação da vedação do pomar.', '{"requestId": 32}'::jsonb, TRUE, NOW() - INTERVAL '1 day'),
(11, 'EXECUTION_STARTED', 'Trabalho iniciado', 'O prestador iniciou a colheita de inhame.', '{"requestId": 33}'::jsonb, FALSE, NOW() - INTERVAL '1 day'),
-- AWAITING_CONFIRMATION notifications
(12, 'EXECUTION_COMPLETED', 'Serviço concluído', 'O prestador marcou a lavoura de vinha como concluída. Por favor confirme.', '{"requestId": 34}'::jsonb, FALSE, NOW() - INTERVAL '5 days'),
(3,  'EXECUTION_COMPLETED', 'Serviço concluído', 'O prestador marcou a poda de árvores como concluída. Por favor confirme.', '{"requestId": 35}'::jsonb, TRUE, NOW() - INTERVAL '10 days'),
-- COMPLETED notifications
(6,  'REQUEST_CONFIRMED', 'Trabalho confirmado', 'O cliente confirmou a conclusão da limpeza em São Jorge.', '{"requestId": 36}'::jsonb, TRUE, NOW() - INTERVAL '32 days'),
(7,  'REQUEST_CONFIRMED', 'Trabalho confirmado', 'O cliente confirmou a fresagem para horta.', '{"requestId": 37}'::jsonb, TRUE, NOW() - INTERVAL '28 days'),
-- REVIEW notifications
(8,  'REVIEW_RECEIVED', 'Nova avaliação', 'Recebeu uma avaliação de 5 estrelas pela manutenção de jardim.', '{"requestId": 41, "reviewId": 4}'::jsonb, TRUE, NOW() - INTERVAL '56 days'),
(7,  'REVIEW_RECEIVED', 'Nova avaliação', 'Recebeu uma avaliação de 4 estrelas pela limpeza de terreno.', '{"requestId": 42, "reviewId": 6}'::jsonb, TRUE, NOW() - INTERVAL '61 days'),
-- DISPUTED notifications
(6,  'DISPUTE_OPENED', 'Disputa aberta', 'O cliente abriu uma disputa sobre a gradagem de terreno na Terceira.', '{"requestId": 46}'::jsonb, FALSE, NOW() - INTERVAL '13 days'),
(7,  'DISPUTE_OPENED', 'Disputa aberta', 'O cliente abriu uma disputa sobre a limpeza de terreno em São Miguel.', '{"requestId": 47}'::jsonb, FALSE, NOW() - INTERVAL '11 days'),
-- EXPIRED notifications
(5,  'REQUEST_EXPIRED', 'Pedido expirado', 'O seu pedido de serviço diverso em Santa Maria expirou sem propostas.', '{"requestId": 48}'::jsonb, TRUE, NOW() - INTERVAL '50 days'),
(12, 'REQUEST_EXPIRED', 'Pedido expirado', 'O seu pedido de transporte de uvas na Graciosa expirou sem propostas.', '{"requestId": 49}'::jsonb, TRUE, NOW() - INTERVAL '170 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 11 — Sequence Resets
-- ═══════════════════════════════════════════════════════════════

SELECT setval('users_id_seq', 15);
SELECT setval('provider_profiles_id_seq', 5);
SELECT setval('team_members_id_seq', 8);
SELECT setval('machines_id_seq', 12);
SELECT setval('inventory_id_seq', 11);
SELECT setval('service_requests_id_seq', 50);
SELECT setval('proposals_id_seq', 30);
SELECT setval('transactions_id_seq', 23);
SELECT setval('service_executions_id_seq', 19);
SELECT setval('reviews_id_seq', 21);
SELECT setval('chat_messages_id_seq', 30);
