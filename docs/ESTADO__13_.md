# ESTADO DO SISTEMA CSN
Atualizado: 12 Março 2026 — Fecho de sessão

## INFRA
- Repo: duartebustorff-star/csn-producao
- Branch: main | Commits: 57
- URL: https://csn-producao.vercel.app
- Migrations: 001–013 todas aplicadas ✅
- Deploy: npx vercel --prod (auto-deploy não funciona)

## FEITO NESTA SESSÃO
- ✅ P1 — Meses em português no termo (commit fd2b58e)
- ✅ P2 — Fix trigger automático: URL prod + body simplificado (commit 439f52b)
- ✅ P3 — Migration 012 aplicada (certificados_matricula, sem constraint FK inspecoes)
- ✅ Dossier obra — ObraDetail.tsx tabs Fases/Dossier + estado docs + download (commit ac18a86)
- ✅ List endpoint suporta obra_id (commit 7e7ce6a)
- ✅ Fix FK concluido_por → null (violação FK colaboradores) (commit 77f2b45)
- ✅ CSN-Processo-Sessoes-v2.pdf

## PENDENTES (por prioridade)
- 🔴 P1 — Testar dossier após fix FK — upload INSP CB-28-LD e verificar termo no dossier
- 🔴 P2 — Botão upload DAV direto no dossier da obra
- 🟠 P3 — altura_ext não preenchida na lead L2026-001
- 🟠 P4 — Checklist GSR (AEB/câmaras/sensores) por obra antes entrega
- 🟡 P5 — COC Eletrónico IMT — deadline julho 2026
- 🟡 P6 — Badge INSP no dashboard de obras
- 🟡 P7 — URL assinada termo expira 7 dias — considerar URL permanente

## OBRAS EM PRODUÇÃO (teste)
- L2026-001-01 CB-42-LF — DAV ✅
- L2026-001-02 CB-78-LB — DAV ✅
- L2026-001-03 CB-34-LG — DAV ✅
- L2026-001-04 CB-98-LF — DAV ✅
- L2026-001-05 CB-72-LD — DAV ✅ INSP ✅
- L2026-001-06 CB-28-LD — DAV ✅ INSP ✅ TERMO (fix FK aplicado — testar)

## REGRAS CRÍTICAS
- PowerShell: SEMPRE cd C:\Users\Utilizador\csn-producao primeiro. Um comando de cada vez.
- Deploy: SEMPRE npx vercel --prod
- Supabase SQL Editor: Ctrl+A → Delete antes de colar. Usar 'New query' para separador limpo.
- FK concluido_por → colaboradores: usar null, nunca "system"
- Ficheiros Claude: download antes de copy no PowerShell
- Git: nunca force push. Sempre git add → commit → push na ordem correta.
- Versioning: NUNCA sobrescrever ficheiros. Os 3 docs de sessão têm sempre o mesmo número: ESTADO__N_.md + CSN-Controlo-Sistema-vN.pdf + csn-architecture__N_.html
- Documentos controlo: SEMPRE PDF, nunca docx.

## DOCS DESTA SESSÃO (__13_)
- csn-architecture__13_.html
- CSN-Controlo-Sistema-v5.pdf (era v5, devia ser v13 — corrigir no próximo)
- ESTADO__13_.md ← este ficheiro

## EMPRESA — DADOS FIXOS
- Nome: Carlos dos Santos Nascimento, Lda
- NIF: 500 861 790
- Morada: Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- CEO: Duarte da Cunha Martins Bustorff-Silva
- Certidão Permanente: 3172-1374-8252

## PESSOAS
- Duarte — CEO, owner, admin
- João — Soldador (EN ISO 9606-1 pendente)
- Bohdan — Soldador (EN ISO 9606-1 pendente)
- José Júlio — Colaborador
- Coordenador IWS/IWT — A contratar (desbloqueia EN 1090)

## EQUIPAMENTO
- Bodor (laser cutter) — ativa
- KUKA (robot soldadura) — a adquirir
- Modelos SolidWorks dos produtos — existem
