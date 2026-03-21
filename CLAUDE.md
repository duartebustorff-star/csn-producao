# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CSN Produção is a production management system for Carlos dos Santos Nascimento, a metalworking company in Mafra, Portugal that builds custom vehicle bodies (open boxes, tippers, platforms). The primary interface is an AI chat assistant ("Sr. Manuel") backed by Claude, with supporting views for production tracking, CRM, documents, HR, and quality management. Designed for a team of 4 operators.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run lint     # ESLint (no custom rules beyond Next.js defaults)
```

There are no tests configured.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19, TypeScript 5
- **Database:** PostgreSQL via Supabase (service role for backend, anon key for frontend)
- **AI:** Anthropic SDK — Claude Sonnet 4.5 for chat + document classification
- **PDF:** pdf-lib (primary) + pdfkit
- **Styling:** Tailwind CSS 4, dark theme (#0c1220 bg, #e8930b orange accent)
- **Fonts:** DM Sans (body) + JetBrains Mono (monospace)
- **Deploy:** Vercel (auto-deploy from GitHub `main` branch)

## Architecture

### API Routes (`src/app/api/`)

All backend logic uses Next.js Route Handlers. Key pattern:

```typescript
import { getServiceSupabase } from "@/lib/supabase"
const supabase = getServiceSupabase()  // Always service role on backend
```

- **`/api/chat`** — Core endpoint. Sends user message + history to Claude with 15 tools defined in `src/lib/chat-tools.ts`. Loops up to 5 iterations for tool_use. Saves message pair to DB.
- **`/api/documentos/gerar-termo`** and **`gerar-checklist`** — Generate PDFs server-side, upload to Supabase Storage.
- **`/api/documentos/upload`** — Sends images to Claude API for document type detection (DAV, FAM, CIT, etc.) and field extraction.
- Other endpoints: `/api/auth` (PIN login), `/api/obras`, `/api/leads`, `/api/timer`, `/api/rh`, `/api/dashboard`, `/api/sgq`, `/api/capacidade`, `/api/parque`, `/api/cits`, `/api/mensagens`.

### AI Tool System (`src/lib/chat-tools.ts`)

15 tools that Claude can invoke to manipulate production data: `consultar_tarefas`, `estado_obra`, `iniciar_timer`, `parar_timer`, `concluir_fase`, `adicionar_nota`, `listar_obras`, `registar_ausencia`, `consultar_ausencias`, `verificar_documentacao`, `receber_veiculo`, `ver_parque`, `criar_lead`, `gerar_termo_responsabilidade`, `gerar_checklist_entrega`. Each tool handler queries/mutates Supabase and returns JSON.

### Frontend (`src/app/page.tsx` + `src/components/`)

Single-page app with login → navigation. All components are `"use client"`. Desktop uses sidebar navigation, mobile uses bottom tabs. Chat view is always mounted (to preserve state). Views are toggled via `activeView` state. Session persists in sessionStorage.

Admin-only views: Leads, RH, Dashboard. Role-based visibility controlled by `Colaborador.role`.

### Database (`supabase/migrations/`)

13 migrations (001–013). Core tables: `colaboradores`, `obras`, `fases_obra`, `timetracking`, `mensagens`, `leads`, `davs`, `fams`, `inspecoes`, `cits`, `dossie_obra`, `audit_log`, `lugares_parque`, `ausencias`, `notas_obra`. All data modifications should be logged to `audit_log` for ISO 9001 compliance.

### Key Libraries (`src/lib/`)

- **`supabase.ts`** — Client factory (service role + anon)
- **`chat-tools.ts`** — Tool definitions + `executeTool()` handler
- **`audit.ts`** — ISO 9001 audit logging
- **`types.ts`** — All TypeScript interfaces
- **`translations.ts`** — PT/EN/UA UI strings
- **`constants.ts`** — Business constants (capacity, schedules, phase assignments)
- **`sgq-pdf.ts`** — Quality system PDF generation

## Important Conventions

- **Language:** Code is in English, but domain terms (table names, tool names, UI labels) are in Portuguese.
- **Path alias:** `@/*` maps to `./src/*` in tsconfig.
- **Supabase access:** Always use `getServiceSupabase()` in API routes. Never expose the service role key to the frontend.
- **Audit logging:** All data mutations must call `audit()` from `src/lib/audit.ts` for ISO 9001 traceability.
- **PDF encoding:** pdf-lib has WinAnsi limitation — characters like `·` (U+00B7) and `—` (U+2014) must be sanitized before embedding in PDFs.
- **9 production phases** (fixed order): Corte → Quinagem → Assembly → Soldadura → Pintura → Montagem taipais → Eletricidade → Palas e extras → Pesagem.
- **Obra states:** espera_documentacao → espera_projeto → espera_veiculo → veiculo_recebido → producao → concluida → entregue.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (backend only)
- `ANTHROPIC_API_KEY` — Claude API key

## Key Documentation

- **`ESTADO.md`** — Project status, implemented features, priorities, and known issues.
- **`CSN-PRODUCAO-BRIEFING.md`** — Complete technical briefing with DB schemas, API pseudocode, and tool definitions.
