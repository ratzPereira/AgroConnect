-- ═══════════════════════════════════════════════════════════════
-- AgroConnect — Seed Data (Realistic Azores Demo)
-- All passwords: password123
-- BCrypt hash (strength 12): $2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa
-- ═══════════════════════════════════════════════════════════════

-- ── Users ──

-- Admin
INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(1, 'admin@agroconnect.pt', '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'ADMIN', TRUE, TRUE);

-- Clients (farmers)
INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(2, 'joao.silva@email.com',    '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT', TRUE, TRUE),
(3, 'maria.costa@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT', TRUE, TRUE),
(4, 'pedro.santos@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT', TRUE, TRUE),
(5, 'ana.ferreira@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'CLIENT', TRUE, TRUE);

-- Provider Managers
INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(6, 'agroservicos@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER', TRUE, TRUE),
(7, 'verdeacores@email.com',   '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER', TRUE, TRUE),
(8, 'jardinagem.pv@email.com', '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_MANAGER', TRUE, TRUE);

-- Provider Operators
INSERT INTO users (id, email, password_hash, role, email_verified, active) VALUES
(9,  'carlos.op@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE),
(10, 'miguel.op@email.com',  '$2a$12$LJ3m4ys3uz4HJ/TfUIWB5eXPQhykMlCmXJU/WJybkMO.WxWAJLqVa', 'PROVIDER_OPERATOR', TRUE, TRUE);

SELECT setval('users_id_seq', 10);

-- ── Client Profiles ──

INSERT INTO client_profiles (user_id, name, phone, location, parish, municipality, island, farm_type, total_area_ha) VALUES
(2, 'João Silva',     '+351 912 345 678', ST_SetSRID(ST_MakePoint(-27.2167, 38.6667), 4326), 'Sé',              'Angra do Heroísmo', 'Terceira',   'Pastagem',           12.5),
(3, 'Maria Costa',    '+351 913 456 789', ST_SetSRID(ST_MakePoint(-27.0667, 38.7333), 4326), 'Santa Cruz',       'Praia da Vitória',  'Terceira',   'Policultura',         8.0),
(4, 'Pedro Santos',   '+351 914 567 890', ST_SetSRID(ST_MakePoint(-25.6667, 37.7333), 4326), 'São Sebastião',    'Ponta Delgada',     'São Miguel', 'Horticultura',        5.0),
(5, 'Ana Ferreira',   '+351 915 678 901', ST_SetSRID(ST_MakePoint(-25.5167, 37.8167), 4326), 'Conceição',        'Ribeira Grande',    'São Miguel', 'Fruticultura',       15.0);

-- ── Provider Profiles ──

INSERT INTO provider_profiles (id, user_id, company_name, nif, phone, location, parish, municipality, island, service_radius_km, avg_rating, total_reviews, verified) VALUES
(1, 6, 'AgroServiços Terceira Lda',           '509123456', '+351 295 212 345', ST_SetSRID(ST_MakePoint(-27.2200, 38.6600), 4326), 'São Pedro',    'Angra do Heroísmo', 'Terceira',   40, 4.7, 23, TRUE),
(2, 7, 'Verde Açores — Serviços Agrícolas',   '509234567', '+351 296 301 456', ST_SetSRID(ST_MakePoint(-25.6700, 37.7400), 4326), 'Fajã de Baixo','Ponta Delgada',     'São Miguel', 50, 4.5, 15, TRUE),
(3, 8, 'João Pereira — Jardinagem e Manutenção','509345678', '+351 295 543 210', ST_SetSRID(ST_MakePoint(-27.0600, 38.7300), 4326), 'Santa Cruz',   'Praia da Vitória',  'Terceira',   15, 4.9,  8, TRUE);

SELECT setval('provider_profiles_id_seq', 3);

-- ── Service Categories ──

INSERT INTO service_categories (id, name, slug, description, pricing_models, form_schema, active, sort_order) VALUES
(1, 'Preparação de Solo', 'preparacao-solo',
    'Lavoura, gradagem, subsolagem e outros trabalhos de preparação do solo.',
    '{"FIXED","PER_UNIT"}',
    '{"fields": [
        {"name": "area", "label": "Área aproximada", "type": "number", "unit": "hectares", "required": true},
        {"name": "terrain_type", "label": "Tipo de terreno", "type": "select", "options": ["Plano", "Inclinado", "Pedregoso", "Húmido"], "required": true},
        {"name": "work_type", "label": "Tipo de trabalho", "type": "select", "options": ["Lavoura", "Gradagem", "Subsolagem", "Fresagem", "Outro"], "required": true},
        {"name": "accessibility", "label": "Acessibilidade", "type": "select", "options": ["Estrada alcatroada", "Caminho de terra", "Sem acesso direto"], "required": false}
    ]}'::jsonb, TRUE, 1),

(2, 'Tratamentos Fitossanitários', 'tratamentos',
    'Pulverização, aplicação de herbicidas, fungicidas e fertilizantes.',
    '{"FIXED","PER_UNIT"}',
    '{"fields": [
        {"name": "area", "label": "Área a tratar", "type": "number", "unit": "hectares", "required": true},
        {"name": "crop_type", "label": "Cultura", "type": "text", "required": true},
        {"name": "treatment_type", "label": "Tipo de tratamento", "type": "select", "options": ["Herbicida", "Fungicida", "Inseticida", "Fertilização", "Outro"], "required": true},
        {"name": "product_provided", "label": "Produto fornecido pelo prestador?", "type": "select", "options": ["Sim", "Não, forneço eu"], "required": true}
    ]}'::jsonb, TRUE, 2),

(3, 'Colheita', 'colheita',
    'Colheita mecanizada ou manual de culturas.',
    '{"FIXED","PER_UNIT"}',
    '{"fields": [
        {"name": "area", "label": "Área de colheita", "type": "number", "unit": "hectares", "required": true},
        {"name": "crop_type", "label": "Cultura a colher", "type": "text", "required": true},
        {"name": "method", "label": "Método", "type": "select", "options": ["Mecanizada", "Manual", "Mista"], "required": true}
    ]}'::jsonb, TRUE, 3),

