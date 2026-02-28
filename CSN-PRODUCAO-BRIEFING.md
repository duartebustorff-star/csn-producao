# CSN Produção — Briefing Técnico para Claude Code

## Princípio #1: SIMPLICIDADE

Este sistema é para uma fábrica com 4 pessoas, não para uma empresa tech. Cada decisão deve favorecer a opção mais simples:
- Menos ficheiros > mais ficheiros
- CSS inline/Tailwind > sistema de design complexo
- Queries simples > abstrações rebuscadas
- 1 página com tabs > 5 páginas com routing complexo
- Se funciona com uma Google Sheet, não meter Redis
- Se o Claude API resolve com o system prompt, não criar 15 tools

O utilizador principal (Duarte) não é programador. Os colaboradores mal sabem usar o telemóvel. Se for preciso ler um manual para usar, está mal.

## Contexto do Projeto

Estás a construir um sistema de gestão de produção para a **Carlos dos Santos Nascimento Lda (CSN)** — uma metalomecânica portuguesa em Mafra que fabrica carroçarias para camiões (caixas abertas, basculantes, estrados, plataformas).

### A empresa
- 4 colaboradores: Duarte (gestor), João (soldador), Oleksandr (serralheiro, ucraniano), Raj (pintor, indiano)
- Equipa multilingue: português, ucraniano, inglês
- Certificações: ISO 9001, EN 1090, EN 3834
- Equipamento: laser Bodor 6kW, robot KUKA KR210, Fronius TPS/i 400
- CAD: Autodesk Inventor com iLogic
- Cloud: Google Workspace (Drive, Sheets, Calendar)

### O que construir
Uma **web app com chat inteligente** (tipo WhatsApp/Slack) onde:
1. Colaboradores consultam tarefas e registam trabalho via chat natural (cada um na sua língua)
2. Timetracking automático integrado no chat
3. Gestor vê dashboard com estado de todas as obras
4. Sistema lê/escreve numa base de dados central (Supabase)
5. Claude API responde de forma inteligente às perguntas

---

## Stack Tecnológico

```
Frontend:  Next.js (React) + Tailwind CSS
Backend:   Next.js API Routes (ou Route Handlers)
Base dados: Supabase (PostgreSQL)
IA:        Claude API (Anthropic) — modelo claude-sonnet-4-5-20250929
Auth:      PIN simples por colaborador (sem email/password)
Hosting:   Vercel (gratuito)
Ficheiros: Google Drive API (desenhos técnicos por obra)
```

### Porquê esta stack
- Next.js: fullstack num só projeto, deploy fácil na Vercel
- Supabase: PostgreSQL grátis até 500MB, API REST automática, realtime
- Claude API: ~$3/MTok input, ~$15/MTok output (estimativa ~10-20€/mês para 4 users)
- Vercel: hosting gratuito para projetos pequenos
- Google Drive: já usado pela empresa para guardar desenhos Inventor

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                      │
│          Next.js + Tailwind CSS               │
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Login   │ │   Chat   │ │  Obras/Dash  │ │
│  │  (PIN)   │ │  (main)  │ │  (sidebar)   │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ API Routes
┌──────────────────┴──────────────────────────┐
│              BACKEND (Next.js)                │
│                                               │
│  /api/chat     → Claude API + Supabase        │
│  /api/obras    → CRUD obras/fases             │
│  /api/timer    → Timetracking start/stop      │
│  /api/auth     → Verificação PIN              │
│  /api/drive    → Buscar desenhos Google Drive  │
└──────────┬────────────┬─────────────┬────────┘
           │            │             │
    ┌──────┴──┐  ┌──────┴──┐  ┌──────┴──────┐
    │Supabase │  │ Claude  │  │Google Drive  │
    │  (DB)   │  │  API    │  │  (ficheiros) │
    └─────────┘  └─────────┘  └─────────────┘
