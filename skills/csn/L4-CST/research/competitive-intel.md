---
name: competitive-intel
code: CSN-L4-CST-RES-003-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Analise concorrencial sistematica — Galucho, Berto Pinto, Inapal, Marques & Marques, TrailerWin
version: 1.0.0
created: 2026-04-08
trigger: Quando e necessaria analise de concorrentes, precos, posicionamento ou movimentacoes de mercado
output_type: concorrencia
---

# 03 — Competitive Intel

Analise sistematica dos concorrentes directos de CSN no mercado de carrocarias para veiculos comerciais 3.5T-8.5T.

## Concorrentes Monitorizados

| Concorrente | Sede | Especialidade | URLs conhecidas |
|-------------|------|---------------|-----------------|
| Galucho | Braga | Basculantes, reboques, semi-reboques | galucho.com |
| Berto Pinto | Maia | Carrocarias, basculantes | bertopinto.pt |
| Inapal | Leiria | Plasticos, carrocarias isotermicas | inapal.pt |
| Marques & Marques | — | Basculantes, estrados | — |
| TrailerWin | — | Carrocarias, reboques | trailerwin.com |

## Prompt Template

```
Analisa o concorrente {{concorrente}} e compara com CSN (Mafra, carrocarias 3.5T-8.5T).

DIMENSOES DE ANALISE:
1. **Produto:** Gama de produtos, segmentos de peso, materiais (aco/aluminio)
2. **Preco:** Faixas de preco publicas ou indicativas, condicoes de pagamento
3. **Distribuicao:** Zona geografica, pontos de venda, rede de assistencia
4. **Comunicacao:** Website, redes sociais, feiras, publicidade
5. **Capacidade:** Dimensao estimada (funcionarios, producao/mes)
6. **Certificacoes:** ISO, marcacao CE, homologacoes
7. **Clientes:** Sectores-alvo, clientes visiveis (testemunhos, portfolios)
8. **Movimentacoes recentes:** Novos produtos, expansoes, contratacoes, noticias

OUTPUT JSON:
{
  "concorrente": "string",
  "data_analise": "ISO 8601",
  "dimensoes": {
    "produto": { "dados": [...], "fonte": "URL" },
    "preco": { "dados": [...], "fonte": "URL | null" },
    "distribuicao": { "dados": [...], "fonte": "URL" },
    "comunicacao": { "score_1_10": N, "detalhes": "string" },
    "capacidade": { "estimativa": "string", "confianca": "alta|media|baixa" },
    "certificacoes": [...],
    "clientes_visiveis": [...],
    "movimentacoes": [...]
  },
  "vantagens_vs_csn": [...],
  "vulnerabilidades": [...],
  "accoes_recomendadas": [...]
}

REGRA BANDEIRA: Dados sem fonte = null. Estimativas devem ser marcadas com confianca "baixa". Nunca inventar precos ou volumes.
```

## Regras de Execucao

1. Pesquisar website oficial + redes sociais + noticias recentes
2. Verificar Racius/eInforma para dados de empresa (volume negocios, funcionarios)
3. Pesquisar em Standvirtual/CustoJusto veiculos com carrocarias do concorrente
4. Cruzar com dados de feiras (EMAF, Bauma) se aplicavel
5. Gravar em `research_findings` tipo `concorrencia`
