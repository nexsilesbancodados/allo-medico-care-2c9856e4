# AloClínica — Documentação Completa de Entrega

**Versão:** 2.0 — Plataforma Completa de Telemedicina  
**Data de Entrega:** Abril 2026  
**Supabase Project:** `oaixgmuocuwhsabidpei`  
**URL de Produção:** Configure via variável `VITE_SITE_URL`

---

## Índice

1. [Visão Geral da Plataforma](#1-visão-geral-da-plataforma)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Funcionalidades por Perfil](#3-funcionalidades-por-perfil)
4. [Módulos Especializados](#4-módulos-especializados)
5. [Segurança e LGPD](#5-segurança-e-lgpd)
6. [Aplicativo Instalável (PWA)](#6-aplicativo-instalável-pwa)
7. [Integrações Externas](#7-integrações-externas)
8. [Banco de Dados](#8-banco-de-dados)
9. [Edge Functions (Serverless)](#9-edge-functions-serverless)
10. [CI/CD e Deploy](#10-cicd-e-deploy)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Operação e Manutenção](#12-operação-e-manutenção)
13. [Testes](#13-testes)

---

## 1. Visão Geral da Plataforma

A AloClínica é uma plataforma completa de telemedicina que conecta pacientes e médicos por videochamadas, permitindo agendamento de consultas, emissão de receitas digitais, solicitação de exames e muito mais. A plataforma atende múltiplos perfis de usuário e está em total conformidade com a legislação brasileira (LGPD, CFM, CRM).

### Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| **Paciente** | Agenda consultas, acessa receitas, cartão de saúde, planos de cuidado |
| **Médico** | Realiza teleconsultas, emite receitas/atestados, gerencia pacientes |
| **Laudista** | Especialista em telelaudo — interpreta exames de imagem |
| **Clínica** | Gerencia médicos, agenda, pacientes e exames |
| **Recepcionista** | Gerencia agendamentos para clínica |
| **Suporte** | Atendimento ao cliente, tickets de suporte |
| **Administrador** | Controle total da plataforma |

---

## 2. Arquitetura Técnica

### Stack Tecnológica

```
Frontend:
  - React 18 + TypeScript + Vite 5
  - TailwindCSS + shadcn/ui (componentes)
  - Framer Motion (animações)
  - TanStack Query (estado assíncrono)
  - React Router v6 (roteamento SPA)
  - Phosphor Icons (ícones)

Backend:
  - Supabase (BaaS)
    ├── PostgreSQL 15 (banco de dados)
    ├── Row-Level Security (RLS) para multi-tenant
    ├── Edge Functions (Deno/TypeScript)
    ├── Realtime (WebSockets para presença/chat)
    ├── Storage (arquivos, exames, gravações)
    └── Auth (JWT, OAuth, email/senha)

PWA:
  - Workbox (service worker, cache offline)
  - Web Push API (notificações push)
  - Web Share API (compartilhamento nativo)

Vídeo:
  - Jitsi Meet (servidor próprio: meet.telemedicinaaloclinica.sbs)

Pagamentos:
  - Asaas (cartão, PIX, boleto)

Comunicação:
  - Evolution API (WhatsApp)
  - Resend (e-mail transacional)

IA:
  - DeepSeek via OpenRouter (assistente médico)

KYC/Biometria:
  - Didit.me (verificação de identidade facial)
```

### Diagrama de Fluxo Principal

```
Paciente → Agenda consulta → Pagamento (Asaas)
                           ↓
                    Confirmação (WhatsApp + Email)
                           ↓
                 Sala de Vídeo (Jitsi Meet (servidor próprio))
                           ↓
           Médico emite Receita/Atestado (DocuSeal)
                           ↓
            Documento assinado → Paciente visualiza
```

---

## 3. Funcionalidades por Perfil

### 3.1 Paciente

#### Dashboard
- Visão geral: próximas consultas, métricas de saúde, notificações
- Atalhos rápidos para agendamento e urgência

#### Agendamento
- Busca por médico, especialidade, valor
- Calendário com horários disponíveis
- Pagamento integrado (cartão, PIX, plano de saúde)
- Confirmação automática via WhatsApp e e-mail

#### Consulta por Vídeo
- Sala de espera virtual
- Videochamada em HD (Jitsi Meet (servidor próprio))
- Chat de texto durante consulta
- Pré-consulta: formulário de queixa principal

#### Saúde Digital
- **Cartão Saúde Digital**: tipo sanguíneo, alergias, condições crônicas, contato de emergência, plano de saúde, número SUS, doação de órgãos, QR Code de emergência
- **Planos de Cuidado**: visualiza planos criados pelo médico (objetivos, medicações, estilo de vida, retorno)
- **Carteira de Vacinação**: histórico completo, alertas de doses em atraso/próximas
- **Métricas de Saúde**: pressão, glicemia, peso, SpO2, frequência cardíaca (gráficos)
- **Linha do Tempo**: histórico clínico cronológico
- **Diário de Sintomas**: registro diário de sintomas com humor

#### Documentos
- Receitas digitais (PDF com assinatura digital)
- Atestados médicos
- Resultados de exames (upload e visualização)
- Renovação de receitas online

#### Privacidade e LGPD
- Exportação de todos os dados pessoais (JSON)
- Solicitação de exclusão da conta (prazo legal 30 dias)
- Histórico de acesso aos dados
- Tabela de retenção de dados por tipo

#### Urgência
- Plantão médico 24h
- Fila de atendimento com estimativa de espera
- Triagem automática por gravidade

---

### 3.2 Médico

#### Dashboard
- Agenda do dia com próximas consultas
- Pacientes aguardando na sala de espera virtual
- Receitas emitidas recentemente
- Indicadores financeiros

#### Agenda e Disponibilidade
- Configuração de horários por dia da semana
- Bloqueio de datas específicas
- Calendário visual mensal/semanal
- Gestão de plantão de urgência (ativar/desativar)

#### Pacientes
- Lista de pacientes atendidos
- Prontuário eletrônico (EMR) completo por paciente
- Histórico de consultas, receitas, exames

#### Durante a Consulta
- Videochamada integrada (Jitsi Meet (servidor próprio))
- Emissão de receita (simples ou controlada)
- Solicitação de exames
- Criação de Plano de Cuidado personalizado
- Atestado médico digital

#### Ferramentas Médicas
- **Renovação de Receitas**: fila de solicitações de renovação
- **Prescrições Anteriores**: histórico completo
- **Certificados Médicos**: geração com assinatura digital

#### Financeiro
- Extrato de consultas realizadas
- Repasses automáticos via Asaas
- Histórico de pagamentos
- Carteira digital (saque para conta bancária)

#### Oftalmologia (módulo especializado)
- Fila de exames oftalmológicos
- Formulário de exame detalhado (acuidade, refração, pressão intraocular)
- Edição e revisão de laudos
- Emissão de receita de óculos/lentes

---

### 3.3 Laudista (Telelaudo)

#### Dashboard de Telelaudo
- Fila de exames aguardando laudo
- Exames por modalidade (RX, TC, RM, US, PET)
- Indicadores de produtividade

#### Laudar Exames
- Visualizador DICOM integrado (OHIF Viewer + Orthanc PACS)
- Editor rico de laudos (TipTap)
- Macros/templates de laudo
- Assinatura digital automática

#### Segunda Opinião
- Sistema de solicitação e resposta de segunda opinião
- Prioridade normal (48h) e urgente (6h)
- Notas de consenso entre laudistas

#### Financeiro Laudista
- Painel de receitas por laudo
- Histórico de pagamentos

---

### 3.4 Administrador

#### Gestão de Usuários
- Médicos: aprovar/rejeitar cadastros, KYC manual
- Pacientes: visualizar e suporte
- Clínicas: cadastro e gerenciamento
- Usuários: alterar roles, suspender contas

#### KYC de Médicos
- Painel de revisão de KYC pendente/aprovado/rejeitado
- Visualização do score de match facial
- Aprovação/rejeição manual com registro de auditoria

#### Aprovações
- Fila de médicos aguardando aprovação
- Verificação de CRM, especialidade, documentos

#### Financeiro Admin
- Visão consolidada de transações
- Cupons de desconto
- Estornos e reembolsos

#### Configurações
- Configurações do site (nome, logo, tema, analytics)
- Configurações de PACS/DICOM
- Gestão de especialidades médicas
- Código de convite para médicos

#### Monitoramento
- Health check de todos os serviços
- Logs de auditoria
- Consultas ao vivo
- NPS e avaliações
- WhatsApp status

---

## 4. Módulos Especializados

### 4.1 Teleoftalmologia

Módulo completo para consultas e laudos oftalmológicos:

- **Teste de Acuidade Visual Digital** (Escala de Snellen)
  - Testagem olho por olho
  - 8 linhas da escala Snellen (20/200 a 20/20)
  - Resultado com classificação (Normal, Leve Redução, Moderada, Significativa)
  - Salvo automaticamente no prontuário

- **Formulário de Exame Completo**
  - Acuidade visual com e sem correção
  - Refração (esférico, cilíndrico, eixo) para ambos os olhos
  - Distância pupilar
  - Pressão intraocular (tonometria)
  - Teste de visão de cores (Ishihara)
  - Grade de Amsler

- **Receita de Óculos/Lentes**
  - Geração automática baseada nos dados do exame
  - PDF com assinatura digital do médico

### 4.2 Telelaudo e PACS

- **Integração DICOM**: suporte a Orthanc PACS local ou cloud
- **Viewer DICOM**: OHIF Viewer embutido para visualização de imagens
- **Modalidades**: RX, TC, RM, US, PET, Mamografia
- **Workflow**: envio → laudo → revisão → entrega
- **Segunda Opinião**: sistema colaborativo entre laudistas

### 4.3 Plano de Cuidado (Care Plan)

Criado pelo médico durante ou após a consulta:

- **Objetivos**: metas clínicas com datas-alvo e marcação de conclusão
- **Medicações**: nome, dosagem, frequência e duração
- **Estilo de Vida**: recomendações por categoria (exercício, dieta, etc.)
- **Retorno**: data programada e observações
- Notificação automática ao paciente

### 4.4 Cartão Saúde Digital

Documento digital de emergência com:
- Número único gerado automaticamente (formato `ALO-XXXXXXXX`)
- Tipo sanguíneo (8 tipos com codificação por cor)
- Alergias (lista com badges)
- Condições crônicas
- Contato de emergência (nome, telefone, parentesco)
- Plano de saúde (nome, número, validade)
- Número do Cartão SUS (CNS)
- Declaração de doação de órgãos
- QR Code para acesso de emergência

**Download**: exportação em PNG via Canvas API  
**Compartilhamento**: Web Share API / cópia para área de transferência

### 4.5 Carteira de Vacinação

- Histórico completo de vacinas
- 12 vacinas comuns pré-cadastradas (datalist)
- Alertas de doses em atraso (vermelho) e próximas (âmbar)
- Campos: vacina, dose, data de aplicação, próxima dose, lote, local

### 4.6 Centro LGPD

Conformidade completa com a Lei Geral de Proteção de Dados (Lei 13.709/2018):

- **Portabilidade**: export JSON de todos os dados pessoais
- **Exclusão**: solicitação formal de exclusão em até 30 dias (Art. 18)
- **Acesso**: log de auditoria de todos os acessos aos dados
- **Correção**: edição de dados pessoais via perfil

**Prazos de Retenção implementados:**

| Tipo de Dado | Prazo | Base Legal |
|---|---|---|
| Prontuário médico | 20 anos | CFM Resolução 1638/2002 |
| Prescrições | 5 anos | RDC 204/2017 |
| Dados de pagamento | 5 anos | BACEN |
| Logs de acesso | 2 anos | LGPD |
| Dados de autenticação | 6 meses pós-encerramento | LGPD |
| Gravações de consulta | 90 dias | Política interna |

---

## 5. Segurança e LGPD

### 5.1 Autenticação e Autorização

- **JWT**: tokens com 1 hora de expiração (refresh automático)
- **MFA (2FA)**: e-mail ou TOTP via app autenticador
- **Row-Level Security (RLS)**: cada usuário vê apenas seus próprios dados
- **Role-Based Access Control**: 8 roles distintas, verificadas no banco
- **Reautenticação**: solicitada antes de ações sensíveis (alteração de senha, exclusão)

### 5.2 Segurança de Dados

#### Column-Level Security
Colunas sensíveis de médicos protegidas por `REVOKE SELECT`:
```sql
-- Apenas admins (via SECURITY DEFINER functions) podem acessar:
- doctor_profiles.kyc_status
- doctor_profiles.kyc_face_match_score  
- doctor_profiles.cpf
- doctor_profiles.bank_account
```

#### SECURITY DEFINER Functions
Funções que operam com privilégios elevados, protegidas por verificação de role:
- `fn_admin_doctor_kyc_list()` — lista KYC de todos os médicos (admin only)
- `fn_admin_set_doctor_kyc(doctor_id, status)` — aprova/rejeita KYC (admin only)
- `fn_check_doctor_approval()` — trigger de auto-aprovação de médicos
- `fn_get_conversation_messages()` — mensagens de chat com validação de participante

### 5.3 Rate Limiting

Edge Functions com rate limiting por IP:
- `send-email`: máximo 10 requisições/minuto por IP
- `send-whatsapp`: máximo 5 mensagens/minuto
- `asaas-webhook`: validação de token Bearer obrigatória

### 5.4 KYC de Médicos

Processo de verificação de identidade:
1. Médico faz upload de foto do documento (CNH ou RG)
2. Captura facial pela câmera
3. Integração com **Didit.me** faz match biométrico
4. Score de similaridade calculado (threshold: 70%)
5. Status: `pending` → `approved` / `rejected`
6. Trigger `fn_check_doctor_approval` verifica: KYC aprovado + CRM válido + documentos enviados

### 5.5 Proteção de Dados em Trânsito e Repouso

- HTTPS obrigatório (HSTS em produção)
- Dados em repouso: criptografados pelo Supabase (AES-256)
- Senhas: bcrypt com salt (gerenciado pelo Supabase Auth)
- Upload de arquivos: bucket privado com signed URLs de 1h

### 5.6 Auditoria

- Tabela `lgpd_access_log`: registra todos os acessos a dados de pacientes
- Tabela `audit_logs`: ações administrativas
- Logs de Edge Functions retidos por 7 dias no Supabase Dashboard

---

## 6. Aplicativo Instalável (PWA)

A plataforma é uma Progressive Web App instalável em todos os dispositivos.

### Características

| Feature | Status |
|---|---|
| Instalável (Android/iOS/Desktop) | ✅ |
| Funciona offline | ✅ (cache estático) |
| Notificações push | ✅ (Web Push API + VAPID) |
| Atalhos de tela inicial | ✅ (4 atalhos) |
| Atualização automática | ✅ (skipWaiting + clientsClaim) |
| Tela de splash | ✅ |
| Ícones adaptáveis | ✅ (192x192 + 512x512 maskable) |

### Atalhos Configurados

1. **Agendar Consulta** → `/dashboard/schedule?role=patient`
2. **Plantão 24h** → `/dashboard/urgent-care?role=patient`
3. **Cartão Saúde** → `/dashboard/patient/health-card?role=patient`
4. **Minhas Consultas** → `/dashboard/appointments?role=patient`

### Prompt de Instalação

Componente `PWAInstallPrompt` exibe banner nativo com:
- Aparece após 3 segundos se o app for instalável
- Cooldown de 7 dias após dispensa
- Detecta se já está instalado (standalone mode)
- Benefícios visuais: velocidade, offline, notificações

### Estratégia de Cache (Workbox)

```
Fontes Google → CacheFirst (1 ano)
Supabase Storage → NetworkFirst (cache como fallback)
Estáticos (js/css/png) → Pré-cache no build
```

---

## 7. Integrações Externas

### 7.1 Supabase
- **URL**: `https://oaixgmuocuwhsabidpei.supabase.co`
- **Auth**: email/senha, magic link
- **Storage Buckets**: `exam-images`, `profiles`, `consultation-recordings`, `prescriptions`, `medical-files`

### 7.2 Jitsi Meet — Servidor Próprio (Videochamada)
- **Servidor**: `https://meet.telemedicinaaloclinica.sbs`
- **Sem custo por minuto** — infraestrutura própria
- Sala criada automaticamente por ID da consulta: `consulta-{appointmentId}`
- API externa carregada via `external_api.js` do servidor
- Configurações customizadas: sem watermark, toolbar simplificada, sem página de boas-vindas
- **Não requer nenhuma chave de API externa**

### 7.3 Asaas (Pagamentos)
- **Variável**: `VITE_ASAAS_API_KEY` + `ASAAS_WEBHOOK_TOKEN`
- Métodos: cartão de crédito, PIX, boleto
- Webhook: `/supabase/functions/v1/asaas-webhook`
- Split automático: plataforma 20% / médico 80%

### 7.4 Evolution API (WhatsApp)
- **Variável**: `EVOLUTION_API_URL` + `EVOLUTION_API_KEY`
- Notificações de: confirmação, lembrete 1h antes, receita disponível, plano de cuidado

### 7.5 Resend (E-mail)
- **Variável**: `RESEND_API_KEY`
- Templates: boas-vindas, confirmação de consulta, receita, senha

### 7.6 Didit.me (KYC Biométrico)
- **Variável**: `DIDIT_CLIENT_ID` + `DIDIT_CLIENT_SECRET`
- Verificação de identidade para médicos

### 7.7 OpenRouter / DeepSeek (IA)
- **Variável**: `OPENROUTER_API_KEY`
- Assistente médico com contexto do paciente
- Sugestões de diagnóstico (não substitui avaliação médica)

### 7.8 DocuSeal (Assinatura Digital)
- **Variável**: `DOCUSEAL_API_KEY`
- Assinatura de receitas controladas
- Armazenamento de documentos assinados

### 7.9 Orthanc PACS (Telelaudo)
- **Variável**: `ORTHANC_URL` + `ORTHANC_USER` + `ORTHANC_PASSWORD`
- Gerenciamento de imagens DICOM
- Proxy seguro via Edge Function `orthanc-proxy`

---

## 8. Banco de Dados

### Tabelas Principais

#### Usuários e Perfis
| Tabela | Descrição |
|---|---|
| `auth.users` | Gerenciado pelo Supabase Auth |
| `profiles` | Dados públicos do usuário (nome, avatar, role) |
| `doctor_profiles` | Dados médicos (CRM, especialidade, KYC) |
| `user_roles` | Roles adicionais por usuário |
| `clinics` | Dados de clínicas |

#### Consultas e Agendamentos
| Tabela | Descrição |
|---|---|
| `appointments` | Consultas agendadas/realizadas |
| `availability` | Disponibilidade de horários dos médicos |
| `appointment_ratings` | Avaliações pós-consulta (NPS) |
| `pre_consultation_forms` | Formulários de pré-consulta |

#### Saúde do Paciente
| Tabela | Descrição |
|---|---|
| `health_metrics` | Pressão, glicemia, peso, SpO2, FC |
| `health_cards` | Cartão de saúde digital |
| `health_timeline` | Linha do tempo clínica |
| `symptom_diary` | Diário de sintomas |
| `medical_history` | Histórico médico estruturado |
| `dependents` | Dependentes do paciente |

#### Documentos Médicos
| Tabela | Descrição |
|---|---|
| `prescriptions` | Receitas médicas |
| `medical_certificates` | Atestados médicos |
| `care_plans` | Planos de cuidado |
| `vaccination_records` | Carteira de vacinação |
| `exam_requests` | Solicitações de exames |
| `exam_reports` | Laudos de exames |

#### Telelaudo
| Tabela | Descrição |
|---|---|
| `laudo_exams` | Exames para laudar |
| `exam_reports` | Laudos redigidos |
| `second_opinion_requests` | Solicitações de segunda opinião |

#### Oftalmologia
| Tabela | Descrição |
|---|---|
| `ophthalmology_exams` | Exames oftalmológicos |
| `ophthalmology_prescriptions` | Receitas de óculos/lentes |
| `visual_acuity_results` | Resultados do teste de acuidade |

#### Financeiro
| Tabela | Descrição |
|---|---|
| `payments` | Pagamentos processados |
| `wallets` | Carteiras dos médicos |
| `wallet_transactions` | Transações financeiras |
| `coupons` | Cupons de desconto |

#### Comunicação
| Tabela | Descrição |
|---|---|
| `conversations` | Conversas entre usuários |
| `messages` | Mensagens de chat |
| `notifications` | Notificações in-app |

#### LGPD e Segurança
| Tabela | Descrição |
|---|---|
| `lgpd_access_log` | Log de acesso a dados de pacientes |
| `lgpd_deletion_requests` | Solicitações de exclusão |
| `rate_limits` | Controle de rate limiting |
| `audit_logs` | Log de auditoria administrativa |
| `consultation_recordings` | Metadados de gravações |

### Políticas RLS (Row-Level Security)

Todas as tabelas com dados pessoais possuem RLS habilitado. Exemplos:

```sql
-- Paciente vê apenas suas próprias consultas
CREATE POLICY "patient_view_own_appointments" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

-- Médico vê consultas onde é o médico
CREATE POLICY "doctor_view_own_appointments" ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid() AND id = appointments.doctor_id)
  );

-- Admin vê tudo
CREATE POLICY "admin_view_all" ON appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

---

## 9. Edge Functions (Serverless)

Todas as Edge Functions ficam em `supabase/functions/` e são executadas via Deno.

| Função | Rota | Descrição |
|---|---|---|
| `send-email` | POST | Envio de e-mails transacionais via Resend |
| `send-whatsapp` | POST | Mensagens WhatsApp via Evolution API |
| `asaas-webhook` | POST | Recebe webhooks de pagamento |
| `jitsi-room (não necessário — salas criadas automaticamente)` | POST | Cria sala de videochamada |
| `didit-kyc` | POST | Inicia verificação KYC biométrica |
| `ai-assistant` | POST | Chat com assistente IA médico |
| `generate-prescription-pdf` | POST | Gera PDF de receita |
| `orthanc-proxy` | ALL | Proxy para PACS Orthanc |
| `compreface-proxy` | ALL | Proxy para reconhecimento facial |
| `pacs-integration` | POST | Integração PACS para exames |

### Rate Limiting (send-email)

```typescript
// 10 requisições por minuto por IP
const { count } = await sb.from("rate_limits")
  .select("id", { count: "exact", head: true })
  .eq("identifier", clientIP)
  .eq("endpoint", "send-email")
  .gte("window_start", since);

if (count >= 10) return new Response("Too Many Requests", { status: 429 });
```

---

## 10. CI/CD e Deploy

### Pipeline GitHub Actions (`.github/workflows/deploy.yml`)

O deploy é disparado automaticamente ao fazer push na branch `main`.

#### Jobs Paralelos:

**1. `deploy-frontend`**
- Build com Vite
- Deploy em container Docker no servidor via SSH
- Cache de dependências (`node_modules`)

**2. `deploy-supabase`**
- `supabase db push` — aplica migrações pendentes
- `supabase functions deploy` — publica todas as Edge Functions

#### Secrets Necessários (GitHub → Settings → Secrets)

| Secret | Descrição |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Token de acesso da CLI Supabase |
| `SUPABASE_DB_PASSWORD` | Senha do banco de dados |
| `DEPLOY_HOST` | IP/hostname do servidor de produção |
| `DEPLOY_USER` | Usuário SSH |
| `DEPLOY_KEY` | Chave privada SSH |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública Supabase |

---

## 11. Variáveis de Ambiente

### Frontend (`.env` ou Secrets do CI)

```env
# Supabase
VITE_SUPABASE_URL=https://oaixgmuocuwhsabidpei.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Jitsi Meet (servidor próprio) (videochamada)
# Sem chave necessária — servidor Jitsi próprio
VITE_JITSI_URL=https://meet.telemedicinaaloclinica.sbs

# Site
VITE_SITE_URL=https://app.aloclinica.com.br
```

### Edge Functions (Supabase Secrets)

```bash
# Pagamentos
supabase secrets set ASAAS_API_KEY=... ASAAS_WEBHOOK_TOKEN=...

# Comunicação
supabase secrets set RESEND_API_KEY=...
supabase secrets set EVOLUTION_API_URL=... EVOLUTION_API_KEY=...

# IA
supabase secrets set OPENROUTER_API_KEY=...

# KYC
supabase secrets set DIDIT_CLIENT_ID=... DIDIT_CLIENT_SECRET=...

# Assinatura Digital
supabase secrets set DOCUSEAL_API_KEY=...

# PACS
supabase secrets set ORTHANC_URL=... ORTHANC_USER=... ORTHANC_PASSWORD=...

# Web Push
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
```

---

## 12. Operação e Manutenção

### 12.1 Checklist de Produção

- [ ] Configurar domínio customizado no Supabase (Auth URLs)
- [ ] Ativar SMTP customizado no Supabase Auth (para evitar limite de e-mails)
- [ ] Configurar CORS no Supabase para o domínio de produção
- [ ] Habilitar webhook Asaas apontando para Edge Function
- [ ] Configurar Evolution API com número WhatsApp Business
- [ ] Configurar pg_cron (já incluso nas migrações) para:
  - Expiração de gravações (90 dias)
  - Limpeza de rate limits
  - Lembrete de consultas (1h antes)

### 12.2 Monitoramento

Acesse o painel de saúde em `/dashboard/admin/health`:

| Serviço | Verificação |
|---|---|
| Supabase DB | Query simples + tempo de resposta |
| Supabase Auth | Status do serviço |
| Jitsi Meet (servidor próprio) | Chamada à API de rooms |
| Asaas | Verificação de saldo |
| Evolution API | Status da instância WhatsApp |
| Edge Functions | Logs recentes |

### 12.3 Backup

O Supabase realiza backups automáticos diários (plano Pro+). Para backup manual:

```bash
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### 12.4 Migrações

Sempre aplique migrações em ordem cronológica:

```bash
# Aplicar todas as migrações pendentes
supabase db push

# Criar nova migração
supabase migration new nome_da_migracao
```

### 12.5 Limpeza de Dados de Teste

```sql
-- Remover dados de teste (use com cautela em produção)
DELETE FROM appointments WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'test';
```

---

## 13. Testes

### Estado Atual

```
Test Files: 39 passed (39)
Tests:      261 passed (261)
```

### Executar Testes

```bash
# Todos os testes
npm test -- --run

# Com cobertura
npm test -- --run --coverage

# Modo watch (desenvolvimento)
npm test
```

### Suítes de Teste

| Arquivo | Cobertura |
|---|---|
| `validation.test.ts` | Validação de CPF, CNPJ, formulários |
| `sanitize.test.ts` | Sanitização de inputs HTML |
| `cpf.test.ts` | Algoritmo de validação CPF |
| `cnpj.test.ts` | Algoritmo de validação CNPJ |
| `security-utils.test.ts` | Funções de segurança |
| `renewal-flow.test.tsx` | Fluxo de renovação de receita |
| `hooks-extended.test.ts` | Hooks customizados |
| `clinic-dashboard.test.tsx` | Dashboard da clínica |
| `landing.test.tsx` | Página inicial |
| `precall-check.test.tsx` | Verificação pré-chamada |

---

## Suporte e Contato

Para dúvidas técnicas sobre a plataforma:

- **Documentação Técnica**: este arquivo + comentários no código
- **Issues**: repositório GitHub do projeto
- **Supabase Dashboard**: `https://app.supabase.com/project/oaixgmuocuwhsabidpei`

---

*AloClínica — Telemedicina completa, segura e em conformidade com a legislação brasileira.*  
*Documentação gerada em Abril 2026.*
