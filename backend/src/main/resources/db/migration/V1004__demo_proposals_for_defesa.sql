-- ═══════════════════════════════════════════════════════════════
-- V1004 — Demo proposals for defesa (2026-05-20)
-- ═══════════════════════════════════════════════════════════════
-- Purpose
--   Provide 10 ready-to-accept service requests for the live demo:
--   client = joao.silva (user 2), each already has a PENDING proposal
--   from AgroServiços Terceira (provider 1). Locations clustered
--   around Angra do Heroísmo, well within the provider's 40 km radius
--   and within the 500 m check-in radius (provider checks in at the
--   exact same coords as the request).
--
-- ID strategy
--   service_requests + proposals: 2000-2009 (disjoint from V1002 1051-1088
--   and V1003 1100-1229).
--
-- Rollback (manual, if ever needed)
--   DELETE FROM proposals       WHERE id BETWEEN 2000 AND 2009;
--   DELETE FROM service_requests WHERE id BETWEEN 2000 AND 2009;
-- ═══════════════════════════════════════════════════════════════


-- ── Defensive guard ─────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM service_requests WHERE id BETWEEN 2000 AND 2009) THEN
    RAISE EXCEPTION 'V1004 aborted: service_requests.id 2000-2009 already in use';
  END IF;
  IF EXISTS (SELECT 1 FROM proposals WHERE id BETWEEN 2000 AND 2009) THEN
    RAISE EXCEPTION 'V1004 aborted: proposals.id 2000-2009 already in use';
  END IF;
END $$;


