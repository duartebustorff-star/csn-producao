# SESSÃO S44 — Skills Engine + iLogic + ISA-95
**Data: 08/04/2026 · Objectivo: Encher o sistema de skills**

---

## FASE 1 — Instalar skills comunidade (Claude Code)

### 1.1 Clonar repositório alirezarezvani/claude-skills (10k★, 223 skills)
```powershell
cd C:\Users\Utilizador\Projectos-AI
git clone https://github.com/alirezarezvani/claude-skills.git
```

### 1.2 Copiar pacotes relevantes para o projecto CSN
```powershell
cd C:\Users\Utilizador\Projectos-AI\csn-producao

mkdir -p skills\comunidade\marketing
mkdir -p skills\comunidade\finance
mkdir -p skills\comunidade\c-level
mkdir -p skills\comunidade\ra-qm
mkdir -p skills\comunidade\business-growth
mkdir -p skills\comunidade\product
mkdir -p skills\comunidade\pm

Copy-Item -Recurse ..\claude-skills\marketing-skill\* skills\comunidade\marketing\
Copy-Item -Recurse ..\claude-skills\finance\* skills\comunidade\finance\
Copy-Item -Recurse ..\claude-skills\c-level-advisor\* skills\comunidade\c-level\
Copy-Item -Recurse ..\claude-skills\ra-qm-team\* skills\comunidade\ra-qm\
Copy-Item -Recurse ..\claude-skills\business-growth\* skills\comunidade\business-growth\
Copy-Item -Recurse ..\claude-skills\product-team\* skills\comunidade\product\
Copy-Item -Recurse ..\claude-skills\project-management\* skills\comunidade\pm\
```

### 1.3 Copiar skills CSN custom (já criados)
```powershell
mkdir -p skills\csn\L4-COM
```
Descarregar csn-skills-vendas-marketing.tar.gz desta sessão e extrair para `skills\csn\L4-COM\`

---

## FASE 2 — Estrutura ISA-95 de skills no repo

```
csn-producao/
├── skills/
│   ├── README.md                    # Este ficheiro — índice geral
│   ├── comunidade/                  # 122 skills externos (7 pacotes)
│   │   ├── marketing/               # 44 skills
│   │   ├── finance/                 # 3 skills
│   │   ├── c-level/                 # 34 skills
│   │   ├── ra-qm/                   # 14 skills
│   │   ├── business-growth/         # 5 skills
│   │   ├── product/                 # 15 skills
│   │   └── pm/                      # 7 skills
│   ├── csn/                         # Skills custom CSN (por nível ISA-95)
│   │   ├── L4-COM/                  # Comercial (12 criados S43)
│   │   ├── L4-FIN/                  # Financeiro
│   │   ├── L4-ENG/                  # Engenharia + iLogic
│   │   ├── L4-CST/                  # Custos
│   │   ├── L3-PRD/                  # Produção
│   │   ├── L3-QMS/                  # Qualidade + Normas
│   │   ├── L3-MNT/                  # Manutenção
│   │   ├── L3-PER/                  # Pessoal / KPIs
│   │   ├── L3-DOC/                  # Documentação
│   │   ├── L3-INV/                  # Inventário / Fornecedores
│   │   ├── RH/                      # Recursos Humanos + ISO 45001
│   │   ├── AMB/                     # Ambiente ISO 14001
│   │   ├── JUR/                     # Jurídico
│   │   └── EST/                     # Estratégia
│   └── anthropic/                   # Skills nativos (referência)
│       └── README.md                # docx, xlsx, pptx, pdf, frontend-design
```

---

## FASE 3 — iLogic configurador (Claude Code + Cowork)

### O que o Claude Code faz:
1. Ler o modelo 3D do Inventor (Duarte exporta parâmetros para Excel/JSON)
2. Gerar scripts iLogic VB.NET para:
   - Configurador paramétrico (largura, comprimento, altura taipais, material)
   - BOM automática
   - Export DXF para Bodor
   - Validação dimensional (Dir. 96/53/CE)
   - Validação peso/eixo
3. Gerar ficheiros .bdf para Nastran (via pyNastran)
4. Post-processing resultados FEA → relatório EN 12642

### Dependências:
- Duarte exporta: Model Parameters (Excel), Assembly BOM (Excel), screenshots Model Browser
- pyNastran: `pip install pyNastran`
- Inventor 2026 com Nastran no PC do Duarte

### Skill a criar: `skills/csn/L4-ENG/ilogic-configurador/SKILL.md`

---

## FASE 4 — Adaptar 27 skills comunidade para contexto CSN

O Claude Code percorre cada skill comunidade marcado como "ADAPTAR" e:
1. Lê o SKILL.md original
2. Adiciona contexto CSN (carroçarias, materiais, normas, mercado PT)
3. Grava versão CSN em `skills/csn/[secção]/`
4. Mantém original intacto em `skills/comunidade/`

Prioridade de adaptação:
1. L4-COM: cold-outreach, social-media, email-marketing (já criados custom, verificar se comunidade tem algo melhor)
2. L3-QMS: registar_nc, auditoria_interna, analise_causa_raiz (base ISO 13485 → adaptar metalomecânica)
3. L4-FIN: financial-analyst, pricing (SaaS → industrial)
4. EST: ceo-advisor, competitive-intelligence (genérico → CSN)

---

## FASE 5 — Começar skills custom normativos (mais impactantes)

Por ordem de impacto na auditoria:

1. `registar_nc` — desbloqueia ISO 9001 cl.10 + EN 1090 + EN ISO 3834 + ISO 14001 + ISO 45001
2. `gerar_itp` — Inspection Test Plan, base para L3-QMS
3. `checklist_fase` — registo por fase de obra, evidência EN 1090
4. `gerar_dop` — Declaration of Performance, obrigatório marcação CE
5. `rastrear_material` — cert 3.1 → obra, rastreabilidade EN 1090

---

## COMANDOS CLAUDE CODE — COPIAR E COLAR

```
# Sessão S44 — abrir Claude Code
cd C:\Users\Utilizador\Projectos-AI\csn-producao

