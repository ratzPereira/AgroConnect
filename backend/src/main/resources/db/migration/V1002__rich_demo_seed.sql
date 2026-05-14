-- ═══════════════════════════════════════════════════════════════
-- V1002 — Rich Demo Seed (Calendar V2 & Provider 1 Operations Hub)
-- ═══════════════════════════════════════════════════════════════
-- Purpose
--   Densify the demo dataset for the live demo (2026-05-12+).
--   Focus on:
--     - agroservicos@email.com (user 6, provider 1, "AgroServiços Terceira")
--     - joao.silva@email.com  (user 2, the showcase client)
--   so the provider backoffice — Calendar V2, Machines, Team, Job
--   Costing, Inventory — has a realistic, full-of-life shape.
--
-- ID strategy
--   All NEW rows use a high-range starting at 1000+. This avoids
--   collisions with real user sign-ups that may have happened on the
--   production database after V999/V1000/V1001 ran. References to
--   baseline rows (users 1-15, team_members 1-8, machines 1-12,
--   inventory 1-11, etc.) keep their original IDs.
--
--   At the end, sequences are set to MAX(id) per table so any future
--   inserts continue cleanly.
--
-- Layout (all NEW IDs are explicit and disjoint from prior seeds)
--   PART 0  — Defensive guards (fail loudly if state is unexpected)
--   PART 1  — Users (1016-1022)
--   PART 2  — Client profiles
--   PART 3  — Team members for provider 1 (1009-1014) + hourly_rate
--   PART 4  — Machines for provider 1 (1013-1019)
--   PART 5  — Provider service categories (add 6, 7 to provider 1)
--   PART 6  — Inventory expansion (1012-1018) + INITIAL movements
--   PART 7  — Service requests (1051-1088)
--   PART 8  — Proposals (1031-1067)
--   PART 9  — Transactions (1024-1056)
--   PART 10 — Service executions (1020-1052) with calendar metadata
--   PART 11 — Execution assignments
--   PART 12 — Machine maintenance logs
--   PART 13 — Machine expenses
--   PART 14 — Reviews (1022-1039)
--   PART 15 — Notifications
--   PART 16 — Sequence resets (dynamic MAX(id))
--
-- Date anchor
--   Demo day = 2026-05-12 (Tue). "Today" in the migration = 2026-05-13.
--   AWARDED + IN_PROGRESS rows are pinned to specific 2026-05 / 2026-06
--   calendar dates so the Day/Week/Month views populate as designed.
--
-- Passwords
--   New user passwords = 'password123', BCrypt-12 hash matches V999.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- PART 0 — Defensive guards
-- ═══════════════════════════════════════════════════════════════
-- If anything in the 1000+ range is already used, fail loudly BEFORE
-- making partial changes. The migration is rolled back as a whole if
-- any of these RAISE EXCEPTION fire.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id BETWEEN 1016 AND 1022) THEN
    RAISE EXCEPTION 'V1002 aborted: users.id 1016-1022 already in use. Bump V1002 ID range.';
  END IF;
  IF EXISTS (SELECT 1 FROM service_requests WHERE id BETWEEN 1051 AND 1088) THEN
    RAISE EXCEPTION 'V1002 aborted: service_requests.id 1051-1088 already in use. Bump V1002 ID range.';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- PART 1 — New Users (IDs 1016-1022)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(1016, 'rita.alves@email.com',      '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_LEAD',     TRUE, TRUE),
(1017, 'nuno.cardoso@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1018, 'filipe.brum@email.com',     '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1019, 'sandra.melo@email.com',     '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1020, 'francisco.melo@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1021, 'laura.dutra@email.com',     '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1022, 'paulo.brum@email.com',      '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE);


-- ═══════════════════════════════════════════════════════════════
-- PART 2 — New Client Profiles
-- ═══════════════════════════════════════════════════════════════

INSERT INTO client_profiles (user_id, name, phone, location, parish, municipality, island, farm_type, total_area_ha) VALUES
(1020, 'Francisco Melo',  '+351 921 234 567', ST_SetSRID(ST_MakePoint(-27.2300, 38.6700), 4326), 'Terra Chã',     'Angra do Heroísmo', 'Terceira',   'Pastagem leiteira', 25.0),
(1021, 'Laura Dutra',     '+351 922 345 678', ST_SetSRID(ST_MakePoint(-27.0500, 38.7400), 4326), 'Santa Cruz',    'Praia da Vitória',  'Terceira',   'Mista',             18.0),
(1022, 'Paulo Brum',      '+351 923 456 789', ST_SetSRID(ST_MakePoint(-25.6850, 37.7510), 4326), 'São Sebastião', 'Ponta Delgada',     'São Miguel', 'Horticultura',       7.5);


-- ═══════════════════════════════════════════════════════════════
-- PART 3 — Team Members for Provider 1 (IDs 1009-1014) + hourly_rate backfill
-- ═══════════════════════════════════════════════════════════════
-- hourly_rate column added in V32 (job costing) — backfill existing rows
-- so the Job Costing panel can compute labor on historical jobs.

UPDATE team_members SET hourly_rate = 14.00 WHERE id = 1;
UPDATE team_members SET hourly_rate = 10.50 WHERE id = 2;
UPDATE team_members SET hourly_rate = 13.50 WHERE id = 3;
UPDATE team_members SET hourly_rate = 10.00 WHERE id = 4;
UPDATE team_members SET hourly_rate = 13.00 WHERE id = 5;
UPDATE team_members SET hourly_rate = 13.00 WHERE id = 6;
UPDATE team_members SET hourly_rate =  9.50 WHERE id = 7;
UPDATE team_members SET hourly_rate = 12.00 WHERE id = 8;

INSERT INTO team_members (id, provider_id, user_id, name, email, phone, role, active, joined_at, hourly_rate) VALUES
(1009, 1, 1016, 'Rita Alves',     'rita.alves@email.com',          '+351 924 567 890', 'LEAD',     TRUE, NOW() - INTERVAL '320 days', 13.50),
(1010, 1, 1017, 'Nuno Cardoso',   'nuno.cardoso@email.com',        '+351 925 678 901', 'OPERATOR', TRUE, NOW() - INTERVAL '260 days', 10.50),
(1011, 1, 1018, 'Filipe Brum',    'filipe.brum@email.com',         '+351 926 789 012', 'OPERATOR', TRUE, NOW() - INTERVAL '180 days', 10.00),
(1012, 1, 1019, 'Sandra Melo',    'sandra.melo@email.com',         '+351 927 890 123', 'OPERATOR', TRUE, NOW() - INTERVAL '120 days', 11.00),
(1013, 1, NULL, 'Joaquim Sousa',  'joaquim.sousa@agroservicos.pt', '+351 928 901 234', 'OPERATOR', TRUE, NOW() - INTERVAL '90 days',   9.50),
(1014, 1, NULL, 'Manuela Toste',  'manuela.toste@agroservicos.pt', '+351 929 012 345', 'LEAD',     TRUE, NOW() - INTERVAL '210 days', 13.00);


-- ═══════════════════════════════════════════════════════════════
-- PART 4 — Machines for Provider 1 (IDs 1013-1019)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO machines (id, provider_id, name, type, description, status, license_plate, last_maintenance_date, next_maintenance_date) VALUES
(1013, 1, 'Massey Ferguson 4707',           'Tractor',      'Tractor 75cv ideal para trabalhos médios em pastagem',         'AVAILABLE',   'KK-12-LL', '2026-03-10', '2026-09-10'),
(1014, 1, 'John Deere 6120M',               'Tractor',      'Tractor 120cv com transmissão PowerQuad — alta versatilidade', 'AVAILABLE',   'MM-34-NN', '2026-04-05', '2026-10-05'),
(1015, 1, 'Ceifeira-debulhadora Claas',     'Colheitadora', 'Ceifeira para cereais e milho, corte de 4.5m',                 'AVAILABLE',   'OO-56-PP', '2026-02-15', '2026-08-15'),
(1016, 1, 'Pulverizador atrelado 2000L',    'Pulverizador', 'Pulverizador rebocável com barras de 12m',                     'AVAILABLE',   NULL,       '2026-03-20', '2026-09-20'),
(1017, 1, 'Atomizador 800L',                'Pulverizador', 'Atomizador montado para tratamentos de pomares e vinhas',      'IN_USE',      NULL,       '2026-04-12', '2026-10-12'),
(1018, 1, 'Charrua reversível 3 ferros',    'Alfaia',       'Charrua reversível de 3 ferros para lavoura profunda',         'AVAILABLE',   NULL,       '2026-03-05', '2026-09-05'),
(1019, 1, 'Iveco Daily 35C16',              'Transporte',   'Carrinha de transporte 3.5t com caixa aberta',                 'AVAILABLE',   'QQ-78-RR', '2026-02-28', '2026-08-28');


