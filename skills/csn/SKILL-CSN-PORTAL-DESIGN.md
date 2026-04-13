---
name: csn-portal-design
description: Design system e regras UX para o portal de produção CSN. Usa esta skill quando construíres qualquer UI para o portal de trabalhadores, dashboard de fábrica, ou interfaces mobile-first da CSN. Cobre design tokens, componentes, responsive, acessibilidade fabril, e padrões de interacção para chão de fábrica. Activa quando o utilizador mencionar "portal", "dashboard trabalhador", "interface fábrica", "mobile worker", "ponto", "timer obra", ou qualquer componente UI da CSN.
---

# CSN Portal Design System — SKILL.md

## Contexto

A CSN (Carlos dos Santos Nascimento, Lda) é uma fábrica de carroçarias para veículos comerciais em Mafra, Portugal. O portal de trabalhadores é usado no chão de fábrica por serralheiros com mãos sujas, luvas, e em condições de luminosidade variável. O design deve ser **industrial, funcional, e à prova de fábrica**.

Stack: Next.js + TypeScript + Tailwind CSS + Supabase + Vercel
Componentes: shadcn/ui compatible, lucide-react icons
Estado: dark mode permanente (não há light mode)

---

## 1. Design Tokens

### Cores — NUNCA alterar sem aprovação

```
/* Accent principal — Apple Green */
--csn-green: #34C759;
--csn-green-bg: rgba(52, 199, 89, 0.12);
--csn-green-border: rgba(52, 199, 89, 0.30);
--csn-green-subtle: rgba(52, 199, 89, 0.04);
--csn-green-glow: rgba(52, 199, 89, 0.40);

/* Brand — só no login */
--csn-orange: #F49311;
--csn-orange-bg: rgba(244, 147, 17, 0.15);

/* RH accent — separado */
--csn-blue: #3B82F6;
--csn-blue-bg: rgba(59, 130, 246, 0.15);

/* Danger / Parar */
--csn-red: #E74C3C;
--csn-red-hover: #C0392B;

/* Superfícies */
--csn-bg: #0A0A0A;
--csn-surface: #111111;
--csn-surface-hover: #1A1A1A;
--csn-border: #1A1A1A;
--csn-border-subtle: rgba(255, 255, 255, 0.06);

/* Texto */
--csn-text: #FFFFFF;
--csn-text-secondary: #888888;
--csn-text-muted: #555555;
--csn-text-hint: #444444;
```

