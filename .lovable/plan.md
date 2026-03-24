
# Conexão PACS/DICOM — Como funciona e o que falta

## O que já está pronto na Allo Médico

Sua Edge Function `pacs-integration` já implementa um **webhook completo** que recebe exames DICOM de um servidor PACS externo. O fluxo é:

```text
┌─────────────┐     DICOM C-STORE     ┌──────────────┐     HTTP POST      ┌───────────────────┐
│  Equipamento │ ──────────────────► │  Orthanc      │ ──────────────► │  Edge Function     │
│  (CT, RX...) │                     │  (PACS Server)│  (Lua script)    │  pacs-integration  │
└─────────────┘                     └──────────────┘                  └───────────────────┘
                                                                            │
                                                                     Cria exam_request
                                                                     Upload no bucket
                                                                     Notifica laudistas
```

A Edge Function já suporta:
- Receber estudos DICOM via `action: "orthanc_webhook"` com arquivos em base64
- Deduplicação por `study_uid`
- Upload automático no bucket `exam-files`
- Criação de `exam_request` com SLA e prioridade
- Auto-assign por especialidade (trigger `fn_auto_assign_exam_to_specialist`)
- Notificações para admins e laudistas

## O que o cliente precisa fazer (infraestrutura externa)

A Allo Médico **não roda** um servidor PACS — isso é responsabilidade da clínica. O passo a passo para o cliente:

### 1. Instalar o Orthanc (gratuito e open-source)
- Docker: `docker run -p 4242:4242 -p 8042:8042 jodogne/orthanc`
- O equipamento de imagem (CR, CT, RM) envia exames via protocolo DICOM (porta 4242) para o Orthanc

### 2. Configurar o Lua Script no Orthanc
O Orthanc suporta scripts Lua que disparam automaticamente quando um novo estudo chega. O cliente precisa adicionar um script que faz POST para a Edge Function:

```lua
function OnStableStudy(studyId, tags, metadata)
  local study = RestApiGet('/studies/' .. studyId)
  local payload = {
    action = "orthanc_webhook",
    study_uid = tags["StudyInstanceUID"],
    patient_name = tags["PatientName"],
    modality = tags["Modality"],
    study_description = tags["StudyDescription"],
    priority = "normal"
  }
  HttpPost("https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/pacs-integration", 
           DumpJson(payload), 
           { ["Content-Type"] = "application/json" })
end
```

### 3. (Opcional) Enviar arquivos DICOM junto
Para incluir os arquivos no webhook, o script Lua precisa serializar as instâncias em base64 e incluir no campo `files[]`. Isso é mais pesado mas permite visualização no DicomViewer da plataforma.

## O que pode ser melhorado no código (plano de implementação)

### Passo 1 — Corrigir bug na Edge Function
Na linha 215 do `pacs-integration/index.ts`, há referência a `err` em vez de `error`. Corrigir para evitar crash.

### Passo 2 — Criar painel de configuração PACS no Admin
Adicionar uma seção no painel admin onde o administrador pode:
- Visualizar o URL do webhook (para copiar e colar no Orthanc)
- Ver os últimos exames recebidos via DICOM router
- Testar a conectividade enviando um ping

### Passo 3 — Adicionar documentação inline
Criar um componente de guia rápido ("Como conectar seu PACS") dentro do painel admin com as instruções do Orthanc/Lua script, para que o cliente não dependa de suporte externo.

### Passo 4 — Validação de segurança no webhook
Adicionar um token secreto (`PACS_WEBHOOK_SECRET`) que o Orthanc envia como header, para que apenas servidores autorizados possam enviar exames.

## Resumo

| Item | Status |
|------|--------|
| Edge Function webhook | ✅ Pronto (com bug menor) |
| Upload e armazenamento DICOM | ✅ Pronto |
| Auto-assign por especialidade | ✅ Pronto |
| Visualizador DICOM (DWV) | ✅ Pronto |
| Servidor PACS (Orthanc) | ⏳ Responsabilidade da clínica |
| Painel admin de config PACS | 🔨 A implementar |
| Token de segurança webhook | 🔨 A implementar |
| Documentação inline | 🔨 A implementar |

## Detalhes técnicos

- **Arquivos a modificar**: `supabase/functions/pacs-integration/index.ts` (fix bug), novo componente `src/components/admin/AdminPACSConfig.tsx`
- **Nova secret**: `PACS_WEBHOOK_SECRET` para autenticar webhooks
- **Sem mudanças no banco**: a coluna `orthanc_study_uid` e `source` já existem em `exam_requests`
