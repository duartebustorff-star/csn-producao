# SKILL_OBRA_ACTIVA — Estado de Obras Activas
### Codigo: CSN-L3-PRD-SKL-002-2026
### Agente: Agente Producao (CSN-L3-PRD-AGT)
### Persona: Fernando
### Sessao: 30

---

## Objectivo

Mostrar ao colaborador as obras em que pode trabalhar, o progresso de cada uma, e as fases disponiveis.

## Trigger

- Colaborador: "Que obras tenho?" / "Em que posso trabalhar?" / abertura do portal
- Fernando: apresenta automaticamente ao abrir a secção producao

## API existente

- **GET** `/api/obras?estado=producao` → obras em producao com fases e dados do lead

## Dados apresentados

### Lista de obras

| Campo | Fonte | Visivel |
|-------|-------|---------|
| numero_obra | obras | SIM |
| cliente | leads.cliente | SIM |
| tipo_carrocaria | leads.tipo_carrocaria | SIM |
| veiculo_marca + modelo | leads | SIM |
| estado | obras | SIM |
| progresso | calculado (fases concluidas / total) | SIM |

### Detalhe de obra (ao clicar)

| Campo | Fonte | Visivel |
|-------|-------|---------|
| fases | fases_obra | SIM — lista com estado e horas |
| VIN | obras | SIM |
| dimensoes | leads | SIM |

## Fluxo

1. GET /api/obras (todas ou filtrado por estado)
2. Calcular progresso: fases com estado='concluido' / total fases
3. Apresentar cards por obra com barra de progresso
4. Ao clicar → mostrar fases com estado (pendente/em_curso/concluido)
5. Fases clicaveis para iniciar timer (chama SKILL_PONTO)

## Regras

- Colaborador ve TODAS as obras activas (nao filtrado por colaborador — na CSN todos trabalham em todas)
- Obras entregues/canceladas nao aparecem por defeito (filtro opcional)
- Progresso = visual, nao percentual exacto (barra simples)

## Tabelas

- `obras` — leitura
- `fases_obra` — leitura
- `leads` — leitura (via join na API)

## Nivel ISA-95

L3-PRD (MES — Production Execution / Production Tracking)