```

---

## Base de Dados (Supabase)

### Tabela: `colaboradores`
```sql
CREATE TABLE colaboradores (
  id TEXT PRIMARY KEY,           -- 'duarte', 'joao', 'oleksandr', 'raj'
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,          -- 'Gestor', 'Soldador', 'Serralheiro', 'Pintor'
  avatar TEXT DEFAULT '🔧',
  pin TEXT NOT NULL,             -- PIN de 4 dígitos (hash em produção)
  lang TEXT DEFAULT 'pt',        -- 'pt', 'en', 'ua'
  role TEXT DEFAULT 'worker',    -- 'admin' ou 'worker'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais
INSERT INTO colaboradores VALUES
  ('duarte', 'Duarte', 'Gestor', '📋', '1234', 'pt', 'admin', true, now()),
  ('joao', 'João', 'Soldador', '🔧', '1111', 'pt', 'worker', true, now()),
  ('oleksandr', 'Oleksandr', 'Serralheiro', '⚙️', '2222', 'ua', 'worker', true, now()),
  ('raj', 'Raj', 'Pintor', '🎨', '3333', 'en', 'worker', true, now());
```

### Tabela: `obras`
```sql
CREATE TABLE obras (
  id TEXT PRIMARY KEY,           -- '2025-007', '2025-008', etc.
  cliente TEXT NOT NULL,
  tipo TEXT NOT NULL,            -- 'Caixa Aberta 7.5m', 'Basculante 3.5t', etc.
  estado TEXT DEFAULT 'espera',  -- 'espera', 'producao', 'concluida', 'cancelada'
  prioridade INTEGER DEFAULT 0, -- 0=normal, 1=urgente
  notas TEXT,
  drive_folder_id TEXT,          -- ID da pasta no Google Drive com desenhos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `fases_obra`
```sql
CREATE TABLE fases_obra (
  id SERIAL PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,
  fase_numero INTEGER NOT NULL,   -- 1-9 (ordem)
  nome TEXT NOT NULL,              -- 'Corte', 'Quinagem', etc.
  estado TEXT DEFAULT 'pendente',  -- 'pendente', 'em_curso', 'concluido'
  responsavel TEXT REFERENCES colaboradores(id),
  horas_estimadas NUMERIC(6,2) DEFAULT 0,
  horas_reais NUMERIC(6,2) DEFAULT 0,
  notas TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(obra_id, fase_numero)
);
```

### Tabela: `timetracking`
```sql
CREATE TABLE timetracking (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  obra_id TEXT REFERENCES obras(id),
  fase_obra_id INTEGER REFERENCES fases_obra(id),
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim TIMESTAMPTZ,
  duracao_minutos NUMERIC(8,2),  -- calculado ao parar
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `mensagens`
```sql
CREATE TABLE mensagens (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  role TEXT NOT NULL,              -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  metadata JSONB,                  -- info extra (ação executada, obra referenciada, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `notas_obra`
```sql
CREATE TABLE notas_obra (
  id SERIAL PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,
  colaborador_id TEXT REFERENCES colaboradores(id),
  texto TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota',       -- 'nota', 'problema', 'material', 'foto'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Fases de produção (template)
As fases são sempre as mesmas, por esta ordem:
1. **Corte** — cortar material (laser, serrote)
2. **Quinagem** — dobrar perfis/chapas (quinadora)
3. **Assembly** — montagem/ponteamento da estrutura
4. **Soldadura** — soldadura completa (robot KUKA ou manual)
5. **Pintura** — preparação superfície + pintura
6. **Montagem taipais** — montar painéis laterais/taipais
7. **Eletricidade** — instalação elétrica (luzes, fichas)
8. **Palas e extras** — para-lamas, para-choques, acessórios
9. **Pesagem** — pesagem final e registo

> **NOTA:** As fases 1-3 do processo completo (CRM, Projeto, Stock/Material) são geridas pelo Duarte antes da obra entrar em produção. Só quando o projeto está feito e o material está disponível é que a obra passa a estado "producao" e aparece para os colaboradores.

### Responsabilidades padrão por tipo de obra
Quando se cria uma obra nova, as fases são atribuídas assim:
- Oleksandr: Corte, Quinagem, Assembly, Eletricidade
- João: Soldadura, Palas e extras
- Raj: Pintura, Montagem taipais
- Duarte: Pesagem (+ supervisão geral)

O Duarte pode alterar estas atribuições manualmente.

---

## Autenticação

Sistema simples por PIN (não é necessário OAuth ou email):

```
1. Ecrã login: escolhe o teu nome (grid de avatares)
2. Ecrã PIN: introduz 4 dígitos
3. Se correto → sessão criada (cookie ou localStorage com colaborador_id)
4. Se errado → tremor + tentar novamente
```

- Sessão expira após 8 horas de inatividade
- Sem registo de novos utilizadores pela app (Duarte adiciona via Supabase)
- Em produção, os PINs devem ser hashed (bcrypt)

---

## Chat + Claude API

### Como funciona o fluxo do chat

```
1. Colaborador escreve mensagem
2. Frontend envia POST /api/chat com:
   - colaborador_id
   - mensagem
   - histórico recente (últimas 20 mensagens)
3. Backend:
   a) Consulta Supabase para contexto atual:
      - Tarefas do colaborador (fases em_curso e pendentes)
      - Estado das obras em produção
      - Timer ativo (se existir)
   b) Monta o system prompt com:
      - Identidade do colaborador (nome, função, língua)
      - Dados das obras/tarefas
      - Instruções de comportamento
      - Tools disponíveis
   c) Chama Claude API
   d) Processa a resposta:
      - Se Claude chamou tool → executa ação no Supabase
      - Guarda mensagem + resposta na tabela mensagens
   e) Retorna resposta ao frontend