-- ═══════════════════════════════════════════════════════════════
-- PART 5 — Provider Services (expand provider 1's catalogue)
-- ═══════════════════════════════════════════════════════════════
-- ON CONFLICT DO NOTHING so the seed is safe to re-run on a DB where
-- the provider may already have added these categories via the UI.

INSERT INTO provider_services (provider_id, category_id) VALUES
(1, 6),
(1, 7)
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- PART 6 — Inventory for Provider 1 (IDs 1012-1018) + INITIAL movements
-- ═══════════════════════════════════════════════════════════════

INSERT INTO inventory (id, provider_id, product_name, unit, quantity, min_stock_alert, cost_per_unit) VALUES
(1012, 1, 'Adubo NPK 12-12-17',           'KG', 1200.000, 200.000,  0.7800),
(1013, 1, 'Adubo NPK 20-10-10',           'KG',  850.000, 150.000,  0.8500),
(1014, 1, 'Herbicida glifosato 36%',      'L',   180.000,  40.000,  9.5000),
(1015, 1, 'Fungicida cobre (oxicloreto)', 'L',    95.000,  25.000, 14.2000),
(1016, 1, 'Inseticida piretróide',        'L',    42.000,  10.000, 22.5000),
(1017, 1, 'Óleo motor 15W-40',            'L',    85.000,  20.000,  6.8000),
(1018, 1, 'Sementes pastagem mista',      'KG',  320.000,  50.000,  4.9000);

-- Backfill INITIAL movements for baseline items 1-11 (only if missing).
-- V31 runs before V999/V1000, so baseline inventory rows were inserted
-- without movement records.
INSERT INTO inventory_movements (item_id, movement_type, quantity_delta, unit_cost, quantity_after, wac_after, reason, actor_user_id, created_at)
SELECT * FROM (VALUES
  (1,  'INITIAL',  800.000::numeric,  1.1500::numeric,  800.000::numeric,  1.1500::numeric, 'Inventário inicial', 6,  NOW() - INTERVAL '180 days'),
  (2,  'INITIAL',   50.000::numeric,  4.5000::numeric,   50.000::numeric,  4.5000::numeric, 'Inventário inicial', 6,  NOW() - INTERVAL '180 days'),
  (3,  'INITIAL', 1200.000::numeric,  1.1500::numeric, 1200.000::numeric,  1.1500::numeric, 'Inventário inicial', 7,  NOW() - INTERVAL '180 days'),
  (4,  'INITIAL',  500.000::numeric,  0.8500::numeric,  500.000::numeric,  0.8500::numeric, 'Inventário inicial', 7,  NOW() - INTERVAL '180 days'),
  (5,  'INITIAL',   80.000::numeric, 12.0000::numeric,   80.000::numeric, 12.0000::numeric, 'Inventário inicial', 7,  NOW() - INTERVAL '180 days'),
  (6,  'INITIAL',  150.000::numeric,  1.5500::numeric,  150.000::numeric,  1.5500::numeric, 'Inventário inicial', 8,  NOW() - INTERVAL '180 days'),
  (7,  'INITIAL',   20.000::numeric,  3.5000::numeric,   20.000::numeric,  3.5000::numeric, 'Inventário inicial', 8,  NOW() - INTERVAL '180 days'),
  (8,  'INITIAL',  600.000::numeric,  1.1500::numeric,  600.000::numeric,  1.1500::numeric, 'Inventário inicial', 13, NOW() - INTERVAL '180 days'),
  (9,  'INITIAL',   30.000::numeric, 25.0000::numeric,   30.000::numeric, 25.0000::numeric, 'Inventário inicial', 13, NOW() - INTERVAL '180 days'),
  (10, 'INITIAL',  300.000::numeric,  1.5500::numeric,  300.000::numeric,  1.5500::numeric, 'Inventário inicial', 14, NOW() - INTERVAL '180 days'),
  (11, 'INITIAL',   50.000::numeric,  8.5000::numeric,   50.000::numeric,  8.5000::numeric, 'Inventário inicial', 14, NOW() - INTERVAL '180 days')
) AS v(item_id, movement_type, quantity_delta, unit_cost, quantity_after, wac_after, reason, actor_user_id, created_at)
WHERE NOT EXISTS (SELECT 1 FROM inventory_movements im WHERE im.item_id = v.item_id);

-- INITIAL movements for the new provider 1 items 1012-1018
INSERT INTO inventory_movements (item_id, movement_type, quantity_delta, unit_cost, quantity_after, wac_after, reason, actor_user_id, created_at) VALUES
(1012, 'INITIAL', 1200.000,  0.7800, 1200.000,  0.7800, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days'),
(1013, 'INITIAL',  850.000,  0.8500,  850.000,  0.8500, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days'),
(1014, 'INITIAL',  180.000,  9.5000,  180.000,  9.5000, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days'),
(1015, 'INITIAL',   95.000, 14.2000,   95.000, 14.2000, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days'),
(1016, 'INITIAL',   42.000, 22.5000,   42.000, 22.5000, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days'),
(1017, 'INITIAL',   85.000,  6.8000,   85.000,  6.8000, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days'),
(1018, 'INITIAL',  320.000,  4.9000,  320.000,  4.9000, 'Inventário inicial — campanha 2026', 6, NOW() - INTERVAL '90 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 7 — Service Requests (IDs 1051-1088)
-- ═══════════════════════════════════════════════════════════════
-- Distribution (focus: joao.silva + provider 1 on Terceira):
--   COMPLETED              (1051-1058)  8 jobs, recent past
--   RATED                  (1059-1063)  5 jobs, deeper past
--   AWAITING_CONFIRMATION  (1064-1065)  2 jobs, just finished
--   IN_PROGRESS            (1066-1068)  3 jobs running TODAY (2026-05-13)
--   AWARDED                (1069-1083) 15 jobs scheduled in the next 6 weeks
--   PUBLISHED              (1084-1086)  3 open requests
--   WITH_PROPOSALS         (1087-1088)  2 with PENDING proposals

-- ── COMPLETED (recent past) ───────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1051, 2, 1, 'COMPLETED', 'Lavoura de pastagem para resseada — 4 hectares',
    'Pastagem cansada de 4 hectares precisa de lavoura profunda antes da resseada de Maio. Terreno conhecido e acessível, tractor pode entrar pela estrada do Biscoito.',
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6720), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-04-26', '2026-04-30',
    '{"area": 4, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '22 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1052, 3, 1, 'COMPLETED', 'Fresagem de batatal — 2 hectares',
    'Preparação fina de canteiros para batata branca. Já está lavrado, falta fresar para deixar solo solto.',
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7250), 4326),
    'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 2.0, 'hectares', 'MEDIUM',
    '2026-04-28', '2026-05-02',
    '{"area": 2, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '20 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1053, 5, 2, 'COMPLETED', 'Pulverização de pomar de citrinos',
    'Pomar de laranjeiras com 1.5 hectares precisa de tratamento fungicida e inseticida. Produtos no local.',
    ST_SetSRID(ST_MakePoint(-25.5200, 37.8150), 4326),
    'Conceição', 'Ribeira Grande', 'São Miguel', 1.5, 'hectares', 'HIGH',
    '2026-05-01', '2026-05-03',
    '{"area": 1.5, "crop_type": "Citrinos", "treatment_type": "Fungicida + Inseticida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '17 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1054, 2, 1, 'COMPLETED', 'Gradagem após lavoura — 4 hectares',
    'Sequência da lavoura anterior. Quero gradar para nivelar o terreno antes da sementeira de erva.',
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6720), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'HIGH',
    '2026-05-04', '2026-05-05',
    '{"area": 4, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '12 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1055, 4, 2, 'COMPLETED', 'Pulverização preventiva de milho — 3 hectares',
    'Tratamento herbicida pré-emergente em campo de milho recém semeado. Produto será fornecido.',
    ST_SetSRID(ST_MakePoint(-25.6750, 37.7320), 4326),
    'São Sebastião', 'Ponta Delgada', 'São Miguel', 3.0, 'hectares', 'HIGH',
    '2026-05-05', '2026-05-06',
    '{"area": 3, "crop_type": "Milho", "treatment_type": "Herbicida", "product_provided": "Não, forneço eu"}'::jsonb,
    NOW() - INTERVAL '11 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1056, 11, 2, 'COMPLETED', 'Tratamento fitossanitário em vinha — Faial',
    'Vinha de 2 hectares na zona dos Flamengos. Necessidade de fungicida cobre por sinais iniciais de míldio.',
    ST_SetSRID(ST_MakePoint(-28.7180, 38.5340), 4326),
    'Flamengos', 'Horta', 'Faial', 2.0, 'hectares', 'HIGH',
    '2026-05-06', '2026-05-07',
    '{"area": 2, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Não, forneço eu"}'::jsonb,
    NOW() - INTERVAL '10 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1057, 1020, 6, 'COMPLETED', 'Reparação de vedação — 200 metros',
    'Vedação de pastagem caiu em vários pontos com o temporal de Março. Preciso de reparação rápida antes de soltar o gado.',
    ST_SetSRID(ST_MakePoint(-27.2310, 38.6695), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 200, 'metros', 'HIGH',
    '2026-05-07', '2026-05-08',
    '{"length_meters": 200, "fence_type": "Rede de arame", "work_type": "Reparação"}'::jsonb,
    NOW() - INTERVAL '9 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1058, 1021, 4, 'COMPLETED', 'Transporte de fardos de silagem — 30 fardos',
    '30 fardos quadrados de silagem do campo para o armazém na Praia. Distância 5km.',
    ST_SetSRID(ST_MakePoint(-27.0530, 38.7390), 4326),
    'Santa Cruz', 'Praia da Vitória', 'Terceira', NULL, NULL, 'MEDIUM',
    '2026-05-08', '2026-05-08',
    '{"cargo_type": "Fardos quadrados de silagem (30 unidades)", "weight_tons": 15, "origin": "Campo na Santa Cruz", "destination": "Armazém na Praia da Vitória"}'::jsonb,
    NOW() - INTERVAL '8 days');


-- ── RATED (deeper past) ───────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1059, 2, 1, 'RATED', 'Lavoura inicial campanha 2026 — 6 hectares',
    'Lavoura de fundo em pastagem antiga para resseada de início de campanha. Trabalho urgente para aproveitar humidade do solo.',
    ST_SetSRID(ST_MakePoint(-27.2120, 38.6650), 4326),
    'Sé', 'Angra do Heroísmo', 'Terceira', 6.0, 'hectares', 'HIGH',
    '2026-02-12', '2026-02-18',
    '{"area": 6, "terrain_type": "Inclinado", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '92 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1060, 3, 3, 'RATED', 'Colheita de milho silagem — 5 hectares',
    'Colheita de milho para silagem com ceifeira. 5 hectares plantados no fim de Setembro, prontos a cortar.',
    ST_SetSRID(ST_MakePoint(-27.0820, 38.7180), 4326),
    'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 5.0, 'hectares', 'HIGH',
    '2026-03-08', '2026-03-12',
    '{"area": 5, "crop_type": "Milho silagem", "method": "Mecanizada"}'::jsonb,
    NOW() - INTERVAL '70 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1061, 5, 2, 'RATED', 'Pulverização foliar em pomar — 2 hectares',
    'Aplicação de adubo foliar e fungicida preventivo em pomar de citrinos. 2 hectares no total.',
    ST_SetSRID(ST_MakePoint(-25.5180, 37.8170), 4326),
    'Conceição', 'Ribeira Grande', 'São Miguel', 2.0, 'hectares', 'MEDIUM',
    '2026-03-18', '2026-03-22',
    '{"area": 2, "crop_type": "Citrinos", "treatment_type": "Fertilização", "product_provided": "Não, forneço eu"}'::jsonb,
    NOW() - INTERVAL '58 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1062, 2, 1, 'RATED', 'Fresagem para semeadura de pastagem — 3 hectares',
    'Preparação fina para semeadura de mistura de pastagem permanente. Solo já lavrado e gradado, falta fresar.',
    ST_SetSRID(ST_MakePoint(-27.2080, 38.6700), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'MEDIUM',
    '2026-04-03', '2026-04-07',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '42 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1063, 1020, 1, 'RATED', 'Gradagem para sementeira de erva — 8 hectares',
    'Gradagem em parcela grande para resseada com mistura de pastagem nova. Acesso por estrada da Terra Chã.',
    ST_SetSRID(ST_MakePoint(-27.2280, 38.6730), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 8.0, 'hectares', 'MEDIUM',
    '2026-04-15', '2026-04-20',
    '{"area": 8, "terrain_type": "Inclinado", "work_type": "Gradagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '30 days');


-- ── AWAITING_CONFIRMATION ────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1064, 4, 2, 'AWAITING_CONFIRMATION', 'Aplicação de adubo NPK em milho — 4 hectares',
    'Adubação de cobertura em campo de milho com NPK 20-10-10. Pretende-se aplicação uniforme e cuidado com zonas declivosas.',
    ST_SetSRID(ST_MakePoint(-25.6730, 37.7390), 4326),
    'São Sebastião', 'Ponta Delgada', 'São Miguel', 4.0, 'hectares', 'MEDIUM',
    '2026-05-10', '2026-05-12',
    '{"area": 4, "crop_type": "Milho", "treatment_type": "Fertilização", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '5 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1065, 2, 5, 'AWAITING_CONFIRMATION', 'Limpeza de terreno com silvas — 1.5 hectares',
    'Terreno encostado às vinhas com silvas e mato a invadir. Limpeza com destroçador para travar avanço.',
    ST_SetSRID(ST_MakePoint(-27.2160, 38.6690), 4326),
    'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM',
    '2026-05-11', '2026-05-12',
    '{"area": 1.5, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '4 days');


-- ── IN_PROGRESS (running TODAY 2026-05-13) ───────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1066, 2, 1, 'IN_PROGRESS', 'Subsolagem em pastagem compactada — 3 hectares',
    'Pastagem com problemas de drenagem após o inverno. Solo compactado, precisa de subsolagem para arejar.',
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6750), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'HIGH',
    '2026-05-13', '2026-05-13',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '3 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1067, 1021, 4, 'IN_PROGRESS', 'Transporte de adubo do porto para armazém',
    'Recolha de 5 toneladas de adubo no porto da Praia da Vitória e entrega no armazém em Santa Cruz. Carga em sacos de 50kg.',
    ST_SetSRID(ST_MakePoint(-27.0610, 38.7330), 4326),
    'Santa Cruz', 'Praia da Vitória', 'Terceira', NULL, NULL, 'MEDIUM',
    '2026-05-13', '2026-05-13',
    '{"cargo_type": "Sacos de adubo (100 x 50kg)", "weight_tons": 5, "origin": "Porto da Praia da Vitória", "destination": "Armazém em Santa Cruz"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1068, 3, 5, 'IN_PROGRESS', 'Limpeza de levada e bermas — 800 metros',
    'Limpeza de levada e bermas em propriedade rural. Vegetação rasteira abundante após chuvas.',
    ST_SetSRID(ST_MakePoint(-27.0680, 38.7260), 4326),
    'Lajes', 'Praia da Vitória', 'Terceira', 0.8, 'hectares', 'MEDIUM',
    '2026-05-13', '2026-05-14',
    '{"area": 0.8, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '3 days');


-- ── AWARDED (future, scheduled) ──────────────────────────────
-- Intentional conflicts:
--   * Exec 1038 + Exec 1040 share TM 1 (António) on 2026-05-14
--   * Exec 1044 + Exec 1045 share Machine 1 on 2026-05-18

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1069, 2, 2, 'AWARDED', 'Tratamento herbicida em pastagem — 4 hectares',
    'Aplicação de herbicida seletivo para combate de junças em pastagem permanente. Tratamento de manhã para evitar vento.',
    ST_SetSRID(ST_MakePoint(-27.2090, 38.6710), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-05-14', '2026-05-14',
    '{"area": 4, "crop_type": "Pastagem", "treatment_type": "Herbicida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '4 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1070, 1020, 1, 'AWARDED', 'Gradagem em pastagem nova — 3 hectares',
    'Gradagem após resseada para incorporar a mistura de pastagem.',
    ST_SetSRID(ST_MakePoint(-27.2320, 38.6720), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'MEDIUM',
    '2026-05-14', '2026-05-14',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '3 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1071, 3, 1, 'AWARDED', 'Lavoura de pastagem velha — 5 hectares',
    'Lavoura profunda para preparar terreno para milho de silagem. Pastagem com 8 anos.',
    ST_SetSRID(ST_MakePoint(-27.0750, 38.7220), 4326),
    'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 5.0, 'hectares', 'HIGH',
    '2026-05-14', '2026-05-15',
    '{"area": 5, "terrain_type": "Inclinado", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '3 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1072, 2, 2, 'AWARDED', 'Tratamento fungicida em pomar de macieiras — 1.5 hectares',
    'Aplicação preventiva de fungicida cobre em macieiras Bravo de Esmolfe. Importante evitar ventos.',
    ST_SetSRID(ST_MakePoint(-27.2160, 38.6710), 4326),
    'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM',
    '2026-05-15', '2026-05-15',
    '{"area": 1.5, "crop_type": "Macieiras", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1073, 4, 1, 'AWARDED', 'Fresagem para campo de milho — 2.5 hectares',
    'Preparação fina do solo antes da sementeira de milho. Trabalho num único dia idealmente.',
    ST_SetSRID(ST_MakePoint(-25.6680, 37.7380), 4326),
    'São Sebastião', 'Ponta Delgada', 'São Miguel', 2.5, 'hectares', 'HIGH',
    '2026-05-15', '2026-05-15',
    '{"area": 2.5, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1074, 1021, 6, 'AWARDED', 'Reparação de cerca elétrica — 300 metros',
    'Cerca elétrica de pastagem com falhas. Preciso de reparação e substituição de isoladores em mau estado.',
    ST_SetSRID(ST_MakePoint(-27.0610, 38.7340), 4326),
    'Santa Cruz', 'Praia da Vitória', 'Terceira', 300, 'metros', 'MEDIUM',
    '2026-05-16', '2026-05-16',
    '{"length_meters": 300, "fence_type": "Elétrica", "work_type": "Reparação"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1075, 2, 1, 'AWARDED', 'Lavoura de campo para batata — 3 hectares',
    'Preparação para batata nova. Lavoura profunda com terreno solto, possível pequena gradagem após.',
    ST_SetSRID(ST_MakePoint(-27.2070, 38.6680), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'HIGH',
    '2026-05-18', '2026-05-18',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1076, 1020, 1, 'AWARDED', 'Subsolagem em pomar — 2 hectares',
    'Pomar precisa de subsolagem entre filas para arejar e melhorar drenagem.',
    ST_SetSRID(ST_MakePoint(-27.2300, 38.6700), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM',
    '2026-05-18', '2026-05-18',
    '{"area": 2, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1077, 3, 5, 'AWARDED', 'Limpeza de mato em pastagem — 2 hectares',
    'Pastagem invadida por silvas e fetos. Limpeza com destroçador para travar avanço.',
    ST_SetSRID(ST_MakePoint(-27.0650, 38.7280), 4326),
    'Lajes', 'Praia da Vitória', 'Terceira', 2.0, 'hectares', 'MEDIUM',
    '2026-05-18', '2026-05-18',
    '{"area": 2, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1078, 2, 7, 'AWARDED', 'Instalação de rega gota-a-gota — 0.5 hectares',
    'Instalação de sistema gota-a-gota em horta familiar de 0.5 hectares. Material já está no terreno.',
    ST_SetSRID(ST_MakePoint(-27.2210, 38.6660), 4326),
    'São Pedro', 'Angra do Heroísmo', 'Terceira', 0.5, 'hectares', 'MEDIUM',
    '2026-05-19', '2026-05-19',
    '{"area": 0.5, "system_type": "Gota a gota", "work_type": "Instalação nova"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1079, 4, 2, 'AWARDED', 'Tratamento de Mildio em vinha — 1.8 hectares',
    'Tratamento preventivo de míldio em vinha jovem. Atomização aérea de copa.',
    ST_SetSRID(ST_MakePoint(-25.6770, 37.7310), 4326),
    'São Sebastião', 'Ponta Delgada', 'São Miguel', 1.8, 'hectares', 'HIGH',
    '2026-05-19', '2026-05-19',
    '{"area": 1.8, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Não, forneço eu"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1080, 2, 3, 'AWARDED', 'Colheita de erva seca para fardos — 4 hectares',
    'Erva já cortada e amontoada, falta enfardar. Pretende-se fardos quadrados pequenos.',
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6720), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'HIGH',
    '2026-05-20', '2026-05-20',
    '{"area": 4, "crop_type": "Erva seca", "method": "Mecanizada"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1081, 2, 2, 'AWARDED', 'Aplicação de adubo em pastagem — 6 hectares',
    'Adubação de cobertura com NPK 20-10-10 em pastagem para vacas leiteiras. Aplicação uniforme.',
    ST_SetSRID(ST_MakePoint(-27.2150, 38.6680), 4326),
    'Sé', 'Angra do Heroísmo', 'Terceira', 6.0, 'hectares', 'MEDIUM',
    '2026-05-20', '2026-05-20',
    '{"area": 6, "crop_type": "Pastagem", "treatment_type": "Fertilização", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1082, 11, 3, 'AWARDED', 'Colheita de cereal — 3 hectares Faial',
    'Colheita de aveia mecanizada com ceifeira-debulhadora. Trabalho num único dia.',
    ST_SetSRID(ST_MakePoint(-28.7160, 38.5360), 4326),
    'Flamengos', 'Horta', 'Faial', 3.0, 'hectares', 'HIGH',
    '2026-05-21', '2026-05-21',
    '{"area": 3, "crop_type": "Aveia", "method": "Mecanizada"}'::jsonb,
    NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1083, 2, 5, 'AWARDED', 'Limpeza de bermas e regadeiras — 1.5 km',
    'Limpeza geral de bermas em caminho da propriedade. Roça e recolha de vegetação rasteira.',
    ST_SetSRID(ST_MakePoint(-27.2130, 38.6700), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'LOW',
    '2026-05-22', '2026-05-22',
    '{"area": 1.5, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '1 day');


-- ── PUBLISHED (open, no proposals yet) ───────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1084, 2, 6, 'PUBLISHED', 'Instalação de vedação nova em parcela — 500 metros',
    'Parcela adquirida recentemente sem qualquer vedação. Preciso de cerca completa em rede de arame com postes de madeira.',
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6740), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 500, 'metros', 'MEDIUM',
    '2026-05-28', '2026-06-10',
    '{"length_meters": 500, "fence_type": "Rede de arame", "work_type": "Instalação nova"}'::jsonb,
    '2026-06-05 23:59:59', NOW() - INTERVAL '6 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1085, 1022, 8, 'PUBLISHED', 'Manutenção mensal de jardim — pacote 3 meses',
    'Procura prestador para manutenção quinzenal de jardim residencial. Corte de relva, poda de sebes, limpeza geral.',
    ST_SetSRID(ST_MakePoint(-25.6840, 37.7510), 4326),
    'São Sebastião', 'Ponta Delgada', 'São Miguel', 700, 'm²', 'LOW',
    '2026-06-01', '2026-08-31',
    '{"area": 700, "services": "Corte de relva, poda de sebes, limpeza geral", "frequency": "Quinzenal"}'::jsonb,
    '2026-05-30 23:59:59', NOW() - INTERVAL '1 day');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1086, 3, 4, 'PUBLISHED', 'Transporte de gado leiteiro — 15 vacas',
    'Transporte de 15 vacas leiteiras Holstein entre duas propriedades na Terceira. Carga e descarga incluídas.',
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7300), 4326),
    'Santa Cruz', 'Praia da Vitória', 'Terceira', NULL, NULL, 'MEDIUM',
    '2026-05-24', '2026-05-28',
    '{"cargo_type": "Vacas leiteiras Holstein (15 cabeças)", "weight_tons": 9, "origin": "Praia da Vitória", "destination": "Angra do Heroísmo"}'::jsonb,
    '2026-05-22 23:59:59', NOW() - INTERVAL '12 hours');


-- ── WITH_PROPOSALS ──────────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1087, 2, 3, 'WITH_PROPOSALS', 'Colheita de batata branca — 2 hectares',
    'Batata branca pronta a colher, plantada em Março. Procuro prestador com arrancador mecânico de batata.',
    ST_SetSRID(ST_MakePoint(-27.2120, 38.6740), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'HIGH',
    '2026-05-25', '2026-05-30',
    '{"area": 2, "crop_type": "Batata branca", "method": "Mecanizada"}'::jsonb,
    '2026-05-22 23:59:59', NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1088, 1020, 1, 'WITH_PROPOSALS', 'Subsolagem em pastagem recente — 4 hectares',
    'Pastagem nova com sinais de compactação no terço superior. Subsolagem para corrigir.',
    ST_SetSRID(ST_MakePoint(-27.2310, 38.6690), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-05-26', '2026-06-01',
    '{"area": 4, "terrain_type": "Inclinado", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    '2026-05-24 23:59:59', NOW() - INTERVAL '1 day');


-- ═══════════════════════════════════════════════════════════════
-- PART 8 — Proposals (IDs 1031-1067)
-- ═══════════════════════════════════════════════════════════════

-- COMPLETED (req 1051-1058) — proposals 1031-1038
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1031, 1051, 1, 'ACCEPTED', 520.00, 'PER_UNIT', 130.00, 4, 'Lavoura com tractor New Holland T5.120 e charrua reversível 3 ferros. 2 dias estimados.',
    'Mão de obra, máquina, combustível', 'Eventuais reparações de muros ou caminhos',
    '2026-04-28', NOW() - INTERVAL '21 days'),
(1032, 1052, 1, 'ACCEPTED', 200.00, 'PER_UNIT', 100.00, 2, 'Fresagem com Massey Ferguson 4707 e fresa 2m. Trabalho num único dia.',
    'Mão de obra, máquina, combustível', 'Remoção de pedras',
    '2026-04-30', NOW() - INTERVAL '19 days'),
(1033, 1053, 1, 'ACCEPTED', 240.00, 'PER_UNIT', 160.00, 1.5, 'Pulverização com atomizador 800L e tractor MF 4707. Operador experiente em pomares.',
    'Mão de obra, máquina, deslocação', 'Produtos fitossanitários (fornecidos pelo cliente)',
    '2026-05-02', NOW() - INTERVAL '16 days'),
(1034, 1054, 1, 'ACCEPTED', 360.00, 'PER_UNIT',  90.00, 4, 'Gradagem em duas passagens cruzadas. New Holland + grade de discos 28".',
    'Mão de obra, máquina, combustível', 'Eventual aplicação de adubo',
    '2026-05-04', NOW() - INTERVAL '11 days'),
(1035, 1055, 1, 'ACCEPTED', 270.00, 'PER_UNIT',  90.00, 3, 'Aplicação herbicida com pulverizador 2000L. Trabalho rápido e preciso.',
    'Mão de obra, máquina, deslocação', 'Produto herbicida (fornecido pelo cliente)',
    '2026-05-05', NOW() - INTERVAL '10 days'),
(1036, 1056, 1, 'ACCEPTED', 320.00, 'PER_UNIT', 160.00, 2, 'Tratamento fungicida em vinha. Atomizador 800L. Deslocação para Faial incluída.',
    'Mão de obra, máquina, deslocação inter-ilhas', 'Produto fungicida',
    '2026-05-06', NOW() - INTERVAL '9 days'),
(1037, 1057, 1, 'ACCEPTED', 380.00, 'PER_UNIT',   1.90, 200, 'Reparação de vedação com substituição de postes em mau estado e remate de rede.',
    'Mão de obra, postes novos, deslocação', 'Pintura ou tratamento extra de postes',
    '2026-05-07', NOW() - INTERVAL '8 days'),
(1038, 1058, 1, 'ACCEPTED', 220.00, 'FIXED', NULL, NULL, 'Transporte de 30 fardos com Iveco Daily. Carga e descarga incluídas.',
    'Mão de obra, viatura, combustível', 'Empilhamento no destino',
    '2026-05-08', NOW() - INTERVAL '7 days');

-- RATED (req 1059-1063) — proposals 1039-1043
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1039, 1059, 1, 'ACCEPTED', 780.00, 'PER_UNIT', 130.00, 6, 'Lavoura profunda com New Holland T5.120 + charrua reversível. Cuidado especial nas zonas declivosas.',
    'Mão de obra, máquina, combustível', 'Gradagem posterior',
    '2026-02-14', NOW() - INTERVAL '91 days'),
(1040, 1060, 1, 'ACCEPTED', 750.00, 'PER_UNIT', 150.00, 5, 'Colheita com ceifeira Claas. Trabalho contínuo num único dia.',
    'Mão de obra, máquina, combustível', 'Transporte do silo (cliente)',
    '2026-03-10', NOW() - INTERVAL '69 days'),
(1041, 1061, 1, 'ACCEPTED', 280.00, 'PER_UNIT', 140.00, 2, 'Aplicação foliar com atomizador 800L. Operador experiente em citrinos.',
    'Mão de obra, máquina, deslocação', 'Produto adubo foliar e fungicida',
    '2026-03-19', NOW() - INTERVAL '57 days'),
(1042, 1062, 1, 'ACCEPTED', 330.00, 'PER_UNIT', 110.00, 3, 'Fresagem fina com Massey Ferguson 4707 e fresa 2m. Solo fica pronto para semeadura.',
    'Mão de obra, máquina, combustível', 'Sementes',
    '2026-04-05', NOW() - INTERVAL '41 days'),
(1043, 1063, 1, 'ACCEPTED', 720.00, 'PER_UNIT',  90.00, 8, 'Gradagem em duas passagens cruzadas. Trabalho num único dia se o tempo ajudar.',
    'Mão de obra, máquina, combustível', 'Sementeira (à parte)',
    '2026-04-16', NOW() - INTERVAL '29 days');

-- AWAITING_CONFIRMATION (req 1064-1065) — proposals 1044-1045
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1044, 1064, 1, 'ACCEPTED', 360.00, 'PER_UNIT',  90.00, 4, 'Aplicação de NPK 20-10-10 com pulverizador 2000L. Distribuição uniforme garantida.',
    'Mão de obra, máquina, deslocação', 'Produto adubo (fornecido pelo cliente)',
    '2026-05-11', NOW() - INTERVAL '5 days'),
(1045, 1065, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Limpeza com destroçador florestal. Trabalho de meio dia.',
    'Mão de obra, máquina, combustível', 'Remoção de troncos',
    '2026-05-11', NOW() - INTERVAL '4 days');

-- IN_PROGRESS (req 1066-1068) — proposals 1046-1048
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1046, 1066, 1, 'ACCEPTED', 360.00, 'PER_UNIT', 120.00, 3, 'Subsolagem profunda com subsolador montado em New Holland T5.120. Solo bem arejado.',
    'Mão de obra, máquina, combustível', 'Gradagem posterior',
    '2026-05-13', NOW() - INTERVAL '3 days'),
(1047, 1067, 1, 'ACCEPTED', 140.00, 'FIXED', NULL, NULL, 'Transporte de adubo do porto com Iveco Daily. Inclui carga e descarga em rampa.',
    'Mão de obra, viatura, combustível', 'Eventuais paletes danificadas',
    '2026-05-13', NOW() - INTERVAL '2 days'),
(1048, 1068, 1, 'ACCEPTED', 180.00, 'PER_UNIT', 225.00, 0.8, 'Limpeza com destroçador. 1 dia e meio estimado.',
    'Mão de obra, máquina, combustível', 'Remoção de pedras grandes',
    '2026-05-13', NOW() - INTERVAL '3 days');

-- AWARDED (req 1069-1083) — proposals 1049-1063
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1049, 1069, 1, 'ACCEPTED', 280.00, 'PER_UNIT',  70.00, 4, 'Tratamento herbicida seletivo com pulverizador 2000L. Aplicação matinal sem vento.',
    'Mão de obra, máquina, deslocação', 'Produto herbicida (fornecido pelo cliente)',
    '2026-05-14', NOW() - INTERVAL '4 days'),
(1050, 1070, 1, 'ACCEPTED', 240.00, 'PER_UNIT',  80.00, 3, 'Gradagem com John Deere 6120M e grade de discos 28".',
    'Mão de obra, máquina, combustível', 'Sementeira',
    '2026-05-14', NOW() - INTERVAL '3 days'),
(1051, 1071, 1, 'ACCEPTED', 650.00, 'PER_UNIT', 130.00, 5, 'Lavoura profunda em terreno inclinado. New Holland + charrua reversível.',
    'Mão de obra, máquina, combustível', 'Gradagem posterior',
    '2026-05-14', NOW() - INTERVAL '3 days'),
(1052, 1072, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Aplicação fungicida com atomizador 800L. Operação muito cuidada para evitar derivação.',
    'Mão de obra, máquina, deslocação', 'Produto fungicida (fornecido pelo cliente)',
    '2026-05-15', NOW() - INTERVAL '2 days'),
(1053, 1073, 1, 'ACCEPTED', 280.00, 'PER_UNIT', 112.00, 2.5, 'Fresagem fina para sementeira de milho. MF 4707 + fresa 2m.',
    'Mão de obra, máquina, deslocação inter-ilhas', 'Sementeira',
    '2026-05-15', NOW() - INTERVAL '2 days'),
(1054, 1074, 1, 'ACCEPTED', 290.00, 'PER_UNIT',   0.97, 300, 'Reparação de cerca elétrica com substituição de isoladores e teste de continuidade.',
    'Mão de obra, isoladores novos, deslocação', 'Energizador (cliente possui)',
    '2026-05-16', NOW() - INTERVAL '2 days'),
(1055, 1075, 1, 'ACCEPTED', 420.00, 'PER_UNIT', 140.00, 3, 'Lavoura profunda com New Holland e charrua reversível 3 ferros. 1 dia.',
    'Mão de obra, máquina, combustível', 'Gradagem posterior',
    '2026-05-18', NOW() - INTERVAL '1 day'),
(1056, 1076, 1, 'ACCEPTED', 320.00, 'PER_UNIT', 160.00, 2, 'Subsolagem em filas. New Holland T5.120 + subsolador.',
    'Mão de obra, máquina, combustível', 'Cobertura morta entre filas',
    '2026-05-18', NOW() - INTERVAL '1 day'),
(1057, 1077, 1, 'ACCEPTED', 220.00, 'PER_UNIT', 110.00, 2, 'Destroçamento com destroçador florestal. Trabalho de 1 dia.',
    'Mão de obra, máquina, combustível', 'Remoção de troncos grandes',
    '2026-05-18', NOW() - INTERVAL '1 day'),
(1058, 1078, 1, 'ACCEPTED', 320.00, 'FIXED', NULL, NULL, 'Instalação completa de gota-a-gota em 0.5ha. Inclui testes.',
    'Mão de obra, conectores e válvulas, deslocação', 'Material principal (tubo, gotejadores — cliente já tem)',
    '2026-05-19', NOW() - INTERVAL '1 day'),
(1059, 1079, 1, 'ACCEPTED', 240.00, 'PER_UNIT', 133.33, 1.8, 'Tratamento com atomizador 800L. Atomização aérea de copa.',
    'Mão de obra, máquina, deslocação inter-ilhas', 'Produto fungicida',
    '2026-05-19', NOW() - INTERVAL '1 day'),
(1060, 1080, 1, 'ACCEPTED', 480.00, 'PER_UNIT', 120.00, 4, 'Colheita de erva seca e enfardamento com fardos quadrados pequenos.',
    'Mão de obra, máquina, combustível', 'Transporte para armazém',
    '2026-05-20', NOW() - INTERVAL '1 day'),
(1061, 1081, 1, 'ACCEPTED', 420.00, 'PER_UNIT',  70.00, 6, 'Aplicação de NPK 20-10-10 com pulverizador 2000L em pastagem.',
    'Mão de obra, máquina, deslocação', 'Produto adubo (fornecido pelo cliente)',
    '2026-05-20', NOW() - INTERVAL '1 day'),
(1062, 1082, 1, 'ACCEPTED', 570.00, 'PER_UNIT', 190.00, 3, 'Colheita de aveia com ceifeira Claas. Deslocação inter-ilhas incluída.',
    'Mão de obra, máquina, deslocação Faial', 'Armazenamento do grão',
    '2026-05-21', NOW() - INTERVAL '1 day'),
(1063, 1083, 1, 'ACCEPTED', 180.00, 'PER_UNIT', 120.00, 1.5, 'Roça e limpeza de bermas com moto-roçadora e carrinha de apoio.',
    'Mão de obra, máquina, combustível', 'Aplicação de herbicida',
    '2026-05-22', NOW() - INTERVAL '1 day');

-- WITH_PROPOSALS (req 1087-1088) — 2 PENDING each (provider 1 + provider 2)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1064, 1087, 1, 'PENDING', 380.00, 'PER_UNIT', 190.00, 2, 'Colheita de batata com arrancador mecânico Spedo. Acondicionamento em caixas.',
    'Mão de obra, máquina, combustível', 'Transporte para armazenamento',
    '2026-05-27', '2026-05-22 23:59:59', NOW() - INTERVAL '1 day'),
