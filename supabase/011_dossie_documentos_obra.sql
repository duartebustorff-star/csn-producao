-- CSN Produção — Dossier Técnico por Obra
-- Migration: 011_dossie_documentos_obra.sql
-- Correr DEPOIS de 010_sgq_minimo_iso9001.sql
-- Adiciona DAV, FAM e INSPECAO ao dossier técnico obrigatório por obra

-- ============================================
-- 1. ALTERAR CHECK CONSTRAINT do dossie_obra
--    Adicionar tipos: dav, fam, inspecao
-- ============================================

ALTER TABLE dossie_obra DROP CONSTRAINT IF EXISTS dossie_obra_tipo_check;

ALTER TABLE dossie_obra ADD CONSTRAINT dossie_obra_tipo_check CHECK (tipo IN (
  -- Documentos de identificação e homologação (NOVOS)
  'dav',                  -- Declaração Aduaneira de Veículo
  'fam',                  -- Folha de Aprovação de Modelo (limites técnicos homologados)
  'inspecao',             -- Relatório de Inspeção (Controlauto) — pesos reais
  -- Documentos de qualidade estrutural (EN 1090)
  'cert_material',        -- Certificado 3.1 de chapa/perfil/tubo
  'ficha_rastreabilidade',-- Rastreabilidade: material → peça → soldador → WPS
  'inspecao_visual',      -- Inspeção visual 100% soldaduras (EN ISO 17637)
  'relatorio_ndt',        -- Ensaios não destrutivos 5-10% soldaduras críticas
  'controlo_dimensional', -- Medições: comprimento, largura, altura, esquadrias
  'registo_fotografico',  -- Fotos das fases críticas
  'verificacao_chassis',  -- Checklist AEB, câmaras, luzes (Reg. 2019/2144)
  'dop',                  -- Declaração de Desempenho EN 1090
  'marcacao_ce',          -- Etiqueta CE aplicada
  'coc_2etapa',           -- Certificado de Conformidade multi-etapa
  'cert_en12642',         -- Certificado EN 12642 L ou XL
  'termo_responsabilidade'-- Declaração de responsabilidade (requisito PT)
));

-- ============================================
-- 2. ATUALIZAR FUNÇÃO criar_dossie_obra()
--    Incluir dav, fam, inspecao como pendentes
-- ============================================

CREATE OR REPLACE FUNCTION criar_dossie_obra(p_obra_id TEXT, p_responsavel_id TEXT DEFAULT 'duarte')
RETURNS void AS $$
BEGIN
  INSERT INTO dossie_obra (obra_id, tipo, estado, responsavel) VALUES
    -- Documentos de identificação (obrigatórios para Termo)
    (p_obra_id, 'dav',                   'pendente', p_responsavel_id),
    (p_obra_id, 'fam',                   'pendente', p_responsavel_id),
    (p_obra_id, 'inspecao',              'pendente', p_responsavel_id),
    -- Qualidade estrutural EN 1090
    (p_obra_id, 'cert_material',         'pendente', p_responsavel_id),
    (p_obra_id, 'ficha_rastreabilidade', 'pendente', p_responsavel_id),
    (p_obra_id, 'inspecao_visual',       'pendente', p_responsavel_id),
    (p_obra_id, 'relatorio_ndt',         'pendente', p_responsavel_id),
    (p_obra_id, 'controlo_dimensional',  'pendente', p_responsavel_id),
    (p_obra_id, 'registo_fotografico',   'pendente', p_responsavel_id),
    (p_obra_id, 'verificacao_chassis',   'pendente', p_responsavel_id),
    (p_obra_id, 'dop',                   'pendente', p_responsavel_id),
    (p_obra_id, 'marcacao_ce',           'pendente', p_responsavel_id),
    (p_obra_id, 'coc_2etapa',            'pendente', p_responsavel_id),
    (p_obra_id, 'termo_responsabilidade','pendente', p_responsavel_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. ADICIONAR dossier às obras de teste existentes
--    (que foram criadas antes desta migração)
-- ============================================

INSERT INTO dossie_obra (obra_id, tipo, estado, responsavel)
SELECT o.id, t.tipo, 'pendente', 'duarte'
FROM obras o
CROSS JOIN (VALUES
  ('dav'), ('fam'), ('inspecao')
) AS t(tipo)
WHERE NOT EXISTS (
  SELECT 1 FROM dossie_obra d
  WHERE d.obra_id = o.id AND d.tipo = t.tipo
);

-- ============================================
-- 4. FUNÇÃO: verificar_dossier_obra(p_obra_id)
--    Retorna estado completo do dossier de uma obra
--    e indica se está pronto para gerar o Termo
-- ============================================

CREATE OR REPLACE FUNCTION verificar_dossier_obra(p_obra_id TEXT)
RETURNS TABLE (
  tipo TEXT,
  estado TEXT,
  ficheiro_url TEXT,
  concluido_em TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.tipo, d.estado, d.ficheiro_url, d.concluido_em
  FROM dossie_obra d
  WHERE d.obra_id = p_obra_id
  ORDER BY
    CASE d.tipo
      WHEN 'dav'    THEN 1
      WHEN 'fam'    THEN 2
      WHEN 'inspecao' THEN 3
      WHEN 'termo_responsabilidade' THEN 99
      ELSE 50
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VIEW: obras_dossier_status
--    Para o dashboard — mostra % de completude
--    e flag "pronto para termo"
-- ============================================

CREATE OR REPLACE VIEW obras_dossier_status AS
SELECT
  o.id AS obra_id,
  o.estado AS obra_estado,
  COUNT(d.id) AS total_docs,
  COUNT(CASE WHEN d.estado = 'ok' THEN 1 END) AS docs_ok,
  COUNT(CASE WHEN d.estado = 'pendente' THEN 1 END) AS docs_pendentes,
  ROUND(
    COUNT(CASE WHEN d.estado = 'ok' THEN 1 END)::numeric /
    NULLIF(COUNT(d.id), 0) * 100
  ) AS percentagem_completo,
  -- Pronto para Termo: DAV + FAM + INSPECAO todos ok
  BOOL_AND(
    CASE WHEN d.tipo IN ('dav', 'fam', 'inspecao')
    THEN d.estado = 'ok'
    ELSE true END
  ) AS pronto_para_termo
FROM obras o
LEFT JOIN dossie_obra d ON d.obra_id = o.id
GROUP BY o.id, o.estado;