```

### System Prompt para o Claude

```
Tu és o assistente de produção da CSN Carroçarias (Carlos dos Santos Nascimento Lda), uma metalomecânica em Mafra, Portugal, que fabrica carroçarias para veículos comerciais.

Estás a falar com: {{colaborador_nome}} ({{colaborador_funcao}})
Língua preferida: {{colaborador_lang}}

REGRAS:
- Responde SEMPRE na língua do colaborador (pt/en/ua)
- Sê conciso e prático — é uma fábrica, não um escritório
- Usa emojis com moderação para clareza visual
- Quando o colaborador pede tarefas, mostra primeiro as "em_curso", depois "pendentes"
- Quando o colaborador diz que acabou uma tarefa, confirma e mostra a próxima
- Quando há notas numa fase, mostra-as
- Nunca inventes dados — usa apenas o que está no contexto fornecido

DADOS ATUAIS:
{{obras_json}}

TIMER ATIVO:
{{timer_info}}

AÇÕES DISPONÍVEIS (tools):
- consultar_tarefas: ver tarefas do colaborador
- estado_obra: ver estado detalhado de uma obra
- iniciar_timer: começar a contar tempo numa tarefa
- parar_timer: parar o timer e registar tempo
- concluir_fase: marcar uma fase como concluída
- adicionar_nota: registar uma observação numa obra
- listar_obras: ver todas as obras e progresso
```

### Claude API Tools

```json
[
  {
    "name": "consultar_tarefas",
    "description": "Consulta as tarefas pendentes e em curso do colaborador atual",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "estado_obra",
    "description": "Mostra o estado detalhado de uma obra específica",
    "input_schema": {
      "type": "object",
      "properties": {
        "obra_id": { "type": "string", "description": "ID da obra, ex: 2025-007" }
      },
      "required": ["obra_id"]
    }
  },
  {
    "name": "iniciar_timer",
    "description": "Inicia o timer de trabalho para a fase em curso do colaborador",
    "input_schema": {
      "type": "object",
      "properties": {
        "obra_id": { "type": "string" },
        "fase_id": { "type": "integer" }
      },
      "required": ["obra_id", "fase_id"]
    }
  },
  {
    "name": "parar_timer",
    "description": "Para o timer ativo e regista o tempo",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "concluir_fase",
    "description": "Marca uma fase como concluída e avança para a próxima",
    "input_schema": {
      "type": "object",
      "properties": {
        "obra_id": { "type": "string" },
        "fase_id": { "type": "integer" }
      },
      "required": ["obra_id", "fase_id"]
    }
  },
  {
    "name": "adicionar_nota",
    "description": "Adiciona uma nota/observação a uma obra",
    "input_schema": {
      "type": "object",
      "properties": {
        "obra_id": { "type": "string" },
        "texto": { "type": "string" },
        "tipo": { "type": "string", "enum": ["nota", "problema", "material"] }
      },
      "required": ["obra_id", "texto"]
    }
  },
  {
    "name": "listar_obras",
    "description": "Lista todas as obras em produção com progresso",
    "input_schema": {
      "type": "object",
      "properties": {
        "estado": { "type": "string", "enum": ["espera", "producao", "concluida", "todas"] }
      }
    }
  }
]
```

### Implementação da API Route `/api/chat`

```javascript
// Pseudocódigo para /api/chat/route.ts