(1065, 1087, 2, 'PENDING', 360.00, 'PER_UNIT', 180.00, 2, 'Colheita de batata com sistema da Verde Açores. Acondicionamento em sacos.',
    'Mão de obra, máquina, combustível', 'Caixas de armazenamento',
    '2026-05-28', '2026-05-22 23:59:59', NOW() - INTERVAL '1 day'),
(1066, 1088, 1, 'PENDING', 520.00, 'PER_UNIT', 130.00, 4, 'Subsolagem com subsolador montado em New Holland T5.120. Trabalho cuidado em encosta.',
    'Mão de obra, máquina, combustível', 'Gradagem posterior',
    '2026-05-27', '2026-05-24 23:59:59', NOW() - INTERVAL '12 hours'),
(1067, 1088, 2, 'PENDING', 540.00, 'PER_UNIT', 135.00, 4, 'Subsolagem com John Deere 6130M. Possibilidade de gradagem incluída por valor adicional.',
    'Mão de obra, máquina, deslocação', 'Gradagem (preço à parte)',
    '2026-05-28', '2026-05-24 23:59:59', NOW() - INTERVAL '6 hours');


-- ═══════════════════════════════════════════════════════════════
-- PART 9 — Transactions (IDs 1024-1056)
-- ═══════════════════════════════════════════════════════════════

