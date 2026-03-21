# CSN Opus / CSN Brain — Briefing Claude Code
## O que construir e por que ordem

**Data:** 21/03/2026
**Versão:** 1.0
**Para:** Claude Code

---

## Contexto do Sistema

**CSN Technic** — Commercial Vehicle Engineering
- **CSN Opus** — sistema de gestão interno da fábrica
- **CSN Brain** — produto comercial SaaS (configurador + calculadora + render 3D)

**Stack:** Next.js 16 + TypeScript + Supabase + Claude API (claude-sonnet-4-5) + Vercel
**Repo:** `duartebustorff-star/csn-producao`
**Deploy:** `npx vercel --prod`
**Path local:** `C:\Users\Utilizador\Projectos-AI\csn-producao`

**Antes de escrever código:**
Lê obrigatoriamente:
1. `ESTADO__17_.md` — estado actual do sistema
2. `docs/csn-architecture__17_.html` — arquitectura completa
3. `docs/adr/ADR-001` a `ADR-015` — todas as decisões arquitecturais

---

## Tabelas Supabase Existentes (21 tabelas)

obras, fases_obra, timetracking, templates_fases, notas_obra, calendario,
leads, davs, fams, inspecoes, cits, dossie_obra, obras_dossier_status,
certificados_matricula, certificacoes_empresa, audit_log, colaboradores,
ausencias, documentos_rh, mensagens, lugares_parque

**Migrations pendentes a correr em ordem:**
- Migration 014 — ERP light (fornecedores, faturas, etc.)
- Migration 015 — QMS (NC, WPS, WPQR, certificados soldadores)
- Migration 016 — Stock (lotes, materiais, FIFO)
- Migration 017 — CMMS + HRM (equipamentos, manutenção, colaboradores)
- Migration 018 — CSN Brain base (marcas_veiculo, nomenclatura_marcas, ordens_trabalho_cowork, documentos_externos)
- Migration 019 — CSN Brain equipamentos (equipamentos_carrocaria, tipos_carrocaria)

---

## ORDEM DE CONSTRUÇÃO — PRIORIDADES

### PRIORIDADE 1 — Pendentes técnicos urgentes

**P1 — Agente Documental**
- Endpoint: `src/app/api/chat/documental/route.ts`
- Tools: `classificar_documento`, `registar_dav`, `registar_inspecao`, `registar_cit`, `registar_fam`, `verificar_completude_obra`
- Trigger: DAV + inspecção → gerar_termo automaticamente

**P2 — Reescrever gerar-termo**
- Formato real CSN (ver ESTADO__17_.md secção TERMO)
- Logo fundo branco, texto jurídico, tabela veículo, assinatura Duarte

**P3 — Correr Migration 014**
- Tabelas ERP light com campos CIVA art.36

---

### PRIORIDADE 2 — CSN Brain (configurador)

**P4 — Migration 018**
```sql
-- marcas_veiculo (campos completos — ver ADR-010 e ADR-013)
-- nomenclatura_marcas (dicionário sinónimos — ver ADR-010)
-- ordens_trabalho_cowork (ver ADR-009)
-- documentos_externos (ver ADR-009)
```

**P5 — Migration 019**
```sql
-- equipamentos_carrocaria (ver ADR-014)
-- tipos_carrocaria (ver ADR-015)
```

**P6 — Seed data: Renault Master XDD ICE**
Primeiro chassi completo na tabela `marcas_veiculo`
Dados em: `Marcas - Veiculos/Renault/SGQ_Veiculos/`

**P7 — Função `calcular_peso_carrocaria()`**
```typescript
// Ver ADR-011 para fórmula exacta
// (PBV × 0.90) - Tara - ((Nº_lugares - 1) × 75)
// Subtrair peso de equipamentos se seleccionados
// Citar diplomas: DL 132/2017 + Reg. UE 1230/2012
```

**P8 — Configurador de chassi (UI)**
Fluxo: Motorização → Marca → Modelo → Cabine → Versão → Rodado → Nº Lugares → Equipamentos
Resultado: envelope de peso + dimensões máximas carroçaria

---

### PRIORIDADE 3 — CSN Opus (gestão interna)

**P9 — Migration 015 — tabelas QMS**
- nao_conformidades, wps, wpqr, inspecoes_soldadura, certificados_soldadores

**P10 — Migration 016 — tabelas Stock**
- stocks, lotes_material, certificados_material, movimentos_stock
- FIFO automático (ver ADR-007)

**P11 — Migration 017 — CMMS + HRM**
- 12 equipamentos da CSN (ver ESTADO__17_.md)
- colaboradores (João, Bohdan, José Júlio)

**P12 — Permissões admin/operador**

**P13 — COC Electrónico IMT — deadline Jul 2026**

---

### PRIORIDADE 4 — AI Personas (Fase 1)

**P14 — Luísa (Assistente CEO)**
- Acesso total ao sistema
- Chat conversacional — perguntas cruzadas entre módulos
- Alimentada pela Knowledge Base completa

**P15 — Fernando (migrar Sr. Manuel)**
- Renomear Sr. Manuel → Fernando
- Manter as 15 tools existentes
- Adicionar personalidade e inteligência emocional
- Interface workers melhorada

---

## Regras de Desenvolvimento

**PowerShell:**
- SEMPRE começar com `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
- Um comando de cada vez
- Nunca múltiplas linhas juntas

**SQL:**
- SEMPRE no Supabase SQL Editor
- Ctrl+A → Delete antes de colar
- NUNCA no PowerShell

**Deploy:**
- `npx vercel --prod` (automático não funcional)

**Git:**
- Nunca force push
- git add → git commit → git push
- Um commit por tema

**FK discipline:**
- Campos FK para colaboradores usam `null` para acções do sistema
- Nunca a string "system"

**PDF (pdf-lib):**
- Usar função `s()` para sanitizar strings (WinAnsi encoding)
- Logo CSN: fundo transparente — branco para termo, preto para checklist

**Fórmulas críticas:**
- Peso útil carroçaria: `(PBV × 0.90) - Tara - ((Nº_lugares - 1) × 75)`
- D-value engate: `(g × T × R) / (T + R)`
- Ver ADR-011, ADR-013, ADR-014 para detalhes completos

---

## Empresa — Dados Fixos

- **Nome legal:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão Permanente:** 3172-1374-8252
- **Marca corporativa:** CSN Technic
- **Sistema interno:** CSN Opus
- **Produto comercial:** CSN Brain
