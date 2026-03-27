# CSN Opus — Índice de ADRs (Architecture Decision Records)

**Total:** 25 ADRs | **Última actualização:** Sessão 26 (27/03/2026)

| # | Título | Data | Sessão | Domínio |
|---|--------|------|--------|---------|
| 001 | Nome do Sistema: CSN Opus | 21/03/2026 | 15 | Sistema |
| 002 | Separação: AI Personas vs Autonomous Agents | 21/03/2026 | 15 | Arquitectura |
| 003 | Base Normativa: 3 Dimensões Sempre Presentes | 21/03/2026 | 15 | Regulamentar |
| 004 | Knowledge Base Externa por Domínio (RAG) | 21/03/2026 | 15 | AI/Knowledge |
| 005 | Arquitectura de 5 Camadas | 21/03/2026 | 15 | Arquitectura |
| 006 | Agente Compliance: Auditoria Mensal Automática | 21/03/2026 | 15 | Qualidade |
| 007 | Rastreabilidade de Materiais por Lote e FIFO | 21/03/2026 | 15 | Produção |
| 008 | Base de Dados de Veículos por Marca + Cowork | 21/03/2026 | 15 | Dados |
| 009 | Inteligência Técnica por Marca: Workflow Documentos | 21/03/2026 | 15 | Dados |
| 010 | CSN Technic: Marca + CSN Brain Produto Comercial | 21/03/2026 | 15 | Produto |
| 011 | Fórmula de Peso Útil + Base Legal | 21/03/2026 | 15 | Regulamentar |
| 012 | Normas Fixação de Carga: EN 12195 + RAG | 21/03/2026 | 15 | Regulamentar |
| 013 | Hierarquia de Conformidade + Todos os Limites | 21/03/2026 | 15 | Regulamentar |
| 014 | Equipamentos: Grua, Plataforma, Engate | 21/03/2026 | 15 | Técnico |
| 015 | Famílias Carroçaria: Basculante + Estrado | 21/03/2026 | 15 | Produto |
| 016 | Agente Inteligência de Marcas | 21/03/2026 | 15 | AI/Agentes |
| 017 | Box Rules: Dimensões e Pesos Carroçaria | 21/03/2026 | 15 | Técnico |
| 018 | Gestão de OTs e Scraping com Cowork | 21/03/2026 | 15 | Produção |
| 019 | Conformidade ISA-95 + ISO 9001 + EN 1090 + Gaps | 26/03/2026 | 15 | Qualidade |
| 020 | Carolina: Agente de Recursos Humanos | 26/03/2026 | 15 | RH |
| 021 | Fernando: Liderança Excepcional + RAG | 26/03/2026 | 15 | Produção |
| 022 | Agente Research: Autónomo, Externo | 26/03/2026 | 15 | AI/Agentes |
| 023 | Departamento de Processos: SOPs Multilingue | 26/03/2026 | 15 | Qualidade |
| 024 | Agente FEA: iLogic + Inventor Nastran + EN 12642 | 26/03/2026 | 15 | Técnico |
| 025 | Faturação Certificada InvoiceXpress | 27/03/2026 | 24–25 | Financeiro |

---

## Domínios

- **Arquitectura** (002, 005): Estrutura do sistema, camadas, separação de concerns
- **Regulamentar** (003, 011, 012, 013): Legislação EU/PT, fórmulas legais, hierarquia normativa
- **AI/Agentes** (004, 016, 022): Agentes autónomos, RAG, knowledge bases
- **Qualidade** (006, 019, 023): ISO 9001, EN 1090, compliance, SOPs
- **Produção** (007, 018, 021): Rastreabilidade, OTs, Fernando
- **Dados** (008, 009): Base veículos, inteligência por marca
- **Produto** (010, 015): CSN Brain, famílias de carroçaria
- **Técnico** (014, 017, 024): Equipamentos, box rules, FEA
- **RH** (020): Carolina, recibos, férias
- **Financeiro** (025): InvoiceXpress, faturação certificada AT
- **Sistema** (001): Nome e identidade

---

## Notas

- ADRs são imutáveis após aceites — alterações geram novos ADRs ou addendums
- ADR-020 refere "Migration 020" mas a migration real executada foi 021
- ADR-025 documenta o histórico completo da decisão (Masterway → Vendus → InvoiceXpress)
- Todos os ADRs estão em `docs/adr/` no repositório