-- COMPLETED → RELEASED (8 rows)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(1024, 1051, 1031, 520.00, 0.12, 62.40, 457.60, 'RELEASED', NOW() - INTERVAL '21 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '21 days'),
(1025, 1052, 1032, 200.00, 0.12, 24.00, 176.00, 'RELEASED', NOW() - INTERVAL '19 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '19 days'),
(1026, 1053, 1033, 240.00, 0.12, 28.80, 211.20, 'RELEASED', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '16 days'),
(1027, 1054, 1034, 360.00, 0.12, 43.20, 316.80, 'RELEASED', NOW() - INTERVAL '11 days', NOW() - INTERVAL '8 days',  NOW() - INTERVAL '11 days'),
(1028, 1055, 1035, 270.00, 0.12, 32.40, 237.60, 'RELEASED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days',  NOW() - INTERVAL '10 days'),
(1029, 1056, 1036, 320.00, 0.12, 38.40, 281.60, 'RELEASED', NOW() - INTERVAL '9 days',  NOW() - INTERVAL '6 days',  NOW() - INTERVAL '9 days'),
(1030, 1057, 1037, 380.00, 0.12, 45.60, 334.40, 'RELEASED', NOW() - INTERVAL '8 days',  NOW() - INTERVAL '5 days',  NOW() - INTERVAL '8 days'),
(1031, 1058, 1038, 220.00, 0.12, 26.40, 193.60, 'RELEASED', NOW() - INTERVAL '7 days',  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '7 days');

-- RATED → RELEASED (5 rows)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(1032, 1059, 1039, 780.00, 0.12,  93.60, 686.40, 'RELEASED', NOW() - INTERVAL '91 days', NOW() - INTERVAL '85 days', NOW() - INTERVAL '91 days'),
(1033, 1060, 1040, 750.00, 0.12,  90.00, 660.00, 'RELEASED', NOW() - INTERVAL '69 days', NOW() - INTERVAL '63 days', NOW() - INTERVAL '69 days'),
(1034, 1061, 1041, 280.00, 0.12,  33.60, 246.40, 'RELEASED', NOW() - INTERVAL '57 days', NOW() - INTERVAL '52 days', NOW() - INTERVAL '57 days'),
(1035, 1062, 1042, 330.00, 0.12,  39.60, 290.40, 'RELEASED', NOW() - INTERVAL '41 days', NOW() - INTERVAL '36 days', NOW() - INTERVAL '41 days'),
(1036, 1063, 1043, 720.00, 0.12,  86.40, 633.60, 'RELEASED', NOW() - INTERVAL '29 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '29 days');

-- AWAITING_CONFIRMATION → HELD (2 rows)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(1037, 1064, 1044, 360.00, 0.12, 43.20, 316.80, 'HELD', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(1038, 1065, 1045, 195.00, 0.12, 23.40, 171.60, 'HELD', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days');

-- IN_PROGRESS → HELD (3 rows)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(1039, 1066, 1046, 360.00, 0.12, 43.20, 316.80, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1040, 1067, 1047, 140.00, 0.12, 16.80, 123.20, 'HELD', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1041, 1068, 1048, 180.00, 0.12, 21.60, 158.40, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- AWARDED → HELD (15 rows)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(1042, 1069, 1049, 280.00, 0.12, 33.60, 246.40, 'HELD', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(1043, 1070, 1050, 240.00, 0.12, 28.80, 211.20, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1044, 1071, 1051, 650.00, 0.12, 78.00, 572.00, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1045, 1072, 1052, 195.00, 0.12, 23.40, 171.60, 'HELD', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1046, 1073, 1053, 280.00, 0.12, 33.60, 246.40, 'HELD', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1047, 1074, 1054, 290.00, 0.12, 34.80, 255.20, 'HELD', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1048, 1075, 1055, 420.00, 0.12, 50.40, 369.60, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1049, 1076, 1056, 320.00, 0.12, 38.40, 281.60, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1050, 1077, 1057, 220.00, 0.12, 26.40, 193.60, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1051, 1078, 1058, 320.00, 0.12, 38.40, 281.60, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1052, 1079, 1059, 240.00, 0.12, 28.80, 211.20, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1053, 1080, 1060, 480.00, 0.12, 57.60, 422.40, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1054, 1081, 1061, 420.00, 0.12, 50.40, 369.60, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1055, 1082, 1062, 570.00, 0.12, 68.40, 501.60, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
(1056, 1083, 1063, 180.00, 0.12, 21.60, 158.40, 'HELD', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day');


-- ═══════════════════════════════════════════════════════════════
-- PART 10 — Service Executions (IDs 1020-1052) with calendar metadata
-- ═══════════════════════════════════════════════════════════════

-- COMPLETED (req 1051-1058) — executions 1020-1027
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1020, 1031,
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6720), 4326),
    NOW() - INTERVAL '17 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '16 days' + INTERVAL '18 hours',
    'Lavoura concluída em 2 dias. Solo bem revolto. Cliente acompanhou no segundo dia.',
    '[{"product": "Gasóleo agrícola", "quantity": 110, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '16 days' + INTERVAL '18 hours',
    '2026-04-28', '2026-04-29', TRUE,
    NOW() - INTERVAL '18 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1021, 1032,
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7250), 4326),
    NOW() - INTERVAL '15 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '15 days' + INTERVAL '15 hours',
    'Fresagem concluída em 7 horas. Solo ficou solto e uniforme.',
    '[{"product": "Gasóleo agrícola", "quantity": 35, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '15 days' + INTERVAL '15 hours',
    '2026-04-30', '2026-04-30', TRUE,
    NOW() - INTERVAL '16 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1022, 1033,
    ST_SetSRID(ST_MakePoint(-25.5200, 37.8150), 4326),
    NOW() - INTERVAL '12 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '12 days' + INTERVAL '13 hours',
    'Pulverização em pomar de citrinos concluída. Cobertura uniforme.',
    '[{"product": "Gasóleo agrícola", "quantity": 18, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '12 days' + INTERVAL '13 hours',
    '2026-05-02', '2026-05-02', TRUE,
    NOW() - INTERVAL '13 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1023, 1034,
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6720), 4326),
    NOW() - INTERVAL '9 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '8 days' + INTERVAL '17 hours',
    'Gradagem em 2 passagens cruzadas. Terreno pronto para semeadura.',
    '[{"product": "Gasóleo agrícola", "quantity": 90, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '8 days' + INTERVAL '17 hours',
    '2026-05-04', '2026-05-05', TRUE,
    NOW() - INTERVAL '10 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1024, 1035,
    ST_SetSRID(ST_MakePoint(-25.6750, 37.7320), 4326),
    NOW() - INTERVAL '8 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '8 days' + INTERVAL '14 hours',
    'Aplicação herbicida pré-emergente em milho. Sem vento, boa cobertura.',
    '[{"product": "Gasóleo agrícola", "quantity": 22, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '8 days' + INTERVAL '14 hours',
    '2026-05-05', '2026-05-05', TRUE,
    NOW() - INTERVAL '9 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1025, 1036,
    ST_SetSRID(ST_MakePoint(-28.7180, 38.5340), 4326),
    NOW() - INTERVAL '7 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '16 hours',
    'Tratamento de vinha concluído. Cobertura cuidada em ambas as faces das folhas.',
    '[{"product": "Gasóleo agrícola", "quantity": 28, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '7 days' + INTERVAL '16 hours',
    '2026-05-06', '2026-05-06', TRUE,
    NOW() - INTERVAL '8 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1026, 1037,
    ST_SetSRID(ST_MakePoint(-27.2310, 38.6695), 4326),
    NOW() - INTERVAL '6 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '6 days' + INTERVAL '17 hours',
    'Reparação de vedação concluída. 25 postes substituídos, rede toda esticada e fixada.',
    '[{"product": "Gasóleo", "quantity": 10, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '6 days' + INTERVAL '17 hours',
    '2026-05-07', '2026-05-08', TRUE,
    NOW() - INTERVAL '7 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1027, 1038,
    ST_SetSRID(ST_MakePoint(-27.0530, 38.7390), 4326),
    NOW() - INTERVAL '5 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '14 hours',
    'Transporte concluído. 30 fardos entregues no armazém sem incidentes.',
    '[{"product": "Gasóleo", "quantity": 12, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '5 days' + INTERVAL '14 hours',
    '2026-05-08', '2026-05-08', TRUE,
    NOW() - INTERVAL '6 days');

-- RATED (req 1059-1063) — executions 1028-1032
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1028, 1039,
    ST_SetSRID(ST_MakePoint(-27.2120, 38.6650), 4326),
    NOW() - INTERVAL '88 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '85 days' + INTERVAL '18 hours',
    'Lavoura profunda concluída em 4 dias. Trabalho cuidado nas zonas inclinadas.',
    '[{"product": "Gasóleo agrícola", "quantity": 200, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '85 days' + INTERVAL '18 hours',
    '2026-02-14', '2026-02-17', TRUE,
    NOW() - INTERVAL '90 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1029, 1040,
    ST_SetSRID(ST_MakePoint(-27.0820, 38.7180), 4326),
    NOW() - INTERVAL '64 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '64 days' + INTERVAL '19 hours',
    'Colheita de 5ha concluída num dia. 7 reboques carregados de silagem.',
    '[{"product": "Gasóleo agrícola", "quantity": 150, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '64 days' + INTERVAL '19 hours',
    '2026-03-10', '2026-03-10', TRUE,
    NOW() - INTERVAL '68 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1030, 1041,
    ST_SetSRID(ST_MakePoint(-25.5180, 37.8170), 4326),
    NOW() - INTERVAL '53 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '53 days' + INTERVAL '13 hours',
    'Aplicação foliar concluída. Cobertura uniforme em todo o pomar.',
    '[{"product": "Gasóleo agrícola", "quantity": 24, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '53 days' + INTERVAL '13 hours',
    '2026-03-19', '2026-03-19', TRUE,
    NOW() - INTERVAL '56 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1031, 1042,
    ST_SetSRID(ST_MakePoint(-27.2080, 38.6700), 4326),
    NOW() - INTERVAL '37 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '37 days' + INTERVAL '15 hours',
    'Fresagem fina em 2 passagens cruzadas. Solo pronto para sementeira de pastagem.',
    '[{"product": "Gasóleo agrícola", "quantity": 55, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '37 days' + INTERVAL '15 hours',
    '2026-04-05', '2026-04-05', TRUE,
    NOW() - INTERVAL '40 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1032, 1043,
    ST_SetSRID(ST_MakePoint(-27.2280, 38.6730), 4326),
    NOW() - INTERVAL '26 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '25 days' + INTERVAL '18 hours',
    'Gradagem em 2 dias devido a chuva no primeiro. Trabalho final bom.',
    '[{"product": "Gasóleo agrícola", "quantity": 175, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '25 days' + INTERVAL '18 hours',
    '2026-04-16', '2026-04-17', TRUE,
    NOW() - INTERVAL '28 days');

-- AWAITING_CONFIRMATION (req 1064-1065) — executions 1033-1034
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1033, 1044,
    ST_SetSRID(ST_MakePoint(-25.6730, 37.7390), 4326),
    NOW() - INTERVAL '3 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '15 hours',
    'Adubação concluída em 4ha. Aplicação uniforme com pulverizador 2000L.',
    '[{"product": "Gasóleo agrícola", "quantity": 30, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '3 days' + INTERVAL '15 hours',
    '2026-05-11', '2026-05-11', TRUE,
    NOW() - INTERVAL '4 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(1034, 1045,
    ST_SetSRID(ST_MakePoint(-27.2160, 38.6690), 4326),
    NOW() - INTERVAL '2 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '13 hours',
    'Limpeza concluída em meio dia. Silvas trituradas e espalhadas no terreno.',
    '[{"product": "Gasóleo agrícola", "quantity": 18, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '2 days' + INTERVAL '13 hours',
    '2026-05-12', '2026-05-12', TRUE,
    NOW() - INTERVAL '3 days');

