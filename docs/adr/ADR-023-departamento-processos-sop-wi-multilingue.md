# ADR-023 — Departamento de Processos: SOPs + Work Instructions Multilingue

**Data:** 26/03/2026
**Hora (Lisboa):** 12:00 WET (UTC+1 — WEST)
**Estado:** ✅ Aceite
**Sessão:** 15 (continuação)

---

## Contexto

A CSN quer eliminar a dependência de especialistas insubstituíveis. Qualquer pessoa do mundo deve conseguir chegar ao sistema, escolher o seu idioma, e executar qualquer tarefa de produção correctamente — com fotos, vídeos e instruções claras. O operador não precisa de ser especialista — precisa de seguir o sistema.

---

## Decisão

**Departamento de Processos** — módulo dedicado dentro do MES.

**Nível ISA-95:** Nível 3 — MES
**Normas base:** ISO 9001 cláusula 8.1 + EN 1090 (WPS como instrução de trabalho)
**Objectivo:** De carpinteiro especializado para tarefeiro básico com controlo digital

---

## Conceito: Caderno de Montagem Digital

Para cada obra, o sistema gera automaticamente um **Caderno de Montagem** baseado no tipo de carroçaria, chassi e equipamentos.

```
Obra criada no sistema
        ↓
Sistema gera Caderno de Montagem da obra
        ↓
Passos gerais sequenciais
        ↓
Em pontos críticos → Work Instruction específica:
  → Assemblagem — como montar esta estrutura
  → Soldadura — WPS, posição, parâmetros, EN ISO 5817
  → Pintura — primário, demão, tempo de secagem, temperatura
  → Acabamentos — checklist visual por ponto
        ↓
Operador no telemóvel:
  1. Escolhe idioma
  2. Segue passo a passo
  3. Confirma cada etapa com foto
  4. Em caso de dúvida → vídeo explicativo
  5. Sistema regista conclusão de cada passo
```

---

## Estrutura de Documentos

### Nível 1 — SOP (Standard Operating Procedure)
Procedimento geral por processo. Não muda por obra.

```
SOP-SOL-001 — Soldadura MAG em S235JR
SOP-CRT-001 — Corte e Preparação de Chapa
SOP-PIN-001 — Processo de Pintura
SOP-MNT-001 — Montagem de Taipais
SOP-ACB-001 — Acabamentos e Inspecção Final
SOP-MDR-001 — Trabalho em Madeira (taipais)
```

### Nível 2 — WI (Work Instruction)
Instrução específica por tarefa dentro de um SOP. Pode variar por modelo de carroçaria.

```
WI-SOL-001-01 — Soldadura longarinas do subframe
WI-SOL-001-02 — Soldadura taipais laterais
WI-SOL-001-03 — Soldadura dobradiças traseiras
WI-PIN-001-01 — Aplicação de primário epoxy
WI-PIN-001-02 — Demão de acabamento
```

### Nível 3 — Caderno de Montagem (por obra)
Gerado automaticamente para cada obra específica. Combina SOPs e WIs relevantes.

```
CM-OF-2025-041 — Caderno de Montagem Obra 041
  → Fase 1: Subframe
  → Fase 2: Estrutura lateral
  → Fase 3: Soldadura (WI-SOL-001-01, WI-SOL-001-02)
  → Fase 4: Pintura (WI-PIN-001-01, WI-PIN-001-02)
  → Fase 5: Montagem taipais (WI-SOL-001-03)
  → Fase 6: Acabamentos e inspecção (SOP-ACB-001)
```

---

## Suporte Multilingue

Idiomas base:
- 🇵🇹 Português (obrigatório)
- 🇬🇧 English
- 🇺🇦 Українська (ucraniano — João, Bohdan)
- 🇮🇳 हिन्दी (hindi — para futuros workers)
- 🇧🇷 Português do Brasil

O sistema detecta automaticamente o idioma preferido do worker no primeiro login.

---

## Conteúdo por Work Instruction

Cada WI tem:

```
TÍTULO          → o que se vai fazer
OBJECTIVO       → resultado esperado
SEGURANÇA       → EPIs obrigatórios (foto)
MATERIAIS       → o que é necessário (foto)
FERRAMENTAS     → o que usar (foto)
PASSOS          → numerados, com foto de cada passo
VÍDEO           → demonstração do processo completo
CRITÉRIOS       → como saber que está bem feito
ERROS COMUNS    → o que NÃO fazer (foto de erro)
CONFIRMAÇÃO     → foto de conclusão enviada pelo operador
```

---

## Interface no Telemóvel (Fernando)

```
Operador abre a obra no telemóvel
        ↓
Selecciona idioma (uma vez, fica guardado)
        ↓
Vê lista de fases da obra
        ↓
Clica na fase actual
        ↓
Passos numerados com foto + vídeo
        ↓
Em cada passo crítico:
  → Lê instrução
  → Vê foto de referência
  → Faz a tarefa
  → Tira foto de confirmação
  → Clica "Concluído"
        ↓
Sistema regista + Fernando recebe confirmação
```

---

## Integração com Normas

| Work Instruction | Norma | O que integra |
|---|---|---|
| Soldadura | EN 1090 + EN ISO 3834 | WPS por junta, nível EN ISO 5817 |
| Inspecção visual | EN ISO 17637 | Critérios de aceitação por tipo de defeito |
| Pintura | ISO 9001 | Controlo de processo, temperaturas, tempo |
| Montagem estrutural | EN 1090 EXC2 | Torques de aperto, verificação dimensional |
| Acabamentos | Reg. 2018/858 | Checklist GSR, iluminação, protecções |

---

## Evolução Contínua

O departamento de processos está sempre a melhorar:
- Melhores vídeos quando há melhor forma de fazer
- Novos idiomas quando entram novos workers
- Novas WIs quando surgem novos tipos de obra
- Feedback do operador incorporado nas próximas versões
- Métricas: tempo médio por passo → identifica onde há dificuldades

---

## Tabelas Supabase

```sql
sops                    -- SOPs por processo
work_instructions       -- WIs por tarefa (com conteúdo multilingue)
cadernos_montagem       -- gerado por obra
passos_caderno          -- cada passo com estado e foto de confirmação
confirmacoes_operador   -- foto + timestamp + operador por passo
```

---

## Nível ISA-95 e Departamento

**Nível 3 — MES**
**Departamento:** Produção / Qualidade (transversal)
**Normas:** ISO 9001 cláusula 8.1 + EN 1090 + EN ISO 3834

---

## Consequências

- Módulo PLM/Process é adicionado à arquitectura como módulo próprio
- Migration 021 cria tabelas `sops`, `work_instructions`, `cadernos_montagem`, `passos_caderno`
- O Agente Research tem tarefa permanente de melhorar o conteúdo das WIs
- O Fernando acede ao Caderno de Montagem da obra activa para dar contexto ao worker
- A Luísa monitoriza métricas de tempo por passo para identificar oportunidades de melhoria
- Cada WI tem versão e histórico — nunca sobrescrita, sempre incrementada
