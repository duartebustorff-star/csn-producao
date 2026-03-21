# CSN — Estado do Projeto
**Última atualização:** 09/03/2026  
**Repositório:** `duartebustorff-star/csn-producao`  
**URL produção:** https://csn-producao.vercel.app  
**Stack:** Next.js 16 + Supabase + Claude API (claude-sonnet-4-5) + Vercel  
**Pasta local:** `C:\Users\Utilizador\csn-producao`

---

## COMO USAR ESTE FICHEIRO

Quando abrires um chat novo, envia este ficheiro (e o ARCHITECTURE.md se necessário) e diz:
> "Lê o ESTADO.md e o ARCHITECTURE.md e continua o trabalho."

---

## INFRAESTRUTURA

| Componente | Estado | Notas |
|---|---|---|
| Supabase (base de dados) | ✅ ATIVO | Migrações 001–010 deployed |
| Vercel (frontend) | ✅ ATIVO | Deploy automático do GitHub |
| GitHub | ✅ ATIVO | Repo: duartebustorff-star/csn-producao |
| Supabase Storage bucket `documentos` | ✅ ATIVO | Paths: termos/ e checklists/ |
| Claude API | ✅ ATIVO | Model: claude-sonnet-4-5 |

---

## TABELAS SUPABASE EXISTENTES (migrations 001–010)

| Tabela | Existe | Descrição |
|---|---|---|
| obras | ✅ | Obras de produção |
| fases_obra | ✅ | Fases de cada obra |
| leads | ✅ | CRM / pipeline comercial |
| davs | ✅ | Documentos Únicos Automóvel |
| fams | ✅ | Fichas de Aprovação de Modelo |
| inspecoes | ✅ | Inspeções Controlauto |
| cits | ✅ | Certificados de Incapacidade Temporária |
| dossie_obra | ✅ | Documentos por obra (TERM, CHKL, etc.) |
| certificacoes_empresa | ✅ | ISO 9001, EN 1090, etc. |
| audit_log | ✅ | Rastreabilidade ISO 9001 |
| timetracking | ✅ | Timers de produção |
| notas_obra | ✅ | Notas por obra |
| ausencias | ✅ | Faltas e férias |
| lugares_parque | ✅ | Parque de veículos |

**Tabelas ainda por criar:**
- utilizadores, departamentos, permissoes
- fornecedores, faturas
- certificados_material, stocks
- emails, tipos_documento, seguros

---

## FICHEIROS IMPLEMENTADOS E COMMITADOS

### API Endpoints
| Ficheiro | Estado | Notas |
|---|---|---|
| `src/app/api/chat/route.ts` | ✅ | Chat Sr. Manuel, loop até 5 iterações tool_use |
| `src/app/api/documentos/gerar-termo/route.ts` | ✅ | Funcional MAS formato inventado — precisa reescrita |
| `src/app/api/documentos/gerar-checklist/route.ts` | ✅ | Funcional, testado, aprovado (8227 bytes) |

### Bibliotecas
| Ficheiro | Estado | Notas |
|---|---|---|
| `src/lib/chat-tools.ts` | ✅ | 15 tools (ver lista abaixo) |
| `src/lib/supabase.ts` | ✅ | Cliente Supabase |
| `src/lib/audit.ts` | ✅ | Audit log ISO 9001 |
| `src/lib/sgq-pdf.ts` | ✅ | PDFs SGQ |

### Assets
| Ficheiro | Estado | Notas |
|---|---|---|
| `public/csn_logo.png` | ✅ | 99469 bytes, fundo transparente |
| `pdfs_auditoria/` | ✅ | PDFs auditoria ISO 9001 |

### Componentes
| Ficheiro | Estado |
|---|---|
| `src/components/QualidadeView.tsx` | ✅ |
| `src/components/SGQSection.tsx` | ✅ |

---

## 15 TOOLS DO SR. MANUEL (chat-tools.ts)

1. `consultar_tarefas`
2. `estado_obra`
3. `iniciar_timer`
4. `parar_timer`
5. `concluir_fase`
6. `adicionar_nota`
7. `listar_obras`
8. `registar_ausencia`
9. `consultar_ausencias`
10. `verificar_documentacao`
11. `receber_veiculo`
12. `ver_parque`
13. `criar_lead`
14. `gerar_termo_responsabilidade`
15. `gerar_checklist_entrega`

---

## AGENTES — ESTADO REAL DO CÓDIGO

