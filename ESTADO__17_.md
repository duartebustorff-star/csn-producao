# CSN Technic — Estado do Projeto
**Última atualização:** 21/03/2026
**Sistema interno:** CSN Opus — Every build. Documented. Certified. Traceable.
**Produto comercial:** CSN Brain — The engineering brain behind every body.
**Marca corporativa:** CSN Technic — Commercial Vehicle Engineering
**Repositório:** `duartebustorff-star/csn-producao`
**URL produção:** https://csn-producao.vercel.app
**Stack:** Next.js 16 + Supabase + Claude API (claude-sonnet-4-5) + Vercel
**Pasta local:** `C:\Users\Utilizador\Projectos-AI\csn-producao`

---

## COMO USAR

Quando abrires um chat novo:
1. Envia este ficheiro + `docs/csn-architecture__17_.html`
2. Envia os ADRs relevantes de `docs/adr/`
3. Diz: *"Lê o ESTADO__17_.md, a arquitectura v17 e os ADRs. Continua o trabalho."*

---

## SESSÃO 15 — RESUMO FINAL (21/03/2026)

Sessão de arquitectura pura. A mais importante do projecto.

### O que foi definido:
- **CSN Technic** — marca corporativa
- **CSN Opus** — sistema de gestão interno
- **CSN Brain** — produto comercial SaaS (melhor que TrailerWin)
- **5 camadas arquitecturais** do CSN Opus
- **5 AI Personas** — Luísa, Fernando, Marta, Leonor, Irina
- **7 Autonomous Agents** incluindo Compliance
- **Knowledge Base** — RAG por domínio
- **Base normativa 3 dimensões** — sempre presente
- **15 ADRs** commitados
- **Hierarquia de conformidade** — 3 níveis (Lei EU → Lei PT → Fabricante)
- **Fórmula peso útil** confirmada: `(PBV × 0.90) - Tara - ((Nº_lugares-1) × 75)`
- **CSN Brain** — 5 camadas: Legislação → Chassi → Equipamentos → Carroçaria → Acessórios
- **Famílias de carroçaria** — Basculante + Caixa Aberta/Estrado (ligeiros e pesados)
- **Equipamentos** — Grua (EN 12999), Plataforma (EN 1756), Engate (UNECE R55)
- **D-value e S-value** fórmulas confirmadas
- **16 OTs** definidas para o Cowork
- **Briefing Claude Code** completo

---

## INFRAESTRUTURA

| Componente | Estado | Notas |
|---|---|---|
| Supabase | ✅ ATIVO | 21 tabelas existentes |
| Vercel | ✅ ATIVO | `npx vercel --prod` |
| GitHub | ✅ ATIVO | duartebustorff-star/csn-producao |
| Supabase Storage | ✅ ATIVO | termos/ e checklists/ |
| Claude API | ✅ ATIVO | claude-sonnet-4-5 |
| ANTHROPIC_API_KEY | ✅ ATIVO | Vercel env vars |

---

## TABELAS SUPABASE — 21 EXISTENTES

| Tabela | Módulo | Estado docs |
|---|---|---|
| obras | MES | ✅ |
| fases_obra | MES | ✅ |
| timetracking | MES | ✅ |
| templates_fases | MES | ⚠️ não documentado |
| notas_obra | MES | ✅ |
| calendario | MES | ⚠️ não documentado |
| leads | CRM | ✅ |
| davs | DMS | ✅ |
| fams | DMS | ✅ |
| inspecoes | DMS | ✅ |
| cits | DMS | ✅ |
| dossie_obra | DMS | ✅ |
| obras_dossier_status | DMS | ⚠️ não documentado |
| certificados_matricula | DMS | ⚠️ não documentado |
| certificacoes_empresa | QMS | ✅ |
| audit_log | QMS | ✅ |
| colaboradores | HRM | ⚠️ não documentado |
| ausencias | HRM | ✅ |
| documentos_rh | HRM | ⚠️ não documentado |
| mensagens | — | ⚠️ não documentado |
| lugares_parque | MES | ✅ |

## MIGRATIONS PENDENTES

| Migration | Tabelas | Estado |
|---|---|---|
| 014 | fornecedores, faturas, faturas_linhas, notas_credito, recibos, tipos_documento | ❌ 🔴 URGENTE |
| 015 | nao_conformidades, wps, wpqr, inspecoes_soldadura, certificados_soldadores | ❌ |
| 016 | stocks, lotes_material, certificados_material, movimentos_stock | ❌ |
| 017 | equipamentos_csn, manutencao_plano, manutencao_registos, avarias, certificados_colaboradores, formacoes, epis | ❌ |
| 018 | marcas_veiculo, nomenclatura_marcas, ordens_trabalho_cowork, documentos_externos | ❌ |
| 019 | equipamentos_carrocaria, tipos_carrocaria | ❌ |

---

## ADRs COMMITADOS (docs/adr/) — 15 ADRs

| ADR | Título |
|---|---|
| 001 | Nome sistema: CSN Opus |
| 002 | AI Personas vs Autonomous Agents |
| 003 | Base normativa 3 dimensões |
| 004 | Knowledge Base externa por domínio |
| 005 | Arquitectura 5 camadas |
| 006 | Agente Compliance: auditoria mensal |
| 007 | Rastreabilidade materiais por lote e FIFO |
| 008 | Base de dados veículos + Cowork |
| 009 | Inteligência técnica por marca + workflow documentos |
| 010 | CSN Technic + CSN Brain produto comercial |
| 011 | Fórmula peso útil + base legal DL 132/2017 + Reg. 1230/2012 |
| 012 | EN 12195 completa 4 partes + EN 12640 + IRU guidelines |
| 013 | Hierarquia conformidade + todos os limites |
| 014 | Equipamentos: grua, plataforma, engate + D-value + S-value |
| 015 | Famílias de carroçaria: basculante + estrado |