(4, 'Transporte Agrícola', 'transporte',
    'Transporte de produtos, materiais ou maquinaria.',
    '{"FIXED"}',
    '{"fields": [
        {"name": "cargo_type", "label": "Tipo de carga", "type": "text", "required": true},
        {"name": "weight_tons", "label": "Peso estimado", "type": "number", "unit": "toneladas", "required": false},
        {"name": "origin", "label": "Origem", "type": "text", "required": true},
        {"name": "destination", "label": "Destino", "type": "text", "required": true}
    ]}'::jsonb, TRUE, 4),

(5, 'Limpeza de Terreno', 'limpeza-terreno',
    'Roça, desmatação, remoção de silvas e limpeza geral de terrenos.',
    '{"FIXED","PER_UNIT"}',
    '{"fields": [
        {"name": "area", "label": "Área a limpar", "type": "number", "unit": "hectares", "required": true},
        {"name": "vegetation_type", "label": "Tipo de vegetação", "type": "select", "options": ["Silvas/Mato baixo", "Árvores pequenas", "Misto", "Resíduos agrícolas"], "required": true},
        {"name": "waste_disposal", "label": "Destino dos resíduos", "type": "select", "options": ["Triturar no local", "Recolher e transportar", "Queima controlada"], "required": true}
    ]}'::jsonb, TRUE, 5),

