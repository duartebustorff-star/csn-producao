---
name: lead-enrich
code: CSN-L4-CST-RES-004-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Enriquecimento de leads B2B — decisor, frota, NIF, CAE, score fit 1-10
version: 1.0.0
created: 2026-04-08
trigger: Quando existe um lead (empresa ou contacto) que precisa de ser enriquecido com dados publicos
output_type: prospeccao
---

# 04 — Lead Enrich

Enriquecimento de leads B2B com dados publicos para qualificacao comercial CSN.

## Prompt Template

```
Enriquece o seguinte lead com dados publicos verificaveis:

LEAD: {{nome_empresa}}
LOCALIZACAO: {{localizacao | "desconhecida"}}
CONTEXTO: CSN vende carrocarias basculantes/estrados/taipais para empresas de terraplanagens, demolicoes, inertes e residuos na zona Grande Lisboa/Oeste/Alentejo.

DADOS A RECOLHER:
1. **Identificacao:** Nome completo, NIF, CAE principal e secundarios, morada sede
2. **Dimensao:** Volume negocios, numero funcionarios, capital social
3. **Decisor:** Nome do gerente/administrador, contacto directo se publico
4. **Frota:** Estimativa de veiculos comerciais (3.5T-8.5T), marcas visiveis
5. **Actividade:** Projectos recentes, obras publicas, concursos (BASE.gov)
6. **Digital:** Website, LinkedIn empresa, Google Maps reviews
7. **Financeiro:** Situacao fiscal (Portal Financas), insolvencias (Citius)
8. **Relacao CSN:** Ja e cliente? Historico se conhecido

SCORE FIT (1-10):
- 10: CAE alvo + zona CSN + frota 3.5T-8.5T + capacidade financeira
- 7-9: 3 de 4 criterios
- 4-6: 2 de 4 criterios
- 1-3: 1 ou nenhum criterio

OUTPUT JSON:
{
  "empresa": "string",
  "nif": "string | null",
  "cae_principal": "string | null",
  "caes_secundarios": ["string"],
  "morada": "string | null",
  "concelho": "string | null",
  "volume_negocios": "number | null",
  "num_funcionarios": "number | null",
  "decisor": {
    "nome": "string | null",
    "cargo": "string | null",
    "linkedin": "string | null",
    "telefone": "string | null",
    "email": "string | null"
  },
  "frota_estimada": {
    "total_veiculos": "number | null",
    "veiculos_3_5t_8_5t": "number | null",
    "marcas": ["string"],
    "confianca": "alta | media | baixa"
  },
  "actividade_recente": [...],
  "presenca_digital": {
    "website": "string | null",
    "linkedin": "string | null",
    "google_rating": "number | null",
    "google_reviews": "number | null"
  },
  "score_fit": N,
  "score_justificacao": "string",
  "fontes": ["URL — campo coberto"]
}

REGRA BANDEIRA: NIF, telefone, email — so se publicamente acessivel. Sem fonte = null. Score fit deve ser conservador.
```

## Fontes para Enriquecimento

| Dado | Fonte |
|------|-------|
| NIF, CAE, sede | Racius, eInforma, Portal da Justica |
| Volume negocios | Racius, eInforma (contas publicas) |
| Decisor | LinkedIn, Racius (orgaos sociais) |
| Frota | Google Maps (imagens), website empresa |
| Obras publicas | BASE.gov.pt |
| Situacao fiscal | Portal das Financas (consulta NIF) |
| Insolvencias | Citius |

## Regras de Execucao

1. Pesquisar nome da empresa em multiplas fontes
2. Confirmar NIF cruzando Racius + Portal Financas
3. Estimar frota com cautela — marcar confianca
4. Calcular score fit com base nos 4 criterios
5. Gravar em `research_findings` tipo `prospeccao`
