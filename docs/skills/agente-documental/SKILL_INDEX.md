# Agente Documental — Skills por Fornecedor de Produção
### Código: CSN-L3-DOC-SKL-IDX-2026
### Nível ISA-95: L3-MOM (Document Management)
### Sessão: 28

---

## VISÃO GERAL

O Agente Documental (L3-DOC) processa automaticamente documentos recebidos por email. Cada skill define as regras de classificação, extracção e acção para um fornecedor específico.

**Base de dados:** 17030 registos, Jan 2024 → Mar 2026, 1127 fornecedores.

---

## SKILLS ACTIVAS — FORNECEDORES DE PRODUÇÃO

| # | Skill | Fornecedor | Material | ISA-95 | Registos | Doc Tipos |
|---|-------|-----------|----------|--------|----------|-----------|
| 1 | SKILL_CHAGAS | Chagas | Aço, tubos, perfis, alumínio | L0-MAT | 167 | FAT(27) CERT31(6) ANEXO(32) |
| 2 | SKILL_COPRIAL | Coprial | Gases soldadura + equipamentos | L0-MAT+EQP | 97 | FAT(33) FT(3) ANEXO(7) |
| 3 | SKILL_PECOL | Pecol | Parafusos, colas, fio solda | L0-MAT | 32 | FAT(10) |
| 4 | SKILL_POLIFER | Polifer | Tinta | L0-MAT | 16 | ANEXO(10) |
| 5 | SKILL_MADEICENTRO | Madeicentro | Madeira / taipais | L0-MAT | 22 | FAT(2) ANEXO(6) |

**Total produção:** 334 registos de 5 fornecedores (2% do total).

---

## DOMÍNIOS EMAIL → SKILL ROUTING

```
@chagas.pt        → SKILL_CHAGAS
@coprial.pt       → SKILL_COPRIAL
@pecol.pt         → SKILL_PECOL
@polifer.pt       → SKILL_POLIFER
@madeicentro.pt   → SKILL_MADEICENTRO
```

Emails de domínios não listados → classificação genérica (regras default do Agente Documental).

---

## TIPOS DE DOCUMENTO PROCESSADOS

| Tipo | Código | Acção Principal |
|------|--------|-----------------|
| Factura | FAT | → invoicexpress_faturas + reconciliação bancária |
| Certificado 3.1 | CERT31 | → certificados_material + rastreabilidade obra |
| Ficha Técnica | FT | → fichas_tecnicas + associação produto |
| Guia Remessa | GR | → recepção material + match com factura |
| Extracto Conta | EXT | → Agente Financeiro |
| Orçamento | ORC | → cotações pendentes |
| Aviso Cobrança | COB | → Agente Financeiro (alerta) |
| Email genérico | EMAIL | → arquivo com metadata |

---

## DEPENDÊNCIAS

### Tabelas existentes (30)
- `invoicexpress_faturas` — registo de facturas
- `movimentos_bancarios` — reconciliação bancária
- `fornecedores` — dados fornecedor

### Tabelas necessárias (Migration 017)
- `materiais` — catálogo de materiais por fornecedor
- `lotes_material` — lotes recebidos com rastreabilidade
- `certificados_material` — certificados 3.1 por lote
- `consumos_material` — consumo por obra (MESA #11 Process Management)

### Tools do Agente Documental (a criar)
- `classificar_documento` — classifica tipo doc por regras da skill
- `associar_obra` — liga documento a obra em produção
- `registar_material` — regista recepção de material + lote

---

## PRÓXIMOS SKILLS (candidatos para sessões futuras)

| Fornecedor | Registos | Doc Tipos | Material | Prioridade |
|-----------|----------|-----------|----------|------------|
| Bielco | 80 | FAT(17) GR(2) ANEXO(21) | Alumínio, réguas, taipais alu | Alta — fornecedor recorrente |
| Silfesan | 109 | FAT(14) GR(1) ANEXO(15) | Corte laser, maquinação | Alta — subcontratação produção |
| Assertiva (contabilidade) | 442 | FAT(165) GR(24) ANEXO(68) | Serviços contabilidade | Média — Agente Financeiro |
| DomCarro | 157 | GR(23) CERT31(6) ANEXO(99) | Frio, unidades frigoríficas | Média — parceiro comercial |

---

## FICHEIROS

```
docs/skills/agente-documental/
├── SKILL_INDEX.md          (este ficheiro)
├── SKILL_CHAGAS.md         (CSN-L3-DOC-SKL-001-2026)
├── SKILL_COPRIAL.md        (CSN-L3-DOC-SKL-002-2026)
├── SKILL_PECOL.md          (CSN-L3-DOC-SKL-003-2026)
├── SKILL_POLIFER.md        (CSN-L3-DOC-SKL-004-2026)
└── SKILL_MADEICENTRO.md    (CSN-L3-DOC-SKL-005-2026)
```