(6, 'Vedação', 'vedacao',
    'Instalação ou reparação de vedações para parcelas e pastagens.',
    '{"FIXED","PER_UNIT"}',
    '{"fields": [
        {"name": "length_meters", "label": "Comprimento total", "type": "number", "unit": "metros", "required": true},
        {"name": "fence_type", "label": "Tipo de vedação", "type": "select", "options": ["Rede de arame", "Madeira", "Elétrica", "Mista"], "required": true},
        {"name": "work_type", "label": "Trabalho", "type": "select", "options": ["Instalação nova", "Reparação", "Substituição"], "required": true}
    ]}'::jsonb, TRUE, 6),

(7, 'Rega', 'rega',
    'Instalação, manutenção ou operação de sistemas de rega.',
    '{"FIXED"}',
    '{"fields": [
        {"name": "area", "label": "Área a regar", "type": "number", "unit": "hectares", "required": true},
        {"name": "system_type", "label": "Tipo de sistema", "type": "select", "options": ["Aspersão", "Gota a gota", "Pivot", "Gravidade", "Outro"], "required": true},
        {"name": "work_type", "label": "Trabalho", "type": "select", "options": ["Instalação nova", "Manutenção", "Reparação"], "required": true}
    ]}'::jsonb, TRUE, 7),

(8, 'Jardinagem', 'jardinagem',
    'Manutenção de jardins, corte de relva, poda de árvores e sebes.',
    '{"FIXED","RECURRING"}',
    '{"fields": [
        {"name": "area", "label": "Área do jardim", "type": "number", "unit": "m²", "required": true},
        {"name": "services", "label": "Serviços necessários", "type": "text", "required": true},
        {"name": "frequency", "label": "Frequência", "type": "select", "options": ["Pontual", "Semanal", "Quinzenal", "Mensal"], "required": true}
    ]}'::jsonb, TRUE, 8),

(9, 'Outros', 'outros',
    'Outros serviços agrícolas não listados nas categorias anteriores.',
    '{"FIXED"}',
    '{"fields": [
        {"name": "service_description", "label": "Descreva o serviço", "type": "textarea", "required": true}
    ]}'::jsonb, TRUE, 9);

SELECT setval('service_categories_id_seq', 9);

-- ── Provider Services (which categories each provider offers) ──

INSERT INTO provider_services (provider_id, category_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),  -- AgroServiços Terceira: solo, tratamentos, colheita, transporte, limpeza
(2, 1), (2, 2), (2, 3), (2, 5), (2, 6), (2, 7),  -- Verde Açores: solo, tratamentos, colheita, limpeza, vedação, rega
(3, 5), (3, 6), (3, 8);  -- João Pereira: limpeza, vedação, jardinagem

-- ── Service Requests ──

-- Request 1: PUBLISHED (waiting for proposals)
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(1, 2, 1, 'PUBLISHED', 'Lavoura de pastagem — 5 hectares',
    'Preciso de lavrar 5 hectares de pastagem para semear erva nova. O terreno é relativamente plano com acesso por caminho de terra. Já não é lavrado há 3 anos.',
    ST_SetSRID(ST_MakePoint(-27.2100, 38.6700), 4326),
    'Terra Chã', 'Angra do Heroísmo', 'Terceira', 5.0, 'hectares', 'MEDIUM',
    '2026-04-01', '2026-04-15',
    '{"area": 5, "terrain_type": "Plano", "work_type": "Lavoura", "accessibility": "Caminho de terra"}'::jsonb,
    '2026-04-01 23:59:59', NOW() - INTERVAL '2 days');

-- Request 2: WITH_PROPOSALS
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(2, 3, 5, 'WITH_PROPOSALS', 'Limpeza de terreno com silvas — 2 hectares',
    'Terreno abandonado há vários anos, coberto de silvas e mato alto. Preciso de limpeza completa para voltar a usar como pastagem. Acesso por estrada alcatroada.',
    ST_SetSRID(ST_MakePoint(-27.0700, 38.7350), 4326),
    'Lajes', 'Praia da Vitória', 'Terceira', 2.0, 'hectares', 'HIGH',
    '2026-03-25', '2026-03-30',
    '{"area": 2, "vegetation_type": "Silvas/Mato baixo", "waste_disposal": "Triturar no local"}'::jsonb,
    '2026-03-28 23:59:59', NOW() - INTERVAL '5 days');

