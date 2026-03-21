

## Plano: Correção e Completude do Módulo Telelaudo para Clínicas

### Problema
A clínica não consegue enviar exames porque `exam_requests.requesting_doctor_id` é FK para `doctor_profiles`, mas o usuário clínica não possui `doctor_profile`.

### Resumo das Alterações

```text
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Clínica envia      │────▶│  exam_requests       │────▶│  Laudista vê na     │
│  ExamRequestForm    │     │  requesting_clinic_id │     │  fila + nome clínica│
│  (sem doctor_id)    │     │  patient_name (texto) │     │  LaudistaReportQueue│
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
         │                                                         │
         ▼                                                         ▼
┌─────────────────────┐                               ┌─────────────────────┐
│  ClinicMyExams      │◀──── real-time channel ───────│  exam_reports       │
│  (nova página)      │                               │  signed_at → status │
│  Ver laudo + PDF    │                               │  = 'reported'       │
└─────────────────────┘                               └─────────────────────┘
```

---

### Etapa 1 — Migration SQL

Adicionar colunas a `exam_requests`:
- `requesting_clinic_id UUID REFERENCES clinic_profiles(id) NULL`
- `patient_name TEXT NULL`
- `patient_birth_date DATE NULL`
- `patient_sex TEXT CHECK (patient_sex IN ('M','F','O')) NULL`
- `exam_date DATE NULL`

Tornar `requesting_doctor_id` nullable (atualmente obrigatório, impede clínica de inserir).

Atualizar RLS de `exam_requests`:
- Clínica: SELECT/INSERT onde `requesting_clinic_id` = seu `clinic_profiles.id`
- Laudista: SELECT onde `status IN ('pending','in_review')` ou `assigned_to = seu doctor_profile.id`

Atualizar RLS de `exam_reports`:
- SELECT para clínica dona do `exam_request` via subquery

Criar trigger: quando `exam_reports.signed_at` muda de NULL para valor, UPDATE `exam_requests.status = 'reported'` no registro correspondente.

### Etapa 2 — ExamRequestForm (corrigir para clínica)

Arquivo: `src/components/doctor/ExamRequestForm.tsx`

Quando `isClinic`:
- Buscar `clinic_profiles.id` via `user_id = auth.uid()`
- No insert: usar `requesting_clinic_id` em vez de `requesting_doctor_id`
- Remover validação que exige `effectiveDoctorProfileId`
- Adicionar campos: Nome do Paciente (obrigatório), Data de Nascimento, Sexo, Data de Realização do Exame
- Após sucesso: redirecionar para `/dashboard/clinic/my-exams?role=clinic`

### Etapa 3 — ClinicMyExams (novo componente)

Arquivo: `src/components/clinic/ClinicMyExams.tsx`

- Buscar `clinic_profiles.id` do usuário
- Query `exam_requests` WHERE `requesting_clinic_id = clinicId`, ORDER BY `created_at DESC`
- Tabela: Paciente, Tipo, Data Envio, Prioridade, Status (badge amarelo/azul/verde), Laudo
- Coluna Laudo: botão "Ver Laudo" quando `status = 'reported'`
- Dialog com dados do exame + texto do laudo (query `exam_reports` WHERE `exam_request_id`) + botão PDF
- Botão "+ Solicitar Exame" → navegar para `/dashboard/clinic/exam-request?role=clinic`
- Real-time via Supabase channel em `exam_requests`
- Skeleton loading

### Etapa 4 — Rota no Dashboard.tsx

Adicionar lazy import para `ClinicMyExams` e rota:
```
<Route path="clinic/my-exams" element={<RoleGuard allowed={["clinic"]}><ClinicMyExams /></RoleGuard>} />
```

### Etapa 5 — ClinicDashboard nav

Em `getClinicNav`, adicionar item "Meus Laudos" com href `/dashboard/clinic/my-exams?role=clinic`, ícone FileText, group "Telelaudo". Atualizar `activeNav` para reconhecer `my-exams`.

### Etapa 6 — LaudistaReportQueue (coluna Origem)

Na query da fila, após buscar pacientes, buscar `clinic_profiles` via `requesting_clinic_id` para obter nome da clínica. Adicionar coluna "Origem" na tabela entre "Paciente" e "Prioridade", exibindo nome da clínica ou "Médico" como fallback.

### Restrições respeitadas
- ExamReportEditor: sem alterações
- LaudistaMyReports: sem alterações
- Wallet/triggers financeiros: sem alterações
- Design: mesmos componentes shadcn/ui existentes

