# DESIGN_SYSTEM.md — AgroConnect Visual Identity & UI Rules

> **This is the design bible. Every component, every page, every pixel follows these rules.**
> **Read this fully before creating ANY frontend component.**
> **When in doubt, reference this file. Do not improvise colors, spacing, or typography.**

---

## 1. Design Philosophy

**"Organic Modern"** — The intersection of agriculture and technology. Clean, structured layouts with warmth and earthiness. Think Stripe's clarity, Linear's polish, but with the soul of the land.

This is NOT:
- A generic Bootstrap/Tailwind template
- A dark SaaS dashboard with purple gradients
- A Material Design clone
- Anything that looks like every other React admin panel

This IS:
- Warm, inviting, trustworthy
- Map-centric (geography is core to the product)
- Clean but not sterile
- Professional but not corporate
- Unique enough that the professor says "wow"

**Reference sites for visual inspiration (study these):**
- stripe.com — clarity of layout, hierarchy, whitespace
- linear.app — sidebar navigation, keyboard-first feel, status system
- vercel.com/dashboard — clean data presentation
- notion.so — content-first, minimal chrome
- cal.com — booking flow, calendar UI

**But our colors, typography, and character are completely our own.**

---

## 2. Color Palette

Extracted from the AgroConnect logo. Every color has a purpose.

### Tailwind Config (tailwind.config.ts)

```typescript
colors: {
  // ── Primary: Forest Green (from logo tractor) ──
  // Used for: primary actions, active states, navigation accents
  primary: {
    50:  '#F0F9F0',
    100: '#D6F0D6',
    200: '#A8DCA8',
    300: '#6EC26E',
    400: '#3DA63D',  // Main brand green
    500: '#2D8A2D',
    600: '#236E23',
    700: '#1A5C1A',
    800: '#134A13',
    900: '#0C3A0C',
    950: '#062106',
  },

  // ── Secondary: Sky Blue (from logo WiFi signal) ──
  // Used for: links, info states, secondary actions, tech elements
  secondary: {
    50:  '#EFF8FF',
    100: '#D8EEFF',
    200: '#B9E0FF',
    300: '#7CC8FF',
    400: '#36ABFF',  // Main accent blue
    500: '#0C8CE8',
    600: '#006FC6',
    700: '#005AA1',
    800: '#004C85',
    900: '#003F6E',
  },

  // ── Earth: Warm Brown (from logo soil/ground) ──
  // Used for: backgrounds, cards, warm neutral surfaces
  earth: {
    50:  '#FDFAF5',
    100: '#F7F0E4',
    200: '#EFE3CC',
    300: '#E2CFA8',
    400: '#C9A86E',
    500: '#B08E4A',
    600: '#8F6F32',
    700: '#735826',
    800: '#5C461E',
    900: '#4A381A',
  },

  // ── Leaf: Bright Green (from logo leaves) ──
  // Used for: success states, growth indicators, active/online badges
  leaf: {
    50:  '#EDFCE5',
    100: '#D4F8C4',
    200: '#ACF08F',
    300: '#7CE24F',
    400: '#5ACA2D',  // Vibrant leaf green
    500: '#3FA517',
    600: '#2F830F',
    700: '#246410',
    800: '#215013',
    900: '#1D4414',
  },

  // ── Neutral: Warm Grays (NOT blue-tinted) ──
  // Used for: text, borders, backgrounds, disabled states
  neutral: {
    50:  '#FAFAF8',
    100: '#F5F4F0',
    200: '#E8E6E0',
    300: '#D4D1C9',
    400: '#B0ADA3',
    500: '#8F8C82',
    600: '#706D65',
    700: '#5A5850',
    800: '#3D3B36',
    900: '#27261F',
    950: '#141310',
  },

  // ── Semantic Colors ──
  warning: {
    50: '#FFF8EB', 100: '#FFECC2', 400: '#F5A623', 600: '#C47A00', 800: '#7A4D00',
  },
  danger: {
    50: '#FFF1F0', 100: '#FFD9D6', 400: '#E24B4A', 600: '#B91C1C', 800: '#7F1D1D',
  },
  info: {
    50: '#EFF8FF', 100: '#D8EEFF', 400: '#36ABFF', 600: '#006FC6', 800: '#004C85',
  },
}
```

