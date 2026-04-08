---
name: monitor-changes
code: CSN-L4-CST-RES-006-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Deteccao de mudancas em sites de concorrentes, fabricantes e reguladores
version: 1.0.0
created: 2026-04-08
trigger: Verificacao periodica de alteracoes em URLs monitorizadas
output_type: concorrencia | fabricante | norma
---

# 06 — Monitor Changes

Deteccao sistematica de alteracoes em websites de concorrentes, fabricantes de chassis e reguladores.

## URLs Monitorizadas

### Concorrentes
| Entidade | URL | O que monitorizar |
|----------|-----|-------------------|
| Galucho | galucho.com | Novos produtos, precos, noticias |
| Berto Pinto | bertopinto.pt | Gama produtos, contactos |
| Inapal | inapal.pt | Novos modelos, certificacoes |
| TrailerWin | trailerwin.com | Catalogos, novidades |

### Fabricantes
| Entidade | URL | O que monitorizar |
|----------|-----|-------------------|
| Mercedes Pro | mercedes-benz.com/bodybuilder | Actualizacoes guidelines Sprinter |
| FUSO | fuso-trucks.com | Novos modelos Canter, guidelines |
| Renault Pro+ | renault.pt/profissional | Renault Master, Pro+ |

### Reguladores
| Entidade | URL | O que monitorizar |
|----------|-----|-------------------|
| IMT | imt-ip.pt | Regulamentacao homologacao |
| AIMMAP | aimmap.pt | Noticias sector metalomecanica |
| ANTRAM | antram.pt | Legislacao transportes |

## Prompt Template

```
Verifica a pagina {{url}} e compara com o estado anterior conhecido.

ESTADO ANTERIOR (se disponivel):
{{snapshot_anterior | "Primeira verificacao — recolher baseline"}}

ANALISA:
1. Conteudo novo (paginas, produtos, noticias) desde ultima verificacao
2. Conteudo alterado (precos, especificacoes, contactos)
3. Conteudo removido
4. Novos ficheiros para download (PDFs, catalogos)

OUTPUT:
{
  "url": "string",
  "data_verificacao": "ISO 8601",
  "estado": "sem_alteracoes | alteracoes_menores | alteracoes_significativas | site_indisponivel",
  "alteracoes": [
    {
      "tipo": "novo | alterado | removido",
      "descricao": "string",
      "localizacao": "string — seccao da pagina",
      "relevancia_csn": "alta | media | baixa",
      "accao_sugerida": "string | null"
    }
  ],
  "snapshot_actual": "string — resumo do estado actual para proxima comparacao"
}

REGRA BANDEIRA: Nao reportar alteracoes cosmeticas (layout, CSS). So reportar mudancas de conteudo relevante.
```

## Regras de Execucao

1. Comparar com snapshot anterior se existir
2. Focar em mudancas de conteudo, nao de design
3. Classificar relevancia para CSN
4. Sugerir accoes quando alteracao e significativa
5. Gravar em `research_findings` com tipo adequado
6. Actualizar snapshot para proxima verificacao
