# ADR-008 — Base de Dados de Veículos por Marca + Integração Cowork

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

Para construir uma carroçaria correctamente a CSN precisa de conhecer as características técnicas do chassi — dimensões, pontos de fixação, restrições do fabricante, pesos por eixo, localização de sensores GSR. Esta informação vive em portais de fabricantes e em PDFs de guidelines para bodybuilders (carroçadores).

Sem esta informação estruturada no sistema, cada obra depende da memória do técnico ou de consultas manuais aos portais.

## Decisão

**Base de dados de veículos por marca** — uma pasta por fabricante na Knowledge Base e uma tabela `veiculos_base` no Supabase com os dados estruturados.

### Estrutura de ficheiros:
```
knowledge-base/tecnico/bodybuilder/
  /fuso
    FUSO_Configuracoes_Completas.xlsx   ← dados técnicos por modelo/versão
    FUSO_Registo_Validacao_FBM.docx     ← validação contra guidelines
  /renault
  /mercedes
  /man
  /daf
  /iveco
```

### Fluxo de entrada de dados por marca:
```
Portal do fabricante
        ↓
Cowork Claude — scraping automático
        ↓
Excel por marca/modelo (validado contra PDF bodybuilder guidelines)
        ↓
Tabela veiculos_base no Supabase
        ↓
Quando chega obra com esse chassi → sistema já sabe as características
```

### Primeiro caso implementado:
- **Mitsubishi Fuso** — scraping feito via Cowork, validado contra PDF bodybuilder guidelines, resultado em `FUSO_Configuracoes_Completas.xlsx`

## Integração Cowork no sistema

O Cowork (agente de desktop Anthropic) é um executor externo que alimenta o sistema CSN Opus:

```
Cowork (scraping / automação web)
        ↓
Roteador (Autonomous Agent)
        ↓
Sistema CSN Opus (Supabase)
```

**Casos de uso actuais:**
- Scraping de portais de fabricantes para base de dados de veículos
- Upload de ficheiros para GitHub

**Casos de uso futuros:**
- Monitorizar portais de fornecedores e extrair facturas automaticamente
- Verificar portais de certificação (ISQ, Bureau Veritas) para estado de certificados
- Scraping de preços de materiais para actualizar base de dados
- Preencher formulários IMT para COC electrónico (deadline Jul 2026)

**Integração técnica:**
O Cowork acede ao sistema via API Supabase com credenciais controladas — acesso limitado a tabelas específicas, nunca acesso total. Entra como fonte de entrada no Roteador ao lado do email e upload manual.

## Razão

O processo de recolha de dados por marca é repetitivo e escalável. Fazer manualmente para cada marca (Renault, Mercedes, MAN, DAF, Iveco) seria centenas de horas. Com o Cowork é uma tarefa por marca.

A tabela `veiculos_base` no Supabase elimina a dependência da memória do técnico e garante que a informação está disponível para todos os agentes — quando a Luísa, o Fernando ou o Agente QMS precisam de saber os limites de carga por eixo de um Fuso Canter, vão buscar à tabela, não a um PDF.

## Consequências

- Criar tabela `veiculos_base` na próxima migration (018)
- Campos mínimos: marca, modelo, versão, cabine, pbt, tara, comprimento_chassis, largura_chassis, altura_max_carrocaria, distancia_eixos, pontos_fixacao, restricoes_bodybuilder, normas_gsr, fonte_dados, data_validacao
- Cada obra liga a `veiculos_base` via `veiculo_id` — a informação do chassi fica associada à obra automaticamente
- Prioridade de marcas: Fuso ✅ → Renault → Mercedes → MAN → DAF → Iveco
- O Cowork é documentado como ferramenta oficial do ecossistema CSN Opus
