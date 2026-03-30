# SKILL_PONTO — Registo de Ponto por Obra e Fase
### Codigo: CSN-L3-PRD-SKL-001-2026
### Agente: Agente Producao (CSN-L3-PRD-AGT)
### Persona: Fernando
### Sessao: 30

---

## Objectivo

Permitir ao colaborador registar entrada e saida de trabalho, associando tempo a uma obra e fase especifica. Usa a API /api/timer existente que escreve na tabela timetracking.

## Trigger

- Colaborador carrega "Entrada" no portal → selecciona obra e fase → timer inicia
- Colaborador carrega "Saida" → timer para, duracao calculada

## API existente

- **GET** `/api/timer?colaborador_id=X` → timer activo (ou null)
- **POST** `/api/timer` body `{ colaborador_id, action: "start", obra_id, fase_id }` → inicia
- **POST** `/api/timer` body `{ colaborador_id, action: "stop" }` → para e calcula duracao

## Fluxo — Entrada

1. Colaborador autentica-se com PIN
2. Sistema verifica se ja tem timer activo (GET /api/timer)
3. Se sim → mostrar timer em curso com botao "Saida"
4. Se nao → listar obras activas (GET /api/obras?estado=producao)
5. Colaborador selecciona obra → listar fases pendentes/em_curso dessa obra
6. Colaborador selecciona fase → POST /api/timer (start)
7. Confirmar: "Entrada registada — [obra] / [fase] — [hora]"

## Fluxo — Saida

1. Colaborador carrega "Saida"
2. POST /api/timer (stop)
3. Sistema calcula duracao e actualiza horas_reais na fase
4. Confirmar: "Saida registada — [duracao] minutos em [obra] / [fase]"

## Regras

- Um colaborador so pode ter UM timer activo de cada vez
- Timer sem stop automatico — se esquecer, admin corrige manualmente
- Fases visiveis: apenas estado='pendente' ou 'em_curso'
- Ao iniciar timer numa fase pendente, fase passa a 'em_curso'
- Duracao somada a fases_obra.horas_reais automaticamente no stop

## Tabelas

- `timetracking` — leitura/escrita (via API)
- `obras` — leitura (via API)
- `fases_obra` — leitura/escrita (via API)
- `colaboradores` — leitura (colaborador_id = colaboradores.id, NAO colaboradores_rh.id)

## Nota: registos_ponto vs timetracking

A tabela `registos_ponto` (migration 019) foi criada para registo simples entrada/saida. A tabela `timetracking` (ja existente) faz o mesmo MAS com associacao a obra e fase. Na pratica, `timetracking` ja cobre tudo o que `registos_ponto` faria. Recomendacao: usar apenas `timetracking` e considerar deprecar `registos_ponto`.

## Nivel ISA-95

L3-PRD (MES — Production Tracking / Data Collection)
