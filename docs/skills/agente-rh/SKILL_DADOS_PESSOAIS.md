# SKILL_DADOS_PESSOAIS — Perfil Pessoal do Colaborador
### Codigo: CSN-L3-RH-SKL-003-2026
### Agente: Agente RH (CSN-L3-RH-AGT)
### Persona: Carolina
### Sessao: 30

---

## Objectivo

Permitir ao colaborador ver os seus dados pessoais registados no sistema. Dados sensiveis parcialmente mascarados.

## Trigger

- Colaborador: "Os meus dados" / "Ver perfil" / "Qual e o meu NIF no sistema?"

## Dados apresentados

| Campo | Fonte | Mascarado |
|-------|-------|-----------|
| nome_completo | colaboradores_rh | NAO |
| categoria_profissional | colaboradores_rh | NAO |
| regime | colaboradores_rh | NAO |
| data_admissao | colaboradores_rh | NAO |
| nif | colaboradores_rh | SIM — mostra ***XXX (ultimos 3) |
| niss | colaboradores_rh | SIM — mostra ***XXX (ultimos 3) |
| iban | colaboradores_rh | SIM — mostra ****XXXX (ultimos 4) |
| morada | colaboradores_rh | NAO |
| contacto | colaboradores_rh | NAO |
| email | colaboradores_rh | NAO |

## Fluxo

1. Validar sessao activa (PIN autenticado)
2. `SELECT * FROM colaboradores_rh WHERE id = $1`
3. Mascarar campos sensiveis antes de apresentar
4. Mostrar em formato ficha

## Regras

- Colaborador so ve os SEUS dados
- Dados fiscais (NIF, NISS, IBAN) sempre mascarados na interface — completos apenas no PDF do recibo
- Colaborador NAO pode editar dados — alteracoes via admin (Duarte/Luisa)
- Se dados em falta (ex: email NULL) → mostrar "Nao registado — contactar administracao"

## Tabelas

- `colaboradores_rh` — leitura

## Nivel ISA-95

L3-RH (MES — Personnel Management)
