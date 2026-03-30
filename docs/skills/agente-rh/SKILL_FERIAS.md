# SKILL_FERIAS — Gestao de Ferias e Ausencias
### Codigo: CSN-L3-RH-SKL-002-2026
### Agente: Agente RH (CSN-L3-RH-AGT)
### Persona: Carolina
### Sessao: 30

---

## Objectivo

Permitir ao colaborador consultar saldo de ferias, pedir ferias, e justificar faltas. Permitir ao admin (Duarte/Luisa) aprovar/rejeitar pedidos.

## Trigger

- Colaborador: "Quantos dias de ferias tenho?" / "Quero pedir ferias" / "Justificar falta"
- Admin: "Pedidos de ferias pendentes" / "Aprovar ferias do [nome]"

## Dados de entrada — Consulta saldo

| Campo | Origem | Obrigatorio |
|-------|--------|-------------|
| colaborador_rh_id | Sessao (via PIN) | SIM |
| ano | Seleccao | NAO (default: ano corrente) |

## Fluxo — Consulta saldo

1. Calcular dias de direito: 22 dias uteis/ano (art. 238 CT)
2. Calcular dias gozados: `SELECT COUNT(*) FROM ausencias WHERE colaborador_rh_id = $1 AND tipo = 'ferias' AND EXTRACT(YEAR FROM data_inicio) = $2`
3. Saldo = direito - gozados
4. Mostrar: "Tens [X] dias de ferias disponiveis em [ano]"

## Fluxo — Pedir ferias

1. Colaborador indica data_inicio + data_fim
2. Validar: saldo suficiente, sem sobreposicao com ferias existentes
3. Criar registo em `ausencias` com estado='pendente'
4. Notificar admin (futuro: via Luisa)

## Fluxo — Aprovar/Rejeitar (admin)

1. Listar pedidos pendentes
2. Admin aprova ou rejeita com motivo
3. Actualizar estado em `ausencias`
4. Notificar colaborador (futuro: via Carolina)

## Regras

- Minimo 10 dias consecutivos obrigatorios por ano (art. 241 CT)
- Ferias devem ser pedidas com 15 dias de antecedencia minima
- Colaborador so ve as SUAS ausencias
- Admin ve todas

## Tabelas

- `ausencias` — leitura/escrita (existe, campos: colaborador_rh_id, tipo, data_inicio, data_fim, estado, motivo)
- `colaboradores_rh` — leitura

## Tabela pendente

- `ferias` — tabela dedicada para tracking anual (dias direito, dias gozados, saldo) — NAO CRIADA, usar ausencias por agora

## Nivel ISA-95

L3-RH (MES — Personnel Management)