-- IN_PROGRESS (req 1066-1068) — executions 1035-1037 — concrete times TODAY
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(1035, 1046,
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6750), 4326),
    NOW() - INTERVAL '4 hours',
    NULL,
    '2026-05-13', '2026-05-13', '08:00:00', '16:00:00', FALSE,
    NOW() - INTERVAL '2 days');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(1036, 1047,
    ST_SetSRID(ST_MakePoint(-27.0610, 38.7330), 4326),
    NOW() - INTERVAL '2 hours',
    NULL,
    '2026-05-13', '2026-05-13', '09:00:00', '13:00:00', FALSE,
    NOW() - INTERVAL '1 day');

INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(1037, 1048,
    ST_SetSRID(ST_MakePoint(-27.0680, 38.7260), 4326),
    NOW() - INTERVAL '1 hour',
    NULL,
    '2026-05-13', '2026-05-14', '13:00:00', '17:30:00', FALSE,
    NOW() - INTERVAL '2 days');

-- AWARDED (req 1069-1083) — executions 1038-1052
INSERT INTO service_executions (id, proposal_id, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(1038, 1049, NULL, '2026-05-14', '2026-05-14', '07:30:00', '12:00:00', FALSE, NOW() - INTERVAL '4 days'),
(1039, 1050, NULL, '2026-05-14', '2026-05-14', '13:30:00', '18:00:00', FALSE, NOW() - INTERVAL '3 days'),
(1040, 1051, NULL, '2026-05-14', '2026-05-15', '09:00:00', '17:30:00', FALSE, NOW() - INTERVAL '3 days'),
(1041, 1052, NULL, '2026-05-15', '2026-05-15', '07:30:00', '11:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1042, 1053, NULL, '2026-05-15', '2026-05-15', '13:00:00', '18:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1043, 1054, NULL, '2026-05-16', '2026-05-16', '09:00:00', '14:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1044, 1055, NULL, '2026-05-18', '2026-05-18', '08:00:00', '12:00:00', FALSE, NOW() - INTERVAL '1 day'),
(1045, 1056, NULL, '2026-05-18', '2026-05-18', '10:00:00', '15:30:00', FALSE, NOW() - INTERVAL '1 day'),
(1046, 1057, NULL, '2026-05-18', '2026-05-18', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '1 day'),
(1047, 1058, NULL, '2026-05-19', '2026-05-19', '08:00:00', '14:00:00', FALSE, NOW() - INTERVAL '1 day'),
(1048, 1059, NULL, '2026-05-19', '2026-05-19', '09:30:00', '14:30:00', FALSE, NOW() - INTERVAL '1 day'),
(1049, 1060, NULL, '2026-05-20', '2026-05-20', '07:00:00', '13:00:00', FALSE, NOW() - INTERVAL '1 day'),
(1050, 1061, NULL, '2026-05-20', '2026-05-20', '13:30:00', '18:00:00', FALSE, NOW() - INTERVAL '1 day'),
(1051, 1062, NULL, '2026-05-21', '2026-05-21', '08:00:00', '18:00:00', FALSE, NOW() - INTERVAL '1 day'),
(1052, 1063, NULL, '2026-05-22', '2026-05-22', '09:00:00', '12:30:00', FALSE, NOW() - INTERVAL '1 day');


-- ═══════════════════════════════════════════════════════════════
-- PART 11 — Execution Assignments
-- ═══════════════════════════════════════════════════════════════
-- Team members (provider 1): 1=António, 2=Carlos (baseline),
--   1009=Rita, 1010=Nuno, 1011=Filipe, 1012=Sandra, 1013=Joaquim, 1014=Manuela.
-- Machines (provider 1): 1=New Holland, 2=Grade 28", 3=Destroçador (baseline),
--   1013=MF 4707, 1014=JD 6120M, 1015=Claas, 1016=Pulv 2000L,
--   1017=Atomizador, 1018=Charrua, 1019=Iveco Daily.

-- COMPLETED (executions 1020-1027)
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, hours_worked, machine_hours, hourly_rate_snapshot, assigned_at) VALUES
(1020,    2,    1, 11.0, 11.0, 10.50, NOW() - INTERVAL '18 days'),
(1020, 1011, 1018,  8.0,  8.0, 10.00, NOW() - INTERVAL '18 days'),
(1021, 1009, 1013,  7.0,  7.0, 13.50, NOW() - INTERVAL '16 days'),
(1022, 1012, 1017,  6.0,  6.0, 11.00, NOW() - INTERVAL '13 days'),
(1023,    2,    1, 18.0, 10.0, 10.50, NOW() - INTERVAL '10 days'),
(1023, 1010,    2, 18.0,  8.0, 10.50, NOW() - INTERVAL '10 days'),
(1024, 1011, 1016,  6.0,  6.0, 10.00, NOW() - INTERVAL '9 days'),
(1025, 1012, 1017,  8.0,  8.0, 11.00, NOW() - INTERVAL '8 days'),
(1026, 1013, 1019, 10.0,  6.0,  9.50, NOW() - INTERVAL '7 days'),
(1026, 1014, NULL, 10.0,  0.0, 13.00, NOW() - INTERVAL '7 days'),
(1027, 1013, 1019,  5.0,  5.0,  9.50, NOW() - INTERVAL '6 days');

-- RATED (executions 1028-1032)
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, hours_worked, machine_hours, hourly_rate_snapshot, assigned_at) VALUES
(1028,    2,    1, 36.0, 28.0, 10.50, NOW() - INTERVAL '90 days'),
(1028, 1011, 1018, 28.0, 24.0, 10.00, NOW() - INTERVAL '90 days'),
(1029,    1, 1015, 11.0, 11.0, 14.00, NOW() - INTERVAL '68 days'),
(1029, 1010, NULL, 11.0,  0.0, 10.50, NOW() - INTERVAL '68 days'),
(1030, 1012, 1017,  6.0,  6.0, 11.00, NOW() - INTERVAL '56 days'),
(1031, 1009, 1013,  8.0,  8.0, 13.50, NOW() - INTERVAL '40 days'),
(1032,    2,    1, 18.0, 11.0, 10.50, NOW() - INTERVAL '28 days'),
(1032, 1011,    2, 16.0,  9.0, 10.00, NOW() - INTERVAL '28 days');

