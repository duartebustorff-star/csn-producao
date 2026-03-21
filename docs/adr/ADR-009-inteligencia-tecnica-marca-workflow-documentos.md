# ADR-009 — Inteligência Técnica por Marca: Ficha de Fabricante, Workflow de Documentos e Monitorização Contínua

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A CSN precisa de conhecer cada chassi ao pormenor para construir carroçarias conformes, seguras e certificáveis. Esta informação vive em portais de fabricantes, PDFs de mounting directives, newsletters técnicas e portais de parceiros certificados. Sem um sistema de recolha, organização e monitorização desta informação, a CSN depende da memória do técnico e arrisca trabalhar com dados desactualizados.

O objectivo é transformar a CSN no carroçador que mais conhece cada marca — tornando-se parceiro técnico indispensável em vez de simples fornecedor de carroçarias.

---

## Decisão

### 1 — Ficha de Fabricante (por marca)

Cada marca tem uma ficha de fabricante no sistema com:

**Identificação corporativa:**
- Nome, sede, estrutura do grupo
- Importador em Portugal — nome, morada, contacto
- Responsável técnico para carroçadores — nome, email, telefone
- Responsável comercial — nome, email, telefone
- Responsável de homologação — nome, email, telefone

**Programa de parceiros carroçadores:**
- Existe programa? Sim/Não
- Condições de acesso
- Benefícios — portal restrito, newsletter, suporte técnico
- Estado CSN — não inscrito / candidato / parceiro certificado
- URL do portal de parceiros

**Canais de informação técnica:**
- Portal público — URL
- Portal de parceiros — URL (se aplicável)
- Newsletter técnica — existe? subscrição? frequência?
- Jornal/boletim técnico — onde está, como aceder
- Sistema de controlo de documentos — como sabemos se saiu versão nova

**Mercados onde operam:**
- Portugal, França, Alemanha, Espanha — presença e quem contactar

---

### 2 — Ficha de Marca (dados técnicos validados)

Dados técnicos estruturados, validados pela CSN, prontos para uso no sistema:

**Dados por modelo/versão/cabine:**
- PBT máximo
- Tara do chassi
- Carga máxima eixo dianteiro
- Carga máxima eixo traseiro
- Altura máxima do CoG da carroçaria
- Fórmula de cálculo do CoG
- Limites de estabilidade lateral
- Comprimento máximo overhang traseiro
- Relação overhang/wheelbase
- Distância entre eixos por configuração
- Dimensões máximas da carroçaria

**Restrições do fabricante:**
- O que invalida a garantia
- O que invalida a homologação
- Restrições de soldadura no chassi (EN ISO 3834)
- Restrições de perfuração no chassis
- Materiais permitidos para montagem

**GSR — Reg. 2019/2144:**
- Localização sensores AEB por modelo
- Localização câmaras por modelo
- Zonas de exclusão para montagem

**Rastreabilidade da ficha:**
- Fonte dos dados — portal / PDF / scraping
- Documento de referência — nome + versão + data
- Validado por — Duarte
- Data de validação
- Testes de cruzamento realizados
- Versão da ficha — histórico de alterações
- Estado — rascunho / validado / desactualizado

---

### 3 — Workflow de entrada de documentos externos

**Passo 1 — Criar Ordem de Trabalho (OT):**
```
OT-AAAA-NNN-marca
ex: OT-2026-001-fuso
    OT-2026-002-stellantis
```

**Passo 2 — Instrução ao Cowork:**
A prompt do Cowork deve sempre incluir:
```
Ordem de Trabalho: OT-2026-001
Marca: Mitsubishi Fuso
Pasta de destino: Base de dados veiculos/downloads/OT-2026-001-fuso/
Registar no sistema: sim
Gerar relatório: sim
```

**Passo 3 — Cowork executa e gera relatório:**
Ver secção "Relatório de Extracção" abaixo.

**Passo 4 — Documentos validados movem-se para pasta definitiva:**
```
Base de dados veiculos/downloads/OT-XXXX/  →  Base de dados veiculos/validado/marca/
```

**Passo 5 — Registo no sistema:**
Tabela `documentos_externos` no Supabase com todos os metadados.

---

### 4 — Estrutura de pastas no repositório

```
Base de dados veiculos/
  /downloads/
    /OT-2026-001-fuso/          ← Cowork guarda aqui directamente
    /OT-2026-002-stellantis/
    /OT-2026-003-renault/
  /validado/
    /fuso/
      /fabricante/
        ficha_fabricante_fuso.md
        mounting_directives_FE_FG_EuroVI_2025.pdf
        /newsletter/
        /historico_directivas/
      /dados_tecnicos/
        FUSO_Configuracoes_Completas.xlsx
        FUSO_Registo_Validacao_FBM.docx
    /stellantis/
    /renault/
    /mercedes/
    /man/
    /daf/
    /iveco/
```

---

### 5 — Monitorização contínua (2x por mês)