---

## CSN BRAIN — 5 CAMADAS

```
1 — LEGISLAÇÃO    → DL 132/2017, Reg. 1230/2012, Dir. 96/53/CE
2 — CHASSI        → tabela marcas_veiculo por marca/modelo
3 — EQUIPAMENTOS  → grua (EN 12999), plataforma (EN 1756), engate (UNECE R55)
4 — CARROÇARIA    → basculante, caixa aberta/estrado
5 — ACESSÓRIOS    → sem impacto estrutural
```

**Fórmula peso útil:**
`Peso_carrocaria = (PBV × 0.90) - Tara - ((Nº_lugares - 1) × 75) - Σ(peso equipamentos)`

**Base legal:** DL 132/2017 alínea e) + Reg. UE 1230/2012 ponto 2.6.2.2

---

## AI PERSONAS

| Persona | Nome | Estado |
|---|---|---|
| Assistente CEO | **Luísa** | ❌ Fase 1 |
| Chefe de Produção | **Fernando** | ⚠️ Existe como Sr. Manuel |
| Agente Comercial | **Marta** | ❌ Fase 2 |
| Aftersales | **Leonor** | ❌ Fase 2 |
| Fornecedores | **Irina** | ❌ Fase 2 |

---

## AUTONOMOUS AGENTS

| Agente | Estado |
|---|---|
| Roteador | ❌ |
| Agente Documental | ❌ 🔴 URGENTE |
| Agente QMS | ❌ |
| Agente Stock | ❌ |
| Agente Manutenção | ❌ |
| Agente KPIs | ❌ |
| Agente Compliance | ❌ |

---

## MARCAS - VEICULOS (pasta no repo)

| Marca | Estado |
|---|---|
| Fuso | ✅ Parcial |
| Renault | ✅ GT XDD ICE + E-TECH completos |
| Mercedes-Benz | ✅ Sprinter mounting directives |
| Stellantis | 🔄 Em curso pelo Cowork |
| MAN | ❌ OT-2026-019 |
| DAF | ❌ OT-2026-020 |
| Iveco | ❌ OT-2026-021 |

---

## EQUIPAMENTOS CSN — 12 UNIDADES

| Equipamento | Categoria | Modelo |
|---|---|---|
| Guilhotina | Corte | A confirmar |
| Laser chapa | Corte | Bodor |
| Laser tubo | Corte | A confirmar |
| Quinadora CNC | Quinagem | A confirmar |
| MIG/MAG #1 | Soldadura | Fronius |
| MIG/MAG #2 | Soldadura | A identificar |
| Máquina pintar | Acabamentos | A confirmar |
| Máq. polir tábuas | Madeira | A confirmar |
| Tupi | Madeira | A confirmar |
| Garlopa | Madeira | A confirmar |
| Empilhador 2.5t | Movimentação | Mitsubishi |
| Empilhador 4.5t | Movimentação | Toyota |

---

## EQUIPA

| Nome | Função | Certificações |
|---|---|---|
| Duarte | CEO · Admin | Acesso total |
| João | Soldador | EN ISO 9606-1 pendente |
| Bohdan | Soldador | EN ISO 9606-1 pendente |
| José Júlio | Colaborador | — |
| IWS/IWT | Coordenador Soldadura | A contratar |

---

## PENDENTES — POR ORDEM DE PRIORIDADE

| # | Prioridade | Tarefa |
|---|---|---|
| P1 | 🔴 | Agente Documental |
| P2 | 🔴 | Reescrever gerar-termo |
| P3 | 🔴 | Migration 014 |
| P4 | 🟡 | Migration 015 QMS |
| P5 | 🟡 | Migration 016 Stock |
| P6 | 🟡 | Migration 017 CMMS/HRM |
| P7 | 🟡 | Migration 018 CSN Brain base |
| P8 | 🟡 | Migration 019 CSN Brain equipamentos |
| P9 | 🟡 | Seed Renault Master XDD ICE |
| P10 | 🟡 | Função calcular_peso_carrocaria() |
| P11 | 🟡 | Configurador chassi UI |
| P12 | 🟡 | COC Electrónico IMT Jul/2026 |
| P13 | ⚪ | Luísa — Assistente CEO |
| P14 | ⚪ | Fernando — migrar Sr. Manuel |
| P15 | ⚪ | Documentar 5 tabelas não documentadas |

---

## NOTAS TÉCNICAS CRÍTICAS

- **PowerShell:** SEMPRE `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
- **SQL:** SEMPRE no Supabase SQL Editor — Ctrl+A → Delete antes de colar
- **PowerShell:** nunca múltiplas linhas — uma a uma
- **pdf-lib:** usar `s()` para sanitizar strings (WinAnsi)
- **Logo CSN:** transparente — branco=termo, preto=checklist
- **Vercel deploy:** `npx vercel --prod`
- **FK:** `null` para acções do sistema (nunca "system")
- **Git:** nunca force push
- **ZIPs:** não commitar — extrair primeiro
- **Cowork:** prompt sempre com OT + marca + pasta destino + instrução relatório
- **Software 3D:** SolidWorks vs Inventor — A CONFIRMAR

---

## EMPRESA

- **Marca:** CSN Technic — Commercial Vehicle Engineering
- **Nome legal:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão:** 3172-1374-8252
