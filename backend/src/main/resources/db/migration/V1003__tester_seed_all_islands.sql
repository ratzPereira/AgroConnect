-- ═══════════════════════════════════════════════════════════════
-- V1003 — Tester Seed (All Azores Islands + Local Check-in Sandbox)
-- ═══════════════════════════════════════════════════════════════
-- Purpose
--   The site will be handed to ~10-15 testers from across the Azores.
--   Each tester should find providers AND open jobs in their own
--   island, regardless of where they are from. V1000 already covered
--   Faial and Flores; this migration fills the remaining gap:
--
--       Pico, São Jorge, Graciosa, Santa Maria, Corvo
--
--   On top of that, the developer's own coordinates
--   (lat 38.664032, lng -27.261843 — Angra do Heroísmo, Terceira)
--   get 30 extra jobs in early lifecycle states so the full
--   provider-side flow can be exercised many times in a row:
--       check-in → record purchases / consumption → see inventory
--       drop → see job costing recompute → check-out → confirm.
--
--   All 30 of those jobs are AWARDED + HELD transaction + execution
--   row already scheduled — no check-in yet, no materials_used yet.
--
-- ID strategy
--   New rows live in the 1100+ range to stay disjoint from V1002
--   (which used 1016-1088 for users/requests/proposals/etc.) and from
--   organic prod sign-ups (which start at the next available sequence
--   value after V1002's setval).
--
-- Date anchor
--   Today = 2026-05-15 (per memory).
--   Scheduled work spans 2026-05-15 → 2026-05-29 so testers always
--   have something "today" or "this week".
--
-- Layout
--   PART 0  — Defensive guards
--   PART 1  — Users (1100-1119)
--   PART 2  — Client profiles (testers in every island)
--   PART 3  — Provider profiles 6-10 (Pico, São Jorge, Graciosa,
--             Santa Maria, Corvo)
--   PART 4  — Provider services
--   PART 5  — Team members (1100-1109) + hourly_rate
--   PART 6  — Machines (1100-1114)
--   PART 7  — Inventory (1100-1114) + INITIAL movements
--   PART 8  — Browse-bait service requests across the new islands
--             (1100-1119) — PUBLISHED / WITH_PROPOSALS / AWARDED
--   PART 9  — Proposals for those (1100-1119)
--   PART 10 — Transactions for the AWARDED rows
--   PART 11 — Service executions for the AWARDED rows
--   PART 12 — Execution assignments for the AWARDED rows
--   PART 13 — Local sandbox: 30 AWARDED jobs at exact coords
--             (req 1200-1229, proposals 1200-1229, tx 1200-1229,
--             execs 1200-1229)
--   PART 14 — Sequence resets (dynamic MAX(id))
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- PART 0 — Defensive guards
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id BETWEEN 1100 AND 1119) THEN
    RAISE EXCEPTION 'V1003 aborted: users.id 1100-1119 already in use.';
  END IF;
  IF EXISTS (SELECT 1 FROM provider_profiles WHERE id BETWEEN 6 AND 10) THEN
    RAISE EXCEPTION 'V1003 aborted: provider_profiles.id 6-10 already in use.';
  END IF;
  IF EXISTS (SELECT 1 FROM service_requests WHERE id BETWEEN 1100 AND 1229) THEN
    RAISE EXCEPTION 'V1003 aborted: service_requests.id 1100-1229 already in use.';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- PART 1 — Users (IDs 1100-1119)
-- ═══════════════════════════════════════════════════════════════
-- 1100-1104  PROVIDER_MANAGER (one per new-island provider)
-- 1105-1109  PROVIDER_OPERATOR (one operator on each new provider)
-- 1110-1119  CLIENT (testers spread across islands)

INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(1100, 'pico.agro@email.com',         '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER',  TRUE, TRUE),
(1101, 'saojorge.rural@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER',  TRUE, TRUE),
(1102, 'graciosa.servicos@email.com', '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER',  TRUE, TRUE),
(1103, 'santamaria.campo@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER',  TRUE, TRUE),
(1104, 'corvo.agro@email.com',        '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER',  TRUE, TRUE),