-- AWAITING_CONFIRMATION (executions 1033-1034)
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, hours_worked, machine_hours, hourly_rate_snapshot, assigned_at) VALUES
(1033, 1012, 1016, 7.0, 7.0, 11.00, NOW() - INTERVAL '4 days'),
(1034, 1011,    3, 5.0, 5.0, 10.00, NOW() - INTERVAL '3 days');

-- IN_PROGRESS (executions 1035-1037)
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, assigned_at) VALUES
(1035,    2,    1, NOW() - INTERVAL '2 days'),
(1035, 1010, 1018, NOW() - INTERVAL '2 days'),
(1036, 1013, 1019, NOW() - INTERVAL '1 day'),
(1037, 1011,    3, NOW() - INTERVAL '2 days');

-- AWARDED (executions 1038-1052) — intentional conflicts:
--   Exec 1038 + Exec 1040 share TM 1 (António) on 2026-05-14
--   Exec 1044 + Exec 1045 share Machine 1 on 2026-05-18
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, assigned_at) VALUES
(1038,    1, 1016, NOW() - INTERVAL '4 days'),
(1038, 1011, NULL, NOW() - INTERVAL '4 days'),
(1039, 1009, 1014, NOW() - INTERVAL '3 days'),
(1039, 1012,    2, NOW() - INTERVAL '3 days'),
(1040,    1, 1018, NOW() - INTERVAL '3 days'),
(1040, 1010,    1, NOW() - INTERVAL '3 days'),
(1041, 1012, 1017, NOW() - INTERVAL '2 days'),
(1042, 1009, 1013, NOW() - INTERVAL '2 days'),
(1043, 1014, 1019, NOW() - INTERVAL '2 days'),
(1044,    2,    1, NOW() - INTERVAL '1 day'),
(1044, 1011, 1018, NOW() - INTERVAL '1 day'),
(1045, 1010,    1, NOW() - INTERVAL '1 day'),
(1046, 1013,    3, NOW() - INTERVAL '1 day'),
(1047, 1009, NULL, NOW() - INTERVAL '1 day'),
(1048, 1012, 1017, NOW() - INTERVAL '1 day'),
(1049,    2, 1015, NOW() - INTERVAL '1 day'),
(1049, 1011, NULL, NOW() - INTERVAL '1 day'),
(1050, 1014, 1016, NOW() - INTERVAL '1 day'),
(1051,    1, 1015, NOW() - INTERVAL '1 day'),
(1051, 1010, NULL, NOW() - INTERVAL '1 day'),
(1052, 1013, 1019, NOW() - INTERVAL '1 day');