-- Request 3: AWARDED (proposal accepted, pending execution)
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(3, 4, 2, 'AWARDED', 'Pulverização de vinha — 3 hectares',
    'Vinha com sinais de míldio, preciso de tratamento urgente com fungicida. Produto será fornecido por mim. Acesso bom.',
    ST_SetSRID(ST_MakePoint(-25.6700, 37.7300), 4326),
    'Fajã de Baixo', 'Ponta Delgada', 'São Miguel', 3.0, 'hectares', 'HIGH',
    '2026-03-20', '2026-03-22',
    '{"area": 3, "crop_type": "Vinha", "treatment_type": "Fungicida", "product_provided": "Não, forneço eu"}'::jsonb,
    NOW() - INTERVAL '7 days');

-- Request 4: COMPLETED
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(4, 2, 8, 'COMPLETED', 'Manutenção de jardim — corte de relva e poda',
    'Jardim de 500m² precisa de corte de relva e poda de duas sebes. Trabalho pontual.',
    ST_SetSRID(ST_MakePoint(-27.2200, 38.6650), 4326),
    'São Pedro', 'Angra do Heroísmo', 'Terceira', 500, 'm²', 'LOW',
    '2026-03-01', '2026-03-10',
    '{"area": 500, "services": "Corte de relva e poda de sebes", "frequency": "Pontual"}'::jsonb,
    NOW() - INTERVAL '20 days');

-- Request 5: RATED
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, created_at) VALUES
(5, 5, 1, 'RATED', 'Fresagem para plantação de batata — 1.5 hectares',
    'Preparação de solo para batata-doce. Terreno foi pastagem, precisa de fresagem fina. Acesso bom por estrada.',
    ST_SetSRID(ST_MakePoint(-25.5200, 37.8100), 4326),
    'Conceição', 'Ribeira Grande', 'São Miguel', 1.5, 'hectares', 'MEDIUM',
    '2026-02-15', '2026-02-25',
    '{"area": 1.5, "terrain_type": "Plano", "work_type": "Fresagem", "accessibility": "Estrada alcatroada"}'::jsonb,
    NOW() - INTERVAL '30 days');

-- Request 6: PUBLISHED (São Miguel)
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(6, 4, 6, 'PUBLISHED', 'Vedação nova para pastagem — 400 metros',
    'Preciso de instalar vedação de arame em redor de uma pastagem nova. Terreno plano, postes já estão no local.',
    ST_SetSRID(ST_MakePoint(-25.6600, 37.7400), 4326),
    'Arrifes', 'Ponta Delgada', 'São Miguel', 400, 'metros', 'LOW',
    '2026-04-10', '2026-04-30',
    '{"length_meters": 400, "fence_type": "Rede de arame", "work_type": "Instalação nova"}'::jsonb,
    '2026-04-15 23:59:59', NOW() - INTERVAL '1 day');

-- Request 7: PUBLISHED (Terceira)
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, preferred_date_from, preferred_date_to, form_data, expires_at, created_at) VALUES
(7, 3, 3, 'PUBLISHED', 'Colheita de milho — 4 hectares',
    'Milho pronto para colher, preciso de máquina de colheita. Terreno acessível, sem pedras.',
    ST_SetSRID(ST_MakePoint(-27.0800, 38.7200), 4326),
    'Fonte do Bastardo', 'Praia da Vitória', 'Terceira', 4.0, 'hectares', 'HIGH',
    '2026-04-05', '2026-04-10',
    '{"area": 4, "crop_type": "Milho", "method": "Mecanizada"}'::jsonb,
    '2026-04-08 23:59:59', NOW() - INTERVAL '1 day');