(1105, 'sergio.pico@email.com',       '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1106, 'duarte.saojorge@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1107, 'tania.graciosa@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1108, 'hugo.santamaria@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(1109, 'isabel.corvo@email.com',      '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),

(1110, 'mario.pico@email.com',        '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1111, 'celia.saojorge@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1112, 'jorge.graciosa@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1113, 'rute.santamaria@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1114, 'nelson.corvo@email.com',      '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1115, 'rui.flores@email.com',        '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1116, 'beatriz.faial@email.com',     '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1117, 'andre.terceira@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1118, 'sofia.saomiguel@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE),
(1119, 'tiago.pico@email.com',        '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT',            TRUE, TRUE);


-- ═══════════════════════════════════════════════════════════════
-- PART 2 — Client Profiles
-- ═══════════════════════════════════════════════════════════════

INSERT INTO client_profiles (user_id, name, phone, location, parish, municipality, island, farm_type, total_area_ha) VALUES
(1110, 'Mário Sequeira',  '+351 932 110 220', ST_SetSRID(ST_MakePoint(-28.4280, 38.5290), 4326), 'Madalena',         'Madalena',                  'Pico',         'Viticultura',     6.0),
(1111, 'Célia Bettencourt','+351 932 220 330', ST_SetSRID(ST_MakePoint(-28.0950, 38.6580), 4326), 'Velas',            'Velas',                     'São Jorge',    'Pastagem leiteira',22.0),
(1112, 'Jorge Lemos',     '+351 932 330 440', ST_SetSRID(ST_MakePoint(-28.0000, 39.0900), 4326), 'Santa Cruz',       'Santa Cruz da Graciosa',    'Graciosa',     'Mista',           10.0),
(1113, 'Rute Tavares',    '+351 932 440 550', ST_SetSRID(ST_MakePoint(-25.1500, 36.9800), 4326), 'Vila do Porto',    'Vila do Porto',             'Santa Maria',  'Horticultura',     5.0),
(1114, 'Nelson Silveira', '+351 932 550 660', ST_SetSRID(ST_MakePoint(-31.1100, 39.6700), 4326), 'Vila Nova do Corvo','Corvo',                    'Corvo',        'Pastagem',         8.0),
(1115, 'Rui Fagundes',    '+351 932 660 770', ST_SetSRID(ST_MakePoint(-31.1900, 39.4500), 4326), 'Santa Cruz',       'Santa Cruz das Flores',     'Flores',       'Mista',            7.0),
(1116, 'Beatriz Goulart', '+351 932 770 880', ST_SetSRID(ST_MakePoint(-28.6300, 38.5400), 4326), 'Castelo Branco',   'Horta',                     'Faial',        'Pastagem',        15.0),
(1117, 'André Borges',    '+351 932 880 990', ST_SetSRID(ST_MakePoint(-27.2200, 38.6500), 4326), 'São Bento',        'Angra do Heroísmo',         'Terceira',     'Policultura',      9.0),
(1118, 'Sofia Resendes',  '+351 932 990 100', ST_SetSRID(ST_MakePoint(-25.4500, 37.8400), 4326), 'Rabo de Peixe',    'Ribeira Grande',            'São Miguel',   'Pastagem',        18.0),
(1119, 'Tiago Ávila',     '+351 932 100 211', ST_SetSRID(ST_MakePoint(-28.4500, 38.4750), 4326), 'São Roque',        'São Roque do Pico',         'Pico',         'Viticultura',      4.5);


-- ═══════════════════════════════════════════════════════════════
-- PART 3 — Provider Profiles (IDs 6-10)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO provider_profiles (id, user_id, company_name, nif, phone, location, parish, municipality, island, service_radius_km, avg_rating, total_reviews, verified) VALUES
(6,  1100, 'Pico Agro — Serviços Vitivinícolas', '509678901', '+351 292 622 100', ST_SetSRID(ST_MakePoint(-28.4250, 38.5300), 4326), 'Madalena',          'Madalena',                  'Pico',         25, 4.7, 12, TRUE),
(7,  1101, 'São Jorge Rural Lda',                '509789012', '+351 295 412 200', ST_SetSRID(ST_MakePoint(-28.0900, 38.6600), 4326), 'Velas',             'Velas',                     'São Jorge',    30, 4.5,  9, TRUE),
(8,  1102, 'Graciosa Serviços Agrícolas',        '509890123', '+351 295 712 300', ST_SetSRID(ST_MakePoint(-28.0050, 39.0850), 4326), 'Santa Cruz',        'Santa Cruz da Graciosa',    'Graciosa',     20, 4.4,  7, TRUE),
(9,  1103, 'Santa Maria Campo Verde',            '509901234', '+351 296 882 400', ST_SetSRID(ST_MakePoint(-25.1450, 36.9810), 4326), 'Vila do Porto',     'Vila do Porto',             'Santa Maria',  20, 4.6,  6, TRUE),
(10, 1104, 'Corvo Agro Cooperativa',             '509012345', '+351 292 596 500', ST_SetSRID(ST_MakePoint(-31.1080, 39.6720), 4326), 'Vila Nova do Corvo','Corvo',                     'Corvo',        15, 4.8,  4, TRUE);


-- ═══════════════════════════════════════════════════════════════
-- PART 4 — Provider Services (which categories each new provider offers)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO provider_services (provider_id, category_id) VALUES
(6,  1), (6,  2), (6,  3), (6,  5), (6,  9),                    -- Pico — solo, tratamentos, colheita, limpeza, outros
(7,  1), (7,  3), (7,  4), (7,  5), (7,  6),                    -- São Jorge — solo, colheita, transporte, limpeza, vedação
(8,  1), (8,  2), (8,  5), (8,  6), (8,  7),                    -- Graciosa — solo, tratamentos, limpeza, vedação, rega
(9,  1), (9,  2), (9,  5), (9,  7), (9,  8),                    -- Santa Maria — solo, tratamentos, limpeza, rega, jardinagem
(10, 1), (10, 3), (10, 4), (10, 5), (10, 9);                    -- Corvo — solo, colheita, transporte, limpeza, outros


-- ═══════════════════════════════════════════════════════════════
-- PART 5 — Team Members for new providers (IDs 1100-1109)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO team_members (id, provider_id, user_id, name, email, phone, role, active, joined_at, hourly_rate) VALUES
(1100,  6, 1100, 'Filipe Cabral',     'pico.agro@email.com',         '+351 292 622 100', 'MANAGER',  TRUE, NOW() - INTERVAL '300 days', 14.00),
(1101,  6, 1105, 'Sérgio Goulart',    'sergio.pico@email.com',       '+351 933 110 110', 'OPERATOR', TRUE, NOW() - INTERVAL '180 days', 10.50),
(1102,  7, 1101, 'Inês Madruga',      'saojorge.rural@email.com',    '+351 295 412 200', 'MANAGER',  TRUE, NOW() - INTERVAL '420 days', 14.50),
(1103,  7, 1106, 'Duarte Bettencourt','duarte.saojorge@email.com',   '+351 933 220 220', 'OPERATOR', TRUE, NOW() - INTERVAL '210 days', 10.00),
(1104,  8, 1102, 'Tânia Almeida',     'graciosa.servicos@email.com', '+351 295 712 300', 'MANAGER',  TRUE, NOW() - INTERVAL '260 days', 13.50),
(1105,  8, 1107, 'Vasco Lemos',       'tania.graciosa@email.com',    '+351 933 330 330', 'OPERATOR', TRUE, NOW() - INTERVAL '150 days',  9.50),
(1106,  9, 1103, 'Hugo Sousa',        'santamaria.campo@email.com',  '+351 296 882 400', 'MANAGER',  TRUE, NOW() - INTERVAL '340 days', 14.00),
(1107,  9, 1108, 'Cristina Resendes', 'hugo.santamaria@email.com',   '+351 933 440 440', 'OPERATOR', TRUE, NOW() - INTERVAL '170 days', 10.00),
(1108, 10, 1104, 'Isabel Silveira',   'corvo.agro@email.com',        '+351 292 596 500', 'MANAGER',  TRUE, NOW() - INTERVAL '500 days', 15.00),
(1109, 10, 1109, 'Manuel Fraga',      'isabel.corvo@email.com',      '+351 933 550 550', 'OPERATOR', TRUE, NOW() - INTERVAL '200 days', 10.50);


-- ═══════════════════════════════════════════════════════════════
-- PART 6 — Machines for new providers (IDs 1100-1114)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO machines (id, provider_id, name, type, description, status, license_plate, last_maintenance_date, next_maintenance_date) VALUES
(1100,  6, 'New Holland T4.75',          'Tractor',       'Tractor 75cv compacto, ideal para vinha',                 'AVAILABLE', 'PI-12-AA', '2026-03-01', '2026-09-01'),
(1101,  6, 'Atomizador 600L para vinha', 'Pulverizador',  'Atomizador de copa para vinha em socalcos',               'AVAILABLE', NULL,       '2026-03-15', '2026-09-15'),
(1102,  6, 'Charrua reversível 2 ferros','Alfaia',        'Charrua de 2 ferros adaptada a vinha de socalco',         'AVAILABLE', NULL,       '2026-02-10', '2026-08-10'),

(1103,  7, 'John Deere 5075E',           'Tractor',       'Tractor 75cv para pastagem leiteira',                     'AVAILABLE', 'SJ-34-BB', '2026-03-20', '2026-09-20'),
(1104,  7, 'Ceifeira de erva 2.4m',      'Alfaia',        'Ceifeira de erva discos 2.4m',                            'AVAILABLE', NULL,       '2026-02-25', '2026-08-25'),
(1105,  7, 'Enfardadora redonda',        'Alfaia',        'Enfardadora redonda 1.20m para silagem',                  'AVAILABLE', NULL,       '2026-03-10', '2026-09-10'),

(1106,  8, 'Massey Ferguson 4708',       'Tractor',       'Tractor 80cv polivalente',                                'AVAILABLE', 'GR-56-CC', '2026-02-20', '2026-08-20'),
(1107,  8, 'Pulverizador 1000L',         'Pulverizador',  'Pulverizador de barras 10m',                              'AVAILABLE', NULL,       '2026-03-05', '2026-09-05'),
(1108,  8, 'Destroçador 1.8m',           'Alfaia',        'Destroçador rotativo 1.8m',                               'AVAILABLE', NULL,       '2026-02-28', '2026-08-28'),

(1109,  9, 'Kubota M5101',               'Tractor',       'Tractor 95cv',                                            'AVAILABLE', 'SM-78-DD', '2026-03-15', '2026-09-15'),
(1110,  9, 'Atomizador 400L',            'Pulverizador',  'Atomizador montado 400L para hortícolas',                 'AVAILABLE', NULL,       '2026-03-22', '2026-09-22'),
(1111,  9, 'Fresa rotativa 1.6m',        'Alfaia',        'Fresa rotativa para canteiros',                           'AVAILABLE', NULL,       '2026-02-18', '2026-08-18'),

(1112, 10, 'Tractor compacto Iseki',     'Tractor',       'Tractor compacto 45cv adaptado ao Corvo',                 'AVAILABLE', 'CO-90-EE', '2026-03-08', '2026-09-08'),
(1113, 10, 'Roçadora mecânica',          'Ferramenta',    'Roçadora profissional para limpeza de mato',              'AVAILABLE', NULL,       '2026-02-22', '2026-08-22'),
(1114, 10, 'Atrelado agrícola 3t',       'Transporte',    'Atrelado basculante de 3 toneladas',                      'AVAILABLE', 'CO-91-FF', '2026-03-12', '2026-09-12');


-- ═══════════════════════════════════════════════════════════════
-- PART 7 — Inventory for new providers (IDs 1100-1114) + INITIAL movements
-- ═══════════════════════════════════════════════════════════════

INSERT INTO inventory (id, provider_id, product_name, unit, quantity, min_stock_alert, cost_per_unit) VALUES
(1100,  6, 'Calda bordalesa',             'KG', 180.000,  40.000,  6.5000),
(1101,  6, 'Adubo NPK 8-12-24 vinha',     'KG', 600.000, 100.000,  0.9200),
(1102,  6, 'Gasóleo agrícola',            'L',  500.000, 150.000,  1.1500),

(1103,  7, 'Sementes pastagem ray-grass', 'KG', 250.000,  50.000,  4.5000),
(1104,  7, 'Adubo NPK 20-10-10',          'KG', 800.000, 150.000,  0.8500),
(1105,  7, 'Gasóleo agrícola',            'L',  700.000, 200.000,  1.1500),

(1106,  8, 'Herbicida glifosato 36%',     'L',  140.000,  30.000,  9.5000),
(1107,  8, 'Adubo NPK 12-12-17',          'KG', 500.000, 100.000,  0.7800),
(1108,  8, 'Gasóleo agrícola',            'L',  400.000, 120.000,  1.1500),

(1109,  9, 'Fungicida cobre',             'L',   80.000,  20.000, 14.2000),
(1110,  9, 'Sementes horta variadas',     'KG',  60.000,  15.000, 12.0000),
(1111,  9, 'Gasóleo agrícola',            'L',  350.000, 100.000,  1.1500),

(1112, 10, 'Sementes pastagem mista',     'KG', 150.000,  30.000,  4.9000),
(1113, 10, 'Adubo orgânico',              'KG', 400.000, 100.000,  0.4500),
(1114, 10, 'Gasóleo agrícola',            'L',  250.000,  80.000,  1.2500);

-- INITIAL movements (one row per item — V31 requires every inventory row
-- to have a movement history, otherwise reads via the movements ledger
-- show 0 stock).
INSERT INTO inventory_movements (item_id, movement_type, quantity_delta, unit_cost, quantity_after, wac_after, reason, actor_user_id, created_at) VALUES
(1100, 'INITIAL', 180.000,  6.5000, 180.000,  6.5000, 'Inventário inicial — Pico',         1100, NOW() - INTERVAL '60 days'),
(1101, 'INITIAL', 600.000,  0.9200, 600.000,  0.9200, 'Inventário inicial — Pico',         1100, NOW() - INTERVAL '60 days'),
(1102, 'INITIAL', 500.000,  1.1500, 500.000,  1.1500, 'Inventário inicial — Pico',         1100, NOW() - INTERVAL '60 days'),

(1103, 'INITIAL', 250.000,  4.5000, 250.000,  4.5000, 'Inventário inicial — São Jorge',    1101, NOW() - INTERVAL '60 days'),
(1104, 'INITIAL', 800.000,  0.8500, 800.000,  0.8500, 'Inventário inicial — São Jorge',    1101, NOW() - INTERVAL '60 days'),
(1105, 'INITIAL', 700.000,  1.1500, 700.000,  1.1500, 'Inventário inicial — São Jorge',    1101, NOW() - INTERVAL '60 days'),

(1106, 'INITIAL', 140.000,  9.5000, 140.000,  9.5000, 'Inventário inicial — Graciosa',     1102, NOW() - INTERVAL '60 days'),
(1107, 'INITIAL', 500.000,  0.7800, 500.000,  0.7800, 'Inventário inicial — Graciosa',     1102, NOW() - INTERVAL '60 days'),
(1108, 'INITIAL', 400.000,  1.1500, 400.000,  1.1500, 'Inventário inicial — Graciosa',     1102, NOW() - INTERVAL '60 days'),

(1109, 'INITIAL',  80.000, 14.2000,  80.000, 14.2000, 'Inventário inicial — Santa Maria',  1103, NOW() - INTERVAL '60 days'),
(1110, 'INITIAL',  60.000, 12.0000,  60.000, 12.0000, 'Inventário inicial — Santa Maria',  1103, NOW() - INTERVAL '60 days'),
(1111, 'INITIAL', 350.000,  1.1500, 350.000,  1.1500, 'Inventário inicial — Santa Maria',  1103, NOW() - INTERVAL '60 days'),

(1112, 'INITIAL', 150.000,  4.9000, 150.000,  4.9000, 'Inventário inicial — Corvo',        1104, NOW() - INTERVAL '60 days'),
(1113, 'INITIAL', 400.000,  0.4500, 400.000,  0.4500, 'Inventário inicial — Corvo',        1104, NOW() - INTERVAL '60 days'),
(1114, 'INITIAL', 250.000,  1.2500, 250.000,  1.2500, 'Inventário inicial — Corvo',        1104, NOW() - INTERVAL '60 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 8 — Browse-bait service requests (IDs 1100-1119)
-- ═══════════════════════════════════════════════════════════════
-- Two open requests per new island (PUBLISHED + WITH_PROPOSALS),
-- plus two AWARDED already-scheduled jobs per new island so the new
-- provider dashboards/calendars have life when the tester logs in.

-- ── Pico ─────────────────────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1100, 1110, 1, 'PUBLISHED', 'Lavoura para vinha nova — 1.5 hectares',
    'Terreno em socalco no Pico, antiga pastagem. Preciso de lavoura cuidada para implantar vinha jovem.',
    ST_SetSRID(ST_MakePoint(-28.4280, 38.5290), 4326),
    'Madalena', 'Madalena', 'Pico', 1.5, 'hectares', 'MEDIUM',
    '2026-05-22', '2026-05-30',
    '{"area": 1.5, "terrain_type": "Inclinado", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    '2026-05-20 23:59:59', NOW() - INTERVAL '12 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1101, 1119, 2, 'WITH_PROPOSALS', 'Tratamento fitossanitário em vinha — 2 hectares',
    'Vinha jovem com sinais de míldio. Procuro prestador local com atomizador para vinha de socalco.',
    ST_SetSRID(ST_MakePoint(-28.4500, 38.4750), 4326),
    'São Roque', 'São Roque do Pico', 'Pico', 2.0, 'hectares', 'HIGH',
    '2026-05-18', '2026-05-22',
    '{"area": 2, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb,
    '2026-05-17 23:59:59', NOW() - INTERVAL '1 day');

-- ── São Jorge ────────────────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1102, 1111, 3, 'PUBLISHED', 'Colheita de erva para silagem — 5 hectares',
    'Erva pronta a cortar para silagem. Preciso de equipa com ceifeira e enfardadora redonda.',
    ST_SetSRID(ST_MakePoint(-28.0950, 38.6580), 4326),
    'Velas', 'Velas', 'São Jorge', 5.0, 'hectares', 'HIGH',
    '2026-05-19', '2026-05-22',
    '{"area": 5, "crop_type": "Erva", "method": "Mecanizada"}'::jsonb,
    '2026-05-18 23:59:59', NOW() - INTERVAL '8 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1103, 1111, 6, 'WITH_PROPOSALS', 'Reparação de vedação — 250 metros',
    'Cerca de pastagem danificada após temporal. Postes em pé mas a rede precisa de reparação e em alguns sítios substituição.',
    ST_SetSRID(ST_MakePoint(-28.0900, 38.6600), 4326),
    'Velas', 'Velas', 'São Jorge', 250, 'metros', 'MEDIUM',
    '2026-05-25', '2026-05-30',
    '{"length_meters": 250, "fence_type": "Rede de arame", "work_type": "Reparação"}'::jsonb,
    '2026-05-23 23:59:59', NOW() - INTERVAL '1 day');

-- ── Graciosa ─────────────────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1104, 1112, 1, 'PUBLISHED', 'Subsolagem em pastagem — 3 hectares',
    'Pastagem compactada precisa de subsolagem para melhorar drenagem antes do Verão.',
    ST_SetSRID(ST_MakePoint(-28.0000, 39.0900), 4326),
    'Santa Cruz', 'Santa Cruz da Graciosa', 'Graciosa', 3.0, 'hectares', 'MEDIUM',
    '2026-05-21', '2026-05-25',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    '2026-05-20 23:59:59', NOW() - INTERVAL '10 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1105, 1112, 7, 'WITH_PROPOSALS', 'Instalação de rega por aspersão — 1.5 hectares',
    'Instalação de rega por aspersão em parcela de hortícolas. Pretendo ter o sistema pronto antes do Verão.',
    ST_SetSRID(ST_MakePoint(-28.0050, 39.0850), 4326),
    'Santa Cruz', 'Santa Cruz da Graciosa', 'Graciosa', 1.5, 'hectares', 'MEDIUM',
    '2026-05-28', '2026-06-05',
    '{"area": 1.5, "system_type": "Aspersão", "work_type": "Instalação nova"}'::jsonb,
    '2026-05-26 23:59:59', NOW() - INTERVAL '1 day');

-- ── Santa Maria ──────────────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1106, 1113, 2, 'PUBLISHED', 'Tratamento fitossanitário em hortícolas — 1 hectare',
    'Aplicação de fungicida cobre em parcela de tomateiros e pimentos. Produto disponível no local.',
    ST_SetSRID(ST_MakePoint(-25.1500, 36.9800), 4326),
    'Vila do Porto', 'Vila do Porto', 'Santa Maria', 1.0, 'hectares', 'HIGH',
    '2026-05-18', '2026-05-20',
    '{"area": 1, "crop_type": "Hortícolas", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb,
    '2026-05-17 23:59:59', NOW() - INTERVAL '14 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1107, 1113, 8, 'WITH_PROPOSALS', 'Manutenção mensal de jardim residencial',
    'Procura prestador para manutenção mensal de jardim com 800m². Corte de relva e poda de sebes.',
    ST_SetSRID(ST_MakePoint(-25.1450, 36.9810), 4326),
    'Vila do Porto', 'Vila do Porto', 'Santa Maria', 800, 'm²', 'LOW',
    '2026-06-01', '2026-08-31',
    '{"area": 800, "services": "Corte de relva, poda de sebes", "frequency": "Mensal"}'::jsonb,
    '2026-05-28 23:59:59', NOW() - INTERVAL '1 day');

