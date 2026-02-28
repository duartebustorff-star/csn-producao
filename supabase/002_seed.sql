-- CSN Produção — Dados de teste
-- Correr DEPOIS do 001_schema.sql

-- ============================================
-- COLABORADORES
-- ============================================

INSERT INTO colaboradores (id, nome, funcao, avatar, pin, lang, role) VALUES
  ('duarte', 'Duarte', 'Gestor', '📋', '1234', 'pt', 'admin'),
  ('bohdan', 'Bohdan', 'Operador', '⚙️', '2222', 'ua', 'worker'),
  ('joao', 'João António', 'Operador', '🔧', '1111', 'pt', 'worker'),
  ('jose', 'José Julio', 'Operador', '🎨', '3333', 'pt', 'worker');

-- ============================================
-- OBRAS
-- ============================================

INSERT INTO obras (id, cliente, tipo, estado) VALUES
  ('2025-007', 'Transportes Silva & Filhos', 'Caixa Aberta 7.5m', 'producao'),
  ('2025-008', 'Câmara Municipal de Mafra', 'Plataforma Basculante 3.5t', 'producao'),
  ('2025-009', 'Construtora Lopes', 'Estrado c/ Grua 12t', 'espera');

-- ============================================
-- FASES — Obra 2025-007 (avançada, soldadura em curso)
-- ============================================

INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais, notas) VALUES
  ('2025-007', 1, 'Corte', 'concluido', 'bohdan', 8.5, NULL),
  ('2025-007', 2, 'Quinagem', 'concluido', 'bohdan', 5, NULL),
  ('2025-007', 3, 'Assembly', 'concluido', 'bohdan', 12, NULL),
  ('2025-007', 4, 'Soldadura', 'em_curso', 'joao', 6, 'Longarinas dianteiras feitas'),
  ('2025-007', 5, 'Pintura', 'pendente', 'jose', 0, NULL),
  ('2025-007', 6, 'Montagem taipais', 'pendente', 'jose', 0, NULL),
  ('2025-007', 7, 'Eletricidade', 'pendente', 'bohdan', 0, NULL),
  ('2025-007', 8, 'Palas e extras', 'pendente', 'joao', 0, NULL),
  ('2025-007', 9, 'Pesagem', 'pendente', 'duarte', 0, NULL);

-- ============================================
-- FASES — Obra 2025-008 (início, corte em curso)
-- ============================================

INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais, notas) VALUES
  ('2025-008', 1, 'Corte', 'em_curso', 'bohdan', 3, 'A cortar perfis HEB'),
  ('2025-008', 2, 'Quinagem', 'pendente', 'bohdan', 0, NULL),
  ('2025-008', 3, 'Assembly', 'pendente', 'bohdan', 0, NULL),
  ('2025-008', 4, 'Soldadura', 'pendente', 'joao', 0, NULL),
  ('2025-008', 5, 'Pintura', 'pendente', 'jose', 0, NULL),
  ('2025-008', 6, 'Montagem taipais', 'pendente', 'jose', 0, NULL),
  ('2025-008', 7, 'Eletricidade', 'pendente', 'bohdan', 0, NULL),
  ('2025-008', 8, 'Palas e extras', 'pendente', 'joao', 0, NULL),
  ('2025-008', 9, 'Pesagem', 'pendente', 'duarte', 0, NULL);

-- ============================================
-- FASES — Obra 2025-009 (em espera, tudo pendente)
-- ============================================

INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
  ('2025-009', 1, 'Corte', 'pendente', 'bohdan', 0),
  ('2025-009', 2, 'Quinagem', 'pendente', 'bohdan', 0),
  ('2025-009', 3, 'Assembly', 'pendente', 'bohdan', 0),
  ('2025-009', 4, 'Soldadura', 'pendente', 'joao', 0),
  ('2025-009', 5, 'Pintura', 'pendente', 'jose', 0),
  ('2025-009', 6, 'Montagem taipais', 'pendente', 'jose', 0),
  ('2025-009', 7, 'Eletricidade', 'pendente', 'bohdan', 0),
  ('2025-009', 8, 'Palas e extras', 'pendente', 'joao', 0),
  ('2025-009', 9, 'Pesagem', 'pendente', 'duarte', 0);