export async function POST(req) {
  const { colaborador_id, message, history } = await req.json();

  // 1. Buscar dados do colaborador
  const colab = await supabase.from('colaboradores').select('*').eq('id', colaborador_id).single();

  // 2. Buscar obras em produção com fases do colaborador
  const { data: obras } = await supabase
    .from('obras')
    .select('*, fases_obra(*)')
    .in('estado', ['producao', 'espera']);

  // 3. Buscar timer ativo
  const { data: timer } = await supabase
    .from('timetracking')
    .select('*, fases_obra(nome, obra_id)')
    .eq('colaborador_id', colaborador_id)
    .is('fim', null)
    .maybeSingle();

  // 4. Montar system prompt com dados reais
  const systemPrompt = buildSystemPrompt(colab, obras, timer);

  // 5. Chamar Claude API com tools
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    tools: TOOLS,
    messages: [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ]
  });

  // 6. Processar tool calls se existirem
  let finalResponse = response;
  if (response.stop_reason === 'tool_use') {
    const toolResults = await processToolCalls(response, colaborador_id);
    // Continuar conversa com resultados das tools
    finalResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
        { role: 'assistant', content: response.content },
        ...toolResults
      ]
    });
  }

  // 7. Guardar mensagens na DB
  await supabase.from('mensagens').insert([
    { colaborador_id, role: 'user', content: message },
    { colaborador_id, role: 'assistant', content: extractText(finalResponse) }
  ]);

  return Response.json({ response: extractText(finalResponse) });
}
```

---

## Frontend — Estrutura de Páginas

### Páginas

```
/                    → Login (escolha colaborador + PIN)
/chat                → Chat principal (view padrão após login)
/obras               → Lista de obras com fases e progresso
/obra/[id]           → Detalhe de uma obra específica
/dashboard           → Dashboard gestor (só admin)
```

### Componentes principais

```
components/
├── LoginScreen.tsx        — Grid de colaboradores + teclado PIN
├── ChatView.tsx           — Chat com mensagens, input, quick actions
├── ChatMessage.tsx        — Bolha de mensagem (user/assistant)
├── QuickActions.tsx       — Botões rápidos ("O que fazer?", "Iniciar", etc.)
├── TimerBanner.tsx        — Barra no topo com timer ativo a contar
├── ObrasView.tsx          — Lista de obras com barras de progresso
├── ObraDetail.tsx         — Detalhe com todas as fases
├── FaseItem.tsx           — Linha de fase (estado, responsável, horas)
├── DashboardView.tsx      — Cards resumo + horas por colaborador
├── BottomNav.tsx          — Navegação inferior (Chat, Obras, Dashboard)
└── Header.tsx             — Header com logo, timer, user info, logout
```

### Design

O design deve seguir o que foi aprovado no protótipo:
- **Tema escuro** (background: #0c1220, cards: rgba branco)
- **Cor accent:** Laranja/dourado (#e8930b) — cor quente industrial
- **Fonte principal:** DM Sans (Google Fonts)
- **Fonte mono:** JetBrains Mono (para IDs de obra, horas, timers)
- **Layout mobile-first** (operários usam telemóvel na fábrica)
- **Botões grandes** e touch-friendly
- **Chat bolhas:** user=laranja à direita, bot=cinza escuro à esquerda
- **Quick action chips** abaixo do chat
- **Timer banner** subtil no header quando ativo (pulsing dot)
- **Progress bars** nas obras (gradiente laranja)
- **Estado das fases:** verde=concluído, laranja=em curso, cinza=pendente

---

## Timetracking

### Lógica

```
"Iniciar" / "Start" / "Почати"
  → Verifica se já tem timer ativo (só 1 de cada vez)
  → Cria registo em timetracking com inicio=now(), fim=null
  → Frontend mostra banner com timer a contar

"Parar" / "Stop" / "Зупинити"
  → Encontra timer ativo do colaborador
  → Atualiza fim=now(), calcula duracao_minutos
  → Soma duração às horas_reais da fase_obra
  → Frontend remove banner

"Acabei" / "Done" / "Завершив"
  → Para timer se ativo
  → Marca fase como "concluido"
  → Se existe próxima fase → marca como "em_curso"
  → Mostra info da próxima fase