O Cowork vai ao portal/site de cada marca activa 2 vezes por mês e:
- Compara com o que já tem registado
- Se existe documento novo → descarrega + alerta Luísa
- Se existe versão actualizada → marca anterior como obsoleta + descarrega nova
- Se existe novo boletim/newsletter → regista e arquiva
- Gera relatório de monitorização com diff do que mudou

**Calendário:**
- Dia 1 e dia 15 de cada mês — verificação automática

---

### 6 — Relatório de extracção (formato padrão Cowork)

```
RELATÓRIO DE EXTRACÇÃO
OT: OT-2026-XXX
Marca: [Marca]
Data: DD/MM/AAAA
Operador: Cowork Claude

FONTES CONSULTADAS:
- [URL 1]
- [URL 2]

DOCUMENTOS ENCONTRADOS: N
DOCUMENTOS DESCARREGADOS: N
DOCUMENTOS SEM ACESSO: N (motivo)

LISTA DE DOCUMENTOS:
1. [Nome] v[versão] [data] ✅/❌
2. ...

DOCUMENTOS SEM ACESSO:
- [Nome] — motivo (ex: requer login parceiro certificado)

DIFERENÇAS FACE À ÚLTIMA VERIFICAÇÃO:
- [Novo documento X]
- [Versão actualizada Y: v2.1 → v2.2]

PRÓXIMA VERIFICAÇÃO: DD/MM/AAAA
```

---

### 7 — Acesso a newsletters e jornais técnicos

Para cada marca:
1. Identificar se existe newsletter técnica para carroçadores
2. Subscrever com email CSN
3. Email entra no sistema via Outlook MCP → Roteador → classifica como "alerta técnico marca X"
4. Agente Compliance verifica se afecta obras em curso
5. Luísa alerta Duarte se necessário

---

### 8 — Ciclo virtuoso: certificação → acesso → conhecimento

```
Certificação EN 1090
        ↓
Candidatura a programa de parceiros certificados (Fuso, Mercedes, MAN, etc.)
        ↓
Acesso ao portal restrito de parceiros
        ↓
Informação técnica exclusiva não disponível publicamente
        ↓
Carroçarias mais precisas, mais conformes, menos NC
        ↓
Mais certificações, mais mercados, mais parceiros
```

---

## Tabelas Supabase necessárias

### `marcas_veiculo`
Ficha de fabricante + dados técnicos validados por modelo.

Campos principais:
```
id, marca, gama, modelo, versao, cabine
pbt_max, tara_chassi
carga_max_eixo_dianteiro, carga_max_eixo_traseiro
altura_max_cog, formula_cog
overhang_max_traseiro, relacao_overhang_wheelbase
distancia_eixos, dimensoes_max_carrocaria
restricoes_soldadura, restricoes_perfuracao
sensores_gsr_localizacao, zonas_exclusao_montagem
fonte_dados, documento_ref, versao_documento
validado_por, data_validacao
testes_cruzamento, notas
estado → rascunho / validado / desactualizado
versao_ficha, historico_alteracoes
```

### `documentos_externos`
Registo de todos os documentos recebidos de fabricantes.

Campos principais:
```
id, marca, tipo_documento
nome_ficheiro, versao_documento, data_documento
url_fonte, metodo_obtencao → portal / scraping / email / download_manual
ot_id → ligado à ordem de trabalho
pasta_local, pasta_rag
data_entrada, registado_por
estado → activo / obsoleto / substituido
documento_substituto_id
notas
```

### `ordens_trabalho_cowork`
Registo de todas as ordens dadas ao Cowork.

Campos principais:
```
id, referencia → OT-AAAA-NNN-marca
tipo → extraccao_inicial / monitorizacao / validacao
marca, descricao
pasta_destino
data_criacao, data_execucao
relatorio_extraccao (JSON)
documentos_encontrados, documentos_descarregados, documentos_sem_acesso
proxima_verificacao
estado → pendente / executado / em_monitorizacao / erro
```

---

## Razão

O conhecimento técnico sobre cada marca é um activo estratégico da CSN. Carroçadores certificados com acesso a portais de parceiros têm informação que a concorrência não tem. A monitorização contínua garante que a CSN nunca trabalha com directivas desactualizadas — o que seria uma não-conformidade ISO 9001 e EN 1090.

## Consequências

- Migration 018: criar tabelas `marcas_veiculo`, `documentos_externos`, `ordens_trabalho_cowork`
- Fuso é o primeiro caso — Ficha de Fabricante a criar com base nos documentos já recolhidos
- O Cowork passa a ter sempre na prompt: OT, marca, pasta de destino, instrução de relatório
- O Agente Compliance monitoriza datas de validade das fichas de marca
- A Luísa tem acesso a toda a informação técnica via RAG + tabela `marcas_veiculo`
- Prioridade de marcas: Fuso ✅ recolha feita → Stellantis em curso → Renault → Mercedes → MAN → DAF → Iveco