| Agente | Código existe? | Prioridade |
|---|---|---|
| **Sr. Manuel (Produção)** | ✅ IMPLEMENTADO | — |
| **Agente Documental** | ❌ POR FAZER | 🔴 URGENTE |
| Agente Comercial | ❌ POR FAZER | 🟠 Alta |
| Agente Técnico | ❌ POR FAZER | 🟡 Média |
| Agente Stocks | ❌ POR FAZER | 🟡 Média |
| Agente Cliente | ❌ POR FAZER | 🟡 Média |
| Agente Formação | ❌ POR FAZER | 🟢 Baixa |
| Agente Marketing | ❌ POR FAZER | 🟢 Baixa |
| Agente Fornecedores | ❌ POR FAZER | 🟢 Baixa |
| Agente Logística | ❌ POR FAZER | 🟢 Baixa |
| Agente Contabilidade | ❌ POR FAZER | 🟢 Baixa |
| Agente Financeiro | ❌ POR FAZER | 🟢 Baixa |

---

## CHECKLIST DE ENTREGA — O QUE GERA

- Cabeçalho preto com logo CSN centralizado
- 8 itens de verificação
- Grelha 2×2 para 4 fotos (Frente, Retaguarda, Lateral Esq., Lateral Dir.)
- Upload para Supabase Storage (`checklists/CHKL_[obraId]_[data].pdf`)
- URL assinada válida 7 dias

---

## TERMO DE RESPONSABILIDADE — PENDENTE REESCRITA

**Problema:** `gerar-termo/route.ts` gera PDF com formato inventado.

**Formato real CSN que deve replicar:**
- Logo CSN em fundo **branco** (diferente do checklist que tem fundo preto)
- Texto jurídico: "Eu, abaixo assinado com poderes para o efeito, na qualidade de gerente da empresa **Carlos dos Santos Nascimento, Lda**, com o n.º de contribuinte **500 861 790**..."
- Destaque tipo carroçaria: **CAIXA ABERTA COM OU SEM COBERTURA**
- Tabela dados veículo: Marca, Modelo, Matrícula, VIN, Cód. Homologação
- Tabela Carroçaria/Conjunto: dimensões e pesos
- Local e data: "Encarnação, [data]"
- Assinatura: **Duarte da Cunha Martins Bustorff-Silva**
- Certidão Permanente: **3172-1374-8252**

---

## PRÓXIMO A FAZER (por ordem de prioridade)

### 1. 🔴 Agente Documental (URGENTE — hub central)
**O que precisa:**
- Endpoint: `src/app/api/chat/documental/route.ts`
- System prompt: classifica DAV / FAM / CIT / inspeção / certificado material
- Tools: `classificar_documento`, `registar_dav`, `registar_inspecao`, `registar_cit`, `registar_fam`, `verificar_completude_obra`
- Trigger: DAV + inspeção completos → chama `gerar_termo`
- Interface: tab "Documental" no app com chat + área de upload

### 2. 🟠 Reescrever gerar-termo (formato real CSN)
- Ver secção "TERMO DE RESPONSABILIDADE" acima

### 3. 🟠 Permissões admin/operador na interface
- Operadores só veem tab de Produção
- Admin vê tudo

### 4. 🟠 Verificação automática DAV+FAM → obra disponível para produção

---

## NOTAS TÉCNICAS CRÍTICAS

- **GitHub via web_fetch:** não funciona sem auth. Sempre usar PowerShell: `Get-Content ficheiro | clip`
- **Supabase SQL Editor:** sempre Ctrl+A → Delete antes de colar
- **PowerShell:** nunca colar múltiplas linhas juntas — linha a linha
- **WinAnsi encoding (pdf-lib):** caracteres `·` (U+00B7) e `—` (U+2014) não existem em WinAnsi. Usar função `s()` para sanitizar todas as strings antes de passar ao pdf-lib
- **Logo CSN:** `public/csn_logo.png` tem fundo transparente. Para fundo preto (checklist) funciona bem. Para fundo branco (termo) usar versão diferente
- **Vercel:** deploy automático a cada push para `main`
- **NIF CSN:** 500 861 790
- **Endereço:** Estrada Nacional 116, Casal do Rôdo, 2640-216 Encarnação

---

## EMPRESA — DADOS FIXOS

- **Nome:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão Permanente:** 3172-1374-8252
- **Posicionamento:** CSN — Engenharia de Veículos Comerciais

## PESSOAS

- **Duarte** — CEO, owner, admin
- **João** — Soldador (EN 9606-1 pendente)
- **Bohdan** — Soldador (EN 9606-1 pendente)
- **José Júlio** — Colaborador
- **Coordenador IWS/IWT** — A contratar (desbloqueia EN 1090)

## EQUIPAMENTO

- Bodor (laser cutter) — ativa
- KUKA (robot soldadura) — a adquirir
- Modelos SolidWorks dos produtos — existem
