

## Plano de Implementacao: 5 Features Morsch (Plantao 24h, Renovacao de Receita, Cartao de Desconto, Cofre de Documentos, Landing B2B)

---

### 1. Plantao Clinico 24h (Pronto-Atendimento Digital)

**Banco de Dados:**
- Nova tabela `on_demand_queue` com colunas: `id`, `patient_id`, `shift` (day/night/dawn), `price`, `payment_id`, `status` (waiting/assigned/in_progress/completed/refunded), `assigned_doctor_id`, `position`, `created_at`, `assigned_at`, `started_at`, `completed_at`
- RLS: paciente ve propria fila; medicos com role doctor veem filas waiting; admin ve tudo

**Edge Function:**
- `calculate-shift-price/index.ts` - retorna preco baseado na hora atual:
  - 07h-19h: R$75 (Diurno)
  - 19h-00h: R$100 (Noturno)
  - 00h-07h: R$120 (Madrugada)

**Componentes Frontend:**
- `src/components/patient/UrgentCareQueue.tsx` - Tela do paciente: paga via Asaas, entra na fila, ve posicao em tempo real (Realtime subscription), timer de 15 min com botao de reembolso
- `src/components/doctor/DoctorOnDutyPanel.tsx` - Painel do plantonista: lista fila ordenada por created_at, botao "Atender Proximo" que atribui paciente e redireciona para VideoRoom
- Rota `/dashboard/urgent-care` (paciente) e `/dashboard/doctor/on-duty` (medico)
- Nav items adicionados em `patientNav.tsx` e `doctorNav.tsx`
- Link na landing page (HeroSection ou PlansSection) para `/dashboard/urgent-care`

**Realtime:**
- Channel `on-demand-queue` com postgres_changes INSERT/UPDATE para atualizar posicao e status em tempo real

---

### 2. Renovacao de Receita Assincrona

**Banco de Dados:**
- Nova tabela `prescription_renewals` com colunas: `id`, `patient_id`, `original_prescription_url`, `health_questionnaire` (jsonb), `status` (pending/in_review/approved/rejected), `assigned_doctor_id`, `new_prescription_id`, `payment_id`, `paid_at`, `reviewed_at`, `rejection_reason`, `created_at`, `updated_at`
- RLS: paciente gerencia proprias; medicos veem as que estao assigned ou pending; admin ve tudo

**Componentes Frontend:**
- `src/components/patient/PrescriptionRenewalForm.tsx` - Upload da receita vencida (bucket patient-documents), questionario de saude (alergias, condicoes cronicas, medicamentos atuais, efeitos colaterais), pagamento via Asaas (R$80)
- `src/components/doctor/RenewalQueue.tsx` - Fila de renovacoes pendentes, botao "Assumir", formulario de aprovacao/rejeicao com emissao de nova receita digital
- Rotas: `/dashboard/prescription-renewal` (paciente), `/dashboard/doctor/renewal-queue` (medico)
- Nav items adicionados

---

### 3. Cartao de Desconto (Programa de Fidelidade)

**Banco de Dados:**
- Nova tabela `discount_cards` com colunas: `id`, `user_id`, `plan_type` (individual/couple/family), `discount_percent` (default 30), `price_monthly`, `status` (active/cancelled/expired), `valid_until`, `payment_id`, `created_at`, `cancelled_at`
- RLS: usuario gerencia proprio cartao; admin ve todos

**Componentes Frontend:**
- `src/pages/DiscountCard.tsx` - Landing page publica dedicada com 3 planos:
  - Individual: R$24.90/mes
  - Casal: R$39.90/mes
  - Familia (ate 4): R$54.90/mes
  - Beneficios: 30% off em teleconsultas, plantao 24h e renovacao de receita
- Integracao no checkout (`PlansCheckout.tsx` e `UrgentCareQueue.tsx`): verificar se usuario tem `discount_cards` ativo e aplicar desconto automaticamente
- Rota publica `/cartao-desconto` adicionada ao App.tsx
- Link no Footer e Header da landing

