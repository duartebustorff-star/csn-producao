---
name: CSN Opus — Contexto Global
version: 1.0
date: 02/04/2026
isa95_level: Transversal
department: Global
norm: ISA-95/IEC 62264 · ISO 9001 · EN 1090
status: planeado
---

## Empresa

Carlos dos Santos Nascimento, Lda (CSN)
NIF: 500 861 790
Actividade: Fabrico de carroçarias para veículos comerciais
Morada: Mafra, Portugal
Email: geral@carrocariascsn.pt

## Pessoas

| Nome | PIN | Função | ISA-95 |
|------|-----|--------|--------|
| Duarte | 1234 | Admin / CEO | L4 |
| Bohdan | 1001 | Operário produção | L0 |
| José Júlio | 1002 | Operário produção | L0 |
| João António | 1003 | Operário produção | L0 |

## Arquitectura ISA-95

O sistema CSN Opus segue ISA-95/IEC 62264 com 5 níveis:
- L4-BPL: Negócio (FIN, COM, ENG, QMS)
- L3-MOM: Operações (PRD, MNT, QMS, PER, DOC, INV)
- L2-SUP: SCADA (Bodor laser)
- L1-SEN: PLC/Sensores
- L0-PHY: Máquinas e Pessoal

## Regra de Ouro

Interfaces Departamentais raciocinam e comunicam.
Nunca escrevem no núcleo ISA-95.
O Roteador Externo é o único ponto de entrada.

## Normas Activas

| Norma | Nível | Âmbito |
|-------|-------|--------|
| ISO 9001:2015 | L4 | SGQ |
| ISO 14001 | L4 | Ambiente |
| ISO 45001 | L3 | Segurança |
| ISO 22400 | L3 | KPIs MOM |
| ISO 55001 | L3 | Activos |
| ISO 50001 | L2 | Energia |
| EN 1090-1/-2 | L0 | Estruturas aço + CE |
| EN ISO 3834-3 | L0 | Qualidade soldadura |
| EN 12642 (L/XL) | L0 | Resistência estrutural |
| Reg. 2018/858 | L4 | Homologação veículos |
| Reg. 2019/2144 | L0 | GSR segurança |

## Stack Técnico

- Frontend: Next.js + TypeScript + Tailwind
- Backend: Supabase (PostgreSQL)
- Storage: Supabase Storage (bucket: documentos)
- AI: Claude API (Anthropic)
- Deploy: Vercel
- Repo: duartebustorff-star/csn-producao

## Dados no Sistema (S35)

- 18.169 emails indexados (emails_indice)
- 3.333 PDFs no Storage
- 381 fornecedores com NIF
- 4.409 registos e-Fatura
- 45 recibos RH (Jan 2025 – Mar 2026)
- 37 tabelas Supabase

## Codificação de Documentos

Formato: CSN-L[nivel]-[secção]-[seq]-[ano]
Secções: PRD, QMS, MNT, INV, PER, EQP, MAT, FIN, DOC, RH, COM, ENG

*CSN Opus · duartebustorff-star/csn-producao · 02/04/2026*
