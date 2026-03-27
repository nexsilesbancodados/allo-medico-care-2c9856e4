

# Design Bible — Patient Panel World-Class Redesign

## Overview

Apply the uploaded "Design Bible" specifications across 8 patient-facing files + index.css. This is a **visual-only** refactor: all logic, hooks, queries, Supabase channels, handlers, and TypeScript interfaces remain untouched.

## Files to modify (9 total)

1. `src/index.css` — Add patient design tokens
2. `src/components/patient/patientNav.tsx` — Restructure bottom nav (5 tabs: Inicio, Consultas, Urgencia, Chat, Perfil)
3. `src/components/dashboards/PatientDashboard.tsx` — Hero, quick actions 5-col grid, stat bento Apple Health style, skeleton loaders, Doctolib-style next appointment card, Pingo health tip
4. `src/components/patient/AppointmentsList.tsx` — Horizontal filter chips, Wellnest-style appointment cards with status side stripe, skeleton loaders, empty state
5. `src/components/patient/DoctorSearch.tsx` — MyChart search input, Doctolib specialty chips, Wellnest doctor cards with avatar ring/rating/price/favorite heart, skeleton
6. `src/components/patient/PaymentHistory.tsx` — Premium gradient active plan card, transaction list with status circles, security footer card
7. `src/components/patient/PatientHealth.tsx` — Apple Health tabs, metric cards with icon boxes and status badges, Recharts gradient update, new metric button
8. `src/components/patient/UrgentCareQueue.tsx` — Red gradient urgency banner, queue position card with animated progress bar, symptom form inputs, PIX/payment card
9. `src/components/patient/PatientExamResults.tsx` — Exam cards with status side stripe, filter chips, download/share buttons, skeleton

## Technical approach

### Step 1: CSS tokens (`index.css`)
Add to `:root` block (never remove existing vars):
```css
--p-primary: 215 80% 28%;
--p-primary-mid: 215 65% 40%;
--p-bg: 210 25% 98%;
--p-surface: 0 0% 100%;
--p-muted: 215 18% 94%;
--p-border: 215 18% 88%;
--p-text: 215 45% 10%;
--p-text-muted: 215 12% 44%;
--p-text-hint: 215 8% 46%;
--p-danger: 0 72% 51%;
--p-danger-soft: 0 100% 92%;
--p-success-soft: 145 60% 92%;
--p-warning-soft: 38 100% 92%;
--p-shadow-card: 0 2px 8px rgba(0,52,127,0.06);
--p-shadow-elevated: 0 6px 24px rgba(0,52,127,0.10);
--p-shadow-btn: 0 4px 14px rgba(0,52,127,0.28);
```

### Step 2: patientNav.tsx
Reorder to 5 bottom tabs: Home, Consultas, Urgencia (Zap icon), Chat, Perfil. Move Pagamentos/Agendar/etc to sidebar groups. Keep all hrefs and active logic identical.

### Step 3: PatientDashboard.tsx
- **Hero**: Gradient `from-[#00347F] via-[#1A4BA1] to-[#2563EB]`, `rounded-b-[28px]` mobile, avatar + name + plan badge + KPI pills + Pingo mascot
- **Quick actions**: `grid-cols-5 gap-2` with 44x44px icon boxes (Agendar, Urgencia, Exames, Receitas, Docs)
- **Skeleton loaders**: Replace loading state with pulse skeletons matching layout
- **Next appointment**: Doctolib-style with left date column (`bg-[#00347F]`) + right content + "Entrar" button
- **StatBento**: Apple Health 2x2 grid with icon boxes, accent lines, Manrope typography
- **Health tip**: Blue tinted card with Pingo mascot
- **Empty state**: Dashed border + centered CTA
- All cards wrapped in `motion.div whileTap={{ scale: 0.97 }}`

### Step 4: AppointmentsList.tsx
- Replace Select filters with horizontal scrolling chips (`rounded-full`, active = `bg-[#00347F] text-white`)
- Card redesign: 4px left status stripe + content with specialty chip + status badge
- Skeleton and empty state per bible spec

### Step 5: DoctorSearch.tsx
- Search input: `rounded-2xl h-12 pl-12` with absolute search icon
- Specialty chips: horizontal scroll, active `bg-[#00347F] text-white`
- Doctor card: avatar with `ring-2 ring-[#00347F]/15`, available badge, rating stars, price in Manrope, rounded CTA, heart favorite
- Skeleton cards

### Step 6: PaymentHistory.tsx
- Active plan card: gradient `from-[#00347F] to-[#1A4BA1]`, white text, rounded-3xl
- Transaction cards: circle status icon + plan name + dates + value right-aligned
- Security footer card: amber tinted

### Step 7: PatientHealth.tsx
- Tab bar: `rounded-2xl bg-muted/50 p-1` with active tab card style
- Metric cards: 40px icon box, uppercase label, Manrope 800 28px value, status badge (Normal/Alto/Baixo)
- Recharts: `stroke="#185FA5"` + linearGradient fill
- New metric button: rounded-full primary

### Step 8: UrgentCareQueue.tsx
- Red gradient banner (`from-[#A32D2D] to-[#E24B4A]`) with Zap icon, price in Manrope 800 32px
- Queue position card: amber tinted, position Manrope 800 48px, animated progress bar
- Form inputs: `rounded-2xl h-11`
- Join button: `rounded-full bg-[#A32D2D]` with red shadow

### Step 9: PatientExamResults.tsx
- Filter chips (horizontal scroll, same pattern as AppointmentsList)
- Exam card: left status stripe + type with emoji icon + date + status badge + action buttons
- Skeleton loaders

## Preservation rules (enforced in every file)
- All imports, hooks, queries, interfaces, handlers, realtime channels: untouched
- All `motion.` wrappers preserved (only Tailwind classes updated)
- All loading/empty states preserved (only visual redesigned)
- No changes to App.tsx, AuthContext, DashboardLayout, hooks/, or any non-patient components