---

### 4. Cofre de Documentos do Paciente (Aprimoramento)

O `PatientExamUpload.tsx` ja existe e permite upload/visualizacao/exclusao. O que falta:

**Melhorias no componente existente:**
- Adicionar campo `category` (select) para categorizar: Exame, Receita, Atestado, Historico, Outro
- Adicionar filtro por categoria e busca por nome
- Adicionar organizacao visual por pastas/categorias com icones distintos
- Renomear na nav de "Meus Exames" para "Cofre de Documentos"
- Adicionar badge de contagem total na sidebar

**Banco de Dados:**
- Adicionar coluna `category` (text, default 'exam') na tabela `patient_documents`

---

### 5. Landing Page B2B + Formulario de Orcamento

**Banco de Dados:**
- Nova tabela `b2b_leads` com colunas: `id`, `company_name`, `cnpj`, `contact_name`, `email`, `phone`, `company_type` (clinic/hospital/health_plan/other), `services_interested` (jsonb array), `message`, `status` (new/contacted/proposal_sent/converted), `created_at`, `notes` (text)
- RLS: INSERT publico (anon); SELECT/UPDATE apenas admin

**Edge Function:**
- `b2b-lead-notification/index.ts` - Envia email via Resend para o admin quando um novo lead B2B e criado

**Componentes Frontend:**
- `src/pages/B2BLanding.tsx` - Pagina dedicada com:
  - Hero B2B (titulo: "Telemedicina para sua Clinica ou Hospital")
  - Lista de servicos (Telelaudo, Teleconsulta, Plantao 24h, White Label)
  - Depoimentos de clinicas
  - Formulario de orcamento (nome, empresa, CNPJ, telefone, email, servicos de interesse, mensagem)
  - CTA forte
- Rota publica `/para-empresas` no App.tsx
- Link no Footer e Header

---

### Resumo de Arquivos

```text
NOVOS ARQUIVOS:
  supabase/migrations/XXXXX.sql          (tabelas: on_demand_queue, prescription_renewals, discount_cards, b2b_leads + coluna category em patient_documents)
  supabase/functions/calculate-shift-price/index.ts
  supabase/functions/b2b-lead-notification/index.ts
  src/components/patient/UrgentCareQueue.tsx
  src/components/patient/PrescriptionRenewalForm.tsx
  src/components/doctor/DoctorOnDutyPanel.tsx
  src/components/doctor/RenewalQueue.tsx
  src/pages/DiscountCard.tsx
  src/pages/B2BLanding.tsx

ARQUIVOS EDITADOS:
  src/pages/Dashboard.tsx                (novas rotas)
  src/App.tsx                            (rotas publicas: /cartao-desconto, /para-empresas)
  src/components/patient/patientNav.tsx   (Plantao, Renovar Receita, Cofre)
  src/components/doctor/doctorNav.tsx     (Plantao, Renovacoes)
  src/components/patient/PatientExamUpload.tsx  (categorias, filtros, rename)
  src/components/patient/PlansCheckout.tsx      (verificar discount_card ativo)
  src/components/landing/Footer.tsx       (links B2B e Cartao)
  src/pages/Index.tsx                     (secao ou link para Plantao 24h)
  supabase/config.toml                    (verify_jwt config)
  src/integrations/supabase/types.ts      (auto-atualizado)
```

### Ordem de Execucao

1. Migration SQL (todas as tabelas de uma vez)
2. Edge Functions (calculate-shift-price, b2b-lead-notification)
3. Componentes do Plantao 24h (UrgentCareQueue + DoctorOnDutyPanel)
4. Componentes da Renovacao de Receita (PrescriptionRenewalForm + RenewalQueue)
5. Pagina do Cartao de Desconto + integracao no checkout
6. Aprimoramento do Cofre de Documentos
7. Landing B2B
8. Rotas, navs e links

