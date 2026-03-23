

# Plano: Suíte de Testes Completa

## Estado Atual
- **Vitest** já instalado e configurado (`vitest.config.ts`, `src/test/setup.ts`)
- **@testing-library/react** e **jest-dom** já em devDependencies
- **28 arquivos de teste** existentes em `src/test/` (unitários e de fluxo)
- **CI/CD** já existe em `.github/workflows/test.yml` (quality → test → build)
- **Faltam**: `@testing-library/user-event`, `msw`, `@playwright/test`, mocks MSW, testes E2E, testes RLS

---

## Etapa 1 — Dependências e Configuração

**Instalar pacotes faltantes:**
- `@testing-library/user-event` (devDep)
- `msw` (devDep)
- `@playwright/test` (devDep)

**Adicionar scripts ao `package.json`:**
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Criar `playwright.config.ts`:**
- Base URL: `http://localhost:5173`
- Timeout: 30s
- Retries: 1
- Screenshots: on failure
- Video: retain on failure
- Projeto: chromium only
- Web server: `npm run dev`

---

## Etapa 2 — Testes Unitários Novos

Criar em `src/__tests__/`:

| Arquivo | Escopo |
|---|---|
| `utils/cpf.test.ts` | `validarCPF`, `formatarCPF` — válidos, inválidos, repetidos, edge cases |
| `utils/cnpj.test.ts` | `validarCNPJ`, `formatarCNPJ` — mesma lógica |
| `utils/sanitize.test.ts` | `stripHtml`, `sanitizeText`, `sanitizeName`, `sanitizePhone`, `sanitizeEmail`, `safeJsonParse`, `isValidUUID` |
| `hooks/use-cooldown.test.ts` | Timer fake, bloqueio e desbloqueio |
| `hooks/use-debounce.test.ts` | Debounce com timer fake |
| `hooks/use-local-storage.test.ts` | Get/set/fallback |
| `components/auth/ProtectedRoute.test.tsx` | Redireciona sem user, permite com role certa, bloqueia role errada |
| `components/auth/Auth.test.tsx` | Renderiza login, valida email vazio, troca para cadastro |

Mocks padrão: `supabase`, `framer-motion`, `logo.png` (já existem nos testes atuais — reutilizar padrão).

---

## Etapa 3 — MSW + Testes de Integração

**Criar `src/mocks/`:**

| Arquivo | Conteúdo |
|---|---|
| `handlers.ts` | Handlers REST interceptando `*/rest/v1/appointments*`, `*/rest/v1/profiles*`, etc. |
| `server.ts` | `setupServer(...handlers)` com `beforeAll/afterAll` |

**Criar `src/__tests__/integration/`:**

| Arquivo | Cenários |
|---|---|
| `appointments-list.test.tsx` | GET retorna lista → renderiza cards; GET 500 → mostra erro |
| `crud-flow.test.tsx` | POST cria → aparece na lista; DELETE → desaparece |

---

## Etapa 4 — Testes E2E (Playwright)

Criar em `tests/`:

| Arquivo | Cenários |
|---|---|
| `auth.spec.ts` | Login válido → dashboard; senha errada → erro; /dashboard sem login → redirect; logout |
| `crud.spec.ts` | Criar registro → listagem; editar; deletar; form vazio → erros |
| `navigation.spec.ts` | Rotas do menu carregam; 404; viewports mobile/desktop |
| `ui.spec.ts` | Sem erros de console; loading states; empty states |

---

## Etapa 5 — Testes RLS

Criar `tests/rls.spec.ts`:
- Usa Supabase client direto com credenciais de teste
- Testa: user A não lê dados de user B; anon retorna 0; update cross-user falha
- Tabelas: `appointments`, `profiles`, `prescriptions`, `medical_records`
- Cleanup via DELETE ao final

---

## Etapa 6 — CI/CD Atualizado

Atualizar `.github/workflows/test.yml`:
- Manter jobs existentes (quality, test, build)
- Adicionar job `e2e` após `build`:
  - `npx playwright install --with-deps chromium`
  - `npm run build` + `npx vite preview &`
  - `npx playwright test`
  - Upload artifacts: `playwright-report/`

---

## Etapa 7 — TEST_PLAN.md

Documento na raiz com:
- Lista de todos os arquivos de teste criados
- Comandos: `npm test`, `npm run test:run`, `npm run test:e2e`
- Cobertura por área (auth, CRUD, RLS, UI, utils, hooks)
- Instruções para configurar secrets no GitHub (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`)

---

## Arquivos Criados/Modificados

```text
CRIADOS:
  playwright.config.ts
  TEST_PLAN.md
  src/mocks/handlers.ts
  src/mocks/server.ts
  src/__tests__/utils/cpf.test.ts
  src/__tests__/utils/cnpj.test.ts
  src/__tests__/utils/sanitize.test.ts
  src/__tests__/hooks/use-cooldown.test.ts
  src/__tests__/hooks/use-debounce.test.ts
  src/__tests__/hooks/use-local-storage.test.ts
  src/__tests__/components/ProtectedRoute.test.tsx
  src/__tests__/components/Auth.test.tsx
  src/__tests__/integration/appointments-list.test.tsx
  src/__tests__/integration/crud-flow.test.tsx
  tests/auth.spec.ts
  tests/crud.spec.ts
  tests/navigation.spec.ts
  tests/ui.spec.ts
  tests/rls.spec.ts

MODIFICADOS:
  package.json (scripts + devDeps)
  .github/workflows/test.yml (job e2e)
```

Nenhum componente, página, lógica ou estilo existente será alterado.

