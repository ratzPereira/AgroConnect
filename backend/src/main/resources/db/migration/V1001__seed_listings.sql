-- ═══════════════════════════════════════════════════════════════
-- V1001 — Seed Listings (Marketplace — Realistic Azores Data)
-- Builds on V999 (users 1-10) and V1000 (users 11-15).
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PART 1 — Listings
-- ═══════════════════════════════════════════════════════════════

-- ── ANIMALS (4 listings) ──

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(1, 2, 'ANIMALS',
 'Vacas leiteiras Holstein — 3 cabeças',
 'Vendo 3 vacas leiteiras Holstein, saudáveis e vacinadas. Produção média de 25 litros/dia por cabeça. Registadas na AASM. Documentação sanitária em dia.',
 1200.00, true, NULL, 3, 'cabeças',
 ST_SetSRID(ST_MakePoint(-27.2167, 38.6553), 4326),
 'Angra do Heroísmo', 'Sé', 'Angra do Heroísmo', 'Terceira',
 'ACTIVE', 42, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(2, 4, 'ANIMALS',
 'Galinhas poedeiras Sussex — 20 unidades',
 'Galinhas poedeiras raça Sussex com 8 meses. Excelentes produtoras (280+ ovos/ano). Criadas ao ar livre com alimentação biológica. Entrego na zona de Ponta Delgada.',
 8.00, false, NULL, 20, 'unidades',
 ST_SetSRID(ST_MakePoint(-25.6687, 37.7483), 4326),
 'Ponta Delgada', 'São Sebastião', 'Ponta Delgada', 'São Miguel',
 'ACTIVE', 28, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(3, 11, 'ANIMALS',
 'Vitelos Angus para engorda — 5 cabeças',
 'Vitelos Aberdeen Angus com 4 meses, desmamados e desparasitados. Boa genética para engorda. Pais com certificado de mérito. Possibilidade de entrega na ilha.',
 800.00, true, NULL, 5, 'cabeças',
 ST_SetSRID(ST_MakePoint(-28.7153, 38.5328), 4326),
 'Horta', 'Horta', 'Horta', 'Faial',
 'ACTIVE', 17, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(4, 3, 'ANIMALS',
 'Coelhos reprodutores — 10 pares',
 'Coelhos reprodutores de raça mista, excelentes para criação. Animais saudáveis com cartão sanitário. Ideais para exploração de carne ou como animais de companhia.',
 25.00, false, NULL, 10, 'pares',
 ST_SetSRID(ST_MakePoint(-27.0597, 38.7327), 4326),
 'Praia da Vitória', 'Santa Cruz', 'Praia da Vitória', 'Terceira',
 'ACTIVE', 9, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '90 days');


-- ── PLANTS (4 listings) ──

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(5, 4, 'PLANTS',
 'Mudas de pitaya orgânica',
 'Mudas de pitaya (dragon fruit) cultivadas em modo biológico. Variedade adaptada ao clima açoriano. Prontas para transplante, com raiz bem desenvolvida. Instruções de cultivo incluídas.',
 15.00, false, NULL, 40, 'mudas',
 ST_SetSRID(ST_MakePoint(-25.6687, 37.7483), 4326),
 'Ponta Delgada', 'São Sebastião', 'Ponta Delgada', 'São Miguel',
 'ACTIVE', 63, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(6, 12, 'PLANTS',
 'Bananeiras anãs (Dwarf Cavendish) — 50 mudas',
 'Mudas de bananeira anã Dwarf Cavendish com 30-40cm de altura. Variedade produtiva e resistente ao vento. Ideal para explorações em São Miguel. Desconto para compras acima de 20 mudas.',
 8.00, true, NULL, 50, 'mudas',
 ST_SetSRID(ST_MakePoint(-25.5169, 37.8126), 4326),
 'Ribeira Grande', 'Conceição', 'Ribeira Grande', 'São Miguel',
 'ACTIVE', 35, NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(7, 11, 'PLANTS',
 'Hortênsias azuis dos Açores — 30 mudas',
 'Mudas de hortênsia azul (Hydrangea macrophylla) típica dos Açores. Plantas com 2 anos, envasadas em vaso de 3L. Cores intensas garantidas pelo solo vulcânico ácido.',
 5.00, false, NULL, 30, 'mudas',
 ST_SetSRID(ST_MakePoint(-28.7153, 38.5328), 4326),
 'Horta', 'Flamengos', 'Horta', 'Faial',
 'SOLD', 51, NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days', NOW() + INTERVAL '65 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(8, 2, 'PLANTS',
 'Ananás dos Açores — mudas certificadas de estufa',
 'Mudas certificadas de ananás dos Açores (Ananas comosus) provenientes de estufas tradicionais. Processo de cultivo com 2 anos até à maturação. Variedade exclusiva da região.',
 3.00, false, NULL, 100, 'mudas',
 ST_SetSRID(ST_MakePoint(-25.6687, 37.7483), 4326),
 'Ponta Delgada', 'Fajã de Baixo', 'Ponta Delgada', 'São Miguel',
 'ACTIVE', 78, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days');


-- ── SEEDS (3 listings) ──

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(9, 3, 'SEEDS',
 'Sementes pastagem permanente — saco 20kg',
 'Mistura de sementes para pastagem permanente (azevém, trevo branco, festuca). Certificadas e adaptadas ao clima atlântico dos Açores. Rendimento: 1 saco por 0.5 hectare.',
 45.00, false, NULL, 15, 'sacos',
 ST_SetSRID(ST_MakePoint(-27.0597, 38.7327), 4326),
 'Praia da Vitória', 'Santa Cruz', 'Praia da Vitória', 'Terceira',
 'ACTIVE', 22, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(10, 4, 'SEEDS',
 'Sementes milho forrageiro — saco 20kg',
 'Sementes de milho forrageiro variedade P8521 (Pioneer), ciclo FAO 300. Ideal para silagem em condições açorianas. Boa resistência à humidade.',
 35.00, false, NULL, 20, 'sacos',
 ST_SetSRID(ST_MakePoint(-25.6687, 37.7483), 4326),
 'Ponta Delgada', 'São Sebastião', 'Ponta Delgada', 'São Miguel',
 'ACTIVE', 14, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(11, 11, 'SEEDS',
 'Mistura hortícola biológica (tomate, pimento, courgette)',
 'Pack de sementes biológicas certificadas: tomate coração-de-boi, pimento verde, courgette. Variedades adaptadas à altitude e humidade do Faial. Germinação >90%.',
 12.00, false, NULL, 30, 'packs',
 ST_SetSRID(ST_MakePoint(-28.7153, 38.5328), 4326),
 'Horta', 'Horta', 'Horta', 'Faial',
 'ACTIVE', 11, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() + INTERVAL '90 days');


-- ── PRODUCE (4 listings) ──

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(12, 12, 'PRODUCE',
 'Queijo São Jorge DOP — curado 7 meses',
 'Queijo São Jorge DOP com cura de 7 meses. Produção artesanal em cooperativa local. Sabor intenso e picante característico. Vendido em peças inteiras (~8kg) ou meias peças.',
 18.00, false, NULL, 10, 'kg',
 ST_SetSRID(ST_MakePoint(-28.2074, 38.6789), 4326),
 'Velas', 'Velas', 'Velas', 'São Jorge',
 'ACTIVE', 55, NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(13, 14, 'PRODUCE',
 'Mel multifloral dos Açores — frascos 500g',
 'Mel multifloral produzido na ilha das Flores, com certificação de origem. Flora predominante: incenso, urze e faia. Extraído a frio. Disponível em frascos de 500g.',
 12.00, false, NULL, 40, 'frascos',
 ST_SetSRID(ST_MakePoint(-31.1279, 39.4533), 4326),
 'Santa Cruz das Flores', 'Santa Cruz', 'Santa Cruz das Flores', 'Flores',
 'ACTIVE', 33, NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(14, 2, 'PRODUCE',
 'Ananás dos Açores — caixa 6 unidades',
 'Ananás dos Açores (Ananas comosus) colhidos no ponto ideal de maturação. Sabor doce e aroma intenso. Caixas de 6 unidades com calibre uniforme. Envio inter-ilhas disponível.',
 15.00, false, NULL, 20, 'caixas',
 ST_SetSRID(ST_MakePoint(-25.6687, 37.7483), 4326),
 'Ponta Delgada', 'Fajã de Baixo', 'Ponta Delgada', 'São Miguel',
 'SOLD', 89, NOW() - INTERVAL '35 days', NOW() - INTERVAL '10 days', NOW() + INTERVAL '55 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(15, 3, 'PRODUCE',
 'Leite fresco de vaca — entrega diária',
 'Leite fresco de vaca não pasteurizado, de exploração com pastagem natural. Entrega diária na zona da Praia da Vitória. Mínimo 5 litros por encomenda. Vacas alimentadas a pasto o ano inteiro.',
 0.80, false, NULL, 50, 'litros',
 ST_SetSRID(ST_MakePoint(-27.0597, 38.7327), 4326),
 'Praia da Vitória', 'Santa Cruz', 'Praia da Vitória', 'Terceira',
 'ACTIVE', 19, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '90 days');


-- ── EQUIPMENT (3 listings) ──

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(16, 6, 'EQUIPMENT',
 'Grade de discos usada — 28 discos',
 'Grade de discos com 28 discos de 24 polegadas. Marca Galucho, modelo GL. Em bom estado de funcionamento, discos com desgaste normal. Ideal para preparação de solo em parcelas médias.',
 2500.00, true, 'USED', 1, 'unidade',
 ST_SetSRID(ST_MakePoint(-27.2167, 38.6553), 4326),
 'Angra do Heroísmo', 'São Pedro', 'Angra do Heroísmo', 'Terceira',
 'ACTIVE', 31, NOW() - INTERVAL '22 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(17, 7, 'EQUIPMENT',
 'Pulverizador costal 16L — novo',
 'Pulverizador costal de 16 litros, marca Matabi Super Green 16. Novo em caixa. Bomba de pressão regulável, bico ajustável. Garantia de fábrica de 2 anos.',
 85.00, false, 'NEW', 5, 'unidades',
 ST_SetSRID(ST_MakePoint(-25.6687, 37.7483), 4326),
 'Ponta Delgada', 'Fajã de Baixo', 'Ponta Delgada', 'São Miguel',
 'ACTIVE', 15, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NOW() + INTERVAL '90 days');

INSERT INTO listings (id, seller_id, category, title, description, price, price_negotiable, condition, quantity, unit, location, location_name, parish, municipality, island, status, views_count, created_at, updated_at, expires_at)
VALUES
(18, 13, 'EQUIPMENT',
 'Sistema rega gota-a-gota completo — 100m',
 'Kit completo de rega gota-a-gota para 100 metros lineares. Inclui tubo PE 16mm, gotejadores autocompensantes (2L/h), filtro, conectores e válvulas. Usado apenas uma temporada.',
 180.00, true, 'LIKE_NEW', 1, 'kit',
 ST_SetSRID(ST_MakePoint(-28.7153, 38.5328), 4326),
 'Horta', 'Flamengos', 'Horta', 'Faial',
 'DRAFT', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days');

SELECT setval('listings_id_seq', (SELECT MAX(id) FROM listings));


-- ═══════════════════════════════════════════════════════════════
-- PART 2 — Listing Photos
-- ═══════════════════════════════════════════════════════════════

INSERT INTO listing_photos (id, listing_id, photo_url, sort_order) VALUES
(1,  1,  '/api/v1/placeholder/listing-1a.jpg', 0),
(2,  1,  '/api/v1/placeholder/listing-1b.jpg', 1),
(3,  2,  '/api/v1/placeholder/listing-2a.jpg', 0),
(4,  3,  '/api/v1/placeholder/listing-3a.jpg', 0),
(5,  3,  '/api/v1/placeholder/listing-3b.jpg', 1),
(6,  5,  '/api/v1/placeholder/listing-5a.jpg', 0),
(7,  5,  '/api/v1/placeholder/listing-5b.jpg', 1),
(8,  6,  '/api/v1/placeholder/listing-6a.jpg', 0),
(9,  7,  '/api/v1/placeholder/listing-7a.jpg', 0),
(10, 8,  '/api/v1/placeholder/listing-8a.jpg', 0),
(11, 12, '/api/v1/placeholder/listing-12a.jpg', 0),
(12, 12, '/api/v1/placeholder/listing-12b.jpg', 1),
(13, 13, '/api/v1/placeholder/listing-13a.jpg', 0),
(14, 14, '/api/v1/placeholder/listing-14a.jpg', 0),
(15, 14, '/api/v1/placeholder/listing-14b.jpg', 1),
(16, 16, '/api/v1/placeholder/listing-16a.jpg', 0),
(17, 16, '/api/v1/placeholder/listing-16b.jpg', 1),
(18, 17, '/api/v1/placeholder/listing-17a.jpg', 0);

SELECT setval('listing_photos_id_seq', (SELECT MAX(id) FROM listing_photos));


-- ═══════════════════════════════════════════════════════════════
-- PART 3 — Conversations & Messages
-- ═══════════════════════════════════════════════════════════════

-- Conversation 1: Buyer (user 5, Ana Ferreira) asks seller (user 2, João Silva) about cow health
INSERT INTO listing_conversations (id, listing_id, buyer_id, last_message_at, created_at)
VALUES (1, 1, 5, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days');

INSERT INTO listing_messages (id, conversation_id, sender_id, content, sent_at) VALUES
(1, 1, 5,
 'Bom dia! As vacas Holstein ainda estão disponíveis? Gostava de saber se têm o boletim sanitário atualizado e se foram testadas para brucelose e tuberculose.',
 NOW() - INTERVAL '3 days'),
(2, 1, 2,
 'Boa tarde, Ana! Sim, ainda estão disponíveis. Todas as 3 vacas foram testadas recentemente — resultados negativos para brucelose e tuberculose. Posso enviar cópia do boletim sanitário.',
 NOW() - INTERVAL '2 days' + INTERVAL '4 hours'),
(3, 1, 5,
 'Ótimo! Pode enviar sim. E qual é a produção média diária de cada uma? Estou a pensar em ampliar o meu rebanho.',
 NOW() - INTERVAL '2 days' + INTERVAL '6 hours'),
(4, 1, 2,
 'A média é de 25 litros/dia por cabeça. A melhor produtora chega aos 28L. São vacas de 3ª lactação, ainda têm bons anos pela frente. Se quiser, pode vir ver ao estábulo.',
 NOW() - INTERVAL '1 day');

-- Conversation 2: Buyer (user 12, Tomas Aguiar) negotiates price on equipment with seller (user 6, AgroServiços Terceira)
INSERT INTO listing_conversations (id, listing_id, buyer_id, last_message_at, created_at)
VALUES (2, 16, 12, NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days');

INSERT INTO listing_messages (id, conversation_id, sender_id, content, sent_at) VALUES
(5, 2, 12,
 'Boa tarde. Vi o anúncio da grade de discos e estou interessado. Seria possível fazer por €2000? Tratando-se de material usado, parece-me um valor mais justo.',
 NOW() - INTERVAL '5 days'),
(6, 2, 6,
 'Olá, Tomas. A grade está em muito bom estado, os discos foram afiados há pouco tempo. Consigo baixar para €2300, que é o mínimo. Incluo o transporte até ao porto de Angra.',
 NOW() - INTERVAL '4 days'),
(7, 2, 12,
 'Entendo. Se incluir o transporte até ao porto para embarque para o Pico, aceito os €2300. Quando posso ir ver a grade?',
 NOW() - INTERVAL '3 days'),
(8, 2, 6,
 'Pode vir qualquer dia da semana das 8h às 17h. Estamos na zona industrial de São Pedro, Angra do Heroísmo. Pergunto pelo Sr. Manuel no armazém.',
 NOW() - INTERVAL '2 days');

-- Conversation 3: Buyer (user 3, Maria Costa) asks about delivery for produce (mel)
INSERT INTO listing_conversations (id, listing_id, buyer_id, last_message_at, created_at)
VALUES (3, 13, 3, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 days');

INSERT INTO listing_messages (id, conversation_id, sender_id, content, sent_at) VALUES
(9, 3, 3,
 'Olá! Estou interessada em encomendar 10 frascos de mel. Fazem envio para a Terceira?',
 NOW() - INTERVAL '2 days'),
(10, 3, 14,
 'Boa tarde, Maria! Sim, fazemos envio inter-ilhas por correio registado. Para 10 frascos, o portes ficam em €8. Embalamos com muito cuidado para não partir.',
 NOW() - INTERVAL '1 day' + INTERVAL '3 hours'),
(11, 3, 3,
 'Perfeito! Quero então 10 frascos. Como faço o pagamento?',
 NOW() - INTERVAL '6 hours');

SELECT setval('listing_conversations_id_seq', (SELECT MAX(id) FROM listing_conversations));
SELECT setval('listing_messages_id_seq', (SELECT MAX(id) FROM listing_messages));


-- ═══════════════════════════════════════════════════════════════
-- PART 4 — Favorites
-- ═══════════════════════════════════════════════════════════════

INSERT INTO listing_favorites (id, listing_id, user_id, created_at) VALUES
(1, 1,  5,  NOW() - INTERVAL '10 days'),
(2, 5,  3,  NOW() - INTERVAL '8 days'),
(3, 12, 2,  NOW() - INTERVAL '7 days'),
(4, 12, 5,  NOW() - INTERVAL '5 days'),
(5, 8,  11, NOW() - INTERVAL '4 days'),
(6, 16, 12, NOW() - INTERVAL '3 days');

SELECT setval('listing_favorites_id_seq', (SELECT MAX(id) FROM listing_favorites));
