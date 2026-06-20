-- ═══════════════════════════════════════════════════════════════
-- V35 — July Demo Data (defesa anchor 2026-07-10)
-- ═══════════════════════════════════════════════════════════════
-- Purpose
--   Add a fresh, dated slice of activity for the live defence on
--   2026-07-10, attached to the EXISTING demo accounts so the
--   provider backoffice — Calendar (Gantt), Inventory (stock + WAC
--   price history), Finance (revenue) — and the client side show
--   life around 4–18 July 2026.
--     - agroservicos@email.com (user 6, provider 1, "AgroServiços Terceira")
--     - joao.silva@email.com  (user 2, showcase client) + other seed clients
--
-- Why a new migration (and not editing the May seed)
--   The calendar/Gantt reads service_executions.scheduled_date, which in
--   V1002 is pinned to ABSOLUTE 2026-04/2026-05 dates (frozen in the past).
--   NOW()-relative fields (check-ins, transactions) self-adjust, but the
--   scheduled dates do not. This migration adds rows whose scheduled /
--   financial / stock dates are ABSOLUTE July 2026 literals so they land
--   in the defence window regardless of when the migration runs.
--
-- ID strategy
--   All NEW explicit IDs start at 2000+, disjoint from V999/V1000/V1001
--   (1-1050 ranges) and V1002 (1000-1088). No new users/team/machines/
--   inventory items — we reuse the existing provider-1 graph. Sequences
--   are bumped to MAX(id) at the end.
--
-- Date anchor
--   Defence day ("today") = 2026-07-10 (Fri). Distribution:
--     COMPLETED              4–8 Jul   (recent past)
--     RATED                  3–5 Jul   (rated, with reviews)
--     AWAITING_CONFIRMATION  9 Jul     (just finished, awaiting client)
--     IN_PROGRESS            10 Jul    (running today, hourly slots)
--     AWARDED                11–18 Jul (scheduled, hourly slots)
--     WITH_PROPOSALS         early Jul (open, pending proposals)
--
-- Inventory
--   PART 8 uses a DO-block that reads each item's CURRENT quantity/WAC and
--   chains July PURCHASE/CONSUMPTION movements with correctly recomputed
--   quantity_after / wac_after, then syncs the inventory row — so the
--   event-sourced ledger stays consistent on top of whatever V1002 left.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- PART 0 — Defensive guards (abort atomically if 2000+ already used)
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM service_requests   WHERE id BETWEEN 2001 AND 2020) THEN
    RAISE EXCEPTION 'V35 aborted: service_requests.id 2001-2020 already in use. Bump V35 ID range.';
  END IF;
  IF EXISTS (SELECT 1 FROM proposals          WHERE id BETWEEN 2001 AND 2022) THEN
    RAISE EXCEPTION 'V35 aborted: proposals.id 2001-2022 already in use. Bump V35 ID range.';
  END IF;
  IF EXISTS (SELECT 1 FROM service_executions WHERE id BETWEEN 2001 AND 2018) THEN
    RAISE EXCEPTION 'V35 aborted: service_executions.id 2001-2018 already in use. Bump V35 ID range.';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- PART 1 — Service Requests (IDs 2001-2020)
-- ═══════════════════════════════════════════════════════════════

-- ── COMPLETED (scheduled 4–8 Jul) ─────────────────────────────
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2001, 2, 1, 'COMPLETED', 'Lavoura de pastagem para resseada de verão — 5 hectares',
    'Pastagem cansada de 5 hectares na Terra Chã. Lavoura profunda antes da resseada de verão. Acesso pela estrada do Biscoito.',
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6720), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 5.0, 'hectares', 'MEDIUM',
    '2026-07-04', '2026-07-05', '{"area": 5, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, '2026-06-28 10:00:00'),
(2002, 3, 2, 'COMPLETED', 'Pulverização fungicida em pomar — 2 hectares',
    'Pomar de macieiras com sinais de pedrado. Tratamento fungicida com atomizador. Produtos no local.',
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7250), 4326), 'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 2.0, 'hectares', 'HIGH',
    '2026-07-05', '2026-07-05', '{"area": 2, "crop_type": "Macieiras", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, '2026-06-29 09:30:00'),
(2003, 4, 1, 'COMPLETED', 'Gradagem e nivelamento — 3 hectares',
    'Gradagem após lavoura para nivelar o terreno antes da sementeira de milho.',
    ST_SetSRID(ST_MakePoint(-25.6750, 37.7320), 4326), 'São Sebastião', 'Ponta Delgada', 'São Miguel', 3.0, 'hectares', 'MEDIUM',
    '2026-07-06', '2026-07-06', '{"area": 3, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Estrada alcatroada"}'::jsonb, '2026-06-30 11:00:00'),
(2004, 5, 2, 'COMPLETED', 'Aplicação de herbicida em milho — 4 hectares',
    'Herbicida pós-emergente em campo de milho. Aplicação matinal sem vento. Produto fornecido pelo cliente.',
    ST_SetSRID(ST_MakePoint(-25.5200, 37.8150), 4326), 'Conceição', 'Ribeira Grande', 'São Miguel', 4.0, 'hectares', 'HIGH',
    '2026-07-07', '2026-07-07', '{"area": 4, "crop_type": "Milho", "treatment_type": "Herbicida", "product_provided": "Não, forneço eu"}'::jsonb, '2026-07-01 08:30:00'),