-- ── Corvo ────────────────────────────────────────────────────

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1108, 1114, 5, 'PUBLISHED', 'Limpeza de pastagem invadida — 2 hectares',
    'Pastagem nas zonas altas com mato a invadir. Roça e destroçamento no local.',
    ST_SetSRID(ST_MakePoint(-31.1100, 39.6700), 4326),
    'Vila Nova do Corvo', 'Corvo', 'Corvo', 2.0, 'hectares', 'MEDIUM',
    '2026-05-22', '2026-05-26',
    '{"area": 2, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    '2026-05-21 23:59:59', NOW() - INTERVAL '6 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1109, 1114, 4, 'WITH_PROPOSALS', 'Transporte de fardos — 20 unidades',
    'Transporte de 20 fardos quadrados de feno do campo para o curral. 3 km de distância.',
    ST_SetSRID(ST_MakePoint(-31.1080, 39.6720), 4326),
    'Vila Nova do Corvo', 'Corvo', 'Corvo', NULL, NULL, 'MEDIUM',
    '2026-05-19', '2026-05-21',
    '{"cargo_type": "Fardos quadrados de feno (20 unidades)", "weight_tons": 8, "origin": "Pastagem das Caldeiras", "destination": "Curral central"}'::jsonb,
    '2026-05-18 23:59:59', NOW() - INTERVAL '12 hours');