-- Request 8: CANCELLED
INSERT INTO service_requests (id, client_id, category_id, status, title, description, location, parish, municipality, island, area, area_unit, urgency, form_data, created_at) VALUES
(8, 5, 4, 'CANCELLED', 'Transporte de fardos de feno',
    'Preciso de transportar 50 fardos de feno redondos do campo para o armazém. Distância de 8km.',
    ST_SetSRID(ST_MakePoint(-25.5100, 37.8200), 4326),
    'Ribeirinha', 'Ribeira Grande', 'São Miguel', NULL, NULL, 'LOW',
    '{"cargo_type": "Fardos de feno redondos (50 unidades)", "weight_tons": 25, "origin": "Campo em Ribeirinha", "destination": "Armazém em Conceição"}'::jsonb,
    NOW() - INTERVAL '15 days');

SELECT setval('service_requests_id_seq', 8);

-- ── Proposals ──

-- Proposals for Request 2 (WITH_PROPOSALS — limpeza de terreno)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at) VALUES
(1, 2, 1, 'PENDING', 320.00, 'PER_UNIT', 160.00, 2, 'Limpeza com tractor de rastos e destroçador. Trabalho completo em 1 dia.',
    'Destroçamento completo, recolha de material grosso', 'Remoção de pedras, nivelamento',
    '2026-03-27', '2026-03-30 23:59:59', NOW() - INTERVAL '3 days'),
(2, 2, 3, 'PENDING', 280.00, 'PER_UNIT', 140.00, 2, 'Roça com moto-roçadora e posterior trituração mecânica. 2 dias de trabalho.',
    'Roça completa, trituração dos resíduos no local', 'Remoção de cepos de árvores',
    '2026-03-28', '2026-03-30 23:59:59', NOW() - INTERVAL '2 days');

-- Proposal for Request 3 (AWARDED — pulverização)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(3, 3, 2, 'ACCEPTED', 210.00, 'PER_UNIT', 70.00, 3, 'Pulverização com atomizador de 600L montado em tractor. Operador experiente em vinha.',
    'Mão de obra, tractor com atomizador, deslocação', 'Produto fitossanitário (fornecido pelo cliente)',
    '2026-03-21', NOW() - INTERVAL '6 days');

-- Proposals for Request 4 (COMPLETED — jardinagem)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(4, 4, 3, 'ACCEPTED', 75.00, 'FIXED', 'Corte de relva com tractor-cortador e poda manual das duas sebes. Meio dia de trabalho.',
    'Corte de relva, poda de sebes, recolha de resíduos', 'Adubação, plantação',
    '2026-03-05', NOW() - INTERVAL '18 days');

-- Proposals for Request 5 (RATED — fresagem)
INSERT INTO proposals (id, request_id, provider_id, status, price, pricing_model, unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, created_at) VALUES
(5, 5, 2, 'ACCEPTED', 180.00, 'PER_UNIT', 120.00, 1.5, 'Fresagem com fresa de 2m montada em tractor 90cv. Solo fica pronto para plantação.',
    'Fresagem fina, 2 passagens cruzadas', 'Remoção de pedras, adubação',
    '2026-02-20', NOW() - INTERVAL '28 days');

SELECT setval('proposals_id_seq', 5);

-- ── Transactions ──