(2005, 1020, 1, 'COMPLETED', 'Fresagem fina de canteiros — 2.5 hectares',
    'Preparação fina de canteiros para horticultura. Já lavrado, falta fresar.',
    ST_SetSRID(ST_MakePoint(-27.2300, 38.6700), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 2.5, 'hectares', 'MEDIUM',
    '2026-07-08', '2026-07-08', '{"area": 2.5, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Caminho de terra"}'::jsonb, '2026-07-02 14:00:00');

-- ── RATED (scheduled 3–5 Jul) ─────────────────────────────────
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2006, 2, 1, 'RATED', 'Subsolagem de terreno compactado — 4 hectares',
    'Subsolagem profunda para arejar solo compactado por pisoteio de gado.',
    ST_SetSRID(ST_MakePoint(-27.2120, 38.6650), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-07-03', '2026-07-03', '{"area": 4, "terrain_type": "Pedregoso", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb, '2026-06-27 09:00:00'),
(2007, 3, 2, 'RATED', 'Tratamento de vinha contra míldio — 1.5 hectares',
    'Vinha com sinais iniciais de míldio. Aplicação de cobre com atomizador.',
    ST_SetSRID(ST_MakePoint(-27.0530, 38.7390), 4326), 'Fontinhas', 'Praia da Vitória', 'Terceira', 1.5, 'hectares', 'HIGH',
    '2026-07-04', '2026-07-04', '{"area": 1.5, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, '2026-06-28 16:00:00'),
(2008, 11, 1, 'RATED', 'Lavoura de pousio — 6 hectares (Faial)',
    'Lavoura profunda de terreno em pousio na zona dos Flamengos. Inter-ilhas.',
    ST_SetSRID(ST_MakePoint(-28.7180, 38.5340), 4326), 'Flamengos', 'Horta', 'Faial', 6.0, 'hectares', 'MEDIUM',
    '2026-07-05', '2026-07-06', '{"area": 6, "terrain_type": "Inclinado", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, '2026-06-29 10:30:00');

-- ── AWAITING_CONFIRMATION (scheduled 9 Jul) ───────────────────
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2009, 4, 2, 'AWAITING_CONFIRMATION', 'Adubação de pastagem com NPK — 5 hectares',
    'Aplicação de NPK 20-10-10 em pastagem com pulverizador 2000L. Distribuição uniforme.',
    ST_SetSRID(ST_MakePoint(-25.6730, 37.7390), 4326), 'São Sebastião', 'Ponta Delgada', 'São Miguel', 5.0, 'hectares', 'MEDIUM',
    '2026-07-09', '2026-07-09', '{"area": 5, "crop_type": "Pastagem", "treatment_type": "Fertilização", "product_provided": "Não, forneço eu"}'::jsonb, '2026-07-03 09:00:00'),
(2010, 1021, 5, 'AWAITING_CONFIRMATION', 'Limpeza de terreno com destroçador — 2 hectares',
    'Terreno com silvas e mato alto. Destroçamento e limpeza geral.',
    ST_SetSRID(ST_MakePoint(-27.0500, 38.7400), 4326), 'Santa Cruz', 'Praia da Vitória', 'Terceira', 2.0, 'hectares', 'HIGH',
    '2026-07-09', '2026-07-09', '{"area": 2, "work_type": "Destroçamento", "accessibility": "Caminho de terra"}'::jsonb, '2026-07-03 15:00:00');

-- ── IN_PROGRESS (running TODAY, 10 Jul, hourly slots) ─────────
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2011, 2, 1, 'IN_PROGRESS', 'Lavoura de terreno para milho — 4 hectares',
    'Lavoura profunda com charrua reversível. Trabalho a decorrer hoje.',
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6750), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'HIGH',
    '2026-07-10', '2026-07-10', '{"area": 4, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, '2026-07-07 09:00:00'),
(2012, 1020, 2, 'IN_PROGRESS', 'Pulverização de pomar de citrinos — 2 hectares',
    'Tratamento fungicida e inseticida em pomar de laranjeiras. A decorrer.',
    ST_SetSRID(ST_MakePoint(-27.0610, 38.7330), 4326), 'Fontinhas', 'Praia da Vitória', 'Terceira', 2.0, 'hectares', 'HIGH',
    '2026-07-10', '2026-07-10', '{"area": 2, "crop_type": "Citrinos", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, '2026-07-07 10:00:00'),
(2013, 3, 4, 'IN_PROGRESS', 'Transporte de fardos de feno — Terceira',
    'Transporte de 40 fardos do campo para o armazém. Carga e descarga incluídas.',
    ST_SetSRID(ST_MakePoint(-27.0680, 38.7260), 4326), 'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 1.0, 'unidades', 'MEDIUM',
    '2026-07-10', '2026-07-11', '{"items": "40 fardos", "distance_km": 12}'::jsonb, '2026-07-08 11:00:00');

-- ── AWARDED (scheduled 11–18 Jul, hourly slots) ───────────────
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2014, 5, 1, 'AWARDED', 'Gradagem antes de sementeira — 3 hectares',
    'Gradagem em duas passagens cruzadas. Agendado para 11 de Julho.',
    ST_SetSRID(ST_MakePoint(-25.5180, 37.8170), 4326), 'Conceição', 'Ribeira Grande', 'São Miguel', 3.0, 'hectares', 'MEDIUM',
    '2026-07-11', '2026-07-11', '{"area": 3, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Estrada alcatroada"}'::jsonb, '2026-07-05 09:00:00'),
(2015, 1022, 2, 'AWARDED', 'Tratamento herbicida em horta — 1.5 hectares',
    'Aplicação de herbicida seletivo. Agendado para 12 de Julho de manhã.',
    ST_SetSRID(ST_MakePoint(-25.6850, 37.7510), 4326), 'São Sebastião', 'Ponta Delgada', 'São Miguel', 1.5, 'hectares', 'HIGH',
    '2026-07-12', '2026-07-12', '{"area": 1.5, "crop_type": "Horticultura", "treatment_type": "Herbicida", "product_provided": "Não, forneço eu"}'::jsonb, '2026-07-06 10:00:00'),
(2016, 2, 1, 'AWARDED', 'Lavoura de encosta — 5 hectares',
    'Lavoura profunda em terreno inclinado. Agendado para 14 de Julho.',
    ST_SetSRID(ST_MakePoint(-27.2280, 38.6730), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 5.0, 'hectares', 'MEDIUM',
    '2026-07-14', '2026-07-15', '{"area": 5, "terrain_type": "Inclinado", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb, '2026-07-07 09:30:00'),
(2017, 3, 3, 'AWARDED', 'Colheita de erva e enfardamento — 4 hectares',
    'Colheita de erva seca e enfardamento em fardos quadrados. Agendado para 16 de Julho.',
    ST_SetSRID(ST_MakePoint(-27.0820, 38.7180), 4326), 'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-07-16', '2026-07-16', '{"area": 4, "crop_type": "Erva", "work_type": "Colheita"}'::jsonb, '2026-07-08 14:00:00'),
(2018, 11, 2, 'AWARDED', 'Atomização de pomar — 2 hectares (Faial)',
    'Tratamento de copa com atomizador. Deslocação inter-ilhas. Agendado para 18 de Julho.',
    ST_SetSRID(ST_MakePoint(-28.7180, 38.5340), 4326), 'Flamengos', 'Horta', 'Faial', 2.0, 'hectares', 'HIGH',
    '2026-07-18', '2026-07-18', '{"area": 2, "crop_type": "Pomar", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, '2026-07-09 10:00:00');

-- ── WITH_PROPOSALS (open, pending proposals) ──────────────────
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2019, 2, 1, 'WITH_PROPOSALS', 'Subsolagem de pastagem — 6 hectares',
    'Subsolagem profunda em pastagem. A receber propostas.',
    ST_SetSRID(ST_MakePoint(-27.2080, 38.6700), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 6.0, 'hectares', 'MEDIUM',
    '2026-07-20', '2026-07-22', '{"area": 6, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb, '2026-07-08 09:00:00'),
(2020, 1020, 2, 'WITH_PROPOSALS', 'Tratamento de batata — 3 hectares',
    'Tratamento fungicida preventivo em batatal. A receber propostas.',
    ST_SetSRID(ST_MakePoint(-27.2300, 38.6700), 4326), 'Terra Chã', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'HIGH',
    '2026-07-19', '2026-07-20', '{"area": 3, "crop_type": "Batata", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb, '2026-07-09 11:00:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 2 — Proposals (IDs 2001-2022)
-- ═══════════════════════════════════════════════════════════════
-- ACCEPTED proposals by provider 1 for requests 2001-2018.
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(2001, 2001, 1, 'ACCEPTED', 650.00, 'PER_UNIT', 130.00, 5,   'Lavoura com New Holland T5.120 e charrua reversível 3 ferros. 1 dia.', 'Mão de obra, máquina, combustível', 'Gradagem posterior', '2026-07-04', '2026-06-29 10:00:00'),
(2002, 2002, 1, 'ACCEPTED', 320.00, 'PER_UNIT', 160.00, 2,   'Pulverização com atomizador 800L. Operador experiente em pomares.',   'Mão de obra, máquina, deslocação', 'Produtos (fornecidos pelo cliente)', '2026-07-05', '2026-06-30 09:00:00'),
(2003, 2003, 1, 'ACCEPTED', 270.00, 'PER_UNIT',  90.00, 3,   'Gradagem em duas passagens cruzadas. John Deere 6120M + grade 28".',   'Mão de obra, máquina, combustível', 'Sementeira', '2026-07-06', '2026-07-01 11:00:00'),
(2004, 2004, 1, 'ACCEPTED', 280.00, 'PER_UNIT',  70.00, 4,   'Aplicação herbicida com pulverizador 2000L. Trabalho matinal.',       'Mão de obra, máquina, deslocação', 'Produto herbicida (cliente)', '2026-07-07', '2026-07-02 08:30:00'),
(2005, 2005, 1, 'ACCEPTED', 250.00, 'PER_UNIT', 100.00, 2.5, 'Fresagem fina com Massey Ferguson 4707 e fresa 2m.',                  'Mão de obra, máquina, combustível', 'Remoção de pedras', '2026-07-08', '2026-07-03 14:00:00'),
(2006, 2006, 1, 'ACCEPTED', 480.00, 'PER_UNIT', 120.00, 4,   'Subsolagem profunda com subsolador montado em New Holland T5.120.',   'Mão de obra, máquina, combustível', 'Gradagem posterior', '2026-07-03', '2026-06-28 09:00:00'),
(2007, 2007, 1, 'ACCEPTED', 240.00, 'PER_UNIT', 160.00, 1.5, 'Tratamento de vinha com atomizador 800L. Cobertura cuidada.',         'Mão de obra, máquina, deslocação', 'Produto fungicida (cliente)', '2026-07-04', '2026-06-29 16:00:00'),
(2008, 2008, 1, 'ACCEPTED', 780.00, 'PER_UNIT', 130.00, 6,   'Lavoura profunda inter-ilhas (Faial). New Holland + charrua reversível.', 'Mão de obra, máquina, deslocação inter-ilhas', 'Gradagem', '2026-07-05', '2026-06-30 10:30:00'),
(2009, 2009, 1, 'ACCEPTED', 450.00, 'PER_UNIT',  90.00, 5,   'Aplicação de NPK 20-10-10 com pulverizador 2000L. Distribuição uniforme.', 'Mão de obra, máquina, deslocação', 'Produto adubo (cliente)', '2026-07-09', '2026-07-03 09:00:00'),
(2010, 2010, 1, 'ACCEPTED', 260.00, 'PER_UNIT', 130.00, 2,   'Limpeza com destroçador florestal. Trabalho de meio dia.',            'Mão de obra, máquina, combustível', 'Remoção de troncos', '2026-07-09', '2026-07-03 15:00:00'),
(2011, 2011, 1, 'ACCEPTED', 520.00, 'PER_UNIT', 130.00, 4,   'Lavoura com charrua reversível. New Holland T5.120.',                 'Mão de obra, máquina, combustível', 'Gradagem posterior', '2026-07-10', '2026-07-07 09:00:00'),
(2012, 2012, 1, 'ACCEPTED', 320.00, 'PER_UNIT', 160.00, 2,   'Pulverização com atomizador 800L em pomar de citrinos.',              'Mão de obra, máquina, deslocação', 'Produtos (cliente)', '2026-07-10', '2026-07-07 10:00:00'),
(2013, 2013, 1, 'ACCEPTED', 160.00, 'FIXED',   NULL, NULL,   'Transporte de 40 fardos com Iveco Daily. Carga e descarga incluídas.', 'Mão de obra, viatura, combustível', 'Empilhamento no destino', '2026-07-10', '2026-07-08 11:00:00'),
(2014, 2014, 1, 'ACCEPTED', 240.00, 'PER_UNIT',  80.00, 3,   'Gradagem com John Deere 6120M e grade de discos 28".',                'Mão de obra, máquina, combustível', 'Sementeira', '2026-07-11', '2026-07-05 09:00:00'),
(2015, 2015, 1, 'ACCEPTED', 195.00, 'PER_UNIT', 130.00, 1.5, 'Aplicação herbicida com pulverizador 2000L. Aplicação matinal.',      'Mão de obra, máquina, deslocação', 'Produto herbicida (cliente)', '2026-07-12', '2026-07-06 10:00:00'),
(2016, 2016, 1, 'ACCEPTED', 650.00, 'PER_UNIT', 130.00, 5,   'Lavoura profunda em encosta. New Holland + charrua reversível.',      'Mão de obra, máquina, combustível', 'Gradagem posterior', '2026-07-14', '2026-07-07 09:30:00'),
(2017, 2017, 1, 'ACCEPTED', 480.00, 'PER_UNIT', 120.00, 4,   'Colheita de erva seca e enfardamento. Ceifeira Claas + enfardadeira.', 'Mão de obra, máquina, combustível', 'Transporte para armazém', '2026-07-16', '2026-07-08 14:00:00'),
(2018, 2018, 1, 'ACCEPTED', 320.00, 'PER_UNIT', 160.00, 2,   'Atomização de copa com atomizador 800L. Deslocação inter-ilhas.',     'Mão de obra, máquina, deslocação inter-ilhas', 'Produto fungicida', '2026-07-18', '2026-07-09 10:00:00');

-- PENDING proposals for WITH_PROPOSALS requests 2019-2020 (provider 1 + provider 2)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(2019, 2019, 1, 'PENDING', 720.00, 'PER_UNIT', 120.00, 6, 'Subsolagem com subsolador montado em New Holland T5.120. Trabalho cuidado.', 'Mão de obra, máquina, combustível', 'Gradagem posterior', '2026-07-20', '2026-07-18 23:59:59', '2026-07-09 09:00:00'),
(2020, 2019, 2, 'PENDING', 690.00, 'PER_UNIT', 115.00, 6, 'Subsolagem com John Deere 6130M. Gradagem opcional por valor adicional.',    'Mão de obra, máquina, deslocação', 'Gradagem (à parte)', '2026-07-21', '2026-07-18 23:59:59', '2026-07-09 12:00:00'),
(2021, 2020, 1, 'PENDING', 360.00, 'PER_UNIT', 120.00, 3, 'Tratamento fungicida preventivo com atomizador 800L.',                       'Mão de obra, máquina, deslocação', 'Produto fungicida', '2026-07-19', '2026-07-17 23:59:59', '2026-07-09 11:30:00'),
(2022, 2020, 2, 'PENDING', 345.00, 'PER_UNIT', 115.00, 3, 'Tratamento com pulverizador 2000L. Aplicação rápida.',                       'Mão de obra, máquina, deslocação', 'Produto fungicida', '2026-07-20', '2026-07-17 23:59:59', '2026-07-09 13:00:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 3 — Transactions (IDs 2001-2018)
-- ═══════════════════════════════════════════════════════════════
-- COMPLETED + RATED → RELEASED
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(2001, 2001, 2001, 650.00, 0.12, 78.00, 572.00, 'RELEASED', '2026-07-04 08:00:00', '2026-07-07 10:00:00', '2026-06-29 10:00:00'),
(2002, 2002, 2002, 320.00, 0.12, 38.40, 281.60, 'RELEASED', '2026-07-05 08:00:00', '2026-07-08 10:00:00', '2026-06-30 09:00:00'),
(2003, 2003, 2003, 270.00, 0.12, 32.40, 237.60, 'RELEASED', '2026-07-06 08:00:00', '2026-07-09 10:00:00', '2026-07-01 11:00:00'),
(2004, 2004, 2004, 280.00, 0.12, 33.60, 246.40, 'RELEASED', '2026-07-07 08:00:00', '2026-07-10 10:00:00', '2026-07-02 08:30:00'),
(2005, 2005, 2005, 250.00, 0.12, 30.00, 220.00, 'RELEASED', '2026-07-08 08:00:00', '2026-07-11 10:00:00', '2026-07-03 14:00:00'),
(2006, 2006, 2006, 480.00, 0.12, 57.60, 422.40, 'RELEASED', '2026-07-03 08:00:00', '2026-07-06 10:00:00', '2026-06-28 09:00:00'),
(2007, 2007, 2007, 240.00, 0.12, 28.80, 211.20, 'RELEASED', '2026-07-04 08:00:00', '2026-07-07 10:00:00', '2026-06-29 16:00:00'),
(2008, 2008, 2008, 780.00, 0.12, 93.60, 686.40, 'RELEASED', '2026-07-05 08:00:00', '2026-07-08 10:00:00', '2026-06-30 10:30:00');

-- AWAITING_CONFIRMATION + IN_PROGRESS + AWARDED → HELD (no released_at)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(2009, 2009, 2009, 450.00, 0.12, 54.00, 396.00, 'HELD', '2026-07-09 08:00:00', '2026-07-03 09:00:00'),
(2010, 2010, 2010, 260.00, 0.12, 31.20, 228.80, 'HELD', '2026-07-09 08:00:00', '2026-07-03 15:00:00'),
(2011, 2011, 2011, 520.00, 0.12, 62.40, 457.60, 'HELD', '2026-07-08 09:00:00', '2026-07-07 09:00:00'),
(2012, 2012, 2012, 320.00, 0.12, 38.40, 281.60, 'HELD', '2026-07-08 09:00:00', '2026-07-07 10:00:00'),
(2013, 2013, 2013, 160.00, 0.12, 19.20, 140.80, 'HELD', '2026-07-09 09:00:00', '2026-07-08 11:00:00'),
(2014, 2014, 2014, 240.00, 0.12, 28.80, 211.20, 'HELD', '2026-07-06 09:00:00', '2026-07-05 09:00:00'),
(2015, 2015, 2015, 195.00, 0.12, 23.40, 171.60, 'HELD', '2026-07-07 09:00:00', '2026-07-06 10:00:00'),
(2016, 2016, 2016, 650.00, 0.12, 78.00, 572.00, 'HELD', '2026-07-08 09:00:00', '2026-07-07 09:30:00'),
(2017, 2017, 2017, 480.00, 0.12, 57.60, 422.40, 'HELD', '2026-07-09 09:00:00', '2026-07-08 14:00:00'),
(2018, 2018, 2018, 320.00, 0.12, 38.40, 281.60, 'HELD', '2026-07-09 09:00:00', '2026-07-09 10:00:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 4 — Service Executions (IDs 2001-2018) with calendar metadata
-- ═══════════════════════════════════════════════════════════════
-- COMPLETED (full lifecycle) — executions 2001-2005
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(2001, 2001, ST_SetSRID(ST_MakePoint(-27.2050, 38.6720), 4326), '2026-07-04 07:30:00', '2026-07-04 17:30:00',
    'Lavoura concluída num dia. Solo bem revolto.', '[{"product": "Gasóleo agrícola", "quantity": 120, "unit": "L"}]'::jsonb,
    '2026-07-04 17:30:00', '2026-07-04', '2026-07-04', '07:30:00', '17:30:00', FALSE, '2026-06-30 10:00:00'),
(2002, 2002, ST_SetSRID(ST_MakePoint(-27.0700, 38.7250), 4326), '2026-07-05 08:00:00', '2026-07-05 13:00:00',
    'Pulverização concluída. Cobertura uniforme em todo o pomar.', '[{"product": "Fungicida cobre (oxicloreto)", "quantity": 12, "unit": "L"}, {"product": "Gasóleo agrícola", "quantity": 20, "unit": "L"}]'::jsonb,
    '2026-07-05 13:00:00', '2026-07-05', '2026-07-05', '08:00:00', '13:00:00', FALSE, '2026-07-01 09:00:00'),
(2003, 2003, ST_SetSRID(ST_MakePoint(-25.6750, 37.7320), 4326), '2026-07-06 08:00:00', '2026-07-06 15:00:00',
    'Gradagem em 2 passagens. Terreno nivelado e pronto.', '[{"product": "Gasóleo agrícola", "quantity": 70, "unit": "L"}]'::jsonb,
    '2026-07-06 15:00:00', '2026-07-06', '2026-07-06', '08:00:00', '15:00:00', FALSE, '2026-07-02 11:00:00'),
(2004, 2004, ST_SetSRID(ST_MakePoint(-25.5200, 37.8150), 4326), '2026-07-07 07:30:00', '2026-07-07 12:30:00',
    'Aplicação herbicida sem vento. Boa cobertura.', '[{"product": "Herbicida glifosato 36%", "quantity": 16, "unit": "L"}, {"product": "Gasóleo agrícola", "quantity": 25, "unit": "L"}]'::jsonb,
    '2026-07-07 12:30:00', '2026-07-07', '2026-07-07', '07:30:00', '12:30:00', FALSE, '2026-07-03 08:30:00'),
(2005, 2005, ST_SetSRID(ST_MakePoint(-27.2300, 38.6700), 4326), '2026-07-08 08:30:00', '2026-07-08 14:30:00',
    'Fresagem fina concluída. Solo solto e uniforme.', '[{"product": "Gasóleo agrícola", "quantity": 45, "unit": "L"}]'::jsonb,
    '2026-07-08 14:30:00', '2026-07-08', '2026-07-08', '08:30:00', '14:30:00', FALSE, '2026-07-04 14:00:00');

-- RATED (full lifecycle) — executions 2006-2008
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_all_day, created_at) VALUES
(2006, 2006, ST_SetSRID(ST_MakePoint(-27.2120, 38.6650), 4326), '2026-07-03 07:30:00', '2026-07-03 18:00:00',
    'Subsolagem profunda concluída. Solo bem arejado.', '[{"product": "Gasóleo agrícola", "quantity": 95, "unit": "L"}]'::jsonb,
    '2026-07-03 18:00:00', '2026-07-03', '2026-07-03', TRUE, '2026-06-29 09:00:00'),
(2007, 2007, ST_SetSRID(ST_MakePoint(-27.0530, 38.7390), 4326), '2026-07-04 08:00:00', '2026-07-04 12:00:00',
    'Tratamento de vinha concluído. Cobertura cuidada.', '[{"product": "Fungicida cobre (oxicloreto)", "quantity": 9, "unit": "L"}, {"product": "Gasóleo agrícola", "quantity": 15, "unit": "L"}]'::jsonb,
    '2026-07-04 12:00:00', '2026-07-04', '2026-07-04', TRUE, '2026-06-30 16:00:00'),
(2008, 2008, ST_SetSRID(ST_MakePoint(-28.7180, 38.5340), 4326), '2026-07-05 07:00:00', '2026-07-06 17:00:00',
    'Lavoura de 6ha concluída em 2 dias (inter-ilhas).', '[{"product": "Gasóleo agrícola", "quantity": 210, "unit": "L"}]'::jsonb,
    '2026-07-06 17:00:00', '2026-07-05', '2026-07-06', TRUE, '2026-07-01 10:30:00');

-- AWAITING_CONFIRMATION (finished, not yet confirmed) — executions 2009-2010
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(2009, 2009, ST_SetSRID(ST_MakePoint(-25.6730, 37.7390), 4326), '2026-07-09 08:00:00', '2026-07-09 14:00:00',
    'Adubação concluída em 5ha. Aguarda confirmação do cliente.', '[{"product": "Adubo NPK 20-10-10", "quantity": 250, "unit": "KG"}, {"product": "Gasóleo agrícola", "quantity": 30, "unit": "L"}]'::jsonb,
    '2026-07-09 14:00:00', '2026-07-09', '2026-07-09', '08:00:00', '14:00:00', FALSE, '2026-07-04 09:00:00'),
(2010, 2010, ST_SetSRID(ST_MakePoint(-27.0500, 38.7400), 4326), '2026-07-09 09:00:00', '2026-07-09 13:30:00',
    'Destroçamento concluído. Aguarda confirmação do cliente.', '[{"product": "Gasóleo agrícola", "quantity": 22, "unit": "L"}]'::jsonb,
    '2026-07-09 13:30:00', '2026-07-09', '2026-07-09', '09:00:00', '13:30:00', FALSE, '2026-07-04 15:00:00');

-- IN_PROGRESS (checked in, running TODAY) — executions 2011-2013
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(2011, 2011, ST_SetSRID(ST_MakePoint(-27.2100, 38.6750), 4326), '2026-07-10 07:45:00', NULL, '2026-07-10', '2026-07-10', '07:30:00', '16:00:00', FALSE, '2026-07-07 09:00:00'),
(2012, 2012, ST_SetSRID(ST_MakePoint(-27.0610, 38.7330), 4326), '2026-07-10 09:10:00', NULL, '2026-07-10', '2026-07-10', '09:00:00', '13:00:00', FALSE, '2026-07-07 10:00:00'),
(2013, 2013, ST_SetSRID(ST_MakePoint(-27.0680, 38.7260), 4326), '2026-07-10 13:20:00', NULL, '2026-07-10', '2026-07-11', '13:00:00', '17:30:00', FALSE, '2026-07-08 11:00:00');

-- AWARDED (scheduled future, hourly slots, no check-in) — executions 2014-2018
INSERT INTO service_executions (id, proposal_id, notes, scheduled_date, scheduled_end_date, scheduled_start_time, scheduled_end_time, scheduled_all_day, created_at) VALUES
(2014, 2014, NULL, '2026-07-11', '2026-07-11', '08:00:00', '14:00:00', FALSE, '2026-07-05 09:00:00'),
(2015, 2015, NULL, '2026-07-12', '2026-07-12', '07:30:00', '11:30:00', FALSE, '2026-07-06 10:00:00'),
(2016, 2016, NULL, '2026-07-14', '2026-07-15', '08:00:00', '17:30:00', FALSE, '2026-07-07 09:30:00'),
(2017, 2017, NULL, '2026-07-16', '2026-07-16', '07:00:00', '15:00:00', FALSE, '2026-07-08 14:00:00'),
(2018, 2018, NULL, '2026-07-18', '2026-07-18', '09:00:00', '14:30:00', FALSE, '2026-07-09 10:00:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 5 — Execution Assignments (provider 1 team + machines)
-- ═══════════════════════════════════════════════════════════════
-- Team (provider 1): 1=António(14.00), 2=Carlos(10.50), 1009=Rita(13.50),
--   1010=Nuno(10.50), 1011=Filipe(10.00), 1012=Sandra(11.00),
--   1013=Joaquim(9.50), 1014=Manuela(13.00).
-- Machines (provider 1): 1=New Holland, 2=Grade 28", 3=Destroçador,
--   1013=MF 4707, 1014=JD 6120M, 1015=Claas, 1016=Pulv 2000L,
--   1017=Atomizador, 1018=Charrua, 1019=Iveco Daily.
INSERT INTO execution_assignments (execution_id, team_member_id, machine_id, hours_worked, machine_hours, hourly_rate_snapshot, assigned_at) VALUES
(2001,    2,    1, 10.0, 10.0, 10.50, '2026-07-03 18:00:00'),
(2001, 1011, 1018,  9.0,  9.0, 10.00, '2026-07-03 18:00:00'),
(2002, 1009, 1017,  5.0,  5.0, 13.50, '2026-07-04 17:00:00'),
(2003, 1010, 1014,  7.0,  7.0, 10.50, '2026-07-05 17:00:00'),
(2004, 1012, 1016,  5.0,  5.0, 11.00, '2026-07-06 17:00:00'),
(2005,    2, 1013,  6.0,  6.0, 10.50, '2026-07-07 17:00:00'),
(2006,    1,    1, 10.5, 10.5, 14.00, '2026-07-02 18:00:00'),
(2007, 1009, 1017,  4.0,  4.0, 13.50, '2026-07-03 18:00:00'),
(2008,    1,    1, 18.0, 16.0, 14.00, '2026-07-04 18:00:00'),
(2008, 1011, 1018, 18.0, 14.0, 10.00, '2026-07-04 18:00:00'),
(2009, 1012, 1016,  6.0,  6.0, 11.00, '2026-07-08 18:00:00'),
(2010, 1013,    3,  4.5,  4.5,  9.50, '2026-07-08 18:00:00'),
(2011,    2,    1,  8.5,  8.5, 10.50, '2026-07-09 18:00:00'),
(2011, 1014, 1018,  8.5,  8.5, 13.00, '2026-07-09 18:00:00'),
(2012, 1009, 1017,  4.0,  4.0, 13.50, '2026-07-09 18:00:00'),
(2013, 1010, 1019,  4.5,  4.5, 10.50, '2026-07-09 18:00:00'),
(2014, 1010, 1014,  6.0,  6.0, 10.50, '2026-07-10 12:00:00'),
(2015, 1012, 1016,  4.0,  4.0, 11.00, '2026-07-10 12:00:00'),
(2016,    1,    1, 10.0, 10.0, 14.00, '2026-07-10 12:00:00'),
(2016, 1011, 1018, 10.0, 10.0, 10.00, '2026-07-10 12:00:00'),
(2017,    2, 1015,  8.0,  8.0, 10.50, '2026-07-10 12:00:00'),
(2017, 1013, 1019,  8.0,  4.0,  9.50, '2026-07-10 12:00:00'),
(2018, 1009, 1017,  5.5,  5.5, 13.50, '2026-07-10 12:00:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 6 — Reviews (RATED requests 2006-2008) — IDs 2001-2006
-- ═══════════════════════════════════════════════════════════════
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(2001, 2006, 2, 6, 5, 'Subsolagem impecável. O António arejou o terreno todo sem deixar zonas por fazer. Muito profissional.', '2026-07-04 10:00:00'),
(2002, 2006, 6, 2, 5, 'Cliente atencioso e terreno bem identificado. Tudo a postos para o trabalho. Recomendo.',                  '2026-07-04 11:00:00'),
(2003, 2007, 3, 6, 4, 'Tratamento bem feito e atempado. Apenas um pequeno atraso à chegada — de resto, excelente.',                '2026-07-05 09:00:00'),
(2004, 2007, 6, 3, 5, 'Vinha bem tratada pelo cliente, fácil acesso. Combinação clara. Obrigado!',                                 '2026-07-05 10:00:00'),
(2005, 2008, 11, 6, 5, 'Lavoura de 6 hectares no Faial impecável, mesmo com a deslocação inter-ilhas. Equipa muito competente.',   '2026-07-07 09:00:00'),
(2006, 2008, 6, 11, 5, 'Trabalho exigente mas bem coordenado pelo cliente. Voltaríamos a colaborar de certeza.',                   '2026-07-07 10:00:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 7 — Machine maintenance & expenses (July)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO machine_maintenance_logs (machine_id, maintenance_type, description, cost, workshop_name, performed_at, next_due_at, notes, created_by) VALUES
(1013, 'ROUTINE', 'Mudança de óleo e filtros (500h)', 185.00, 'Oficina Agrícola Terceira', '2026-07-02', '2026-10-02', 'Tudo conforme. Próxima às 1000h.', 6),
(1, 'REPAIR', 'Substituição de mangueira hidráulica do elevador', 95.00, 'Oficina Agrícola Terceira', '2026-07-06', NULL, 'Fuga detetada durante lavoura. Resolvido no próprio dia.', 6);

INSERT INTO machine_expenses (machine_id, category, description, amount, incurred_at, notes, created_by) VALUES
(1, 'FUEL', 'Abastecimento gasóleo agrícola — campanha julho', 320.00, '2026-07-03', '250L a 1.28/L', 6),
(1013, 'FUEL', 'Abastecimento gasóleo agrícola', 178.00, '2026-07-05', '140L a 1.27/L', 6),
(1017, 'PARTS', 'Bicos de pulverização de substituição', 64.00, '2026-07-07', 'Jogo de 8 bicos antideriva', 6),
(1019, 'INSURANCE', 'Seguro trimestral carrinha Iveco', 142.00, '2026-07-01', 'Q3 2026', 6);


-- ═══════════════════════════════════════════════════════════════
-- PART 8 — Inventory movements (July) — WAC chained from current state
-- ═══════════════════════════════════════════════════════════════
-- Reads each item's CURRENT quantity/WAC from the inventory table and
-- chains PURCHASE/CONSUMPTION movements (correctly recomputing
-- quantity_after / wac_after), then syncs the inventory row. This keeps
-- the event-sourced ledger consistent regardless of prior state.
DO $$
DECLARE
  m RECORD;
  cur_qty NUMERIC(14,3); cur_wac NUMERIC(14,4);
  new_qty NUMERIC(14,3); new_wac NUMERIC(14,4); eff_cost NUMERIC(14,4);
BEGIN
  CREATE TEMP TABLE _july_mov (
    seq INT, item_id BIGINT, mtype TEXT, delta NUMERIC(14,3),
    ucost NUMERIC(14,4), reason TEXT, actor INT, created TIMESTAMP
  ) ON COMMIT DROP;

  INSERT INTO _july_mov (seq, item_id, mtype, delta, ucost, reason, actor, created) VALUES
    -- Purchases (note rising prices → WAC evolution visible in the price history)
    (1, 1012, 'PURCHASE',   1000.000, 0.8100, 'Compra de adubo NPK 12-12-17 — campanha verão', 6, '2026-07-02 09:00:00'),
    (2, 1013, 'PURCHASE',    600.000, 0.8900, 'Compra de adubo NPK 20-10-10 — campanha verão', 6, '2026-07-02 09:10:00'),
    (3, 1014, 'PURCHASE',    120.000, 9.9000, 'Compra de herbicida glifosato 36%',             6, '2026-07-03 10:00:00'),
    (4, 1015, 'PURCHASE',     60.000, 14.800, 'Compra de fungicida cobre (oxicloreto)',        6, '2026-07-03 10:10:00'),
    (5, 1018, 'PURCHASE',    200.000, 5.1000, 'Compra de sementes de pastagem mista',          6, '2026-07-04 11:00:00'),
    -- Consumptions tied to July jobs (materials_used above)
    (6, 1015, 'CONSUMPTION',  -12.000, NULL, 'Consumo — pulverização pomar (exec 2002)',       6, '2026-07-05 13:00:00'),
    (7, 1014, 'CONSUMPTION',  -16.000, NULL, 'Consumo — herbicida milho (exec 2004)',          6, '2026-07-07 12:30:00'),
    (8, 1015, 'CONSUMPTION',   -9.000, NULL, 'Consumo — tratamento vinha (exec 2007)',         6, '2026-07-04 12:00:00'),
    (9, 1013, 'CONSUMPTION', -250.000, NULL, 'Consumo — adubação pastagem (exec 2009)',        6, '2026-07-09 14:00:00'),
    (10, 1012, 'PURCHASE',    500.000, 0.8300, 'Reposição de adubo NPK 12-12-17',              6, '2026-07-08 09:00:00');

  FOR m IN SELECT * FROM _july_mov ORDER BY seq LOOP
    SELECT quantity, cost_per_unit INTO cur_qty, cur_wac FROM inventory WHERE id = m.item_id FOR UPDATE;
    IF cur_qty IS NULL THEN
      RAISE EXCEPTION 'V35: inventory item % not found (expected from V1002).', m.item_id;
    END IF;

    IF m.mtype IN ('PURCHASE', 'ADJUSTMENT_IN') THEN
      new_qty := cur_qty + m.delta;
      IF m.mtype = 'PURCHASE' THEN
        eff_cost := m.ucost;
        new_wac  := ROUND((cur_qty * cur_wac + m.delta * m.ucost) / NULLIF(new_qty, 0), 4);
      ELSE
        eff_cost := cur_wac;
        new_wac  := cur_wac;
      END IF;
    ELSE  -- CONSUMPTION / ADJUSTMENT_OUT (delta negative) — unit_cost must be NULL
      new_qty  := cur_qty + m.delta;
      eff_cost := NULL;
      new_wac  := cur_wac;
      IF new_qty < 0 THEN
        RAISE EXCEPTION 'V35: consumption on item % would drive stock negative (% + %).', m.item_id, cur_qty, m.delta;
      END IF;
    END IF;

    INSERT INTO inventory_movements
      (item_id, movement_type, quantity_delta, unit_cost, quantity_after, wac_after, reason, actor_user_id, created_at)
      VALUES (m.item_id, m.mtype, m.delta, eff_cost, new_qty, new_wac, m.reason, m.actor, m.created);

    UPDATE inventory SET quantity = new_qty, cost_per_unit = new_wac WHERE id = m.item_id;
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- PART 9 — Notifications (July)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO notifications (user_id, type, title, body, data, read, created_at) VALUES
(6, 'PROPOSAL_ACCEPTED', 'Proposta aceite!',    'A sua proposta para a lavoura do João Silva foi aceite.',              '{"requestId": 2011, "proposalId": 2011}'::jsonb, TRUE,  '2026-07-07 09:05:00'),
(6, 'REQUEST_CONFIRMED', 'Trabalho confirmado', 'O cliente confirmou a subsolagem de 4 hectares.',                      '{"requestId": 2006}'::jsonb,                     TRUE,  '2026-07-04 10:05:00'),
(6, 'REVIEW_RECEIVED',   'Nova avaliação',      'Recebeu uma avaliação de 5 estrelas pela subsolagem.',                 '{"requestId": 2006, "reviewId": 2001}'::jsonb,   FALSE, '2026-07-04 10:10:00'),
(6, 'REVIEW_RECEIVED',   'Nova avaliação',      'Recebeu uma avaliação de 5 estrelas pela lavoura no Faial.',           '{"requestId": 2008, "reviewId": 2005}'::jsonb,   FALSE, '2026-07-07 09:05:00'),
(6, 'EXECUTION_COMPLETED','Serviço a confirmar','A adubação de pastagem foi concluída e aguarda confirmação.',          '{"requestId": 2009}'::jsonb,                     FALSE, '2026-07-09 14:05:00'),
(2, 'EXECUTION_STARTED', 'Trabalho iniciado',   'AgroServiços iniciou a lavoura do seu terreno.',                       '{"requestId": 2011}'::jsonb,                     FALSE, '2026-07-10 07:50:00'),
(2, 'PROPOSAL_RECEIVED', 'Nova proposta recebida','Recebeu uma proposta para a subsolagem de pastagem.',                '{"requestId": 2019, "proposalId": 2019}'::jsonb, FALSE, '2026-07-09 09:05:00'),
(1020,'PROPOSAL_RECEIVED','Nova proposta recebida','Recebeu uma proposta para o tratamento de batata.',                  '{"requestId": 2020, "proposalId": 2021}'::jsonb, FALSE, '2026-07-09 11:35:00');


-- ═══════════════════════════════════════════════════════════════
-- PART 10 — Sequence resets (dynamic MAX(id))
-- ═══════════════════════════════════════════════════════════════
SELECT setval('service_requests_id_seq',   GREATEST((SELECT MAX(id) FROM service_requests),   (SELECT last_value FROM service_requests_id_seq)));
SELECT setval('proposals_id_seq',          GREATEST((SELECT MAX(id) FROM proposals),          (SELECT last_value FROM proposals_id_seq)));
SELECT setval('transactions_id_seq',       GREATEST((SELECT MAX(id) FROM transactions),       (SELECT last_value FROM transactions_id_seq)));
SELECT setval('service_executions_id_seq', GREATEST((SELECT MAX(id) FROM service_executions), (SELECT last_value FROM service_executions_id_seq)));
SELECT setval('reviews_id_seq',            GREATEST((SELECT MAX(id) FROM reviews),            (SELECT last_value FROM reviews_id_seq)));