-- ── Service requests (status WITH_PROPOSALS, client = joao.silva) ──
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(2000, 2, 1, 'WITH_PROPOSALS', 'Lavoura de pastagem — 4 hectares',
    'Pastagem com 6 anos, precisa de lavoura profunda para preparar resseada. Solo solto, terreno plano. Acesso por caminho de terra.',
    ST_SetSRID(ST_MakePoint(-27.2080, 38.6700), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'MEDIUM',
    '2026-05-25', '2026-05-28',
    '{"area": 4, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '2 days'),

(2001, 2, 2, 'WITH_PROPOSALS', 'Tratamento herbicida em pastagem — 3 hectares',
    'Combate a junças e ranúnculos em pastagem para vacas leiteiras. Aplicação de manhã, sem vento.',
    ST_SetSRID(ST_MakePoint(-27.2167, 38.6667), 4326),
    'Sé', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'MEDIUM',
    '2026-05-22', '2026-05-24',
    '{"area": 3, "crop_type": "Pastagem", "treatment_type": "Herbicida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '1 day'),

(2002, 2, 3, 'WITH_PROPOSALS', 'Enfardamento de erva seca — 5 hectares',
    'Erva já cortada e amontoada há 3 dias. Pretende-se fardos quadrados pequenos para armazém.',
    ST_SetSRID(ST_MakePoint(-27.2200, 38.6620), 4326),
    'São Pedro', 'Angra do Heroísmo', 'Terceira', 5.0, 'hectares', 'HIGH',
    '2026-05-21', '2026-05-22',
    '{"area": 5, "crop_type": "Erva seca", "method": "Mecanizada"}'::jsonb,
    NOW() - INTERVAL '1 day'),

(2003, 2, 4, 'WITH_PROPOSALS', 'Transporte de adubo do porto — 5 toneladas',
    'Recolha de 5 toneladas de adubo NPK no porto da Praia da Vitória e entrega no armazém em Angra. Carga em sacos de 50kg.',
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6580), 4326),
    'Posto Santo', 'Angra do Heroísmo', 'Terceira', NULL, NULL, 'MEDIUM',
    '2026-05-23', '2026-05-23',
    '{"cargo_type": "Sacos de adubo (100 x 50kg)", "weight_tons": 5, "origin": "Porto da Praia da Vitória", "destination": "Armazém em Angra"}'::jsonb,
    NOW() - INTERVAL '1 day'),

(2004, 2, 5, 'WITH_PROPOSALS', 'Limpeza de silvas em pastagem — 2 hectares',
    'Pastagem invadida por silvas e fetos no perímetro. Limpeza com destroçador, triturar no local.',
    ST_SetSRID(ST_MakePoint(-27.2050, 38.6650), 4326),
    'São Bento', 'Angra do Heroísmo', 'Terceira', 2.0, 'hectares', 'MEDIUM',
    '2026-05-26', '2026-05-28',
    '{"area": 2, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    NOW() - INTERVAL '2 days'),

(2005, 2, 1, 'WITH_PROPOSALS', 'Gradagem para milho de silagem — 6 hectares',
    'Gradagem após lavoura para preparar terreno para sementeira de milho de silagem. Trabalho num único dia idealmente.',
    ST_SetSRID(ST_MakePoint(-27.2120, 38.6740), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 6.0, 'hectares', 'HIGH',
    '2026-05-22', '2026-05-23',
    '{"area": 6, "terrain_type": "Plano", "work_type": "Gradagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '1 day'),

(2006, 2, 1, 'WITH_PROPOSALS', 'Fresagem para hortícolas — 2.5 hectares',
    'Preparação fina do solo para sementeira de hortícolas. Terreno já lavrado e gradado, falta fresar.',
    ST_SetSRID(ST_MakePoint(-27.2180, 38.6680), 4326),
    'Sé', 'Angra do Heroísmo', 'Terceira', 2.5, 'hectares', 'MEDIUM',
    '2026-05-25', '2026-05-27',
    '{"area": 2.5, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '2 days'),

(2007, 2, 2, 'WITH_PROPOSALS', 'Aplicação de fungicida em vinha — 1.8 hectares',
    'Tratamento preventivo de míldio em vinha jovem. Atomização aérea de copa.',
    ST_SetSRID(ST_MakePoint(-27.2230, 38.6640), 4326),
    'São Pedro', 'Angra do Heroísmo', 'Terceira', 1.8, 'hectares', 'HIGH',
    '2026-05-21', '2026-05-22',
    '{"area": 1.8, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Sim"}'::jsonb,
    NOW() - INTERVAL '1 day'),

(2008, 2, 3, 'WITH_PROPOSALS', 'Colheita de cereal mecanizada — 4 hectares',
    'Colheita de aveia com ceifeira-debulhadora. Trabalho num único dia, sem chuva prevista.',
    ST_SetSRID(ST_MakePoint(-27.2090, 38.6600), 4326),
    'Posto Santo', 'Angra do Heroísmo', 'Terceira', 4.0, 'hectares', 'HIGH',
    '2026-05-24', '2026-05-24',
    '{"area": 4, "crop_type": "Aveia", "method": "Mecanizada"}'::jsonb,
    NOW() - INTERVAL '1 day'),

(2009, 2, 1, 'WITH_PROPOSALS', 'Subsolagem em pastagem compactada — 3 hectares',
    'Pastagem com problemas de drenagem após o inverno. Solo compactado, precisa de subsolagem para arejar.',
    ST_SetSRID(ST_MakePoint(-27.2700, 38.6750), 4326),
    'Cinco Ribeiras', 'Angra do Heroísmo', 'Terceira', 3.0, 'hectares', 'MEDIUM',
    '2026-05-27', '2026-05-29',
    '{"area": 3, "terrain_type": "Plano", "work_type": "Subsolagem", "accessibility": "Caminho de terra"}'::jsonb,
    NOW() - INTERVAL '2 days');


-- ── Proposals (status PENDING, provider 1 = AgroServiços Terceira) ──
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(2000, 2000, 1, 'PENDING', 280.00, 'FIXED',
    'Disponibilidade imediata. Trator de 120 CV com charrua reversível de 4 ferros. Trabalho previsto para 1 dia.',
    'Mão-de-obra, combustível, deslocação dentro da Terceira.',
    'Análise de solo, sementes ou correctivos.',
    '2026-05-26', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day'),

(2001, 2001, 1, 'PENDING', 220.00, 'FIXED',
    'Tratamento com pulverizador de 600 litros. Aplicação ao amanhecer para evitar vento.',
    'Mão-de-obra, deslocação, água, equipamento de aplicação.',
    'Produto herbicida (fornecido pelo cliente).',
    '2026-05-23', NOW() + INTERVAL '14 days', NOW() - INTERVAL '12 hours'),

(2002, 2002, 1, 'PENDING', 400.00, 'FIXED',
    'Enfardadeira para fardos quadrados pequenos (~25 kg cada). Equipa de 2 pessoas.',
    'Mão-de-obra, enfardadeira, cordel.',
    'Transporte dos fardos para o armazém (orçamento separado).',
    '2026-05-22', NOW() + INTERVAL '14 days', NOW() - INTERVAL '8 hours'),

(2003, 2003, 1, 'PENDING', 180.00, 'FIXED',
    'Camião de 7,5 toneladas com porta-paletes. Disponível na data pretendida.',
    'Camião, combustível, motorista, porta-paletes.',
    'Carga/descarga manual extra.',
    '2026-05-23', NOW() + INTERVAL '14 days', NOW() - INTERVAL '6 hours'),

(2004, 2004, 1, 'PENDING', 240.00, 'FIXED',
    'Destroçador agrícola montado em trator. 1 operador.',
    'Mão-de-obra, equipamento, combustível.',
    'Remoção dos restos (fica triturado no local).',
    '2026-05-27', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day'),

(2005, 2005, 1, 'PENDING', 380.00, 'FIXED',
    'Grade de discos pesada com trator de 140 CV. Trabalho previsto para 1 dia completo.',
    'Mão-de-obra, equipamento, combustível, deslocação.',
    'Análise de solo ou correctivos.',
    '2026-05-23', NOW() + INTERVAL '14 days', NOW() - INTERVAL '10 hours'),

(2006, 2006, 1, 'PENDING', 200.00, 'FIXED',
    'Fresa rotativa de 2 metros. Trabalho fino para sementeira.',
    'Mão-de-obra, equipamento, combustível.',
    'Sementes ou adubo.',
    '2026-05-26', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day'),

(2007, 2007, 1, 'PENDING', 160.00, 'FIXED',
    'Atomizador para vinha com bomba de 400 L. Aplicação cuidada na copa.',
    'Mão-de-obra, equipamento, água, deslocação.',
    'Produto fungicida (fornecido pelo cliente).',
    '2026-05-22', NOW() + INTERVAL '14 days', NOW() - INTERVAL '5 hours'),

(2008, 2008, 1, 'PENDING', 320.00, 'FIXED',
    'Ceifeira-debulhadora New Holland TC5070. 1 operador + reboque.',
    'Mão-de-obra, ceifeira, reboque, combustível.',
    'Armazenamento do cereal.',
    '2026-05-24', NOW() + INTERVAL '14 days', NOW() - INTERVAL '4 hours'),

(2009, 2009, 1, 'PENDING', 260.00, 'FIXED',
    'Subsolador de 5 dentes com trator de 140 CV. Profundidade até 45 cm.',
    'Mão-de-obra, equipamento, combustível, deslocação.',
    'Análise de solo.',
    '2026-05-28', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day');


-- ── Sequence resets ────────────────────────────────────────────
SELECT setval('service_requests_id_seq', GREATEST((SELECT MAX(id) FROM service_requests), (SELECT last_value FROM service_requests_id_seq)));
SELECT setval('proposals_id_seq',        GREATEST((SELECT MAX(id) FROM proposals),        (SELECT last_value FROM proposals_id_seq)));
