# ADR-004 — Knowledge Base Externa por Domínio (RAG)

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O conhecimento dos agentes estava implícito nos prompts de sistema — cada agente "sabia" de cor o que precisava. Isso significa que actualizar um WPS ou uma norma obrigava a actualizar o prompt do agente. Se um agente fosse apagado e recriado, perdia todo o conhecimento acumulado.

## Decisão

O conhecimento não vive dentro dos agentes. Vive numa **Knowledge Base externa, partilhada e permanente**, organizada por domínio:

```
/knowledge-base
  /csn
    /producao       → WPS, checklists, IT, procedimentos
    /qualidade      → NC, FPC, ISO 9001, EN 1090
    /comercial      → catálogos, argumentários
    /fornecedores   → qualificações, certificados material
  /tecnico
    /normas         → PDFs ISO/EN — as 3 dimensões
    /plm            → Inventor, iLogic, BOM, desenhos
    /bodybuilder    → guidelines Renault, Mercedes, MAN
    /equipamentos   → manuais Bodor, Fronius, quinadora
```

Os agentes consultam a Knowledge Base via RAG quando precisam de informação específica.

## Razão

- Actualizar um documento actualiza o conhecimento de todos os agentes simultaneamente
- Se um agente é apagado, o conhecimento fica
- O conhecimento é auditável — sabe-se exactamente o que cada agente consulta
- Livros técnicos, manuais de equipamentos e normas em PDF podem ser adicionados sem reconstruir agentes
- Cada pasta corresponde a um módulo do organograma — organização consistente

## Consequências

- Cada agente tem acesso apenas às pastas do seu domínio (princípio de acesso mínimo)
- A Luísa (Assistente CEO) tem acesso a todas as pastas
- Novos documentos técnicos (ex: manual do fabricante Renault) são adicionados à pasta correcta e ficam imediatamente disponíveis para os agentes relevantes
- A Knowledge Base é uma camada própria na arquitectura (Camada 5)
