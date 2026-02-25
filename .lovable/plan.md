

## Plano: Sistema de Telelaudo (Workflow de Laudos Médicos)

Este plano implementa um fluxo completo de telelaudo: upload de exames, fila para laudistas, edição de laudos com templates, assinatura digital SHA-256, geração de PDF e notificações.

---

### Escopo Funcional

1. **Solicitação** - Médico assistente faz upload de exame (PDF/imagem) e preenche anamnese
2. **Triagem** - Exame aparece na fila de laudos pendentes para médicos laudistas
3. **Execução** - Laudista visualiza o arquivo, seleciona template, edita o laudo e assina digitalmente
4. **Entrega** - PDF gerado automaticamente, paciente/médico solicitante notificados

---

### Detalhes Técnicos

#### A. Banco de Dados (3 tabelas novas + 1 bucket)

**Tabela `exam_requests`** (Solicitações de exame para laudo):
- `id`, `patient_id` (uuid), `requesting_doctor_id` (uuid, ref doctor_profiles), `exam_type` (text), `clinical_info` (text - anamnese), `file_urls` (jsonb - array de URLs no storage), `status` (enum: pending, in_review, reported, delivered), `priority` (text: normal, urgent), `assigned_to` (uuid, nullable - laudista atribuído), `created_at`, `updated_at`

**Tabela `exam_reports`** (Laudos):
- `id`, `exam_request_id` (uuid, FK exam_requests), `reporter_id` (uuid, FK doctor_profiles - laudista), `content_text` (text - corpo do laudo), `template_id` (uuid, nullable), `pdf_url` (text), `document_hash` (text - SHA-256), `verification_code` (text), `signed_at` (timestamptz), `created_at`, `updated_at`

**Tabela `report_templates`** (Modelos de laudo):
- `id`, `title` (text), `exam_type` (text), `body_text` (text - template base), `created_by` (uuid), `is_active` (boolean), `created_at`

**Bucket `exam-files`** (privado) para armazenar arquivos DICOM/PDF/imagem dos exames.

**RLS:**
- `exam_requests`: médicos solicitantes veem os próprios, laudistas veem pendentes/atribuídos, admin vê tudo
- `exam_reports`: laudista autor + médico solicitante + admin
- `report_templates`: qualquer médico pode ler templates ativos, admin gerencia

#### B. Componentes Frontend (4 novos)

1. **`src/components/doctor/ExamRequestForm.tsx`** - Formulário para solicitar laudo: upload de arquivo, tipo de exame, anamnese, prioridade. Usa o bucket `exam-files`.

2. **`src/components/doctor/ExamReportQueue.tsx`** - Fila de exames pendentes para o laudista. Tabela com filtros por status, tipo e prioridade. Botão "Assumir" para atribuir a si.

3. **`src/components/doctor/ExamReportEditor.tsx`** - Tela split-view: esquerda = visualizador do arquivo (iframe para PDF, `<img>` para imagem), direita = editor de texto com seleção de template. Botão "Assinar e Finalizar" gera hash SHA-256 + código de verificação, cria PDF via jsPDF, salva no bucket `prescriptions` e atualiza status para "reported".

4. **`src/components/doctor/ReportTemplateManager.tsx`** - CRUD de templates de laudo (admin/médico). Lista de modelos com título, tipo de exame e corpo editável.

#### C. Rotas e Navegação

- Adicionar ao `doctorNav.tsx` um item "Laudos" no grupo "Documentos"
- Adicionar 4 rotas ao `Dashboard.tsx`:
  - `/dashboard/doctor/exam-request` - ExamRequestForm
  - `/dashboard/doctor/report-queue` - ExamReportQueue
  - `/dashboard/doctor/report-editor/:examId` - ExamReportEditor
  - `/dashboard/doctor/report-templates` - ReportTemplateManager

#### D. Assinatura Digital

Reutilizar `src/lib/signature.ts` (já existe `gerarHashDocumento` SHA-256 e `gerarCodigoVerificacao`). Ao finalizar o laudo:
1. Gerar hash do conteúdo do laudo
2. Gerar código de verificação de 8 caracteres
3. Registrar na tabela `document_verifications` (já existente)
4. Gerar PDF com jsPDF (já instalado) incluindo hash e código no rodapé

#### E. Notificações

Ao marcar como "reported", inserir notificação na tabela `notifications` para o médico solicitante e, se houver `patient_id`, para o paciente.

#### F. Visualização de Arquivos

- PDFs: renderizados via `<iframe>` com URL assinada do Supabase Storage
- Imagens (JPG/PNG): exibidas via `<img>` com URL assinada
- DICOM: fora do escopo inicial (requer cornerstone.js ou integração PACS), mas o campo `exam_type` permite extensão futura

---

### Ordem de Implementação

1. Migration SQL (tabelas + bucket + RLS)
2. ExamRequestForm (upload + solicitação)
3. ExamReportQueue (fila do laudista)
4. ExamReportEditor (split-view + templates + assinatura + PDF)
5. ReportTemplateManager (CRUD de modelos)
6. Rotas + navegação
7. Notificações na finalização

