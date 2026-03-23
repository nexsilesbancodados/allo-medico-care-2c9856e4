# TEST_PLAN.md — Suíte de Testes Completa

## Comandos

| Comando | Descrição |
|---|---|
| `npm test` | Vitest em modo watch |
| `npm run test:run` | Vitest single-run (CI) |
| `npm run test:e2e` | Playwright E2E (headless) |
| `npm run test:e2e:ui` | Playwright E2E (modo UI interativo) |

---

## Arquivos de Teste

### Testes Unitários (Vitest)

| Arquivo | Cobertura |
|---|---|
| `src/__tests__/utils/cpf.test.ts` | `validarCPF`, `formatarCPF` — válidos, inválidos, repetidos, edge cases |
| `src/__tests__/utils/cnpj.test.ts` | `validarCNPJ`, `formatarCNPJ` — mesma lógica |
| `src/__tests__/utils/sanitize.test.ts` | `stripHtml`, `sanitizeText`, `sanitizeName`, `sanitizePhone`, `sanitizeEmail`, `safeJsonParse`, `isValidUUID` |
| `src/__tests__/hooks/use-cooldown.test.ts` | Timer fake, bloqueio e desbloqueio após cooldown |
| `src/__tests__/hooks/use-debounce.test.ts` | Debounce com timer fake, atualização após delay |
| `src/__tests__/hooks/use-local-storage.test.ts` | Get/set/remove, fallback, updater function |

### Testes de Integração (MSW)

| Arquivo | Cobertura |
|---|---|
| `src/__tests__/integration/appointments-list.test.ts` | GET, POST, DELETE interceptados; erro 500 |
| `src/__tests__/integration/crud-flow.test.ts` | Listagem de profiles, criação e deleção de appointments |

### Mocks (MSW)

| Arquivo | Descrição |
|---|---|
| `src/mocks/handlers.ts` | Handlers REST para appointments e profiles |
| `src/mocks/server.ts` | Setup do servidor MSW para testes Node |

### Testes Existentes (src/test/)

28 arquivos de teste já existentes cobrindo auth flows, booking, consultation, dashboard, hooks, i18n, landing, navigation, PWA, prescription, renewal, security, SEO, telelaudo, urgent care e validação.

### Testes E2E (Playwright)

| Arquivo | Cenários |
|---|---|
| `tests/auth.spec.ts` | Redirect sem login, campos de login, validação vazia, credenciais inválidas, 404 |
| `tests/crud.spec.ts` | Validação de formulário vazio, validação de email |
| `tests/navigation.spec.ts` | Landing sem erros de console, responsividade mobile/desktop, páginas auth/termos/privacidade |
| `tests/ui.spec.ts` | Sem erros JS, botão de submit visível, hero content, dark mode toggle |
| `tests/rls.spec.ts` | Anon não lê appointments/medical_records, não insere appointments, teste de isolamento de dados |

---

## Cobertura por Área

| Área | Unitários | Integração | E2E | RLS |
|---|---|---|---|---|
| **Auth** | ProtectedRoute (existente) | — | ✅ auth.spec.ts | — |
| **Utils (CPF/CNPJ)** | ✅ | — | — | — |
| **Sanitização/Segurança** | ✅ | — | — | — |
| **Hooks** | ✅ cooldown, debounce, localStorage | — | — | — |
| **CRUD/API** | — | ✅ MSW handlers | ✅ crud.spec.ts | — |
| **Navegação** | ✅ (existente) | — | ✅ navigation.spec.ts | — |
| **UI/Layout** | — | — | ✅ ui.spec.ts | — |
| **RLS/Segurança DB** | — | — | — | ✅ rls.spec.ts |

---

## Configuração de Secrets no GitHub

Vá em **Settings → Secrets and variables → Actions** no repositório GitHub e adicione:

| Secret | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/pública do Supabase |
| `TEST_USER_A_EMAIL` | Email de um usuário de teste (para testes RLS) |
| `TEST_USER_A_PASSWORD` | Senha do usuário de teste A |
| `TEST_USER_B_EMAIL` | _(Opcional)_ Email de um segundo usuário para testes de isolamento cross-user |
| `TEST_USER_B_PASSWORD` | _(Opcional)_ Senha do usuário B |

---

## CI/CD Pipeline

O workflow `.github/workflows/test.yml` executa:

1. **quality** — TypeScript type-check + ESLint
2. **test** — Vitest (unitários + integração)
3. **build** — Build de produção
4. **e2e** — Playwright (chromium) com upload de relatório

Dispara em push para `main`/`dev` e PRs para `main`.