```

### Regras
- Só 1 timer ativo por colaborador
- Timer continua mesmo se fechar o browser (é server-side)
- Duarte (admin) pode ver timers de todos
- Duarte pode editar horas manualmente se necessário

---

## Multilingue

O Claude API responde automaticamente na língua do colaborador — basta incluir a língua no system prompt. Não é necessário sistema de traduções no frontend para o chat.

Para o UI estático (labels, botões, navigation), usa um objeto de traduções simples:

```typescript
const UI_TRANSLATIONS = {
  pt: { obras: "Obras", dashboard: "Painel", chat: "Chat", logout: "Sair", ... },
  en: { obras: "Works", dashboard: "Dashboard", chat: "Chat", logout: "Logout", ... },
  ua: { obras: "Роботи", dashboard: "Панель", chat: "Чат", logout: "Вийти", ... },
};
```

A língua é determinada pelo perfil do colaborador após login.

---

## Google Drive (desenhos técnicos)

### Estrutura no Drive
```
CSN Produção/
├── 2025-007 - Transportes Silva/
│   ├── Desenho Geral.pdf
│   ├── Chassis.pdf
│   └── Detalhes soldadura.pdf
├── 2025-008 - Câmara Mafra/
│   └── Basculante.pdf
└── Templates/
    ├── Caixa Aberta.ipt
    └── Basculante.ipt
```

### Integração
- Campo `drive_folder_id` na tabela `obras`
- Quando colaborador pede "desenho da obra 2025-007", o Claude:
  1. Lê o drive_folder_id da obra
  2. Chama Google Drive API para listar ficheiros
  3. Retorna links diretos para os PDFs
- Necessita Google Service Account com acesso à pasta partilhada

**NOTA:** A integração com Google Drive pode ser Fase 2. Na Fase 1, o Duarte pode simplesmente partilhar os links dos desenhos no campo `notas` da obra.

---

## Permissões (RBAC)

```
┌──────────────────────────────┬─────────┬─────────┐
│         Funcionalidade       │  admin  │ worker  │
├──────────────────────────────┼─────────┼─────────┤
│ Chat (perguntar/registar)    │   ✅    │   ✅    │
│ Ver suas tarefas             │   ✅    │   ✅    │
│ Timetracking (próprio)       │   ✅    │   ✅    │
│ Marcar fase concluída        │   ✅    │   ✅    │
│ Adicionar notas              │   ✅    │   ✅    │
│ Ver todas as obras           │   ✅    │   ✅    │
│ Ver Dashboard                │   ✅    │   ❌    │
│ Ver horas de todos           │   ✅    │   ❌    │
│ Criar/editar obras           │   ✅    │   ❌    │
│ Alterar responsáveis         │   ✅    │   ❌    │
│ Editar horas manualmente     │   ✅    │   ❌    │
│ Gerir colaboradores          │   ✅    │   ❌    │
└──────────────────────────────┴─────────┴─────────┘
```

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Google Drive (Fase 2)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abc...
```

---

## Dados de Teste

Inserir estas obras para desenvolvimento:

```sql
-- Obras
INSERT INTO obras (id, cliente, tipo, estado) VALUES
  ('2025-007', 'Transportes Silva & Filhos', 'Caixa Aberta 7.5m', 'producao'),
  ('2025-008', 'Câmara Municipal de Mafra', 'Plataforma Basculante 3.5t', 'producao'),
  ('2025-009', 'Construtora Lopes', 'Estrado c/ Grua 12t', 'espera');

-- Fases obra 2025-007 (avançada — soldadura em curso)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais, notas) VALUES
  ('2025-007', 1, 'Corte', 'concluido', 'oleksandr', 8.5, NULL),
  ('2025-007', 2, 'Quinagem', 'concluido', 'oleksandr', 5, NULL),
  ('2025-007', 3, 'Assembly', 'concluido', 'oleksandr', 12, NULL),
  ('2025-007', 4, 'Soldadura', 'em_curso', 'joao', 6, 'Longarinas dianteiras feitas'),
  ('2025-007', 5, 'Pintura', 'pendente', 'raj', 0, NULL),
  ('2025-007', 6, 'Montagem taipais', 'pendente', 'raj', 0, NULL),
  ('2025-007', 7, 'Eletricidade', 'pendente', 'oleksandr', 0, NULL),
  ('2025-007', 8, 'Palas e extras', 'pendente', 'joao', 0, NULL),
  ('2025-007', 9, 'Pesagem', 'pendente', 'duarte', 0, NULL);

-- Fases obra 2025-008 (início — corte em curso)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais, notas) VALUES
  ('2025-008', 1, 'Corte', 'em_curso', 'oleksandr', 3, 'A cortar perfis HEB'),
  ('2025-008', 2, 'Quinagem', 'pendente', 'oleksandr', 0, NULL),
  ('2025-008', 3, 'Assembly', 'pendente', 'oleksandr', 0, NULL),
  ('2025-008', 4, 'Soldadura', 'pendente', 'joao', 0, NULL),
  ('2025-008', 5, 'Pintura', 'pendente', 'raj', 0, NULL),
  ('2025-008', 6, 'Montagem taipais', 'pendente', 'raj', 0, NULL),
  ('2025-008', 7, 'Eletricidade', 'pendente', 'oleksandr', 0, NULL),
  ('2025-008', 8, 'Palas e extras', 'pendente', 'joao', 0, NULL),
  ('2025-008', 9, 'Pesagem', 'pendente', 'duarte', 0, NULL);

-- Fases obra 2025-009 (em espera — tudo pendente)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
  ('2025-009', 1, 'Corte', 'pendente', 'oleksandr', 0),
  ('2025-009', 2, 'Quinagem', 'pendente', 'oleksandr', 0),
  ('2025-009', 3, 'Assembly', 'pendente', 'oleksandr', 0),
  ('2025-009', 4, 'Soldadura', 'pendente', 'joao', 0),
  ('2025-009', 5, 'Pintura', 'pendente', 'raj', 0),
  ('2025-009', 6, 'Montagem taipais', 'pendente', 'raj', 0),
  ('2025-009', 7, 'Eletricidade', 'pendente', 'oleksandr', 0),
  ('2025-009', 8, 'Palas e extras', 'pendente', 'joao', 0),
  ('2025-009', 9, 'Pesagem', 'pendente', 'duarte', 0);
```