### Regras de cor
- Verde (#34C759) é o accent GLOBAL após login — timer, KPIs, botões activos, progress, chat user bubbles
- Laranja (#F49311) aparece APENAS no ecrã de login (logo CSN, PIN dots, botão OK)
- Vermelho (#E74C3C) é exclusivo para acções de PARAR/SAÍDA
- Azul (#3B82F6) é exclusivo para RH (recibos, baixas) — portal separado
- Nunca usar gradients de cor. Usar gradients apenas em separadores (opacity fade)

### Tipografia

```
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;

/* Escala */
--text-xs: 10px;    /* labels, hints, timestamps */
--text-sm: 12px;    /* detalhes, subtítulos */
--text-base: 14px;  /* corpo, chat messages */
--text-lg: 16px;    /* títulos de secção */
--text-xl: 18px;    /* nomes de botão grandes */
--text-2xl: 24px;   /* KPI values */
--text-3xl: 28px;   /* timer no card */
--text-timer: 56px; /* timer grande standalone */

/* Pesos */
font-weight: 400;   /* corpo */
font-weight: 600;   /* subtítulos */
font-weight: 700;   /* títulos, nomes */
font-weight: 800;   /* botões ENTRADA/SAÍDA */

/* Mono — apenas para valores numéricos */
font-family: monospace; /* timers, KPIs, horas */
font-variant-numeric: tabular-nums; /* alinhamento de dígitos */
```

### Spacing

```
/* Base 4px grid */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;

/* Border radius */
--radius-sm: 8px;   /* inputs, tags */
--radius-md: 10px;  /* KPI cards */
--radius-lg: 12px;  /* cards, botões */
--radius-xl: 16px;  /* cards grandes, doors */
```

---

## 2. Estética — "Industrial Precision"

Direcção estética fixa: **Industrial Precision**. NÃO variar entre sessões. Não usar:
- Gradients de cor (apenas opacity gradients em separadores)
- Sombras (drop-shadow, box-shadow) — excepto glow subtil no indicador de fase activa
- Bordas arredondadas excessivas (max 16px)
- Emojis como ícones — usar lucide-react
- Fundos brancos, cinzas claros, ou qualquer cor quente
- Animações decorativas — apenas animações funcionais (pulse no dot "em trabalho", fade-in em mensagens chat)

Usar:
- Superfícies escuras com bordas subtis (#1A1A1A borders)
- Accent verde pontual e decisivo (não em tudo — apenas onde é informação activa)
- Separadores gradient (opacity fade) entre secções
- Borda esquerda verde (3px) em cards com informação activa
- Marca de água nos botões (ícone grande semi-transparente 8% opacity)
- Tracking letters (letter-spacing) em labels UPPERCASE pequenas
- Dot pulsante para indicar estado "activo" / "em trabalho"
- Espaço negativo generoso — não empacotar

---

## 3. UX de Fábrica — Regras invioláveis

### Touch targets
- Mínimo 44×44px para qualquer elemento interactivo
- Botões de acção principal (ENTRADA/SAÍDA): mínimo 56px altura, largura total
- Inputs de texto: mínimo 44px altura, fonte >= 14px
- Gap mínimo entre botões: 10px

### Zero navegação
- O portal é um DASHBOARD PERMANENTE — tudo visível num ecrã
- Não usar: bottom nav, tabs, sidebar, hamburger menu, drawers
- Estrutura vertical fixa: Header → KPIs → Obra activa → Botões acção → Chat
- Quando o trabalhador abre, vê tudo. Não precisa de tocar em nada para saber o que está a fazer.

### Legibilidade em condições adversas
- Contraste mínimo: texto branco (#FFF) em fundo #0A0A0A = ratio 19.3:1
- Texto secundário (#888) em #0A0A0A = ratio 5.3:1 (passa WCAG AA)
- Nunca usar texto abaixo de 10px
- KPI values em 24px mono bold — visíveis a 1 metro
- Timer grande em 56px — visível a 3 metros

### Estados visuais claros
- A trabalhar: dot verde pulsante + timer a correr + SAÍDA vermelho activo
- Parado: ENTRADA verde activo + timer parado + SAÍDA cinzento 35% opacity
- Nunca ter ambos os botões activos ao mesmo tempo
- Botão inactivo: opacity 0.35 + cursor default + não responde a tap

---

## 4. Componentes Standard

### 4.1 Header
```
[Avatar BH] Nome Completo     [Data/Hora]
             Categoria          Status      [Sair]
```
- Avatar: 40×40px circle, iniciais, background green-bg, text green
- Botão Sair: outline, border-zinc-700, text-zinc-500, com ícone LogOut

### 4.2 Green accent line (separador principal)
```css
height: 2px;
background: linear-gradient(90deg, #34C759 0%, #34C759 40%, transparent 100%);
```

### 4.3 KPI Cards (grid 3 colunas)
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│   HOJE   │ │  SEMANA  │ │   OBRA   │
│  5h23    │ │  32h10   │ │   65%    │
└──────────┘ └──────────┘ └──────────┘
```
- Background: #111 (accent card tem green-subtle bg)
- Border: 1px solid #1A1A1A
- Radius: 10px (radius-md)
- Label: 10px uppercase tracking-widest text-zinc-500 com ícone 10px
- Value: 24px mono bold (verde no "HOJE", branco nos outros)
- O KPI "HOJE" tem fundo green-subtle para destacar

### 4.4 Obra Activa Card
```
┌─ EM TRABALHO ─────────────── 01:23:47 ─┐
│  OB-2026-012                 F3-Solda   │
│  VW Crafter — Caixa aberta             │
│  Álvaro Botelho                         │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░            │
│  F1  F2  F3● F4  F5  F6               │
└─────────────────────────────────────────┘
```
- Border-left: 3px solid green
- Border: 1px solid green-border
- Background: green-subtle
- "EM TRABALHO": 10px tracking-widest green com dot pulsante antes
- Timer: 28px mono bold green, alinhado à direita
- Fase: label com nome por baixo do timer
- Progress bars: 6px height rounded, verde (done), verde 35% (active), #2A2A2A (pending)
- Glow subtil na fase activa: box-shadow 0 0 6px green-glow

### 4.5 Botões ENTRADA / SAÍDA
```
┌──── SAÍDA ────┐ ┌─── ENTRADA ───┐
│   ⏸ (watermark)│ │  ▶ (watermark) │
│    SAÍDA       │ │   ENTRADA      │
└────────────────┘ └────────────────┘
```
- Flex: 1 cada, side by side, gap 10px
- Height: 56px+ (py-4)
- Radius: 12px (radius-lg)
- Font: 18px weight 800, tracking wide
- SAÍDA activo: bg red, text white, cursor pointer
- ENTRADA activo: bg green, text black, cursor pointer
- Inactivo: bg #1A1A1A, text #555, opacity 0.35, cursor default
- Marca de água: ícone Pause/Play 56px, position absolute centered, opacity 0.08
- Active state (tap): transform scale(0.97)

### 4.6 Chat Fernando (bottom)
```
┌─ F Fernando — Assistente ──────────────┐
│ [mensagens scroll]                      │
│ Bot: Bom dia! Timer na F3...           │
│               User: Preciso eléctrodos │
│ Bot: Registado. Pedi ao Duarte...      │
├─────────────────────────────────────────┤
│ [📷] [Perguntar ao Fernando...] [➤]   │
└─────────────────────────────────────────┘
```
- Flex: 1 (ocupa todo o espaço restante)
- Chat header: F avatar 22px + "Fernando" text-zinc-500 10px
- Mensagens: scroll vertical, gap 6px
- Bubble user: bg green, text black, rounded com bottom-right 4px
- Bubble bot: bg #1A1A1A, text #EEE, rounded com bottom-left 4px
- Max-width: 85%
- Font: 12-13px
- Input bar: border-top border-zinc-800, flex row, gap 6-8px
- Camera button: 34×34px, border zinc-700, rounded-lg, ícone Camera 16px
- Text input: flex-1, bg zinc-900, border zinc-700, focus:border green/50
- Send button: 34×34px, bg green (ou #222 se vazio), rounded-lg, ícone Send 16px

### 4.7 Separadores subtis entre secções
```css
/* Entre KPIs e Obra */
height: 1px;
margin: 0 16px;
background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%);

/* Antes do chat */
height: 1px;
background: linear-gradient(90deg, transparent 0%, rgba(52,199,89,0.3) 50%, transparent 100%);
```

---

## 5. Responsive — Breakpoints

### Mobile portrait (default, <600px)
- Layout vertical: tudo stacked
- KPIs: 3 colunas
- Botões: 2 colunas (SAÍDA | ENTRADA)
- Chat: flex-1 ocupa resto

### Mobile landscape (<600px height, landscape)
- KPIs + Obra lado a lado (2 colunas: KPIs left, Obra right)
- Botões mais compactos (py-3 em vez de py-4)
- Chat: altura reduzida (max-height: 150px)
- Timer no card: 22px em vez de 28px

### Tablet (>=768px)
- Max-width: 900px centered
- KPIs: padding maior, values 28px
- Obra card: mais espaço, timer 32px
- Chat: max-height 280px
- Botões: 64px height

### Desktop (>=1024px)
- Max-width: 1200px centered
- Layout opção 2 colunas: (KPIs + Obra + Botões) left | Chat right (sidebar)
- Chat como sidebar fixa à direita (width: 380px)
- Ou manter single column se preferível

```css
@media (orientation: landscape) and (max-height: 500px) {
  /* Compact mode for landscape phones */
}

@media (min-width: 768px) {
  /* Tablet adjustments */
}

@media (min-width: 1024px) {
  /* Desktop — consider 2-column layout */
}
```

---

## 6. Animações — Só funcionais

```css
/* Dot pulsante — estado "em trabalho" */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.dot-active { animation: pulse 2s infinite; }

/* Botão tap feedback */
.btn:active { transform: scale(0.97); }

/* Chat message fade-in */
.chat-msg { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Timer tick — tabular-nums previne layout shift */
.timer { font-variant-numeric: tabular-nums; }
```

Não usar:
- Transições longas (>300ms)
- Parallax, scroll animations
- Hover effects elaborados (é touch-first)
- Skeleton loaders (usar "A carregar..." simples)

---

## 7. Ícones — lucide-react only

```tsx
import {
  Clock, LogOut, Camera, Send, Pause, Play,
  Wrench, TrendingUp, Timer, ChevronRight,
  AlertTriangle, CheckCircle, Package, Settings
} from "lucide-react"
```

Tamanhos standard:
- 10px: dentro de labels
- 14px: dentro de botões pequenos
- 16px: botões médios, chat input
- 18px: dentro de botões ENTRADA/SAÍDA
- 24px: nunca maior que isto

Nunca usar emojis como ícones. Emojis só em conteúdo de chat (mensagens do Fernando).

---

## 8. Login — Excepção ao design system

O ecrã de login é a ÚNICA excepção:
- Logo "CSN" em #F49311 (laranja brand), 52px, weight 900
- PIN dots activos: #F49311 (laranja)
- Botão OK: bg #F49311, text #000
- Numpad: bg #1A1A1A, text #FFF, height 54px, radius 12px
- Subtítulo "PORTAL TRABALHADOR": 11px, #555, tracking 4px
- Após login, todo o laranja desaparece e entra o verde

---

## 9. Anti-patterns — NUNCA fazer

- Bottom navigation bars (não é uma app com tabs)
- Sidebar hamburger menus
- Modal dialogs (excepto PropostaWizard que é overlay full-screen)
- Toast notifications (usar inline feedback no chat)
- Loading spinners (usar texto "A carregar..." ou "A pensar...")
- Scroll horizontal
- Fontes decorativas, serifadas, ou handwriting
- Ícones coloridos (ícones são sempre monocromáticos)
- Bordas grossas (>2px) excepto border-left no card activo (3px)
- Background images ou patterns
- Blur/glassmorphism
- Cards dentro de cards (nunca aninhar)
- Mais de 2 níveis de hierarquia visual

---

## 10. Checklist antes de entregar

- [ ] Funciona em iPhone SE (320px width)?
- [ ] KPIs legíveis a 1 metro?
- [ ] Timer legível a 3 metros?
- [ ] Botões ENTRADA/SAÍDA têm min 44px touch target?
- [ ] Apenas um botão activo de cada vez?
- [ ] Chat ocupa espaço restante sem scroll duplo?
- [ ] Nenhum elemento usa cor laranja fora do login?
- [ ] Dark mode consistente (sem brancos a escapar)?
- [ ] Landscape não quebra o layout?
- [ ] Separadores visíveis entre secções?
