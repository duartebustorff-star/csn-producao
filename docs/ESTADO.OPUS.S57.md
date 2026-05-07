# ESTADO OPUS — S57

**Data:** 5 Maio 2026
**Repo:** duartebustorff-star/csn-producao
**Branch:** main (HEAD `cdbe556` — patch `c5f8c80` por deployar)
**Status:** sessão fechada com pendências críticas

---

## Tentava fazer

Limpar pendências S54, formalizar arquitectura skills, e gerar termo de responsabilidade BZ-93-LE atrasado há 25 dias.

## Código final que funcionou

### Migration 054 — skills_csn (não aplicada em produção)

Tabela central de registo de skills CSN como SSoT, conforme ISO 9001 §7.5:
- `skills_csn` (16 campos: codigo, nome_slug, isa95_level/seccao, agente_dono, status, aprovação, ciclo de vida)
- `skills_csn_historico` (auditoria de alterações §7.5.3.2 c)
- `proximo_codigo_skill(level, seccao, ano)` — atribuição automática
- View `v_skills_registry` para HTML registry
- Seed: 5 skills (4 retroactivos + meta-skill `criar-skill-csn`)

### Cálculo distâncias eixo→carroçaria (BZ-93-LE)

Para cabine simples:
```
Dist. eixo ret. → frente carroçaria  = (entre_eixos − ADAP01) − folga_csn
Dist. eixo ret. → traseira carroçaria = comprimento_caixa − (anterior)
```

Para BZ-93-LE: 4215 − 1544 − 50 = 2621 mm | 4200 − 2621 = 1579 mm.

### UPDATE LEAD-BZ93LE-2025

```sql
UPDATE leads
SET tipo_carrocaria = 'caixa_aberta_madeira',
    altura_ext = 470,
    dimensoes = '4200x2100x470mm',
    dist_eixo_traseiro_retaguarda = 1579,
    dist_eixo_frontal_frente = 2621
WHERE id = 'LEAD-BZ93LE-2025';
```

### Criação de WO-2025-0001

```sql
INSERT INTO obras (
  id, lead_id, vin, matricula, estado, created_at
) VALUES (
  'WO-2025-0001', 'LEAD-BZ93LE-2025',
  'VF1RDB00073788261', 'BZ-93-LE', 'entregue',
  '2025-10-30 14:04:00+00'
);
```

ID convenção ISA-95: `WO-AAAA-NNNN`. Atributos (matrícula, VIN, cliente) ficam em colunas, não no ID.

### Patch ao handler `/api/documentos/gerar-termo` (commit c5f8c80)

4 hunks aditivos e retrocompatíveis:
1. SELECT da lead inclui `dist_eixo_frontal_frente` e `dist_eixo_traseiro_retaguarda`
2. Override por body para tara_total, tara_frontal, tara_traseira, dist_eixo_ret_*
3. dimRows usa variáveis (não "-" hardcoded)
4. pesoRows usa variáveis (não "-" hardcoded)

Lógica: `body.X ?? lead.X ?? "-"` (distâncias) | `body.X ?? "-"` (taras parciais) | `body.X ?? dav.tara ?? "-"` (tara total).

## Problemas / erros encontrados

### Webhook Vercel↔GitHub partido

Diagnóstico confirmado: **3 pushes para main desde 5 Maio sem qualquer reacção do Vercel**. Última deploy de produção: `8db8501` em 30 Abril. Commits `c5f8c80`, `e5fe788`, `cdbe556` não disparam build.

**Solução pendente:** Vercel Dashboard → projecto csn-producao → Settings → Git → Disconnect + Connect.

### REGRA BANDEIRA quebrada 4 vezes

1. **Lead errada** — assumi L2026-001 (era da JAP, 6 obras CB-*) em vez de LEAD-BZ93LE-2025 (criada retroactivamente em S57). Memória dizia.
2. **Texto declarativo inventado** — escrevi 5 alíneas a-b-c-d-e que não existem no modelo CSN canónico (Drive).
3. **Morada errada** — usei "Rua da Atalaia" inferida em vez de pedir confirmação. Real: Rua da Indústria, Casal do Rôdo, 8, 2640-216 Encarnação.
4. **Modelo veículo** — escrevi "MASTER" (nome comercial) onde o termo CSN espera "RDB" (código fabricante derivado do VIN posições 4-6).