-- Transaction for Request 4 (COMPLETED — RELEASED)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(1, 4, 4, 75.00, 0.12, 9.00, 66.00, 'RELEASED', NOW() - INTERVAL '17 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '18 days');

-- Transaction for Request 5 (RATED — RELEASED)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, released_at, created_at) VALUES
(2, 5, 5, 180.00, 0.12, 21.60, 158.40, 'RELEASED', NOW() - INTERVAL '27 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '28 days');

-- Transaction for Request 3 (AWARDED — HELD)
INSERT INTO transactions (id, request_id, proposal_id, amount, commission_rate, commission_amount, provider_payout, status, held_at, created_at) VALUES
(3, 3, 3, 210.00, 0.12, 25.20, 184.80, 'HELD', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days');

SELECT setval('transactions_id_seq', 3);

-- ── Team Members ──

INSERT INTO team_members (id, provider_id, user_id, name, email, phone, role, active, joined_at) VALUES
(1, 1, 6, 'António Mendes',  'agroservicos@email.com', '+351 295 212 345', 'MANAGER',  TRUE, NOW() - INTERVAL '365 days'),
(2, 1, 9, 'Carlos Oliveira', 'carlos.op@email.com',    '+351 916 789 012', 'OPERATOR', TRUE, NOW() - INTERVAL '200 days'),
(3, 2, 7, 'Ricardo Sousa',   'verdeacores@email.com',  '+351 296 301 456', 'MANAGER',  TRUE, NOW() - INTERVAL '300 days'),
(4, 2, 10,'Miguel Tavares',  'miguel.op@email.com',    '+351 917 890 123', 'OPERATOR', TRUE, NOW() - INTERVAL '150 days'),
(5, 3, 8, 'João Pereira',    'jardinagem.pv@email.com','+351 295 543 210', 'MANAGER',  TRUE, NOW() - INTERVAL '180 days');

SELECT setval('team_members_id_seq', 5);

-- ── Machines ──

INSERT INTO machines (id, provider_id, name, type, description, status, license_plate, last_maintenance_date, next_maintenance_date) VALUES
(1, 1, 'New Holland T5.120',   'Tractor',       'Tractor 120cv com cabina fechada',              'AVAILABLE', 'AA-12-BB', '2026-01-15', '2026-07-15'),
(2, 1, 'Grade de discos 28"',  'Alfaia',        'Grade de discos de 28 polegadas, 2.5m largura', 'AVAILABLE', NULL,       '2026-02-01', '2026-08-01'),
(3, 1, 'Destroçador florestal', 'Alfaia',       'Destroçador para limpeza de mato e silvas',     'IN_USE',    NULL,       '2026-01-20', '2026-07-20'),
(4, 2, 'John Deere 6130M',     'Tractor',       'Tractor 130cv, ideal para trabalhos pesados',   'AVAILABLE', 'CC-34-DD', '2026-02-10', '2026-08-10'),
(5, 2, 'Atomizador 600L',      'Pulverizador',  'Atomizador montado de 600 litros',              'IN_USE',    NULL,       '2026-03-01', '2026-09-01'),
(6, 2, 'Fresa 2m',             'Alfaia',        'Fresa rotativa de 2 metros',                    'AVAILABLE', NULL,       '2026-02-15', '2026-08-15'),
(7, 3, 'Kubota L3560',         'Tractor',       'Tractor compacto 36cv para jardinagem',         'AVAILABLE', 'EE-56-FF', '2026-03-01', '2026-09-01'),
(8, 3, 'Moto-roçadora Stihl',  'Ferramenta',    'Moto-roçadora profissional 45cc',               'AVAILABLE', NULL,       '2026-02-20', '2026-05-20');

SELECT setval('machines_id_seq', 8);

-- ── Inventory ──

INSERT INTO inventory (id, provider_id, product_name, unit, quantity, min_stock_alert, cost_per_unit) VALUES
(1, 1, 'Gasóleo agrícola',          'L',    800,  200,  1.15),
(2, 1, 'Óleo hidráulico',           'L',     50,   15,  4.50),
(3, 2, 'Gasóleo agrícola',          'L',    1200, 300,  1.15),
(4, 2, 'Adubo NPK 7-14-14',        'KG',   500,  100,  0.85),
(5, 2, 'Fungicida (cobre)',         'L',     80,   20, 12.00),
(6, 3, 'Gasóleo',                   'L',    150,   50,  1.55),
(7, 3, 'Fio de corte (roçadora)',   'UNIT',  20,    5,  3.50);

SELECT setval('inventory_id_seq', 7);

-- ── Service Executions ──

-- Execution for Request 4 (COMPLETED — jardinagem)
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, created_at) VALUES
(1, 4,
    ST_SetSRID(ST_MakePoint(-27.2195, 38.6652), 4326),
    NOW() - INTERVAL '16 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '16 days' + INTERVAL '13 hours',
    'Trabalho concluído sem problemas. Relva cortada a 5cm, sebes podadas em forma rectangular.',
    '[{"product": "Gasóleo", "quantity": 5, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '16 days' + INTERVAL '13 hours',
    NOW() - INTERVAL '17 days');

-- Execution for Request 5 (RATED — fresagem)
INSERT INTO service_executions (id, proposal_id, checkin_location, checkin_time, checkout_time, notes, materials_used, completed_at, created_at) VALUES
(2, 5,
    ST_SetSRID(ST_MakePoint(-25.5198, 37.8102), 4326),
    NOW() - INTERVAL '25 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '25 days' + INTERVAL '15 hours',
    'Fresagem concluída em 2 passagens cruzadas. Solo ficou em excelentes condições para plantação de batata-doce.',
    '[{"product": "Gasóleo agrícola", "quantity": 45, "unit": "L"}]'::jsonb,
    NOW() - INTERVAL '25 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '26 days');

SELECT setval('service_executions_id_seq', 2);

-- ── Execution Assignments ──

INSERT INTO execution_assignments (execution_id, team_member_id, machine_id) VALUES
(1, 5, 7),   -- João Pereira (jardinagem) + Kubota
(2, 4, 4);   -- Miguel Tavares (fresagem) + John Deere + Fresa (implicit via provider)

-- ── Reviews ──

-- Reviews for Request 5 (RATED — both parties reviewed)
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(1, 5, 5, 7, 5, 'Excelente trabalho! O solo ficou perfeitamente preparado para a plantação. O operador foi muito profissional e o serviço foi rápido. Recomendo vivamente a Verde Açores.', NOW() - INTERVAL '23 days'),
(2, 5, 7, 5, 5, 'Cliente muito simpática e prestável. Terreno estava bem acessível e tudo conforme combinado. Fácil de trabalhar.', NOW() - INTERVAL '22 days');

-- Reviews for Request 4 (COMPLETED — only client reviewed so far)
INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment, created_at) VALUES
(3, 4, 2, 8, 5, 'Trabalho impecável! O jardim ficou como novo. O João é muito cuidadoso e atento aos detalhes. Já marquei nova visita para o próximo mês.', NOW() - INTERVAL '13 days');

SELECT setval('reviews_id_seq', 3);

-- ── Notifications ──

INSERT INTO notifications (user_id, type, title, body, data, read, created_at) VALUES
(2, 'PROPOSAL_RECEIVED', 'Nova proposta recebida', 'Recebeu uma proposta para o seu pedido de limpeza de terreno.', '{"requestId": 2, "proposalId": 1}'::jsonb, TRUE, NOW() - INTERVAL '3 days'),
(2, 'PROPOSAL_RECEIVED', 'Nova proposta recebida', 'Recebeu uma segunda proposta para o seu pedido de limpeza de terreno.', '{"requestId": 2, "proposalId": 2}'::jsonb, FALSE, NOW() - INTERVAL '2 days'),
(4, 'PROPOSAL_ACCEPTED', 'Proposta aceite!', 'A sua proposta para pulverização de vinha foi aceite pelo cliente.', '{"requestId": 3, "proposalId": 3}'::jsonb, TRUE, NOW() - INTERVAL '6 days'),
(2, 'EXECUTION_COMPLETED', 'Serviço concluído', 'O prestador marcou o serviço de jardinagem como concluído. Por favor confirme.', '{"requestId": 4}'::jsonb, TRUE, NOW() - INTERVAL '16 days'),
(5, 'REVIEW_RECEIVED', 'Nova avaliação', 'Recebeu uma avaliação de 5 estrelas pela fresagem.', '{"requestId": 5, "reviewId": 2}'::jsonb, TRUE, NOW() - INTERVAL '22 days');
