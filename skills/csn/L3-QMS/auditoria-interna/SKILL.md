---
name: auditoria-interna
description: >
  Planeia e executa auditorias internas ISO 9001:2015. Usa esta skill quando preparar programa anual de auditorias, executar auditoria, gerar relatório, ou quando o utilizador mencionar "auditoria interna", "programa de auditorias", "checklist auditoria", "internal audit". Cobre ISO 9001:2015 §9.2.
---

# Auditoria Interna

**Código interno:** CSN-L3-QMS-AUD-2026
**Nível ISA-95:** L3-MOM (QMS)
**Camada:** C3 (Agente QMS)
**Normas:** ISO 9001:2015 §9.2, EN 1090-1 (FPC), EN ISO 3834-3

## Objectivo

Planear, executar e documentar auditorias internas ao SGQ conforme ISO 9001:2015 §9.2. Inclui auditoria ao FPC (EN 1090) e ao sistema de soldadura (EN 3834).

## Programa anual de auditorias

Mínimo 1 auditoria completa por ano a todos os processos. Processos críticos (soldadura, inspecção) auditados 2x/ano.

| Processo | Norma | Frequência | Q1 | Q2 | Q3 | Q4 |
|----------|-------|------------|----|----|----|----|
| SGQ Geral | ISO 9001 | 1x/ano | ✓ | | | |
| Produção/Soldadura | EN 3834 + EN 1090 | 2x/ano | | ✓ | | ✓ |
| Compras/Recepção | ISO 9001 §8.4 | 1x/ano | | | ✓ | |
| RH/Competências | ISO 9001 §7.2 | 1x/ano | | ✓ | | |
| Calibração/Medição | ISO 9001 §7.1.5 | 1x/ano | | | | ✓ |

## Checklist por área

### SGQ Geral (ISO 9001)
- Política da qualidade documentada e comunicada?
- Objectivos mensuráveis definidos e monitorizados?
- Acções correctivas das NCs anteriores fechadas?
- Revisão pela gestão realizada nos últimos 12 meses?
- Controlo de documentos e registos operacional?

### Produção (EN 1090 + EN 3834)
- WPS disponíveis no posto de trabalho?
- Certificados de soldador válidos (< 2 anos)?
- Coordenador de soldadura designado e activo?
- Rastreabilidade material → peça → obra demonstrável?
- Relatórios de inspecção visual completos (100% juntas)?
- NDT realizado em juntas críticas (5-10%)?
- ITP preenchido por obra?

## Output

- Relatório de auditoria PDF com:
  - Âmbito, data, auditor, processos auditados
  - Constatações (conformidade/NC menor/NC maior/observação)
  - Evidências por constatação
  - Acções correctivas requeridas com prazo
  - Conclusão e recomendações
- Código: CSN-L3-QMS-AUD-[ano]-[seq]
- NCs detectadas geram automaticamente registo em `nao_conformidades` (via registar-nc)

## Regra Bandeira

Auditor não pode auditar o seu próprio trabalho. Se CSN tem equipa reduzida, o responsável de qualidade audita produção e o responsável de produção audita qualidade (auditoria cruzada).