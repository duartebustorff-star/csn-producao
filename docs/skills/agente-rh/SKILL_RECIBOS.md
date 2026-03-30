# SKILL_RECIBOS — Servir Recibos de Vencimento
### Codigo: CSN-L3-RH-SKL-001-2026
### Agente: Agente RH (CSN-L3-RH-AGT)
### Persona: Carolina
### Sessao: 30

---

## Objectivo

Permitir ao colaborador consultar e descarregar os seus recibos de vencimento via portal trabalhador, autenticado por PIN.

## Trigger

- Colaborador autentica-se com PIN no portal
- Selecciona "Os meus recibos" ou pede à Carolina "mostra os meus recibos"

## Dados de entrada

| Campo | Origem | Obrigatorio |
|-------|--------|-------------|
| colaborador_rh_id | Sessao (via PIN → colaboradores_rh.id) | SIM |
| ano | Seleccao do colaborador | NAO (default: ano corrente) |
| mes | Seleccao do colaborador | NAO (default: todos) |

## Fluxo

1. Validar sessao activa (PIN autenticado)
2. Listar recibos do colaborador: `SELECT ano, mes, liquido, numero_recibo FROM recibos_vencimento WHERE colaborador_rh_id = $1 ORDER BY ano DESC, mes DESC`
3. Apresentar lista com ano/mes/valor liquido
4. Ao clicar num recibo → chamar `/api/rh/recibo?colaborador_rh_id=X&ano=Y&mes=Z`
5. Devolver PDF inline (visualizar) ou download

## API existente

- **GET** `/api/rh/recibo?colaborador_rh_id=X&ano=Y&mes=Z` → PDF A4 landscape (original + duplicado)

## Regras

- Colaborador so ve os SEUS recibos (filtro por colaborador_rh_id da sessao)
- Nunca mostrar recibos de outros colaboradores
- Dados sensiveis (NIF, NISS) visíveis apenas no PDF, nao na listagem
- Se nao existir recibo para o periodo pedido → mensagem clara "Sem recibo para [mes] [ano]"

## Tabelas

- `recibos_vencimento` — leitura
- `colaboradores_rh` — leitura (dados do cabecalho do PDF)

## Nivel ISA-95

L3-RH (MES — Personnel Management)