-- ── AWARDED slate (one per new island, plus 5 extra for breadth) ──

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1110, 1110, 1, 'AWARDED', 'Fresagem para vinha nova — 1 hectare',
    'Fresagem para preparar plantação de vinha nova. Trabalho num único dia.',
    ST_SetSRID(ST_MakePoint(-28.4260, 38.5295), 4326),
    'Madalena', 'Madalena', 'Pico', 1.0, 'hectares', 'MEDIUM',
    '2026-05-19', '2026-05-19',
    '{"area": 1, "terrain_type": "Inclinado", "work_type": "Fresagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1111, 1111, 1, 'AWARDED', 'Lavoura em pastagem antiga — 4 hectares',
    'Lavoura profunda para resseada de pastagem. Trabalho cuidado no terreno inclinado.',
    ST_SetSRID(ST_MakePoint(-28.0920, 38.6590), 4326),
    'Velas', 'Velas', 'São Jorge', 4.0, 'hectares', 'HIGH',
    '2026-05-20', '2026-05-21',
    '{"area": 4, "terrain_type": "Inclinado", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1112, 1112, 2, 'AWARDED', 'Aplicação de herbicida em pastagem — 3 hectares',
    'Tratamento herbicida seletivo em pastagem permanente. Aplicação matinal.',
    ST_SetSRID(ST_MakePoint(-28.0010, 39.0880), 4326),
    'Santa Cruz', 'Santa Cruz da Graciosa', 'Graciosa', 3.0, 'hectares', 'MEDIUM',
    '2026-05-21', '2026-05-21',
    '{"area": 3, "crop_type": "Pastagem", "treatment_type": "Herbicida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1113, 1113, 1, 'AWARDED', 'Fresagem para canteiros de hortícolas — 0.8 hectares',
    'Preparação fina de canteiros para horta. Solo já lavrado, falta fresar.',
    ST_SetSRID(ST_MakePoint(-25.1480, 36.9805), 4326),
    'Vila do Porto', 'Vila do Porto', 'Santa Maria', 0.8, 'hectares', 'MEDIUM',
    '2026-05-22', '2026-05-22',
    '{"area": 0.8, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1114, 1114, 5, 'AWARDED', 'Limpeza de caminhos rurais — 1 km',
    'Limpeza de bermas e regadeiras em caminho rural após inverno chuvoso.',
    ST_SetSRID(ST_MakePoint(-31.1090, 39.6710), 4326),
    'Vila Nova do Corvo', 'Corvo', 'Corvo', 1.0, 'hectares', 'LOW',
    '2026-05-23', '2026-05-23',
    '{"area": 1, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '2 days');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1115, 1115, 1, 'PUBLISHED', 'Subsolagem em pastagem — 2 hectares Flores',
    'Pastagem com problemas de drenagem após inverno. Subsolagem para arejar o solo.',
    ST_SetSRID(ST_MakePoint(-31.1900, 39.4500), 4326),
    'Santa Cruz', 'Santa Cruz das Flores', 'Flores', 2.0, 'hectares', 'MEDIUM',
    '2026-05-24', '2026-05-28',
    '{"area": 2, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    '2026-05-22 23:59:59', NOW() - INTERVAL '12 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1116, 1116, 6, 'PUBLISHED', 'Vedação nova em pastagem — 400 metros Faial',
    'Vedação totalmente nova em rede de arame com postes de madeira tratada. Pastagem 3ha.',
    ST_SetSRID(ST_MakePoint(-28.6300, 38.5400), 4326),
    'Castelo Branco', 'Horta', 'Faial', 400, 'metros', 'MEDIUM',
    '2026-05-26', '2026-06-05',
    '{"length_meters": 400, "fence_type": "Rede de arame", "work_type": "Instalação nova"}'::jsonb,
    '2026-05-24 23:59:59', NOW() - INTERVAL '10 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1117, 1117, 2, 'PUBLISHED', 'Pulverização de pomar — 1.5 hectares Terceira',
    'Pomar de macieiras precisa de tratamento preventivo. Produto fornecido pelo cliente.',
    ST_SetSRID(ST_MakePoint(-27.2200, 38.6500), 4326),
    'São Bento', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'HIGH',
    '2026-05-18', '2026-05-19',
    '{"area": 1.5, "crop_type": "Macieiras", "treatment_type": "Fungicida", "product_provided": "Não, forneço eu"}'::jsonb,
    '2026-05-17 23:59:59', NOW() - INTERVAL '8 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1118, 1118, 3, 'PUBLISHED', 'Colheita de batata — 2 hectares São Miguel',
    'Batata branca pronta a colher. Procuro prestador com arrancador mecânico.',
    ST_SetSRID(ST_MakePoint(-25.4500, 37.8400), 4326),
    'Rabo de Peixe', 'Ribeira Grande', 'São Miguel', 2.0, 'hectares', 'HIGH',
    '2026-05-22', '2026-05-25',
    '{"area": 2, "crop_type": "Batata branca", "method": "Mecanizada"}'::jsonb,
    '2026-05-20 23:59:59', NOW() - INTERVAL '14 hours');

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1119, 1119, 5, 'PUBLISHED', 'Limpeza de vinha abandonada — 1 hectare Pico',
    'Vinha sem manutenção há dois anos. Roça do mato entre as filas.',
    ST_SetSRID(ST_MakePoint(-28.4520, 38.4760), 4326),
    'São Roque', 'São Roque do Pico', 'Pico', 1.0, 'hectares', 'MEDIUM',
    '2026-05-24', '2026-05-28',
    '{"area": 1, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb,
    '2026-05-23 23:59:59', NOW() - INTERVAL '6 hours');


-- ═══════════════════════════════════════════════════════════════
-- PART 9 — Proposals (IDs 1100-1119)
-- ═══════════════════════════════════════════════════════════════

-- WITH_PROPOSALS rows — PENDING (two each)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1100, 1101, 6, 'PENDING', 360.00, 'PER_UNIT', 180.00, 2, 'Tratamento com atomizador 600L específico para vinha em socalcos.',
    'Mão de obra, máquina, deslocação local', 'Produto fungicida',
    '2026-05-20', '2026-05-17 23:59:59', NOW() - INTERVAL '20 hours'),
(1101, 1101, 1, 'PENDING', 420.00, 'PER_UNIT', 210.00, 2, 'Deslocação inter-ilhas a partir da Terceira. Atomizador 800L.',
    'Mão de obra, máquina, deslocação inter-ilhas', 'Produto fungicida',
    '2026-05-21', '2026-05-17 23:59:59', NOW() - INTERVAL '6 hours');

INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1102, 1103, 7, 'PENDING', 320.00, 'PER_UNIT', 1.28, 250, 'Reparação local com substituição de troços de rede e postes ocasionais.',
    'Mão de obra, rede de substituição, postes', 'Pintura',
    '2026-05-27', '2026-05-23 23:59:59', NOW() - INTERVAL '14 hours');

INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1103, 1105, 8, 'PENDING', 1850.00, 'FIXED', NULL, NULL, 'Instalação completa de rega por aspersão. Tubagem, aspersores e teste.',
    'Mão de obra, tubagem, aspersores, válvulas', 'Bomba (se necessária)',
    '2026-05-30', '2026-05-26 23:59:59', NOW() - INTERVAL '20 hours');

INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1104, 1107, 9, 'PENDING', 380.00, 'RECURRING', NULL, NULL, 'Visita mensal de manutenção. Corte de relva, poda de sebes e limpeza geral.',
    'Mão de obra, equipamento, recolha de resíduos', 'Adubação, plantação',
    '2026-06-01', '2026-05-28 23:59:59', NOW() - INTERVAL '18 hours');

INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1105, 1109, 10, 'PENDING', 180.00, 'FIXED', NULL, NULL, 'Transporte de 20 fardos com atrelado agrícola. Carga e descarga incluídas.',
    'Mão de obra, atrelado, combustível', 'Empilhamento no destino',
    '2026-05-20', '2026-05-18 23:59:59', NOW() - INTERVAL '10 hours');

-- AWARDED rows — ACCEPTED (one each), price snapshot for transactions
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1110, 1110, 6,  'ACCEPTED', 220.00, 'PER_UNIT', 220.00, 1,   'Fresagem para vinha nova com tractor New Holland T4.75 e fresa adaptada.',
    'Mão de obra, máquina, combustível', 'Sementeira',
    '2026-05-19', NOW() - INTERVAL '3 days'),
(1111, 1111, 7,  'ACCEPTED', 540.00, 'PER_UNIT', 135.00, 4,   'Lavoura profunda em terreno inclinado. John Deere 5075E + charrua.',
    'Mão de obra, máquina, combustível', 'Gradagem posterior',
    '2026-05-20', NOW() - INTERVAL '3 days'),
(1112, 1112, 8,  'ACCEPTED', 270.00, 'PER_UNIT',  90.00, 3,   'Aplicação herbicida com pulverizador 1000L. Aplicação matinal.',
    'Mão de obra, máquina, deslocação', 'Produto herbicida (fornecido pelo cliente)',
    '2026-05-21', NOW() - INTERVAL '3 days'),
(1113, 1113, 9,  'ACCEPTED', 160.00, 'PER_UNIT', 200.00, 0.8, 'Fresagem fina para canteiros com Kubota M5101 + fresa 1.6m.',
    'Mão de obra, máquina, combustível', 'Sementeira',
    '2026-05-22', NOW() - INTERVAL '3 days'),