### Color Usage Rules

| Element | Light Mode | Dark Mode (future) |
|---------|-----------|-----------|
| Page background | `neutral-50` (#FAFAF8) | `neutral-950` |
| Card background | `white` | `neutral-900` |
| Card border | `neutral-200` | `neutral-700` |
| Sidebar background | `neutral-900` | `neutral-950` |
| Sidebar text | `neutral-200` | `neutral-300` |
| Sidebar active item | `primary-400` text + `primary-950` bg | same |
| Primary button | `primary-500` bg, white text | `primary-400` bg |
| Secondary button | `white` bg, `neutral-700` text, `neutral-300` border | inverse |
| Destructive button | `danger-600` bg, white text | `danger-500` bg |
| Body text | `neutral-800` | `neutral-200` |
| Muted text | `neutral-500` | `neutral-400` |
| Links | `secondary-600` | `secondary-400` |
| Input borders | `neutral-300` default, `primary-400` focus | inverse |
| Status: Published | `secondary-50` bg, `secondary-700` text | inverse |
| Status: In Progress | `primary-50` bg, `primary-700` text | inverse |
| Status: Awaiting | `warning-50` bg, `warning-600` text | inverse |
| Status: Completed | `leaf-50` bg, `leaf-700` text | inverse |
| Status: Disputed | `danger-50` bg, `danger-700` text | inverse |
| Status: Cancelled/Expired | `neutral-100` bg, `neutral-600` text | inverse |

**NEVER use pure black (#000000) for text. Use `neutral-800` or `neutral-900`.**
**NEVER use pure white (#FFFFFF) for page background. Use `neutral-50`.**
**NEVER use blue-tinted grays (like slate or zinc). Our grays are warm (olive/brown tint).**

---

## 3. Typography

### Font Stack

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
  display: ['"Cal Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

**Plus Jakarta Sans** — main body font. Geometric but warm. Clean at small sizes. NOT Inter, NOT Roboto, NOT system default.

**Cal Sans** — display/heading font. Used ONLY for the main page titles and hero text. Gives a distinctive, modern feel. If not available, fall back to Plus Jakarta Sans bold.

**Load via Google Fonts in `index.html`:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```
Cal Sans via CDN: `https://cdn.jsdelivr.net/npm/cal-sans@1.0.1/cal-sans.css`

### Type Scale

| Element | Size | Weight | Line Height | Font | Tailwind |
|---------|------|--------|-------------|------|----------|
| Page title (h1) | 28px | 700 | 1.2 | Cal Sans | `text-[28px] font-bold font-display leading-tight` |
| Section title (h2) | 20px | 600 | 1.3 | Plus Jakarta | `text-xl font-semibold` |
| Card title (h3) | 16px | 600 | 1.4 | Plus Jakarta | `text-base font-semibold` |
| Body | 14px | 400 | 1.6 | Plus Jakarta | `text-sm` |
| Small/caption | 12px | 500 | 1.4 | Plus Jakarta | `text-xs font-medium` |
| Label | 13px | 500 | 1.4 | Plus Jakarta | `text-[13px] font-medium` |
| Metric/number | 32px | 700 | 1.0 | Plus Jakarta | `text-[32px] font-bold` |
| Stat label | 12px | 500 | 1.4 | Plus Jakarta | `text-xs font-medium text-neutral-500` |

**NEVER use font-weight below 400 or above 700.**
**NEVER use text smaller than 12px.**
**NEVER center body text paragraphs — left-align always.**

---

## 4. Layout System

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px fixed)  │  Main Content Area          │
│                        │                              │
│  Logo                  │  Top bar (breadcrumb + user) │
│                        │  ─────────────────────────── │
│  Navigation            │                              │
│  - Dashboard           │  Page content                │
│  - Pedidos             │  (max-width: 1200px)         │
│  - Propostas           │  (padding: 24px 32px)        │
│  - Operações           │                              │
│  - Equipa              │                              │
│  - Máquinas            │                              │
│  - Inventário          │                              │
│  - Financeiro          │                              │
│  ───────               │                              │
│  Configurações         │                              │
│  (if admin: Admin)     │                              │
│                        │                              │
└─────────────────────────────────────────────────────┘
```

### Sidebar Rules
- Width: 240px fixed
- Background: `neutral-900`
- Logo at top with 24px padding
- Nav items: 14px, `neutral-400` default, `white` on hover, `primary-400` when active
- Active item has a 3px left border in `primary-400` and subtle `primary-950` background
- Sections separated by thin `neutral-700` divider
- Collapse to icon-only (56px) on mobile with hamburger toggle
- Subtle transition on hover (background shift, not color jump)

### Content Area Rules
- Background: `neutral-50`
- Max-width: 1200px centered
- Padding: 24px top/bottom, 32px left/right
- Top bar: breadcrumb (left), user avatar + notification bell (right)
- Mobile: full-width, 16px padding

### Spacing Scale
Use these values consistently. Do NOT use arbitrary values.

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight gaps inside components |
| sm | 8px | Between related elements (icon + label) |
| md | 12px | Between form fields in same group |
| lg | 16px | Between cards in grid, between sections |
| xl | 24px | Between major sections |
| 2xl | 32px | Page padding, large gaps |
| 3xl | 48px | Between completely separate content blocks |

---

## 5. Component Design Patterns

### Cards
```
┌──────────────────────────────────┐
│  4px left border (status color)  │
│                                  │
│  Title              Status Badge │
│  Subtitle / meta                 │
│                                  │
│  Content...                      │
│                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Footer actions         Price →  │
└──────────────────────────────────┘
```

- Background: `white`
- Border: `1px solid neutral-200`
- Border-radius: `12px`
- Left border: 4px, colored by status (primary for active, warning for pending, etc.)
- Padding: `16px 20px`
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` — VERY subtle, almost invisible
- Hover (if clickable): shadow grows to `0 4px 12px rgba(0,0,0,0.06)`, translate-y -1px
- Transition: `all 150ms ease`

### Buttons

**Primary:**
```tailwind
bg-primary-500 hover:bg-primary-600 active:bg-primary-700
text-white font-medium text-sm
px-4 py-2.5 rounded-lg
transition-colors duration-150
```

**Secondary:**
```tailwind
bg-white hover:bg-neutral-50 active:bg-neutral-100
text-neutral-700 font-medium text-sm
border border-neutral-300 hover:border-neutral-400
px-4 py-2.5 rounded-lg
transition-all duration-150
```

**Ghost (for nav, toolbars):**
```tailwind
hover:bg-neutral-100 active:bg-neutral-200
text-neutral-600 hover:text-neutral-800
font-medium text-sm
px-3 py-2 rounded-lg
transition-all duration-150
```

**Button sizes:** sm (py-1.5 px-3 text-xs), md (py-2.5 px-4 text-sm), lg (py-3 px-6 text-base)

### Status Badges
```tailwind
// Pattern: colored bg + colored text + rounded-full + small padding
inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
```

| Status | Classes |
|--------|---------|
| Rascunho | `bg-neutral-100 text-neutral-600` |
| Publicado | `bg-secondary-50 text-secondary-700` |
| Com propostas | `bg-secondary-100 text-secondary-800` |
| Adjudicado | `bg-primary-50 text-primary-700` |
| Em execução | `bg-primary-100 text-primary-800` |
| Aguarda confirmação | `bg-warning-50 text-warning-600` |
| Concluído | `bg-leaf-50 text-leaf-700` |
| Avaliado | `bg-leaf-100 text-leaf-800` |
| Em disputa | `bg-danger-50 text-danger-600` |
| Expirado | `bg-neutral-100 text-neutral-500` |
| Cancelado | `bg-neutral-100 text-neutral-500` |

### Form Inputs
```tailwind
w-full px-3 py-2.5 text-sm
bg-white border border-neutral-300 rounded-lg
placeholder:text-neutral-400
focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
transition-all duration-150
```

- Label: `text-[13px] font-medium text-neutral-700 mb-1.5`
- Helper text: `text-xs text-neutral-500 mt-1`
- Error: `border-danger-400 focus:ring-danger-400/20`, message in `text-xs text-danger-600 mt-1`

### Tables
- Header: `bg-neutral-50` with `text-xs font-medium text-neutral-500 uppercase tracking-wider`
- Rows: `border-b border-neutral-100`, hover `bg-neutral-50/50`
- Cells: `py-3 px-4 text-sm`
- NO zebra striping (too retro). Subtle bottom borders are enough.

### Empty States
When a list has no items, show:
- A simple line illustration or icon (64px, `text-neutral-300`)
- Title: `text-neutral-600 font-medium`
- Description: `text-neutral-500 text-sm`
- CTA button (primary)
- Centered, `py-16`

### Map Component
The map is a FIRST-CLASS element, not an afterthought:
- On request creation: full-width, minimum 400px height, rounded corners
- On dashboard: hero position, takes 60% of viewport
- Tiles: use CartoDB Voyager (light, clean, modern): `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Custom marker: green pin matching `primary-500`, not default blue Leaflet marker
- Cluster markers at zoom out
- Smooth zoom animation enabled

---

## 6. Page-Specific Design Notes

### Landing / Login
- Split layout: left side = hero image/illustration + value prop, right side = form
- Hero bg: subtle topographic pattern or aerial farm photo with overlay
- Form: centered card, generous padding, logo at top
- "Registar" / "Entrar" tabs at top of form
- Social proof below form (if available)

### Dashboard (Client)
- Welcome message with name: "Bom dia, João"
- 4 metric cards: Pedidos ativos, Propostas pendentes, Serviços concluídos, Valor total gasto
- Map showing own active requests as pins
- Recent activity feed (last 5 events as a timeline)
- Quick action button: "Novo Pedido" (primary, prominent)

### Dashboard (Provider)
- 4 metric cards: Propostas enviadas, Serviços agendados, Receita este mês, Rating médio
- Map showing nearby requests (opportunities)
- Today's schedule (calendar strip)
- Pending proposals list

### Request Creation Wizard
- Stepper at top (5 steps, horizontal pills)
- Current step highlighted in `primary-400`, completed in `leaf-400` with checkmark
- One step visible at a time
- Back/Next buttons at bottom (secondary left, primary right)
- Progress bar under stepper (thin, primary color)
- Step 3 (map): FULL WIDTH, no card wrapper, immersive

### Request Detail
- Header: title, status badge, created date, category pill
- Two-column layout:
  - Left (60%): description, photos gallery (grid), form data, map (embedded)
  - Right (40%): proposal cards list, or execution status timeline
- If has proposals: cards stack with provider info, price, rating

### Proposal Card
```
┌─ primary-400 left border (4px) ────────────────────┐
│                                                      │
│  Provider avatar + name        ★ 4.8 (23 avaliações)│
│  "AgroServiços Terceira Lda"                         │
│                                                      │
│  Preço: €180,00                    Prazo: 3 dias     │
│                                                      │
│  Inclui: Lavoura com grade de discos, 2 passagens    │
│  Não inclui: Remoção de pedras                       │
│                                                      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  [Aceitar proposta]          [Enviar mensagem]       │
└──────────────────────────────────────────────────────┘
```

---

## 7. Animation & Micro-interactions

### Principles
- Animations are FUNCTIONAL, not decorative
- Duration: 150ms for hover, 200ms for transitions, 300ms for page/modal enter
- Easing: `ease` for most, `ease-out` for enter, `ease-in` for exit
- NEVER animate for more than 300ms. No bouncing, no elastic, no spring physics.

### Specific Animations
- **Page load:** content fades in with slight upward slide (opacity 0→1, translateY 8px→0, 200ms)
- **Card hover:** subtle shadow grow + 1px lift (150ms)
- **Button press:** scale(0.98) for 100ms
- **Modal enter:** backdrop fade 200ms, modal slide up 250ms
- **Toast notification:** slide in from right, 300ms, auto-dismiss after 5s with fade
- **Status change:** old badge fades, new badge fades in (150ms crossfade)
- **Sidebar nav:** active indicator slides vertically to new position (200ms)
- **Map markers:** pop in with scale animation when map loads
- **Skeleton loading:** subtle shimmer left-to-right (neutral-200 to neutral-100, 1.5s loop)

### Loading States
EVERY page that fetches data must show loading state:
- Use skeleton screens, NOT spinners (skeletons feel faster)
- Skeleton color: `bg-neutral-200 animate-pulse` with rounded matching the content shape
- Match skeleton shapes to actual content layout

---

## 8. Icons

Use **Lucide React** (`lucide-react` package). These are clean, consistent, 24px default.

Icon color follows text color of the context (neutral-500 for muted, neutral-700 for normal, white for on-primary-bg).

Size: 16px for inline/nav, 20px for buttons, 24px for section headers, 48-64px for empty states.

**Specific icon mapping:**
- Pedidos: `ClipboardList`
- Propostas: `FileText`
- Execução: `Wrench`
- Equipas: `Users`
- Máquinas: `Tractor` (or `Cog` if Tractor not available)
- Inventário: `Package`
- Financeiro: `Wallet`
- Dashboard: `LayoutDashboard`
- Mapa: `MapPin`
- Notificações: `Bell`
- Configurações: `Settings`
- Admin: `Shield`
- Estrela (rating): `Star`
- Check-in GPS: `MapPinCheck` (or `Navigation`)
- Câmara (fotos): `Camera`
- Upload: `Upload`
- Calendário: `Calendar`
- Chat: `MessageCircle`

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 768px | No sidebar (hamburger), single column, bottom nav for key actions |
| Tablet | 768-1024px | Collapsed sidebar (icons only, 56px), adjusted grid |
| Desktop | > 1024px | Full sidebar (240px), multi-column layouts |

Mobile-first approach: default styles are mobile, use `md:` and `lg:` for larger.

### Mobile Specifics
- Bottom navigation bar (fixed) with 4 key items: Dashboard, Pedidos, Mapa, Perfil
- Swipe gestures for card actions (accept/reject proposal)
- Touch targets minimum 44x44px
- Map fills entire viewport with overlay cards at bottom

---

## 10. What NOT to Do (Common AI Slop Patterns to Avoid)

1. **NO gradient backgrounds on cards or sections** — flat colors only
2. **NO centered text blocks for body content** — always left-aligned
3. **NO icon + title + paragraph repeated in a 3-column grid as "features"** — that's every landing page ever made
4. **NO blue-purple color scheme** — we use green/earth
5. **NO oversized hero sections with stock photos** — keep it functional
6. **NO card shadows that look like they're floating 20px off the page** — 1-3px max
7. **NO rounded corners above 12px** — except for full-round pills/avatars
8. **NO more than 2 font weights on one screen** — pick 2 (medium + bold usually)
9. **NO rainbow of different colors for different cards** — use status colors only
10. **NO generic "Welcome to Dashboard" headers** — use the user's name + contextual info
11. **NO loading spinners** — always skeleton screens
12. **NO default Leaflet blue markers** — custom green markers
13. **NO Inter, Roboto, Arial, Helvetica, system-ui alone** — use Plus Jakarta Sans
14. **NO border-radius: 9999px on cards** — that's only for pills and avatars
15. **NO more than 4 metric cards in a row** — 3-4 max, then new row

---

## 11. Component File Template

Every component file should follow this structure:

```tsx
// features/requests/components/RequestCard.tsx

interface RequestCardProps {
  request: ServiceRequest;
  onSelect?: (id: number) => void;
}

export function RequestCard({ request, onSelect }: RequestCardProps) {
  const statusConfig = getStatusConfig(request.status);
  
  return (
    <div
      onClick={() => onSelect?.(request.id)}
      className={cn(
        "bg-white rounded-xl border border-neutral-200 p-4 pl-5",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "hover:-translate-y-px transition-all duration-150",
        "cursor-pointer",
        "border-l-4", statusConfig.borderColor,
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-neutral-800 truncate">
          {request.title}
        </h3>
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          statusConfig.badgeClasses,
        )}>
          {statusConfig.label}
        </span>
      </div>
      
      <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
        {request.description}
      </p>
      
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {request.location.name}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatRelativeDate(request.createdAt)}
        </span>
      </div>
    </div>
  );
}
```

---

## 12. Tailwind Config Summary

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ... (all colors from section 2)
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Cal Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.08)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 13. Quick Reference: The 5 Rules That Make or Break The Design

1. **Warm neutrals everywhere** — our grays have a warm olive/brown tint, never blue-cold
2. **Left accent borders on cards** — 4px colored border-left is our signature pattern
3. **Map is king** — whenever there's geographical data, show it on a map, not a table
4. **Status colors are consistent** — same status always has the same color everywhere in the app
5. **Plus Jakarta Sans + generous spacing** — the font and whitespace do 80% of the work
