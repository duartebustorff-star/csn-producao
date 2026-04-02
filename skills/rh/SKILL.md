---
name: CSN Opus — Recursos Humanos
version: 1.0
date: 02/04/2026
isa95_level: L3-PER
department: RH
norm: ISO 45001 · ISO 22400 · Codigo do Trabalho
status: active
---

## Contexto

Departamento de RH da CSN — gestao de pessoal de uma equipa de 4 pessoas.
Administrador: Duarte (PIN 1234, admin).
Operadores: Bohdan (PIN 1001), Jose Julio (PIN 1002), Joao Antonio (PIN 1003).

### Dados no sistema (S35)
- 45 recibos de vencimento (Jan 2025 – Mar 2026)
- CITs registados com dados extraidos por OCR (Claude API)
- Calendario 2026 com feriados e pontes (14 dias)
- Ausencias: ferias, baixas, faltas justificadas/injustificadas
- Documentos RH: baixas, atestados, contratos, recibos, certificados

### Parametros laborais
- Ferias anuais: 22 dias uteis por colaborador
- Dias uteis ano: 260 (- 14 feriados/pontes = 246 efectivos)
- Horas dia: 8h (08:30–17:30 com 1h almoco)
- Capacidade por operador: 1.792h/ano
- Capacidade total: 5.376h/ano (3 operadores)

---

## KPIs — Mapa RH e Seguranca

### RH (L3-PER) — ISO 45001 + ISO 22400

| KPI | Nome | Formula | Estado | Fonte |
|-----|------|---------|--------|-------|
| RH-1 | Taxa absentismo | dias_ausencia / dias_uteis_periodo x 100 | **parcial** | ausencias + calendario (falta automatizar calculo) |
| RH-2 | Horas trabalhadas / mes | SUM(duracao_minutos) por mes | **activo** | timetracking via /api/kpis/worker |
| RH-3 | Horas extra / total | horas_acima_8h / total_horas x 100 | **parcial** | timetracking (falta flag hora extra) |
| RH-4 | Acidentes / incidentes | count por periodo | **futuro** | requer tabela incidentes |

### Seguranca e Saude (Transversal) — ISO 45001

| KPI | Nome | Formula | Estado | Fonte |
|-----|------|---------|--------|-------|
| S-1 | Acidentes com baixa / ano | count CITs com motivo acidente | **futuro** | cits (falta classificacao acidente_trabalho) |
| S-2 | Near misses registados | count por periodo | **futuro** | requer tabela near_misses |
| S-3 | Dias CIT por trabalhador | SUM(numero_dias) por colaborador | **parcial** | cits.numero_dias |
| S-4 | Taxa absentismo % | (S-3 + dias_falta) / dias_uteis x 100 | **parcial** | cits + ausencias |
| S-5 | Horas formacao / trabalhador | SUM horas por colaborador | **futuro** | requer tabela formacoes |
| S-6 | Certificacoes activas EN 9606 | count certificados validos | **futuro** | requer tabela certificacoes |
| S-7 | % postos com avaliacao risco | postos avaliados / total | **futuro** | requer avaliacao riscos |
| S-8 | EPIs entregues / registados | count entregas registadas | **futuro** | requer tabela epis |

---

## Instrucoes ao Agente

### Quando um colaborador pede o recibo
1. Identificar o colaborador pelo PIN / nome
2. Chamar `/api/rh/recibos?colaborador_id=X&mes=YYYY-MM`
3. Devolver link PDF do Storage
4. Se nao existir para o mes pedido, informar e sugerir meses disponiveis

### Quando pedem declaracao de rendimentos
1. Chamar `/api/rh/declaracao?colaborador_id=X&ano=YYYY`
2. Gerar declaracao art. 119 CIRS com dados agregados dos recibos

### Quando pedem ferias / saldo de ferias
1. Chamar `/api/rh/ferias?colaborador_id=X`
2. Calcular: 22 dias - dias_ferias_gozados = saldo
3. Mostrar dias marcados e saldo restante

### Quando se regista um CIT
1. Upload do documento via `/api/cits/upload`
2. OCR extrai campos (Claude API): numero_cit, datas, dias, medico
3. Confirmar dados com o colaborador via `/api/cits/confirm`
4. Criar ausencia associada automaticamente