### Endpoint hardcodava 4 campos a "-"

Dist. eixo retaguarda → frente/traseira + tara frontal/traseira ficavam sempre "-" no PDF. Patch em `c5f8c80` resolve, mas **bloqueado em produção pelo webhook**.

### Tipo carroçaria divergente BD vs termo legal

BD (slug): `caixa_aberta_madeira`
Termo legal (IMT): `CAIXA ABERTA COM OU SEM COBERTURA`
Mapeamento por confirmar — pendente migração de slugs vs nomes legais.

### Memória sistema 30/30

Atingido limite. Substituída entrada obsoleta (sequência sessões S40-S49) por consolidação S57.

## Solução / fim de sessão

### Termo BZ-93-LE — entregue fora do sistema

PDF gerado por mim em `/mnt/user-data/outputs/Termo_Responsabilidade_BZ-93-LE.pdf` conforme modelo CSN canónico do Drive. **Não está em `dossie_obra`, não está em Storage, não fechou ticket.** Decisão pragmática para desbloquear Juliana após 25 dias de atraso.

**Ações Duarte:** imprimir, assinar, envelope para JAP Mouriz, email confirmação a juliana.sousa@caasolution.pt.

### Decisões tomadas

| Tema | Decisão |
|---|---|
| Skills | Registo central em Supabase (SSoT) com codificação CSN-LX-XXX-SKL-NNN-AAAA |
| Frindus | Projecto Supabase + Claude próprios (isolamento) |
| Robótica | NÃO comprar humanoide. Cobot UR para Weinig (futuro) |
| Cérebro Claude Code | Adiado |
| Disciplina operacional | Princípios Boris vivem em `agentes_perfil` (Supabase), não CLAUDE.md isolado |
| Work Order ID | `WO-AAAA-NNNN` |
| Modelo termo | Sempre pedir docx do Drive antes de inventar |
| 3D printing | Tese aceite: estrutura híbrida aço + plástico reciclado. Curto prazo: painéis. Médio: caixas leves. Longo: nicho premium. |

## Próximos passos (S58)

**Bloqueantes:**
1. Reconectar webhook Vercel↔GitHub
2. Aplicar migration 054 (skills_csn)
3. Corrigir DAV `BZ-93-LE` (modelo MASTER → RDB)
4. Corrigir docx no Drive (modelo termo: empresa = CSN Lda, não Duarte)

**Estruturais:**
5. Migration 055 — `agentes_perfil` (regras operacionais JSONB)
6. Tabela `empresa_dados` (morada, NIF, certidão como fonte canónica)
7. Skill `vin-decoder-csn` (input VIN → marca + modelo_comercial + modelo_codigo + ano)
8. Separar `davs.modelo` em `modelo_comercial` + `modelo_codigo`

**Frindus (S59):**
9. Conversa com TOC (4 perguntas)
10. Inventário bruto

**Outras:**
11. Recibos Abril 2026 — manual ou cron?
12. Refletores laterais BZ-93-LE — confirmar com Bohdan/José Júlio antes de entregar termo
13. Research finding LFAM 3D printing — registar formalmente quando tabela `research_findings` existir

## Aprendizagens (lessons-csn)

1. **Verificar Supabase antes de assumir** — dados na BD têm autoridade sobre memória contextual
2. **Documentos canónicos vivem no Drive/sistema** — sempre pedir antes de inventar texto
3. **VIN é fonte canónica para `modelo_codigo`** (posições 4-6)
4. **Lead 2026 ≠ Lead 2025** — prefixo BZ é 2025, prefixo CB é 2026
5. **Cabine simples + folga 50mm** = parâmetro fixo CSN
6. **REGRA BANDEIRA** — nunca inferir: morada, modelo, texto declarativo, tipo carroçaria
7. **Webhook Vercel pode partir silenciosamente** — verificar consola após push importante

---

**Status final:** sessão longa, muitos avanços de conhecimento, **execução técnica abaixo do desejável** (REGRA BANDEIRA quebrada 4 vezes, webhook Vercel não diagnosticado a tempo, termo gerado fora do sistema). S58 deve abrir com revisão das aprendizagens antes de avançar.