# 1. Clonar skills comunidade
git clone https://github.com/alirezarezvani/claude-skills.git ..\claude-skills

# 2. Criar estrutura
mkdir skills\comunidade\marketing
mkdir skills\comunidade\finance
mkdir skills\comunidade\c-level
mkdir skills\comunidade\ra-qm
mkdir skills\comunidade\business-growth
mkdir skills\comunidade\product
mkdir skills\comunidade\pm
mkdir skills\csn\L4-COM
mkdir skills\csn\L4-FIN
mkdir skills\csn\L4-ENG
mkdir skills\csn\L4-CST
mkdir skills\csn\L3-PRD
mkdir skills\csn\L3-QMS
mkdir skills\csn\L3-MNT
mkdir skills\csn\L3-PER
mkdir skills\csn\L3-DOC
mkdir skills\csn\L3-INV
mkdir skills\csn\RH
mkdir skills\csn\AMB
mkdir skills\csn\JUR
mkdir skills\csn\EST

# 3. Copiar pacotes
Copy-Item -Recurse ..\claude-skills\marketing-skill\* skills\comunidade\marketing\
Copy-Item -Recurse ..\claude-skills\finance\* skills\comunidade\finance\
Copy-Item -Recurse ..\claude-skills\c-level-advisor\* skills\comunidade\c-level\
Copy-Item -Recurse ..\claude-skills\ra-qm-team\* skills\comunidade\ra-qm\
Copy-Item -Recurse ..\claude-skills\business-growth\* skills\comunidade\business-growth\
Copy-Item -Recurse ..\claude-skills\product-team\* skills\comunidade\product\
Copy-Item -Recurse ..\claude-skills\project-management\* skills\comunidade\pm\

# 4. Verificar
Get-ChildItem skills\comunidade -Recurse -Filter "SKILL.md" | Measure-Object

# 5. Commit
git add skills\
git commit -m "S44: estrutura skills ISA-95 + 122 skills comunidade + 12 custom L4-COM"
git push
```

---

## MÉTRICAS S44

| Métrica | Antes | Depois |
|---------|-------|--------|
| Skills no repo | 1 (analise-fabricante) | 135+ |
| Secções ISA-95 com skills | 1 | 16 |
| Skills comunidade instalados | 0 | 122 |
| Skills custom CSN | 0 | 12 (L4-COM) |
| Estrutura ISA-95 skills | não existe | completa |
