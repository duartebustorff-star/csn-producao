# ESTADO OPUS — S46

**Data:** 09/04/2026
**HEAD:** c9c6f58
**Sessão anterior:** S45 (048ff3c)

---

## RESUMO S46

### Feito
1. **Migration `nao_conformidades`** — tabela 66, migration 52. Campos: numero_nc, obra_id, fase, tipo, origem, descricao, gravidade, quantidades (afectada/rejeitada/retrabalhada), custo, acções, estados (aberta→fechada). FKs: obras(id), colaboradores(id). Indexes: obra, estado, numero_nc.
2. **Route `/api/qms/registar-nc`** — POST (criar NC com numero sequencial CSN-NC-YYYY-NNNN), GET (listar com filtros estado/obra), PATCH (actualizar estado, acção correctiva, causa raiz, fecho). Testada em produção: CSN-NC-2026-0001.
3. **12 skills novos** (commit bdf7ecb + c9c6f58):
   - L3-QMS: gerar-itp, gerar-dop, auditoria-interna
   - L3-PRD: ordem-fabrico, checklist-fase, rastrear-material
   - L4-ENG: gerar-coc, gerar-termo, calculos-normativos
   - L4-COM: gerar-proposta, ficha-produto, email-followup
4. **Marketing PPTX** — 11 slides profissionais (pesquisa tools & skills marketing 2025-2026). Decisão: marketing é departamento dentro do Opus, sem apps externas.

### KPIs ISO 22400 desbloqueados
- quality ratio, scrap ratio, rework ratio, first pass yield (via nao_conformidades)
- OEE componente qualidade
- **Total calculáveis: 8** (antes: 6)

### Commits S46
```
786a6e6 skills: 12 novos skills QMS/PRD/ENG/COM (S46) — registar-nc YAML fix
bdf7ecb S46: 12 skills QMS/PRD/ENG/COM + route registar-nc
c9c6f58 fix: registar-nc route com codigo correcto
```

---

## CONTAGENS

| Componente | Total |
|-----------|-------|
| Tabelas | 66 |
| Migrations | 52 |
| Skills custom CSN | ~121 |
| Skills comunidade | 127 |
| Agentes (C3) | 11 |
| Personas (C2) | 5 |
| ADRs | 27 |
| Routes API | 34 |

---

## PENDENTE S47

### Prioridade 1 — Gates Lead→Obra
1. **Gate 1 — Medidas (obrigatório para orçamento):** Validação PostgreSQL: distancia_entre_eixos, dist_eixo_frontal_frente, dist_eixo_traseiro_retaguarda, dist_eixo_frontal_traseira_cabine, dist_topo_chassi_topo_cabine, rodado, veiculo_cabine. Sem medidas = sem orçamento = sem produção.
2. **Gate 2 — Documentação (obrigatório para arrancar produção):**
   - Veículos NOVOS: DAV + FAM no sistema (FAM pode ter anotações medidas/pesos)
   - Veículos USADOS: Cartão Único Veículo (frente + verso)
3. **Tabelas novas:** `fam`, `cartao_unico`
4. **CHECK constraints:** estados pipeline lead + estados obra

### Prioridade 2 — Agente Documental (intake)
- Classificação automática de documentos recebidos
- Upload → tipo → associar obra
- Trigger DAV+INSP → gerar termo
- Integrar com skills fornecedores (cert 3.1, facturas)

### Prioridade 3 — Outros
- Adaptar 27 skills comunidade → contexto CSN
- Email webhook → Router
- COC eletrónico IMT (deadline Jul/2026)
- Portal "duas portas" (Produção + Pessoal)

---

## CONTAS/SERVICOS
- **Supabase:** oysfxhlzilazeznpaafc
- **Vercel:** csn-producao.vercel.app
- **InvoiceXpress:** cert AT 192, conta carlosdossantosna
- **Twilio:** trial, +351 923 233 644
- **Gmail sistema:** carrocariascsn@gmail.com