(1114, 1114, 10, 'ACCEPTED', 220.00, 'PER_UNIT', 220.00, 1,   'Limpeza de bermas com roçadora e atrelado. Trabalho de 1 dia.',
    'Mão de obra, máquina, combustível', 'Aplicação de herbicida',
    '2026-05-23', NOW() - INTERVAL '3 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 10 — Transactions for the AWARDED rows
-- ═══════════════════════════════════════════════════════════════

INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(1100, 1110, 1110, 220.00, 0.12, 26.40, 193.60, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1101, 1111, 1111, 540.00, 0.12, 64.80, 475.20, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1102, 1112, 1112, 270.00, 0.12, 32.40, 237.60, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1103, 1113, 1113, 160.00, 0.12, 19.20, 140.80, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(1104, 1114, 1114, 220.00, 0.12, 26.40, 193.60, 'HELD', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 11 — Service executions for the AWARDED rows (1110-1114)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO service_executions (id, proposal_id, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(1100, 1110, NULL, '2026-05-19', '2026-05-19', '08:00:00', '13:00:00', FALSE, NOW() - INTERVAL '3 days'),
(1101, 1111, NULL, '2026-05-20', '2026-05-21', '08:00:00', '18:00:00', FALSE, NOW() - INTERVAL '3 days'),
(1102, 1112, NULL, '2026-05-21', '2026-05-21', '07:30:00', '12:00:00', FALSE, NOW() - INTERVAL '3 days'),
(1103, 1113, NULL, '2026-05-22', '2026-05-22', '08:00:00', '12:00:00', FALSE, NOW() - INTERVAL '3 days'),
(1104, 1114, NULL, '2026-05-23', '2026-05-23', '09:00:00', '17:00:00', FALSE, NOW() - INTERVAL '3 days');


-- ═══════════════════════════════════════════════════════════════
-- PART 12 — Execution assignments for the AWARDED rows
-- ═══════════════════════════════════════════════════════════════

INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, assigned_at) VALUES
(1100, 1101, 1100, NOW() - INTERVAL '3 days'),                -- Pico — Sérgio + New Holland T4.75
(1101, 1103, 1103, NOW() - INTERVAL '3 days'),                -- São Jorge — Duarte + JD 5075E
(1102, 1105, 1107, NOW() - INTERVAL '3 days'),                -- Graciosa — Vasco + pulverizador
(1103, 1107, 1109, NOW() - INTERVAL '3 days'),                -- Santa Maria — Cristina + Kubota M5101
(1104, 1109, 1113, NOW() - INTERVAL '3 days');                -- Corvo — Manuel + roçadora


-- ═══════════════════════════════════════════════════════════════
-- PART 13 — Local check-in sandbox (30 jobs at exact coords)
-- ═══════════════════════════════════════════════════════════════
-- All 30 jobs:
--   client = joao.silva (user 2 → client_id 2)
--   provider = AgroServiços Terceira (provider 1, user 6)
--   coords = lat 38.664032, lng -27.261843 (developer's actual spot)
--   status = AWARDED, proposal = ACCEPTED, transaction = HELD
--   execution = scheduled, NO check-in yet, NO materials_used
--
-- Why no materials and no check-in: the user explicitly wants to
-- walk through the live flow many times. Each row should be a clean
-- "ready to check in" job that, when consumed, drains real inventory
-- and shows real job-costing math.
--
-- The 30 are scheduled across 2026-05-15 → 2026-05-29 with varied
-- categories so the calendar populates and there's always something
-- visible for "today".
--
-- Reusable parameters:
--   lat = 38.664032, lng = -27.261843
--   ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(1200, 2, 1, 'AWARDED', 'Lavoura de pastagem — sandbox #1',                'Trabalho de teste — lavoura de 2ha de pastagem para resseada.',                                  ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM', '2026-05-15', '2026-05-15', '{"area": 2, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1201, 2, 1, 'AWARDED', 'Gradagem após lavoura — sandbox #2',              'Trabalho de teste — gradagem em 2 passagens cruzadas.',                                         ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM', '2026-05-15', '2026-05-15', '{"area": 2, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1202, 2, 1, 'AWARDED', 'Fresagem para sementeira — sandbox #3',           'Trabalho de teste — fresagem fina antes da sementeira de pastagem.',                            ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM', '2026-05-16', '2026-05-16', '{"area": 1.5, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1203, 2, 1, 'AWARDED', 'Subsolagem em pastagem — sandbox #4',             'Trabalho de teste — subsolagem para arejar solo compactado.',                                   ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.5, 'hectares', 'HIGH',   '2026-05-16', '2026-05-16', '{"area": 2.5, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1204, 2, 2, 'AWARDED', 'Aplicação de adubo NPK — sandbox #5',             'Trabalho de teste — adubação com NPK 20-10-10 em pastagem.',                                   ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'MEDIUM', '2026-05-17', '2026-05-17', '{"area": 3, "crop_type": "Pastagem", "treatment_type": "Fertilização", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1205, 2, 2, 'AWARDED', 'Tratamento herbicida — sandbox #6',               'Trabalho de teste — herbicida seletivo contra junças em pastagem.',                             ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM', '2026-05-17', '2026-05-17', '{"area": 2, "crop_type": "Pastagem", "treatment_type": "Herbicida", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1206, 2, 2, 'AWARDED', 'Tratamento fungicida cobre — sandbox #7',         'Trabalho de teste — tratamento preventivo com fungicida cobre em pomar.',                       ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.0, 'hectares', 'HIGH',   '2026-05-18', '2026-05-18', '{"area": 1, "crop_type": "Pomar", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1207, 2, 2, 'AWARDED', 'Pulverização inseticida — sandbox #8',            'Trabalho de teste — aplicação de inseticida piretróide em milho jovem.',                        ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'HIGH',   '2026-05-18', '2026-05-18', '{"area": 1.5, "crop_type": "Milho", "treatment_type": "Inseticida", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1208, 2, 3, 'AWARDED', 'Colheita de erva — sandbox #9',                   'Trabalho de teste — colheita de erva para silagem.',                                            ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'HIGH',   '2026-05-19', '2026-05-19', '{"area": 2, "crop_type": "Erva", "method": "Mecanizada"}'::jsonb, NOW() - INTERVAL '2 days'),
(1209, 2, 3, 'AWARDED', 'Enfardamento — sandbox #10',                      'Trabalho de teste — enfardamento de erva já cortada em fardos quadrados.',                      ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM', '2026-05-19', '2026-05-19', '{"area": 2, "crop_type": "Erva seca", "method": "Mecanizada"}'::jsonb, NOW() - INTERVAL '2 days'),
(1210, 2, 4, 'AWARDED', 'Transporte de adubo — sandbox #11',               'Trabalho de teste — transporte de 50 sacos de adubo do armazém para o campo.',                  ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', NULL, NULL,        'MEDIUM', '2026-05-20', '2026-05-20', '{"cargo_type": "Sacos de adubo (50 x 50kg)", "weight_tons": 2.5, "origin": "Armazém", "destination": "Campo Sé"}'::jsonb, NOW() - INTERVAL '2 days'),
(1211, 2, 4, 'AWARDED', 'Transporte de fardos — sandbox #12',              'Trabalho de teste — transporte de 25 fardos quadrados.',                                        ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', NULL, NULL,        'LOW',    '2026-05-20', '2026-05-20', '{"cargo_type": "Fardos quadrados (25 unidades)", "weight_tons": 12, "origin": "Campo Sé", "destination": "Armazém"}'::jsonb, NOW() - INTERVAL '2 days'),
(1212, 2, 5, 'AWARDED', 'Limpeza de silvas — sandbox #13',                 'Trabalho de teste — destroçamento de silvas em bordadura.',                                     ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.0, 'hectares', 'MEDIUM', '2026-05-21', '2026-05-21', '{"area": 1, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb, NOW() - INTERVAL '2 days'),
(1213, 2, 5, 'AWARDED', 'Limpeza de bermas — sandbox #14',                 'Trabalho de teste — roça de bermas em caminho da propriedade.',                                 ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 0.5, 'hectares', 'LOW',    '2026-05-21', '2026-05-21', '{"area": 0.5, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb, NOW() - INTERVAL '2 days'),
(1214, 2, 1, 'AWARDED', 'Lavoura de campo para batata — sandbox #15',      'Trabalho de teste — preparação para batata nova.',                                              ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'HIGH',   '2026-05-22', '2026-05-22', '{"area": 2, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1215, 2, 2, 'AWARDED', 'Pulverização preventiva — sandbox #16',           'Trabalho de teste — pulverização preventiva fungicida em vinha.',                               ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'HIGH',   '2026-05-22', '2026-05-22', '{"area": 1.5, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1216, 2, 2, 'AWARDED', 'Aplicação foliar — sandbox #17',                  'Trabalho de teste — adubo foliar e fungicida em pomar de citrinos.',                            ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.0, 'hectares', 'MEDIUM', '2026-05-23', '2026-05-23', '{"area": 1, "crop_type": "Citrinos", "treatment_type": "Fertilização", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1217, 2, 5, 'AWARDED', 'Destroçamento de mato — sandbox #18',             'Trabalho de teste — limpeza com destroçador florestal.',                                        ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM', '2026-05-23', '2026-05-23', '{"area": 1.5, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb, NOW() - INTERVAL '2 days'),
(1218, 2, 1, 'AWARDED', 'Gradagem fina — sandbox #19',                     'Trabalho de teste — gradagem fina antes da sementeira.',                                        ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM', '2026-05-24', '2026-05-24', '{"area": 1.5, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1219, 2, 3, 'AWARDED', 'Colheita de milho silagem — sandbox #20',         'Trabalho de teste — colheita mecanizada com ceifeira.',                                         ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'HIGH',   '2026-05-24', '2026-05-24', '{"area": 2, "crop_type": "Milho silagem", "method": "Mecanizada"}'::jsonb, NOW() - INTERVAL '2 days'),
(1220, 2, 2, 'AWARDED', 'Adubação de cobertura — sandbox #21',             'Trabalho de teste — aplicação de NPK 12-12-17 em pastagem.',                                   ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM', '2026-05-25', '2026-05-25', '{"area": 2, "crop_type": "Pastagem", "treatment_type": "Fertilização", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1221, 2, 5, 'AWARDED', 'Limpeza de levada — sandbox #22',                 'Trabalho de teste — limpeza de levada e regadeiras.',                                           ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 0.6, 'hectares', 'LOW',    '2026-05-25', '2026-05-25', '{"area": 0.6, "vegetation_type": "Misto", "waste_disposal": "Triturar no local"}'::jsonb, NOW() - INTERVAL '2 days'),
(1222, 2, 6, 'AWARDED', 'Reparação de vedação — sandbox #23',              'Trabalho de teste — reparação de vedação caída em ~80 metros.',                                  ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 80,  'metros',   'MEDIUM', '2026-05-26', '2026-05-26', '{"length_meters": 80, "fence_type": "Rede de arame", "work_type": "Reparação"}'::jsonb, NOW() - INTERVAL '2 days'),
(1223, 2, 1, 'AWARDED', 'Lavoura ligeira — sandbox #24',                   'Trabalho de teste — lavoura ligeira em parcela de 1.5ha.',                                       ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM', '2026-05-26', '2026-05-26', '{"area": 1.5, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1224, 2, 2, 'AWARDED', 'Tratamento de míldio — sandbox #25',              'Trabalho de teste — fungicida cobre em vinha jovem.',                                           ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.0, 'hectares', 'HIGH',   '2026-05-27', '2026-05-27', '{"area": 1, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1225, 2, 4, 'AWARDED', 'Transporte de fardos silagem — sandbox #26',      'Trabalho de teste — transporte de 30 fardos quadrados de silagem.',                             ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', NULL, NULL,        'MEDIUM', '2026-05-27', '2026-05-27', '{"cargo_type": "Fardos quadrados de silagem (30 unidades)", "weight_tons": 15, "origin": "Campo Sé", "destination": "Armazém"}'::jsonb, NOW() - INTERVAL '2 days'),
(1226, 2, 1, 'AWARDED', 'Fresagem para milho — sandbox #27',               'Trabalho de teste — fresagem para sementeira de milho.',                                        ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'HIGH',   '2026-05-28', '2026-05-28', '{"area": 2, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days'),
(1227, 2, 2, 'AWARDED', 'Aplicação herbicida pré-emergente — sandbox #28', 'Trabalho de teste — herbicida pré-emergente em milho recém-semeado.',                          ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'HIGH',   '2026-05-28', '2026-05-28', '{"area": 2, "crop_type": "Milho", "treatment_type": "Herbicida", "product_provided": "Sim"}'::jsonb, NOW() - INTERVAL '2 days'),
(1228, 2, 5, 'AWARDED', 'Limpeza pré-sementeira — sandbox #29',            'Trabalho de teste — limpeza geral de campo antes da sementeira.',                               ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.0, 'hectares', 'MEDIUM', '2026-05-29', '2026-05-29', '{"area": 1, "vegetation_type": "Resíduos agrícolas", "waste_disposal": "Triturar no local"}'::jsonb, NOW() - INTERVAL '2 days'),
(1229, 2, 1, 'AWARDED', 'Subsolagem em pomar — sandbox #30',               'Trabalho de teste — subsolagem entre filas de pomar.',                                          ST_SetSRID(ST_MakePoint(-27.261843, 38.664032), 4326), 'Sé', 'Angra do Heroísmo', 'Terceira', 1.5, 'hectares', 'MEDIUM', '2026-05-29', '2026-05-29', '{"area": 1.5, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb, NOW() - INTERVAL '2 days');

-- Proposals (ACCEPTED, provider 1) — one per request, IDs 1200-1229
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(1200, 1200, 1, 'ACCEPTED', 280.00, 'PER_UNIT', 140.00, 2,   'Lavoura com New Holland T5.120 + charrua reversível. 1 dia.',           'Mão de obra, máquina, combustível', 'Gradagem posterior',             '2026-05-15', NOW() - INTERVAL '2 days'),
(1201, 1201, 1, 'ACCEPTED', 180.00, 'PER_UNIT',  90.00, 2,   'Gradagem com grade de discos 28". Trabalho num único dia.',             'Mão de obra, máquina, combustível', 'Sementeira',                     '2026-05-15', NOW() - INTERVAL '2 days'),
(1202, 1202, 1, 'ACCEPTED', 165.00, 'PER_UNIT', 110.00, 1.5, 'Fresagem fina com MF 4707 e fresa 2m.',                                 'Mão de obra, máquina, combustível', 'Sementeira',                     '2026-05-16', NOW() - INTERVAL '2 days'),
(1203, 1203, 1, 'ACCEPTED', 300.00, 'PER_UNIT', 120.00, 2.5, 'Subsolagem com subsolador montado em NH T5.120.',                       'Mão de obra, máquina, combustível', 'Gradagem',                       '2026-05-16', NOW() - INTERVAL '2 days'),
(1204, 1204, 1, 'ACCEPTED', 210.00, 'PER_UNIT',  70.00, 3,   'Aplicação de NPK com pulverizador 2000L.',                              'Mão de obra, máquina, deslocação',   'Produto adubo (cliente fornece)','2026-05-17', NOW() - INTERVAL '2 days'),
(1205, 1205, 1, 'ACCEPTED', 140.00, 'PER_UNIT',  70.00, 2,   'Tratamento herbicida com pulverizador 2000L.',                          'Mão de obra, máquina, deslocação',   'Produto herbicida (cliente fornece)','2026-05-17', NOW() - INTERVAL '2 days'),
(1206, 1206, 1, 'ACCEPTED', 160.00, 'PER_UNIT', 160.00, 1,   'Tratamento com atomizador 800L.',                                       'Mão de obra, máquina',               'Produto fungicida (cliente fornece)','2026-05-18', NOW() - INTERVAL '2 days'),
(1207, 1207, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Aplicação de inseticida com atomizador 800L.',                          'Mão de obra, máquina',               'Produto inseticida (cliente fornece)','2026-05-18', NOW() - INTERVAL '2 days'),
(1208, 1208, 1, 'ACCEPTED', 240.00, 'PER_UNIT', 120.00, 2,   'Colheita de erva com ceifeira de discos.',                              'Mão de obra, máquina, combustível', 'Enfardamento',                  '2026-05-19', NOW() - INTERVAL '2 days'),
(1209, 1209, 1, 'ACCEPTED', 180.00, 'PER_UNIT',  90.00, 2,   'Enfardamento de erva já cortada.',                                      'Mão de obra, máquina, combustível', 'Transporte',                    '2026-05-19', NOW() - INTERVAL '2 days'),
(1210, 1210, 1, 'ACCEPTED', 120.00, 'FIXED',     NULL,  NULL,'Transporte com Iveco Daily. Carga e descarga incluídas.',                'Mão de obra, viatura, combustível', 'Empilhamento',                  '2026-05-20', NOW() - INTERVAL '2 days'),
(1211, 1211, 1, 'ACCEPTED', 150.00, 'FIXED',     NULL,  NULL,'Transporte de fardos com Iveco Daily.',                                  'Mão de obra, viatura, combustível', 'Empilhamento no destino',       '2026-05-20', NOW() - INTERVAL '2 days'),
(1212, 1212, 1, 'ACCEPTED', 130.00, 'PER_UNIT', 130.00, 1,   'Limpeza com destroçador florestal.',                                    'Mão de obra, máquina, combustível', 'Remoção de troncos',            '2026-05-21', NOW() - INTERVAL '2 days'),
(1213, 1213, 1, 'ACCEPTED',  70.00, 'PER_UNIT', 140.00, 0.5, 'Roça de bermas com moto-roçadora.',                                     'Mão de obra, máquina',               'Aplicação de herbicida',        '2026-05-21', NOW() - INTERVAL '2 days'),
(1214, 1214, 1, 'ACCEPTED', 280.00, 'PER_UNIT', 140.00, 2,   'Lavoura profunda para batata.',                                          'Mão de obra, máquina, combustível', 'Gradagem',                      '2026-05-22', NOW() - INTERVAL '2 days'),
(1215, 1215, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Pulverização preventiva com atomizador 800L.',                          'Mão de obra, máquina',               'Produto fungicida (cliente fornece)','2026-05-22', NOW() - INTERVAL '2 days'),
(1216, 1216, 1, 'ACCEPTED', 140.00, 'PER_UNIT', 140.00, 1,   'Aplicação foliar com atomizador 800L.',                                 'Mão de obra, máquina',               'Produto (cliente fornece)',     '2026-05-23', NOW() - INTERVAL '2 days'),
(1217, 1217, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Destroçamento com destroçador florestal.',                              'Mão de obra, máquina, combustível', 'Remoção de troncos',            '2026-05-23', NOW() - INTERVAL '2 days'),
(1218, 1218, 1, 'ACCEPTED', 135.00, 'PER_UNIT',  90.00, 1.5, 'Gradagem fina para sementeira.',                                         'Mão de obra, máquina, combustível', 'Sementeira',                    '2026-05-24', NOW() - INTERVAL '2 days'),
(1219, 1219, 1, 'ACCEPTED', 300.00, 'PER_UNIT', 150.00, 2,   'Colheita com ceifeira-debulhadora Claas.',                              'Mão de obra, máquina, combustível', 'Transporte do silo',            '2026-05-24', NOW() - INTERVAL '2 days'),
(1220, 1220, 1, 'ACCEPTED', 140.00, 'PER_UNIT',  70.00, 2,   'Adubação com pulverizador 2000L.',                                       'Mão de obra, máquina, deslocação',   'Produto adubo (cliente fornece)','2026-05-25', NOW() - INTERVAL '2 days'),
(1221, 1221, 1, 'ACCEPTED',  85.00, 'PER_UNIT', 141.67, 0.6, 'Limpeza de levada e regadeiras.',                                        'Mão de obra, máquina',               'Aplicação de herbicida',        '2026-05-25', NOW() - INTERVAL '2 days'),
(1222, 1222, 1, 'ACCEPTED', 160.00, 'PER_UNIT',   2.00, 80,  'Reparação de vedação com substituição de postes em mau estado.',         'Mão de obra, postes',                'Pintura',                       '2026-05-26', NOW() - INTERVAL '2 days'),
(1223, 1223, 1, 'ACCEPTED', 210.00, 'PER_UNIT', 140.00, 1.5, 'Lavoura ligeira com NH T5.120.',                                        'Mão de obra, máquina, combustível', 'Gradagem',                      '2026-05-26', NOW() - INTERVAL '2 days'),
(1224, 1224, 1, 'ACCEPTED', 130.00, 'PER_UNIT', 130.00, 1,   'Tratamento fungicida com atomizador 800L.',                             'Mão de obra, máquina',               'Produto (cliente fornece)',     '2026-05-27', NOW() - INTERVAL '2 days'),
(1225, 1225, 1, 'ACCEPTED', 220.00, 'FIXED',     NULL,  NULL,'Transporte de 30 fardos com Iveco Daily.',                              'Mão de obra, viatura, combustível', 'Empilhamento no destino',       '2026-05-27', NOW() - INTERVAL '2 days'),
(1226, 1226, 1, 'ACCEPTED', 220.00, 'PER_UNIT', 110.00, 2,   'Fresagem para sementeira de milho.',                                     'Mão de obra, máquina, combustível', 'Sementeira',                    '2026-05-28', NOW() - INTERVAL '2 days'),
(1227, 1227, 1, 'ACCEPTED', 140.00, 'PER_UNIT',  70.00, 2,   'Aplicação herbicida pré-emergente.',                                    'Mão de obra, máquina, deslocação',   'Produto (cliente fornece)',     '2026-05-28', NOW() - INTERVAL '2 days'),
(1228, 1228, 1, 'ACCEPTED', 110.00, 'PER_UNIT', 110.00, 1,   'Limpeza geral pré-sementeira.',                                          'Mão de obra, máquina',               'Aplicação de herbicida',        '2026-05-29', NOW() - INTERVAL '2 days'),
(1229, 1229, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Subsolagem entre filas de pomar.',                                       'Mão de obra, máquina, combustível', 'Cobertura morta',               '2026-05-29', NOW() - INTERVAL '2 days');

-- Transactions — HELD (escrow pending check-out)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at)
SELECT
    1200 + offset_id,
    1200 + offset_id,
    1200 + offset_id,
    amount,
    0.12,
    ROUND(amount * 0.12, 2),
    ROUND(amount * 0.88, 2),
    'HELD',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
FROM (VALUES
    ( 0, 280.00), ( 1, 180.00), ( 2, 165.00), ( 3, 300.00), ( 4, 210.00),
    ( 5, 140.00), ( 6, 160.00), ( 7, 195.00), ( 8, 240.00), ( 9, 180.00),
    (10, 120.00), (11, 150.00), (12, 130.00), (13,  70.00), (14, 280.00),
    (15, 195.00), (16, 140.00), (17, 195.00), (18, 135.00), (19, 300.00),
    (20, 140.00), (21,  85.00), (22, 160.00), (23, 210.00), (24, 130.00),
    (25, 220.00), (26, 220.00), (27, 140.00), (28, 110.00), (29, 195.00)
) AS v(offset_id, amount);

-- Service executions — scheduled, NO check-in yet (NULL checkin_time)
-- All 30 spread Mon-Fri across 2026-05-15 → 2026-05-29.
INSERT INTO service_executions (id, proposal_id, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(1200, 1200, NULL, '2026-05-15', '2026-05-15', '07:30:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1201, 1201, NULL, '2026-05-15', '2026-05-15', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1202, 1202, NULL, '2026-05-16', '2026-05-16', '07:30:00', '11:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1203, 1203, NULL, '2026-05-16', '2026-05-16', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1204, 1204, NULL, '2026-05-17', '2026-05-17', '08:00:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1205, 1205, NULL, '2026-05-17', '2026-05-17', '14:00:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1206, 1206, NULL, '2026-05-18', '2026-05-18', '07:30:00', '11:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1207, 1207, NULL, '2026-05-18', '2026-05-18', '13:30:00', '17:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1208, 1208, NULL, '2026-05-19', '2026-05-19', '07:00:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1209, 1209, NULL, '2026-05-19', '2026-05-19', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1210, 1210, NULL, '2026-05-20', '2026-05-20', '08:00:00', '11:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1211, 1211, NULL, '2026-05-20', '2026-05-20', '14:00:00', '17:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1212, 1212, NULL, '2026-05-21', '2026-05-21', '07:30:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1213, 1213, NULL, '2026-05-21', '2026-05-21', '14:00:00', '16:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1214, 1214, NULL, '2026-05-22', '2026-05-22', '07:30:00', '12:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1215, 1215, NULL, '2026-05-22', '2026-05-22', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1216, 1216, NULL, '2026-05-23', '2026-05-23', '08:00:00', '11:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1217, 1217, NULL, '2026-05-23', '2026-05-23', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1218, 1218, NULL, '2026-05-24', '2026-05-24', '08:00:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1219, 1219, NULL, '2026-05-24', '2026-05-24', '13:30:00', '18:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1220, 1220, NULL, '2026-05-25', '2026-05-25', '07:30:00', '11:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1221, 1221, NULL, '2026-05-25', '2026-05-25', '14:00:00', '16:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1222, 1222, NULL, '2026-05-26', '2026-05-26', '08:00:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1223, 1223, NULL, '2026-05-26', '2026-05-26', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1224, 1224, NULL, '2026-05-27', '2026-05-27', '07:30:00', '11:30:00', FALSE, NOW() - INTERVAL '2 days'),
(1225, 1225, NULL, '2026-05-27', '2026-05-27', '14:00:00', '17:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1226, 1226, NULL, '2026-05-28', '2026-05-28', '07:30:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1227, 1227, NULL, '2026-05-28', '2026-05-28', '13:30:00', '17:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1228, 1228, NULL, '2026-05-29', '2026-05-29', '08:00:00', '12:00:00', FALSE, NOW() - INTERVAL '2 days'),
(1229, 1229, NULL, '2026-05-29', '2026-05-29', '13:30:00', '17:30:00', FALSE, NOW() - INTERVAL '2 days');

-- Execution assignments — rotate through provider 1's team & machines.
-- The user wants to test the check-in flow as the provider; assignments
-- here use baseline team members (1 = António, 2 = Carlos) plus the
-- V1002 ops (1009 Rita, 1010 Nuno, 1011 Filipe, 1012 Sandra), and a
-- spread of machines so the calendar shows variety.
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, assigned_at) VALUES
(1200,    1,    1, NOW() - INTERVAL '2 days'),  -- lavoura — NH T5.120
(1201, 1010,    2, NOW() - INTERVAL '2 days'),  -- gradagem — grade 28"
(1202, 1009, 1013, NOW() - INTERVAL '2 days'),  -- fresagem — MF 4707
(1203,    1, 1018, NOW() - INTERVAL '2 days'),  -- subsolagem — NH + charrua
(1204, 1011, 1016, NOW() - INTERVAL '2 days'),  -- adubação — pulverizador 2000L
(1205, 1012, 1016, NOW() - INTERVAL '2 days'),  -- herbicida — pulverizador 2000L
(1206, 1011, 1017, NOW() - INTERVAL '2 days'),  -- fungicida — atomizador 800L
(1207, 1012, 1017, NOW() - INTERVAL '2 days'),  -- inseticida — atomizador 800L
(1208,    2, 1015, NOW() - INTERVAL '2 days'),  -- colheita erva — ceifeira Claas
(1209, 1010, 1013, NOW() - INTERVAL '2 days'),  -- enfardamento — MF 4707
(1210, 1011, 1019, NOW() - INTERVAL '2 days'),  -- transporte — Iveco
(1211, 1012, 1019, NOW() - INTERVAL '2 days'),  -- transporte — Iveco
(1212,    1,    3, NOW() - INTERVAL '2 days'),  -- destroçador
(1213, 1009, NULL, NOW() - INTERVAL '2 days'),  -- moto-roçadora (sem máquina registada)
(1214,    1, 1018, NOW() - INTERVAL '2 days'),  -- lavoura batata — NH + charrua
(1215, 1011, 1017, NOW() - INTERVAL '2 days'),  -- pulverização vinha — atomizador
(1216, 1012, 1017, NOW() - INTERVAL '2 days'),  -- foliar citrinos — atomizador
(1217,    2,    3, NOW() - INTERVAL '2 days'),  -- destroçador
(1218, 1010,    2, NOW() - INTERVAL '2 days'),  -- gradagem — grade 28"
(1219,    1, 1015, NOW() - INTERVAL '2 days'),  -- colheita milho — ceifeira
(1220, 1011, 1016, NOW() - INTERVAL '2 days'),  -- adubação — pulverizador 2000L
(1221, 1009, NULL, NOW() - INTERVAL '2 days'),  -- limpeza levada
(1222, 1010, NULL, NOW() - INTERVAL '2 days'),  -- reparação vedação
(1223,    1,    1, NOW() - INTERVAL '2 days'),  -- lavoura ligeira — NH T5.120
(1224, 1012, 1017, NOW() - INTERVAL '2 days'),  -- fungicida vinha — atomizador
(1225, 1011, 1019, NOW() - INTERVAL '2 days'),  -- transporte silagem — Iveco
(1226, 1009, 1013, NOW() - INTERVAL '2 days'),  -- fresagem milho — MF 4707
(1227, 1012, 1016, NOW() - INTERVAL '2 days'),  -- herbicida pré-emergente — pulverizador
(1228, 1011,    3, NOW() - INTERVAL '2 days'),  -- limpeza — destroçador
(1229,    1, 1018, NOW() - INTERVAL '2 days');  -- subsolagem pomar — NH + charrua


-- ═══════════════════════════════════════════════════════════════
-- PART 14 — Sequence resets (dynamic MAX(id))
-- ═══════════════════════════════════════════════════════════════
-- Same pattern as V1002. Respects any real signups that may have
-- happened on prod after V1002 ran.

SELECT setval('users_id_seq',              GREATEST((SELECT MAX(id) FROM users),              (SELECT last_value FROM users_id_seq)));
SELECT setval('provider_profiles_id_seq',  GREATEST((SELECT MAX(id) FROM provider_profiles),  (SELECT last_value FROM provider_profiles_id_seq)));
SELECT setval('team_members_id_seq',       GREATEST((SELECT MAX(id) FROM team_members),       (SELECT last_value FROM team_members_id_seq)));
SELECT setval('machines_id_seq',           GREATEST((SELECT MAX(id) FROM machines),           (SELECT last_value FROM machines_id_seq)));
SELECT setval('inventory_id_seq',          GREATEST((SELECT MAX(id) FROM inventory),          (SELECT last_value FROM inventory_id_seq)));
SELECT setval('service_requests_id_seq',   GREATEST((SELECT MAX(id) FROM service_requests),   (SELECT last_value FROM service_requests_id_seq)));
SELECT setval('proposals_id_seq',          GREATEST((SELECT MAX(id) FROM proposals),          (SELECT last_value FROM proposals_id_seq)));
SELECT setval('transactions_id_seq',       GREATEST((SELECT MAX(id) FROM transactions),       (SELECT last_value FROM transactions_id_seq)));
SELECT setval('service_executions_id_seq', GREATEST((SELECT MAX(id) FROM service_executions), (SELECT last_value FROM service_executions_id_seq)));
