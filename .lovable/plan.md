

## Varredura Completa: Erros Identificados e Plano de Correção

### Diagnóstico da Tela Branca (Causa Raiz)

O app falha no boot porque o bundle inicial é gigantesco demais para carregar dentro do timeout de segurança (7s no `main.tsx` + 10s no `index.html`).

**Cadeia de dependências do bundle de entrada:**

```text
main.tsx
  └─ App.tsx (eager)
       ├─ Index.tsx ← 12 seções landing (eager)
       ├─ Dashboard.tsx ← EAGER (problema principal)
       │    ├─ 8 shells de dashboard (PatientDashboard, AdminDashboard, etc.)
       │    ├─ 9 sub-páginas (UserProfile, DoctorSearch, etc.)
       │    ├─ DashboardLayout ← gsap, framer-motion, NotificationBell
       │    └─ AdminDashboard ← jsPDF (vendor-pdf inteiro!)
       ├─ ErrorBoundary, ScrollToTop, etc.
       └─ AuthContext ← Supabase client
```

Resultado: o chunk principal ultrapassa facilmente 2-3MB de JS parseado, e navegadores mais lentos não conseguem carregar tudo antes do watchdog disparar o fallback fatal.

---

### Erros Encontrados

| # | Severidade | Arquivo | Problema |
|---|-----------|---------|----------|
| 1 | **CRÍTICO** | `App.tsx:13` | `Dashboard` importado com `import` direto (eager). Puxa 18+ componentes pesados para o bundle inicial |
| 2 | **CRÍTICO** | `App.tsx:12` | `Index` (landing) importado eager com 12 seções. Todo visitante baixa tudo |
| 3 | **CRÍTICO** | `Dashboard.tsx:16-36` | 18 componentes importados com `import` direto em vez de `lazy()` |
| 4 | **CRÍTICO** | `AdminDashboard.tsx:16` | `jsPDF` importado no topo do arquivo (sincrono). Biblioteca pesada (~500KB) puxada para o bundle principal |
| 5 | **ALTO** | `main.tsx:102-110` | Watchdog de 7s conflita com o de 10s do `index.html`. O de 7s substitui o conteúdo do root com UI de erro, que impede o de 10s de detectar conteúdo válido |
| 6 | **MÉDIO** | `DashboardLayout.tsx:21` | `gsap` importado no topo (sincrono) em componente de layout — inflando todo chunk de dashboard |
| 7 | **MÉDIO** | `App.tsx:111-113` | `showDeferredFeatures` usa `requestAnimationFrame` (dispara no primeiro frame), derrotando o propósito de adiar features pesadas |
| 8 | **BAIXO** | `i18n/index.tsx:40` | `localStorage.getItem` chamado durante inicialização do estado — pode lançar exceção em contextos restritos (já tem try/catch, OK) |
| 9 | **BAIXO** | `sentry.ts` | Importado via `import()` no boot, mas puxa `@sentry/react` que é pesado (~200KB) |

---

### Plano de Correção

#### 1. Converter Dashboard e Index para lazy imports (CRÍTICO)

**`App.tsx`**: Substituir os imports diretos por `lazy()`:
```typescript
// ANTES (eager - puxa tudo para o bundle principal)
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

// DEPOIS (lazy - carregados sob demanda)
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
```

#### 2. Converter imports eager do Dashboard.tsx para lazy (CRÍTICO)

**`Dashboard.tsx`**: As 18 importações diretas (linhas 18-36) devem virar `lazy()`:
```typescript
// ANTES
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
// ... 16 mais

// DEPOIS
const PatientDashboard = lazy(() => import("@/components/dashboards/PatientDashboard"));
const AdminDashboard = lazy(() => import("@/components/dashboards/AdminDashboard"));
// ... todos os 18
```
Manter o prefetch por idle para as rotas do role ativo (já existe no código).

#### 3. Lazy import do jsPDF no AdminDashboard (CRÍTICO)

**`AdminDashboard.tsx`**: Converter para import dinâmico no momento do uso:
```typescript
// ANTES
import jsPDF from "jspdf";

// DEPOIS (apenas quando o usuário clica "Exportar PDF")
const doc = new (await import("jspdf")).default();
```

#### 4. Unificar watchdogs e corrigir boot race condition (ALTO)

**`main.tsx`**: Remover o watchdog de 7s duplicado. O `index.html` já tem um de 10s. O `main.tsx` deve apenas:
- Disparar `app:booted` após o render
- Chamar `__APP_BOOT_FAIL__` em caso de exceção
- Não manipular `root.innerHTML` após o render iniciar

#### 5. Lazy import do gsap no DashboardLayout (MÉDIO)

**`DashboardLayout.tsx`**: Converter `import gsap from "gsap"` para import dinâmico ou mover a animação para um hook que importa sob demanda.

#### 6. Restaurar delay real para features adiadas (MÉDIO)

**`App.tsx`**: Substituir `requestAnimationFrame` por um `setTimeout` de 1000ms para que as features adiadas (Chatbot, Analytics, OfflineIndicator, CookieConsent, PWAUpdateBanner) não bloqueiem o primeiro render.

---

### Impacto Esperado

- O bundle inicial cairá de ~2-3MB para ~300-500KB (apenas React, Router, AuthContext, e a rota atual)
- O boot levará <2s em vez de >7s
- O watchdog nunca mais será acionado em condições normais
- A landing page e o dashboard carregarão em chunks separados sob demanda

