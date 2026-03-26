# ADR-024 — Agente FEA: Testes Estruturais Automáticos com iLogic + Inventor Nastran

**Data:** 26/03/2026
**Hora (Lisboa):** 12:30 WET (UTC+1 — WEST)
**Estado:** ✅ Aceite
**Sessão:** 15 (continuação)

---

## Contexto

A certificação EN 12642 (resistência estrutural da carroçaria) exige ensaio ou cálculo FEA por modelo de carroçaria. Pagar um laboratório para cada modelo novo é lento e caro. O Autodesk Inventor Nastran permite fazer análises FEA computacionais que os organismos notificados aceitam quando o método é validado uma vez. O iLogic automatiza todo o processo dentro do Inventor.

---

## Decisão

**Agente FEA** — Autonomous Agent no departamento técnico do CSN Opus.

**Tipo:** Autonomous Agent — sem persona — trabalha em background
**Ferramentas:** Autodesk Inventor + Inventor Nastran + iLogic
**Normas base:** EN 12642:2016 (L e XL) + EN ISO 3834 (materiais)
**Nível ISA-95:** Nível 3 — MES / Técnico
**Departamento:** Técnico / Engenharia

---

## O que o Agente FEA faz

```
1. Recebe parâmetros da carroçaria do CSN Brain
   → comprimento, largura, altura
   → espessura de chapa por componente
   → perfis estruturais (UPN, RHS, etc.)
   → material (S235JR, S355, etc.)
   → tipo de carroçaria (basculante, estrado)
        ↓
2. Gera modelo 3D paramétrico via iLogic
   → cria geometria automaticamente no Inventor
   → aplica materiais e secções correctas
        ↓
3. Define condições de carga EN 12642
   → Código L: forças de parede definidas na norma
   → Código XL: forças de parede maiores
   → Condições de fronteira: pontos de fixação ao chassi
        ↓
4. Lança análise Nastran automaticamente
   → via iLogic API do Nastran
   → análise estática linear
   → verifica tensões e deformações
        ↓
5. Extrai e verifica resultados
   → tensão máxima vs. limite do material
   → deformação máxima vs. critério EN 12642
   → resultado: PASSA / FALHA / MARGEM DE SEGURANÇA
        ↓
6. Gera relatório automático
   → PDF com geometria, cargas, resultados, conclusão
   → Entra automaticamente no dossier de obra
   → Evidência para auditoria EN 12642
```

---

## Base de Conhecimento — RAG iLogic

O Agente FEA alimenta-se do RAG iLogic já definido no ADR-022:

```
knowledge-base/tecnico/plm/inventor-ilogic/
  trenches_chunks.json          ← Inventor Trenches blog (RAG em construção)
  github_inventorcode_chunks.json
  au_chunks.json                ← Autodesk University sessions
  help_chunks.json              ← Documentação oficial Inventor 2026
  forum_chunks.json             ← Fórum Autodesk Programming
```

O agente consulta este RAG para:
- Gerar código iLogic correcto para cada tipo de análise
- Resolver erros de API do Nastran
- Optimizar o modelo para convergência da análise

---

## Condições de Carga EN 12642

### Código L (carroçaria standard)
```
Parede frontal:   ≥ 0.4 × peso carga × g
Paredes laterais: ≥ 0.3 × peso carga × g  
Parede traseira:  ≥ 0.25 × peso carga × g
Tecto:            ≥ 0.2 × peso carga × g
```

### Código XL (carroçaria reforçada — mercado DE/FR obrigatório)
```
Parede frontal:   ≥ 0.5 × peso carga × g
Paredes laterais: ≥ 0.4 × peso carga × g
Parede traseira:  ≥ 0.3 × peso carga × g
Tecto:            ≥ 0.6 × peso carga × g
```

---

## Workflow iLogic — Estrutura do Código

```vb
' 1. Receber parâmetros do sistema
Dim comprimento As Double = iProperties.Value("Custom", "comprimento_carrocaria")
Dim largura As Double = iProperties.Value("Custom", "largura_carrocaria")
Dim espessura_lateral As Double = iProperties.Value("Custom", "espessura_chapa_lateral")

' 2. Criar geometria paramétrica
' ... criar sketches, extrusões, estrutura

' 3. Aplicar material S235JR
Dim oMaterial = oDoc.Materials.Item("S235JR")
oComponentDef.Material = oMaterial

' 4. Definir condições de carga EN 12642 XL
Dim carga_lateral As Double = peso_carga * 0.4 * 9.81

' 5. Lançar análise Nastran
Dim oNastran = ThisApplication.ActiveDocument.NastranDocument
oNastran.Solve()

' 6. Extrair resultado
Dim tensao_max As Double = oNastran.Results.MaxStress
Dim limite_material As Double = 235 ' MPa para S235JR

If tensao_max <= limite_material Then
    iProperties.Value("Custom", "resultado_fea") = "PASSA"
Else
    iProperties.Value("Custom", "resultado_fea") = "FALHA"
End If
```

---

## Tabelas Supabase

```sql
CREATE TABLE analises_fea (
  id uuid PRIMARY KEY,
  obra_id uuid REFERENCES obras(id),
  modelo_carrocaria text,
  parametros_entrada jsonb,        -- dimensões, materiais, espessuras
  codigo_en12642 text,             -- 'L' ou 'XL'
  resultado text,                  -- 'PASSA' / 'FALHA'
  tensao_maxima numeric,           -- MPa
  deformacao_maxima numeric,       -- mm
  margem_seguranca numeric,        -- %
  relatorio_pdf_url text,
  versao_modelo text,              -- versão do modelo iLogic usado
  data_analise timestamptz DEFAULT now(),
  aprovado_por text,
  notas text
);
```

---

## Integração com CSN Brain e EN 12642

```
CSN Brain configura carroçaria
        ↓
Box Rules calculadas (ADR-017)
        ↓
Agente FEA corre análise automática
        ↓
Resultado entra na tabela analises_fea
        ↓
Se PASSA → carroçaria certificável EN 12642
Se FALHA → CSN Brain sugere reforços automáticos
        ↓
Relatório PDF entra no dossier de obra
        ↓
Agente Compliance verifica que análise existe
antes de gerar DoP (Declaração de Desempenho)
```

---

## Estratégia de Certificação

1. **Validar o método uma vez** com organismo notificado (Bureau Veritas, TÜV)
2. **Organismo valida** o modelo FEA e os critérios usados
3. **Para modelos novos** — análise interna + relatório → aceite pelo organismo
4. **Resultado:** certificação EN 12642 mais rápida e barata para cada modelo novo

---

## Consequências

- Departamento técnico tem agente FEA como ferramenta core
- Migration 021 adiciona tabela `analises_fea`
- O RAG iLogic (ADR-022 + tarefa Inventor Trenches) é pré-requisito
- O Agente FEA não existe ainda — construção após RAG iLogic estar completo
- A arquitectura v19 inclui Agente FEA no departamento técnico
- Cada obra com carroçaria nova deve ter análise FEA antes de entregar
- Primeiro modelo a analisar: basculante traseiro para Renault Master XDD
