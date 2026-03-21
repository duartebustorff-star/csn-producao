# ADR-006 — Agente Compliance: Auditoria Mensal Automática

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A conformidade normativa era verificada manualmente e só quando um auditor externo chegava. Não havia monitorização contínua do estado de cumprimento das normas. Certificados de soldadores podiam expirar sem alerta. Cláusulas ISO 9001 podiam estar em falta sem que ninguém soubesse.

## Decisão

O **Agente Compliance** é um Autonomous Agent dedicado que:

1. **Corre automaticamente no primeiro dia de cada mês** — auditoria interna automática
2. **Verifica cada norma, cada cláusula, cada requisito documental**
3. **Regista o resultado** — histórico de auditorias internas ISO 9001
4. **Alerta** certificados a expirar com 60 dias de antecedência
5. **Gera pacote de evidências** específico por auditor externo (ISO 9001, EN 1090, IMT, etc.)

Pacotes de auditoria por norma:
- ISO 9001: política, objectivos, NC, acções correctivas, auditorias internas, revisão gestão
- EN 1090: WPS, WPQR, certificados soldadores, FPC, DoP por obra, registos inspecção
- Reg. 2018/858: COC por veículo, DAV, registos GSR
- ISO 14001 (Fase 3): registos resíduos, consumos energia
- ISO 45001 (Fase 3): avaliação riscos, EPIs, formações, acidentes

## Razão

A certificação EN 1090 e ISO 9001 exigem evidência de auditorias internas regulares (ISO 9001 cláusula 9.2). Automatizar este processo elimina o risco de chegar a uma auditoria externa sem preparação. É também o argumento central do diferenciador da CSN — conformidade documentada e rastreável em tempo real.

## Consequências

- O Agente Compliance alimenta-se da Knowledge Base `/csn/qualidade` e `/tecnico/normas`
- Os resultados das auditorias mensais ficam registados na tabela `audit_log` existente
- A secção "Prontidão para Auditoria" no documento de arquitectura reflecte sempre o estado real
- As percentagens de conformidade são calculadas pelo Agente Compliance — não estimadas manualmente
