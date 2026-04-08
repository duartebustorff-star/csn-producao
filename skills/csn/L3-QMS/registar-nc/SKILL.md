---
name: registar-nc
description: >
  Regista não-conformidades (NC) no sistema. O SKILL MAIS IMPORTANTE — desbloqueia ISO 9001 cl.10 + EN 1090 + EN ISO 3834 + ISO 14001 + ISO 45001. Activa para NC, não-conformidade, defeito, problema qualidade, reclamação, desvio.
---

# registar-nc — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Defeito detectado em produção
- Reclamação de cliente
- Desvio em auditoria interna
- Material não conforme
- Soldadura rejeitada

## Normas: ISO 9001 cl.10.2, EN 1090-2, EN ISO 3834-3

## Campos obrigatórios
1. Nº NC: NC-2026-XXX (sequencial)
2. Data detecção
3. Quem detectou (colaborador ou inspecção)
4. Obra afectada (se aplicável)
5. Tipo: produto/processo/sistema/fornecedor/cliente
6. Descrição do desvio
7. Evidência (foto, medição, relatório)
8. Classificação: menor/maior/crítica
9. Acção imediata (contenção)
10. Análise causa raiz (5 porquês ou Ishikawa)
11. Acção correctiva (CAPA)
12. Responsável e prazo
13. Verificação eficácia
14. Estado: aberta→em análise→acção correctiva→verificação→fechada

## Tabela Supabase necessária: nao_conformidades
## Campos: id, numero_nc, data_deteccao, obra_id, tipo, descricao, classificacao, causa_raiz, accao_correctiva, responsavel_id, prazo, estado, verificacao_eficacia, data_fecho

## Regras
- Toda NC deve ter causa raiz antes de fechar
- NC crítica: notificação imediata ao Duarte
- NC de soldadura: referência ao soldador + WPS + junta
- NC de material: referência ao certificado 3.1 + fornecedor
- Registo fotográfico obrigatório para NC maior/crítica