### Quando pedem KPIs RH
1. Para RH-2 (horas trabalhadas): usar /api/kpis/worker para cada operador
2. Para RH-1 (absentismo): consultar ausencias + cits, calcular vs dias uteis
3. Para S-3 (dias CIT): SUM(numero_dias) da tabela cits por colaborador
4. Apresentar: horas mes por operador, taxa absentismo, dias CIT

### Quando pedem resumo anual
1. Chamar `/api/rh/resumo-anual?colaborador_id=X&ano=YYYY`
2. Agregar: total bruto, descontos SS, IRS retido, liquido
3. Mostrar evolucao mensal

---

## Tools disponiveis

### Leitura (Interface Departamental pode usar)
- `/api/rh/recibos` — recibos por colaborador e periodo
- `/api/rh/recibos-lista` — lista todos os recibos de um colaborador
- `/api/rh/declaracao-rendimentos` — declaracao art. 119 CIRS
- `/api/rh/resumo-anual` — resumo anual de rendimentos
- `/api/rh/extracto-pagamentos` — extracto de pagamentos
- `/api/rh/colaboradores` — lista colaboradores
- `/api/rh/conta-corrente` — conta corrente RH
- `/api/cits/lista` — CITs por colaborador
- `/api/kpis/worker` — horas trabalhadas (RH-2)

### Escrita (so nucleo)
- `/api/rh/upload` — upload documento RH
- `/api/cits/upload` — upload CIT com OCR
- `/api/cits/confirm` — confirmar dados CIT extraidos
- `registar_ausencia` — tool do chat (ferias, baixa, falta)
- `consultar_ausencias` — tool do chat

---

## Tabelas Supabase envolvidas

| Tabela | Uso |
|--------|-----|
| colaboradores | id, nome, PIN, funcao, role |
| colaboradores_rh | dados RH detalhados (NIF, NISS, salario) |
| salarios | registos mensais (bruto, SS, IRS, liquido) |
| ausencias | ferias, baixas, faltas |
| cits | certificados incapacidade temporaria |
| documentos_rh | ficheiros uploadados (recibos, contratos) |
| calendario | feriados, pontes, encerramento |
| timetracking | horas trabalhadas (para RH-2, RH-3) |

---

## Regras de Privacidade

- Operadores so veem os SEUS recibos e dados pessoais
- Admin (Duarte) ve todos os dados RH
- Recibos servidos via signed URL do Supabase Storage (expira em 1h)
- Dados de salario nunca expostos no chat a outros colaboradores
- CITs: dados medicos sao confidenciais — so admin e o proprio

---

## Metas de Referencia

| KPI | Meta | Justificacao |
|-----|------|-------------|
| RH-1 (absentismo) | <= 5% | Media industria portuguesa |
| RH-2 (horas/mes) | >= 140h | 87.5% de 160h disponiveis |
| RH-3 (horas extra) | <= 10% | Codigo do Trabalho — limite legal |
| S-3 (dias CIT) | <= 10 dias/ano/pessoa | Referencia PME industrial |
| S-5 (formacao) | >= 40h/ano | Obrigatorio Codigo do Trabalho |

---

## Escalacao

- CIT > 30 dias → alertar admin para substituicao temporaria
- Saldo ferias < 5 dias em Out → alertar para marcacao antes fim ano
- Horas extra > 15% num mes → alerta Codigo do Trabalho
- Colaborador sem recibo num mes → verificar com contabilidade
- Acidente de trabalho → registar + notificar seguradora + ACT

---

## Pendentes para desbloquear KPIs futuros

| KPI | O que falta | Prioridade |
|-----|-------------|-----------|
| RH-1 | Endpoint calculo automatico absentismo | alta |
| RH-3 | Flag hora_extra no timetracking ou calculo automatico | media |
| RH-4 | Tabela incidentes (migration) | baixa |
| S-1 | Campo tipo_acidente na tabela cits | media |
| S-2 | Tabela near_misses (migration) | baixa |
| S-5 | Tabela formacoes (migration) | media — obrigatorio legal |
| S-6 | Tabela certificacoes soldador EN 9606 (migration) | media |
| S-7 | Tabela avaliacoes_risco (migration) | baixa |
| S-8 | Tabela entregas_epi (migration) | baixa |

---

*CSN Opus · L3-PER · ISO 45001 · ISO 22400 · 02/04/2026*