-- ═══════════════════════════════════════════════════════════════
-- PART 12 — Machine Maintenance Logs (Provider 1 fleet)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO machine_maintenance_logs (machine_id, maintenance_type, description, cost, workshop_name, performed_at, next_due_at, notes, created_by) VALUES
(1,    'ROUTINE',    'Revisão das 250 horas — óleo motor, filtros e líquidos',  280.00, 'Oficina Agrícola Ramos',  '2026-01-15', '2026-07-15', 'Substituídos 4 filtros e óleo motor 15W-40.', 6),
(1,    'REPAIR',     'Substituição de injector com fuga',                       420.00, 'Oficina Agrícola Ramos',  '2026-03-20', NULL,         'Tractor parado 1 dia. Sintomas: arranque difícil e fumo escuro.', 6),
(2,    'INSPECTION', 'Inspeção da grade de discos e afiamento',                 120.00, 'Mecânica Lima',           '2026-02-01', '2026-08-01', 'Todos os discos afiados, 2 rolamentos lubrificados.', 6),
(3,    'ROUTINE',    'Manutenção do destroçador florestal',                     180.00, 'Mecânica Lima',           '2026-01-20', '2026-07-20', 'Substituição de martelos e correia.', 6),
(1013, 'ROUTINE',    'Revisão completa Massey Ferguson 4707',                   320.00, 'Oficina Agrícola Ramos',  '2026-03-10', '2026-09-10', 'Óleos e filtros. Tractor em ótimo estado.', 6),
(1014, 'ROUTINE',    'Revisão das 500 horas John Deere 6120M',                  480.00, 'AgriParts Açores',         '2026-04-05', '2026-10-05', 'Revisão major. Substituídas correias e filtros.', 6),
(1015, 'INSPECTION', 'Inspeção pré-campanha da ceifeira Claas',                 250.00, 'AgriParts Açores',         '2026-02-15', '2026-08-15', 'Lâminas afiadas, sem-fins limpos.', 6),
(1016, 'ROUTINE',    'Manutenção do pulverizador atrelado 2000L',               150.00, 'Mecânica Lima',           '2026-03-20', '2026-09-20', 'Limpeza de bicos e teste de pressão.', 6),
(1017, 'REPAIR',     'Reparação do agitador do atomizador 800L',                280.00, 'Mecânica Lima',           '2026-04-12', NULL,         'Veio do agitador partido. Substituído.', 6),
(1018, 'INSPECTION', 'Verificação da charrua reversível',                       90.00,  'Oficina interna',         '2026-03-05', '2026-09-05', 'Aivecas em bom estado, ferros sem desgaste excessivo.', 6),
(1019, 'ROUTINE',    'Inspeção anual da carrinha Iveco Daily',                  220.00, 'Iveco Açores',             '2026-02-28', '2026-08-28', 'IPO realizada. Tudo conforme.', 6);


-- ═══════════════════════════════════════════════════════════════
-- PART 13 — Machine Expenses (Provider 1 fleet)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO machine_expenses (machine_id, category, description, amount, incurred_at, notes, created_by) VALUES
(1,    'FUEL',      'Reabastecimento gasóleo (200L)',           230.00, '2026-04-02', '@ 1.15€/L', 6),
(1,    'FUEL',      'Reabastecimento gasóleo (200L)',           230.00, '2026-04-25', '@ 1.15€/L', 6),
(1,    'INSURANCE', 'Seguro anual',                             480.00, '2026-01-10', 'Renovação Tranquilidade', 6),
(1,    'TAX',       'IUC anual',                                 95.00, '2026-01-15', NULL, 6),
(1013, 'FUEL',      'Reabastecimento gasóleo (150L)',           172.50, '2026-04-15', NULL, 6),
(1013, 'INSURANCE', 'Seguro anual',                             380.00, '2026-02-01', NULL, 6),
(1014, 'FUEL',      'Reabastecimento gasóleo (220L)',           253.00, '2026-04-28', '@ 1.15€/L', 6),
(1014, 'INSURANCE', 'Seguro anual',                             520.00, '2026-03-01', 'Renovação Allianz', 6),
(1014, 'TAX',       'IUC anual',                                110.00, '2026-03-10', NULL, 6),
(1015, 'FUEL',      'Reabastecimento gasóleo (300L)',           345.00, '2026-03-10', 'Para colheita de Março', 6),
(1015, 'PARTS',     'Lâminas novas para sem-fim',                95.00, '2026-02-15', NULL, 6),
(1016, 'PARTS',     'Bicos de pulverização (12 unidades)',       72.00, '2026-03-20', NULL, 6),
(1017, 'PARTS',     'Veio do agitador',                         180.00, '2026-04-12', 'Substituído na reparação', 6),
(1019, 'FUEL',      'Reabastecimento gasolina (60L)',            96.00, '2026-04-30', NULL, 6),
(1019, 'INSURANCE', 'Seguro anual',                             280.00, '2026-02-28', NULL, 6),
(1019, 'TAX',       'IUC anual',                                 75.00, '2026-02-28', NULL, 6);


-- ═══════════════════════════════════════════════════════════════
-- PART 14 — Reviews (IDs 1022-1039)
-- ═══════════════════════════════════════════════════════════════