---

## Fases de Desenvolvimento

### Fase 1 — MVP (isto é o que construir AGORA)
- [x] Supabase: criar tabelas + dados teste
- [x] Auth: login PIN
- [x] Chat: integração Claude API com tools
- [x] Timetracking: iniciar/parar/registar
- [x] Vista obras: lista com progresso
- [x] Dashboard gestor: cards resumo
- [x] Deploy na Vercel

### Fase 2 — Melhorias
- [ ] Google Drive: integração desenhos técnicos
- [ ] Criar nova obra (formulário admin)
- [ ] Editar atribuições de fases
- [ ] Notificações (obra avançou de fase)
- [ ] Histórico de horas por semana/mês

### Fase 3 — Expansão
- [ ] PWA (instalar no telemóvel como app)
- [ ] Integração ManyChat (WhatsApp clientes)
- [ ] Integração Simple Phones (telefone AI)
- [ ] Relatórios PDF exportáveis
- [ ] Fotos de progresso por fase

---

## Como Correr Localmente

```bash
# 1. Criar projeto
npx create-next-app@latest csn-producao --typescript --tailwind --app --src-dir

# 2. Instalar dependências
cd csn-producao
npm install @supabase/supabase-js @anthropic-ai/sdk

# 3. Configurar .env.local
# (copiar as variáveis de ambiente listadas acima)

# 4. Criar tabelas no Supabase
# (correr o SQL listado acima no SQL Editor do Supabase)

# 5. Correr
npm run dev
```

---

## Notas Importantes

1. **Responsive (mobile + tablet + desktop)**: Os operários vão usar no telemóvel na fábrica (dedos sujos, luvas — botões grandes, touch-friendly). O Duarte usa no PC do escritório ou num tablet. O layout deve adaptar-se:
   - **Mobile (<768px):** coluna única, navegação inferior (bottom tabs), chat fullscreen
   - **Tablet (768-1024px):** chat + sidebar de obras lado a lado
   - **Desktop (>1024px):** layout completo com sidebar permanente, dashboard expandido, chat + detalhes de obra lado a lado
   
   Desenvolver mobile-first mas garantir que em ecrãs maiores aproveita bem o espaço (não ficar uma coluna estreita centrada num monitor grande).

2. **Simplicidade**: Não complicar. O chat é a interface principal — tudo o resto são vistas complementares. Se o colaborador conseguir fazer tudo pelo chat sem tocar nos outros menus, o sistema está bem desenhado.

3. **Offline**: Se o telemóvel perder rede na fábrica, o chat deve mostrar mensagem amigável e permitir retry. Não é necessário modo offline completo.

4. **Performance**: As queries ao Supabase devem ser rápidas. O Claude API demora ~1-3s a responder — mostrar animação de "typing" enquanto espera.

5. **Custo Claude API**: Com 4 utilizadores, ~20-50 mensagens/dia, modelo Sonnet: estimativa ~10-20€/mês. Monitorizar via dashboard Anthropic.

6. **Segurança**: Os PINs são simples mas suficientes para uma empresa de 4 pessoas numa rede local. Em produção, adicionar HTTPS (automático na Vercel) e rate limiting nos endpoints.