-- RATED — full review pairs
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(1022, 1059,    2,    6, 5, 'Excelente trabalho de lavoura! O António e a equipa trabalharam mesmo nas zonas mais difíceis sem problemas. Recomendo vivamente.', NOW() - INTERVAL '84 days'),
(1023, 1059,    6,    2, 5, 'Cliente experiente, terreno bem preparado. Tudo conforme combinado. Já temos novos trabalhos marcados.',                           NOW() - INTERVAL '83 days'),
(1024, 1060,    3,    6, 4, 'Colheita correu bem no geral. Apenas o atraso de 1 hora à chegada baixou um pouco a nota — fora isso, trabalho excelente.',     NOW() - INTERVAL '62 days'),
(1025, 1060,    6,    3, 5, 'Maria foi muito flexível com o horário. Silo preparado, tudo eficiente. Excelente parceria.',                                    NOW() - INTERVAL '61 days'),
(1026, 1061,    5,    6, 5, 'O Sandra fez uma aplicação foliar perfeita. Pomar a recuperar muito bem após o tratamento. Cinco estrelas!',                     NOW() - INTERVAL '51 days'),
(1027, 1061,    6,    5, 5, 'Cliente atenciosa e produto preparado antecipadamente. Trabalho fluido do princípio ao fim.',                                    NOW() - INTERVAL '50 days'),
(1028, 1062,    2,    6, 5, 'Fresagem impecável. Solo ficou perfeito para a sementeira. A equipa do AgroServiços é mesmo de confiança.',                      NOW() - INTERVAL '35 days'),
(1029, 1062,    6,    2, 5, 'Sempre um prazer trabalhar com o João. Terreno preparado e cliente prestável.',                                                  NOW() - INTERVAL '34 days'),
(1030, 1063, 1020,    6, 5, 'Gradagem em parcela grande, terreno inclinado, e nem um problema. Trabalho rápido e profissional.',                              NOW() - INTERVAL '22 days'),
(1031, 1063,    6, 1020, 5, 'Cliente novo mas muito organizado. Excelente experiência para começarmos a colaboração.',                                        NOW() - INTERVAL '21 days');

-- COMPLETED — client-only reviews
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(1032, 1051,    2,    6, 5, 'Lavoura de 4ha feita em 2 dias. Solo perfeito para a resseada. Como sempre, trabalho de excelência.',   NOW() - INTERVAL '15 days'),
(1033, 1052,    3,    6, 5, 'Fresagem rápida e bem feita. Recomendo!',                                                                NOW() - INTERVAL '14 days'),
(1034, 1053,    5,    6, 5, 'Tratamento muito profissional, pomar respondeu bem.',                                                    NOW() - INTERVAL '11 days'),
(1035, 1054,    2,    6, 5, 'Sequência da lavoura — gradagem impecável. Tudo na hora certa.',                                         NOW() - INTERVAL '7 days'),
(1036, 1055,    4,    6, 5, 'Pulverização excelente, sem deriva, milho a sair bem.',                                                  NOW() - INTERVAL '6 days'),
(1037, 1056,   11,    6, 5, 'Apesar da deslocação inter-ilhas, tudo correu bem. Vinha tratada como deve ser.',                        NOW() - INTERVAL '5 days'),
(1038, 1057, 1020,    6, 5, 'Vedação reparada e melhorada onde era preciso. Cinco estrelas!',                                         NOW() - INTERVAL '4 days'),
(1039, 1058, 1021,    6, 4, 'Transporte rápido. Apenas um fardo ligeiramente deslocado mas nada de problemas.',                       NOW() - INTERVAL '3 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 15 — Notifications
-- ═══════════════════════════════════════════════════════════════

INSERT INTO notifications (user_id, type, title, body, data, read, created_at) VALUES
-- Provider 1 manager (user 6) — recent activity
(6,    'PROPOSAL_ACCEPTED', 'Proposta aceite!',     'A sua proposta para a subsolagem do João Silva foi aceite.',         '{"requestId": 1066, "proposalId": 1046}'::jsonb,  TRUE,  NOW() - INTERVAL '3 days'),
(6,    'PROPOSAL_ACCEPTED', 'Proposta aceite!',     'A sua proposta para o transporte da Laura Dutra foi aceite.',         '{"requestId": 1067, "proposalId": 1047}'::jsonb,  TRUE,  NOW() - INTERVAL '2 days'),
(6,    'PROPOSAL_ACCEPTED', 'Proposta aceite!',     'A sua proposta para a colheita de erva (Joao Silva) foi aceite.',     '{"requestId": 1080, "proposalId": 1060}'::jsonb,  FALSE, NOW() - INTERVAL '1 day'),
(6,    'PROPOSAL_ACCEPTED', 'Proposta aceite!',     'A sua proposta para a adubação de pastagem (Joao Silva) foi aceite.', '{"requestId": 1081, "proposalId": 1061}'::jsonb,  FALSE, NOW() - INTERVAL '1 day'),
(6,    'REQUEST_CONFIRMED', 'Trabalho confirmado',  'O cliente confirmou a lavoura de 4 hectares.',                        '{"requestId": 1051}'::jsonb,                      TRUE,  NOW() - INTERVAL '15 days'),
(6,    'REQUEST_CONFIRMED', 'Trabalho confirmado',  'O cliente confirmou a fresagem da Praia da Vitória.',                 '{"requestId": 1052}'::jsonb,                      TRUE,  NOW() - INTERVAL '14 days'),
(6,    'REVIEW_RECEIVED',   'Nova avaliação',       'Recebeu uma avaliação de 5 estrelas pela lavoura inicial.',           '{"requestId": 1059, "reviewId": 1022}'::jsonb,    TRUE,  NOW() - INTERVAL '84 days'),
(6,    'REVIEW_RECEIVED',   'Nova avaliação',       'Recebeu uma avaliação de 5 estrelas pela fresagem.',                  '{"requestId": 1062, "reviewId": 1028}'::jsonb,    TRUE,  NOW() - INTERVAL '35 days'),
(6,    'REVIEW_RECEIVED',   'Nova avaliação',       'Recebeu uma avaliação de 5 estrelas pela gradagem.',                  '{"requestId": 1063, "reviewId": 1030}'::jsonb,    TRUE,  NOW() - INTERVAL '22 days'),
(6,    'REVIEW_RECEIVED',   'Nova avaliação',       'Recebeu uma avaliação de 4 estrelas pelo transporte.',                '{"requestId": 1058, "reviewId": 1039}'::jsonb,    FALSE, NOW() - INTERVAL '3 days'),

-- João Silva (user 2) — open thread of activity
(2,    'EXECUTION_STARTED',    'Trabalho iniciado',        'AgroServiços iniciou a subsolagem da sua pastagem.',               '{"requestId": 1066}'::jsonb,                  TRUE,  NOW() - INTERVAL '4 hours'),
(2,    'EXECUTION_COMPLETED',  'Serviço concluído',        'A limpeza de silvas foi concluída. Por favor confirme.',           '{"requestId": 1065}'::jsonb,                  FALSE, NOW() - INTERVAL '2 days'),
(2,    'PROPOSAL_RECEIVED',    'Nova proposta recebida',   'Recebeu uma proposta para a colheita de batata branca.',           '{"requestId": 1087, "proposalId": 1064}'::jsonb, FALSE, NOW() - INTERVAL '1 day'),
(2,    'PROPOSAL_RECEIVED',    'Nova proposta recebida',   'Recebeu uma segunda proposta para a colheita de batata branca.',   '{"requestId": 1087, "proposalId": 1065}'::jsonb, FALSE, NOW() - INTERVAL '12 hours'),

-- Other clients with recent activity
(4,    'EXECUTION_COMPLETED', 'Serviço concluído',        'A adubação do milho foi concluída. Por favor confirme.',           '{"requestId": 1064}'::jsonb,                  FALSE, NOW() - INTERVAL '3 days'),
(1020, 'PROPOSAL_RECEIVED',   'Nova proposta recebida',   'Recebeu uma proposta para a subsolagem em pastagem.',              '{"requestId": 1088, "proposalId": 1066}'::jsonb, FALSE, NOW() - INTERVAL '12 hours'),
(1020, 'PROPOSAL_RECEIVED',   'Nova proposta recebida',   'Recebeu uma segunda proposta para a subsolagem.',                  '{"requestId": 1088, "proposalId": 1067}'::jsonb, FALSE, NOW() - INTERVAL '6 hours'),
(1021, 'EXECUTION_STARTED',   'Trabalho iniciado',        'AgroServiços iniciou o transporte do adubo.',                      '{"requestId": 1067}'::jsonb,                  TRUE,  NOW() - INTERVAL '2 hours'),
(3,    'EXECUTION_STARTED',   'Trabalho iniciado',        'AgroServiços iniciou a limpeza de levada.',                        '{"requestId": 1068}'::jsonb,                  FALSE, NOW() - INTERVAL '1 hour');


-- ═══════════════════════════════════════════════════════════════
-- PART 16 — Sequence Resets (dynamic — safe in any state)
-- ═══════════════════════════════════════════════════════════════
-- Use MAX(id) per table so any real user signups in baseline ranges
-- are respected. Sequence advances past whatever the highest existing
-- ID is (baseline or V1002).

SELECT setval('users_id_seq',              GREATEST((SELECT MAX(id) FROM users),              (SELECT last_value FROM users_id_seq)));
SELECT setval('team_members_id_seq',       GREATEST((SELECT MAX(id) FROM team_members),       (SELECT last_value FROM team_members_id_seq)));
SELECT setval('machines_id_seq',           GREATEST((SELECT MAX(id) FROM machines),           (SELECT last_value FROM machines_id_seq)));
SELECT setval('inventory_id_seq',          GREATEST((SELECT MAX(id) FROM inventory),          (SELECT last_value FROM inventory_id_seq)));
SELECT setval('service_requests_id_seq',   GREATEST((SELECT MAX(id) FROM service_requests),   (SELECT last_value FROM service_requests_id_seq)));
SELECT setval('proposals_id_seq',          GREATEST((SELECT MAX(id) FROM proposals),          (SELECT last_value FROM proposals_id_seq)));
SELECT setval('transactions_id_seq',       GREATEST((SELECT MAX(id) FROM transactions),       (SELECT last_value FROM transactions_id_seq)));
SELECT setval('service_executions_id_seq', GREATEST((SELECT MAX(id) FROM service_executions), (SELECT last_value FROM service_executions_id_seq)));
SELECT setval('reviews_id_seq',            GREATEST((SELECT MAX(id) FROM reviews),            (SELECT last_value FROM reviews_id_seq)));
