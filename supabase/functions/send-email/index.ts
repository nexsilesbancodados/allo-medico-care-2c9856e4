import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: string;
  to: string;
  data: Record<string, string>;
}

// ─── URL Constants ─────────────────────────────────────────────────────────────
const BASE_URL = Deno.env.get("SITE_URL") || "https://allo-medico-care.lovable.app";

const URLS = {
  // Patient routes
  patientDashboard:    `${BASE_URL}/dashboard?role=patient`,
  patientSchedule:     `${BASE_URL}/dashboard/schedule?role=patient`,
  patientAppointments: `${BASE_URL}/dashboard/appointments?role=patient`,
  patientHealth:       `${BASE_URL}/dashboard/health?role=patient`,
  patientPlans:        `${BASE_URL}/dashboard/plans?role=patient`,
  patientPrescriptions:`${BASE_URL}/dashboard/prescriptions?role=patient`,
  patientSupport:      `${BASE_URL}/dashboard/support?role=patient`,
  // Doctor routes
  doctorDashboard:     `${BASE_URL}/dashboard?role=doctor`,
  doctorAuth:          `${BASE_URL}/medico`,
  // Clinic routes
  clinicDashboard:     `${BASE_URL}/dashboard?role=clinic`,
  clinicAuth:          `${BASE_URL}/clinica`,
  // Partner routes
  partnerDashboard:    `${BASE_URL}/dashboard?role=partner`,
  partnerAuth:         `${BASE_URL}/parceiro`,
  // Admin
  adminDashboard:      `${BASE_URL}/dashboard?role=admin`,
  // Laudista
  laudistaDashboard:   `${BASE_URL}/dashboard?role=laudista`,
  // Auth
  authLogin:           `${BASE_URL}/auth`,
  // Validation
  validateDoc: (code: string) => `${BASE_URL}/validar/${code}`,
  // Discount card
  discountCard:        `${BASE_URL}/cartao-beneficios`,
};

// ─── Email wrapper ─────────────────────────────────────────────────────────────
const BRAND = {
  color: "#1a6fc4",
  colorDark: "#0f4c8a",
  green: "#22c55e",
  greenDark: "#15803d",
  red: "#ef4444",
  redDark: "#b91c1c",
  amber: "#f59e0b",
  amberDark: "#d97706",
  bg: "#f8fafc",
  muted: "#666",
  border: "#e2e8f0",
};

const LOGO_URL = `https://oaixgmuocuwhsabidpei.supabase.co/storage/v1/object/public/email-assets/logo.png`;

// Banner configs per email category
const BANNERS: Record<string, { emoji: string; title: string; gradient: [string, string]; accent: string }> = {
  appointment:    { emoji: "📅", title: "Consultas",        gradient: [BRAND.color, BRAND.colorDark],   accent: BRAND.color },
  welcome:        { emoji: "🎉", title: "Bem-vindo(a)!",    gradient: [BRAND.color, "#2563eb"],          accent: BRAND.color },
  welcome_doctor: { emoji: "🩺", title: "Portal Médico",    gradient: [BRAND.color, BRAND.colorDark],   accent: BRAND.color },
  welcome_clinic: { emoji: "🏥", title: "Clínica",          gradient: [BRAND.color, BRAND.colorDark],   accent: BRAND.color },
  approved:       { emoji: "✅", title: "Aprovado!",         gradient: [BRAND.green, BRAND.greenDark],   accent: BRAND.green },
  rejected:       { emoji: "❌", title: "Atualização",       gradient: [BRAND.red, BRAND.redDark],       accent: BRAND.red },
  prescription:   { emoji: "💊", title: "Receita Médica",    gradient: [BRAND.color, "#7c3aed"],         accent: BRAND.color },
  certificate:    { emoji: "📋", title: "Documento Médico",  gradient: [BRAND.color, BRAND.colorDark],   accent: BRAND.color },
  payment:        { emoji: "💳", title: "Financeiro",        gradient: [BRAND.green, "#059669"],         accent: BRAND.green },
  consultation:   { emoji: "📹", title: "Teleconsulta",      gradient: [BRAND.color, "#6366f1"],         accent: BRAND.color },
  alert:          { emoji: "⚠️", title: "Atenção",          gradient: [BRAND.amber, BRAND.amberDark],   accent: BRAND.amber },
  card:           { emoji: "💳", title: "Cartão Benefícios", gradient: [BRAND.green, "#10b981"],         accent: BRAND.green },
  exam:           { emoji: "🔬", title: "Resultados",        gradient: [BRAND.color, "#0ea5e9"],         accent: BRAND.color },
  invite:         { emoji: "🔑", title: "Convite",           gradient: [BRAND.green, BRAND.color],       accent: BRAND.color },
  survey:         { emoji: "⭐", title: "Avaliação",          gradient: [BRAND.amber, "#f97316"],         accent: BRAND.amber },
  default:        { emoji: "💙", title: "AloClínica",        gradient: [BRAND.color, BRAND.colorDark],   accent: BRAND.color },
};

const banner = (category: string) => {
  const b = BANNERS[category] || BANNERS.default;
  return `
    <div style="background:linear-gradient(135deg,${b.gradient[0]},${b.gradient[1]});border-radius:16px 16px 0 0;padding:28px 32px 24px;text-align:center;margin:-32px -32px 24px -32px;">
      <img src="${LOGO_URL}" alt="AloClínica" width="140" height="auto" style="display:block;margin:0 auto 12px;max-width:140px;" />
      <div style="font-size:36px;margin-bottom:4px;">${b.emoji}</div>
      <h1 style="color:white;font-size:20px;font-weight:700;margin:0;letter-spacing:0.5px;">${b.title}</h1>
    </div>`;
};

// Map template type → banner category
const TEMPLATE_BANNER: Record<string, string> = {
  appointment_confirmation: "appointment",
  appointment_reminder: "appointment",
  appointment_cancelled: "alert",
  appointment_rescheduled: "alert",
  prescription_sent: "prescription",
  certificate_sent: "certificate",
  welcome: "welcome",
  welcome_doctor: "welcome_doctor",
  welcome_clinic: "welcome_clinic",
  doctor_approved: "approved",
  doctor_rejected: "rejected",
  clinic_approved: "approved",
  clinic_rejected: "rejected",
  affiliate_approved: "approved",
  affiliate_rejected: "rejected",
  consultation_started: "consultation",
  consultation_completed: "consultation",
  document_uploaded: "certificate",
  password_reset: "default",
  subscription_activated: "payment",
  subscription_expiring: "alert",
  payment_confirmed: "payment",
  exam_report_ready: "exam",
  card_activated: "card",
  card_expiring: "alert",
  refund_processed: "payment",
  renewal_approved: "approved",
  renewal_rejected: "rejected",
  no_show_fee: "alert",
  doctor_invite_code: "invite",
  b2b_lead_received: "default",
  nps_survey: "survey",
  waitlist_slot_available: "approved",
};

const wrap = (body: string, templateType = "default") => {
  const bannerHtml = banner(TEMPLATE_BANNER[templateType] || "default");
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:24px auto;padding:32px;background:${BRAND.bg};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
    ${bannerHtml}
    ${body}
    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:32px 0 16px;" />
    <p style="color:${BRAND.muted};font-size:11px;text-align:center;margin:0;">
      AloClínica — Telemedicina Digital<br/>
      Este é um e-mail automático. Não responda.
    </p>
  </div>
</body>
</html>`;
};

const btn = (url: string, label: string, color = BRAND.color) =>
  `<div style="text-align:center;margin:24px 0;"><a href="${url}" style="display:inline-block;background:${color};color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a></div>`;

const card = (content: string, borderColor = BRAND.color) =>
  `<div style="background:white;padding:18px;border-radius:10px;margin:16px 0;border-left:4px solid ${borderColor};">${content}</div>`;

// ─── Templates ─────────────────────────────────────────────────────────────────
const templates: Record<string, (d: Record<string, string>) => { subject: string; html: string }> = {

  appointment_confirmation: (d) => ({
    subject: "✅ Consulta Confirmada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Consulta Confirmada!</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>Sua consulta com <strong>${d.doctor_name}</strong> foi confirmada.</p>
      ${card(`
        <p><strong>📅 Data:</strong> ${d.date}</p>
        <p><strong>⏰ Horário:</strong> ${d.time}</p>
        <p><strong>🩺 Especialidade:</strong> ${d.specialty || "Clínica Geral"}</p>
      `)}
      <p>Acesse a plataforma <strong>5 minutos antes</strong> para entrar na sala de espera virtual.</p>
      ${btn(URLS.patientAppointments, "Ver Minha Consulta")}
    `, "appointment_confirmation"),
  }),

  appointment_reminder: (d) => ({
    subject: `⏰ Lembrete: Consulta em ${d.time_until} — AloClínica`,
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Lembrete de Consulta</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>Sua consulta com <strong>${d.doctor_name}</strong> acontece em <strong>${d.time_until}</strong>.</p>
      ${card(`
        <p><strong>📅 Data:</strong> ${d.date}</p>
        <p><strong>⏰ Horário:</strong> ${d.time}</p>
      `)}
      <p>Prepare-se para acessar a plataforma no horário agendado.</p>
      ${btn(URLS.patientAppointments, "Acessar Consulta")}
    `, "appointment_reminder"),
  }),

  appointment_cancelled: (d) => ({
    subject: "❌ Consulta Cancelada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.red};margin:0 0 16px;">Consulta Cancelada</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>Sua consulta com <strong>${d.doctor_name}</strong> foi <strong style="color:${BRAND.red};">cancelada</strong>.</p>
      ${card(`
        <p><strong>📅 Data:</strong> ${d.date}</p>
        <p><strong>⏰ Horário:</strong> ${d.time}</p>
        ${d.reason ? `<p><strong>📝 Motivo:</strong> ${d.reason}</p>` : ""}
        <p><strong>Cancelado por:</strong> ${d.cancelled_by || "—"}</p>
      `, BRAND.red)}
      <p>Deseja reagendar? Acesse a plataforma e escolha um novo horário.</p>
      ${btn(URLS.patientSchedule, "Reagendar Consulta")}
    `),
  }),

  appointment_rescheduled: (d) => ({
    subject: "🔄 Consulta Reagendada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.amber};margin:0 0 16px;">Consulta Reagendada</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>Sua consulta com <strong>${d.doctor_name}</strong> foi reagendada.</p>
      ${card(`
        <p><strong>📅 Nova Data:</strong> ${d.new_date}</p>
        <p><strong>⏰ Novo Horário:</strong> ${d.new_time}</p>
      `, BRAND.amber)}
    `),
  }),

  prescription_sent: (d) => ({
    subject: "💊 Nova Receita Médica — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Nova Receita Médica</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>O(a) <strong>${d.doctor_name}</strong> emitiu uma nova receita para você.</p>
      ${d.diagnosis ? `<div style="background:#fff8f0;padding:12px;border-radius:8px;margin:12px 0;"><strong>Diagnóstico:</strong> ${d.diagnosis}</div>` : ""}
      ${d.medications ? card(`<strong>Medicamentos:</strong><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;margin-top:8px;">${d.medications}</pre>`) : ""}
      ${btn(URLS.patientPrescriptions, "Ver Minha Receita")}
    `),
  }),

  certificate_sent: (d) => ({
    subject: "📋 Atestado Médico Emitido — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Atestado Médico Emitido</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>O(a) <strong>${d.doctor_name}</strong> emitiu um ${d.cert_type || "atestado médico"} para você.</p>
      ${card(`
        ${d.days ? `<p><strong>📅 Dias de afastamento:</strong> ${d.days}</p>` : ""}
        <p><strong>🔐 Código de verificação:</strong> ${d.verification_code || "—"}</p>
      `)}
      ${btn(URLS.patientHealth, "Baixar Documento")}
    `),
  }),

  welcome: (d) => ({
    subject: "🎉 Bem-vindo(a) à AloClínica!",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Bem-vindo(a) à AloClínica!</h2>
      <p>Olá <strong>${d.name}</strong>,</p>
      <p>Sua conta foi criada com sucesso. Agora você pode:</p>
      <ul>
        <li>Buscar médicos por especialidade</li>
        <li>Agendar consultas online</li>
        <li>Receber receitas e atestados digitais</li>
      </ul>
      ${btn(URLS.patientDashboard, "Acessar Painel")}
    `, "welcome"),
  }),

  welcome_doctor: (d) => ({
    subject: "🩺 Bem-vindo(a), Dr(a)! — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Bem-vindo(a) ao Portal Médico!</h2>
      <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
      <p>Seu cadastro como médico(a) foi recebido com sucesso!</p>
      ${card(`
        <p><strong>CRM:</strong> ${d.crm || "—"}</p>
        <p><strong>Próximos passos:</strong></p>
        <ol style="margin-top:8px;padding-left:20px;">
          <li>Aguarde a aprovação do administrador</li>
          <li>Complete o onboarding no painel</li>
          <li>Configure sua disponibilidade</li>
        </ol>
      `)}
    `),
  }),

  welcome_clinic: (d) => ({
    subject: "🏥 Clínica Cadastrada! — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Clínica Cadastrada com Sucesso!</h2>
      <p>Olá <strong>${d.name}</strong>,</p>
      <p>Sua clínica <strong>${d.clinic_name}</strong> foi cadastrada na plataforma AloClínica.</p>
      ${card(`<p>📋 <strong>Status:</strong> Aguardando aprovação do administrador</p>`)}
    `),
  }),

  doctor_approved: (d) => ({
    subject: "✅ Cadastro Médico Aprovado! — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">🎉 Cadastro Aprovado!</h2>
      <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
      <p>Seu cadastro na AloClínica foi <strong style="color:${BRAND.green};">APROVADO</strong>!</p>
      ${card(`
        <ul>
          <li>Configurar sua disponibilidade</li>
          <li>Receber agendamentos de pacientes</li>
          <li>Emitir receitas e atestados digitais</li>
        </ul>
      `, BRAND.green)}
      ${btn(d.login_url || URLS.doctorAuth, "Acessar Painel Médico", BRAND.green)}
    `),
  }),

  doctor_rejected: (d) => ({
    subject: "❌ Cadastro Médico Não Aprovado — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.red};margin:0 0 16px;">Cadastro Não Aprovado</h2>
      <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
      <p>Infelizmente, seu cadastro na AloClínica <strong style="color:${BRAND.red};">não foi aprovado</strong> neste momento.</p>
      ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
      <p>Se acredita que houve um engano, entre em contato com o suporte.</p>
    `),
  }),

  clinic_approved: (d) => ({
    subject: "✅ Clínica Aprovada! — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">🏥 Clínica Aprovada!</h2>
      <p>Olá <strong>${d.name}</strong>,</p>
      <p>Sua clínica <strong>${d.clinic_name || ""}</strong> foi <strong style="color:${BRAND.green};">APROVADA</strong>!</p>
      ${card(`
        <ul>
          <li>Vincular médicos à sua clínica</li>
          <li>Gerenciar agendas e recepção</li>
          <li>Acompanhar financeiro e relatórios</li>
        </ul>
      `, BRAND.green)}
      ${btn(d.login_url || URLS.clinicAuth, "Acessar Painel da Clínica", BRAND.green)}
    `),
  }),

  clinic_rejected: (d) => ({
    subject: "❌ Clínica Não Aprovada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.red};margin:0 0 16px;">Clínica Não Aprovada</h2>
      <p>Olá <strong>${d.name}</strong>,</p>
      <p>Sua clínica <strong>${d.clinic_name || ""}</strong> <strong style="color:${BRAND.red};">não foi aprovada</strong> neste momento.</p>
      ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
      <p>Se acredita que houve um engano, entre em contato com o suporte.</p>
    `),
  }),

  affiliate_approved: (d) => ({
    subject: "✅ Afiliação Aprovada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">🎉 Parabéns, ${d.name}!</h2>
      <p>Sua solicitação de afiliação à <strong>AloClínica</strong> foi <strong style="color:${BRAND.green};">APROVADA</strong>!</p>
      ${card(`
        <p><strong>💰 Comissão:</strong> 2% sobre ganhos dos pacientes indicados</p>
        <p><strong>🔄 Recorrência:</strong> Assinaturas mensais e consultas avulsas</p>
        <p><strong>💳 Saque:</strong> Solicite pelo painel</p>
      `, BRAND.green)}
      ${btn(d.login_url || URLS.partnerAuth, "Acessar Painel de Afiliado", BRAND.green)}
    `),
  }),

  affiliate_rejected: (d) => ({
    subject: "❌ Solicitação de Afiliação — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.red};margin:0 0 16px;">Solicitação não aprovada</h2>
      <p>Olá <strong>${d.name}</strong>,</p>
      <p>Sua solicitação de afiliação <strong style="color:${BRAND.red};">não foi aprovada</strong> neste momento.</p>
      ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
    `),
  }),

  consultation_started: (d) => ({
    subject: "📹 Seu Médico Está Online! — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Seu Médico Entrou na Sala!</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p><strong>${d.doctor_name}</strong> já está na sala de consulta virtual.</p>
      ${btn(d.consultation_url || "#", "Entrar na Consulta 📹")}
    `, "consultation_started"),
  }),

  consultation_completed: (d) => ({
    subject: "🎉 Consulta Finalizada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">Consulta Finalizada!</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>Sua consulta com <strong>${d.doctor_name}</strong> foi concluída com sucesso!</p>
      ${card(`
        <p>📋 Receitas e documentos já estão disponíveis no seu painel.</p>
        <p>⭐ Avalie sua experiência para ajudar outros pacientes!</p>
      `, BRAND.green)}
      ${btn(URLS.patientHealth, "Ver Documentos")}
    `),
  }),

  document_uploaded: (d) => ({
    subject: "📎 Novo Documento Disponível — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Novo Documento Disponível</h2>
      <p>Olá <strong>${d.patient_name}</strong>,</p>
      <p>O(a) <strong>${d.doctor_name}</strong> enviou um novo documento para você:</p>
      ${card(`
        <p><strong>📄 Arquivo:</strong> ${d.file_name || "Documento"}</p>
        ${d.description ? `<p><strong>📝 Descrição:</strong> ${d.description}</p>` : ""}
      `)}
      ${btn(URLS.patientHealth, "Visualizar e Baixar")}
    `),
  }),

  password_reset: (d) => ({
    subject: "🔐 Redefinição de Senha — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Redefinição de Senha</h2>
      <p>Olá${d.name ? ` <strong>${d.name}</strong>` : ""},</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta AloClínica.</p>
      ${d.reset_link ? btn(d.reset_link, "Redefinir Senha") : ""}
      <p style="color:${BRAND.muted};font-size:13px;">Este link expira em 1 hora. Se não solicitou a redefinição, ignore este e-mail.</p>
    `),
  }),

  subscription_activated: (d) => ({
    subject: "🎉 Plano Ativado com Sucesso — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">Plano Ativado!</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Seu <strong>${d.plan_name || "plano"}</strong> foi ativado com sucesso.</p>
      ${card(`
        <p><strong>Plano:</strong> ${d.plan_name || "—"}</p>
        <p><strong>Válido até:</strong> ${d.expires_at || "—"}</p>
        <p><strong>Consultas incluídas:</strong> ${d.max_appointments || "Ilimitadas"}</p>
      `, BRAND.green)}
      ${btn(URLS.patientSchedule, "Agendar Consulta", BRAND.green)}
    `),
  }),

  subscription_expiring: (d) => ({
    subject: "⚠️ Seu Plano Expira em Breve — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.amber};margin:0 0 16px;">Plano Expirando</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Seu plano <strong>${d.plan_name || "atual"}</strong> expira em <strong>${d.days_left || "poucos"} dias</strong>.</p>
      ${card(`<p><strong>📅 Expira em:</strong> ${d.expires_at || "—"}</p>`, BRAND.amber)}
      ${btn(d.renew_link || URLS.patientPlans, "Renovar Plano", BRAND.amber)}
    `),
  }),

  payment_confirmed: (d) => ({
    subject: "✅ Pagamento Confirmado — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">Pagamento Confirmado! ✅</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Seu pagamento${d.amount ? ` de <strong>R$ ${d.amount}</strong>` : ""} foi confirmado com sucesso!</p>
      ${card(`
        <p><strong>🩺 Médico:</strong> ${d.doctor_name || "—"}</p>
        <p><strong>📅 Data:</strong> ${d.date || "—"}</p>
        <p><strong>⏰ Horário:</strong> ${d.time || "—"}</p>
      `, BRAND.green)}
      <p>Sua consulta está <strong>garantida</strong>. Acesse a plataforma 5 minutos antes.</p>
      ${btn(URLS.patientAppointments, "Ver Minhas Consultas")}
    `),
  }),

  exam_report_ready: (d) => ({
    subject: "📋 Resultado de Exame Disponível — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Seu Laudo Está Pronto! 📋</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>O laudo do exame <strong>${d.exam_type || "exame"}</strong> foi finalizado por <strong>${d.doctor_name || "médico"}</strong>.</p>
      ${card(`
        <p><strong>🔬 Tipo:</strong> ${d.exam_type || "—"}</p>
        <p><strong>🩺 Laudista:</strong> ${d.doctor_name || "—"}</p>
        ${d.verification_code ? `<p><strong>🔐 Código:</strong> ${d.verification_code}</p>` : ""}
      `)}
      ${btn(d.download_link || URLS.patientHealth, "Acessar Meu Laudo")}
      ${d.validate_link ? `<p style="font-size:12px;color:${BRAND.muted};text-align:center;">Verifique em: <a href="${d.validate_link}" style="color:${BRAND.color};">${d.validate_link}</a></p>` : ""}
    `),
  }),

  card_activated: (d) => ({
    subject: "🎉 Cartão de Benefícios Ativado — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">🎉 Cartão Ativado!</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Seu <strong>Cartão de Benefícios ${d.plan_name || ""}</strong> foi ativado!</p>
      ${card(`
        <p><strong>💳 Plano:</strong> ${d.plan_name || "—"}</p>
        <p><strong>📅 Válido até:</strong> ${d.valid_until || "—"}</p>
        <p><strong>💰 Desconto:</strong> ${d.discount_percent || "30"}% em consultas</p>
      `, BRAND.green)}
      <div style="background:#f0fdf4;padding:16px;border-radius:10px;margin:16px 0;">
        <p style="font-weight:bold;color:#166534;margin:0 0 8px;">Seus benefícios:</p>
        <ul style="color:#166534;font-size:14px;padding-left:20px;margin:0;">
          <li>Telemedicina 24h/7</li>
          <li>Clube de Vantagens (até 80% off)</li>
          <li>Reagendamentos gratuitos</li>
        </ul>
      </div>
      ${btn(URLS.patientSchedule, "Agendar Consulta com Desconto", BRAND.green)}
    `),
  }),

  card_expiring: (d) => ({
    subject: "⚠️ Cartão de Benefícios Expirando — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.amber};margin:0 0 16px;">⚠️ Cartão Expirando!</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Seu <strong>Cartão ${d.plan_name || ""}</strong> expira em <strong>${d.days_left || "poucos"} dias</strong>.</p>
      ${card(`
        <p><strong>📅 Expira em:</strong> ${d.valid_until || "—"}</p>
        <p>Renove para manter seus descontos e benefícios!</p>
      `, BRAND.amber)}
      ${btn(URLS.patientPlans, "Renovar Meu Cartão", BRAND.amber)}
    `),
  }),

  refund_processed: (d) => ({
    subject: "💸 Reembolso Processado — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Reembolso Processado 💸</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Seu reembolso${d.amount ? ` de <strong>R$ ${d.amount}</strong>` : ""} foi processado com sucesso.</p>
      ${card(`
        ${d.reason ? `<p><strong>Motivo:</strong> ${d.reason}</p>` : ""}
        <p><strong>Prazo:</strong> O valor será devolvido em até 10 dias úteis.</p>
      `)}
    `),
  }),

  renewal_approved: (d) => ({
    subject: "✅ Receita Renovada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">Receita Renovada! ✅</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Sua renovação de receita foi <strong style="color:${BRAND.green};">aprovada</strong> por <strong>${d.doctor_name || "médico"}</strong>.</p>
      ${card(`
        <p>📋 A nova receita já está disponível.</p>
        ${d.notes ? `<p><strong>Observações:</strong> ${d.notes}</p>` : ""}
      `, BRAND.green)}
      ${btn(URLS.patientPrescriptions, "Ver Minha Receita", BRAND.green)}
    `),
  }),

  renewal_rejected: (d) => ({
    subject: "❌ Renovação de Receita Negada — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.red};margin:0 0 16px;">Renovação Não Aprovada</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Sua renovação de receita <strong style="color:${BRAND.red};">não foi aprovada</strong>.</p>
      ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
      <p>Recomendamos agendar uma nova consulta para reavaliação.</p>
      ${btn(URLS.patientSchedule, "Agendar Consulta")}
    `, BRAND.red),
  }),

  no_show_fee: (d) => ({
    subject: "⚠️ Taxa de Não Comparecimento — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.amber};margin:0 0 16px;">Taxa de Não Comparecimento</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Você não compareceu à consulta com <strong>${d.doctor_name || "o médico"}</strong> em <strong>${d.date || "—"} às ${d.time || "—"}</strong>.</p>
      ${card(`
        <p>Conforme nossa política, será cobrada uma <strong>taxa de 50%</strong> do valor da consulta.</p>
        ${d.amount ? `<p><strong>Valor retido:</strong> R$ ${d.amount}</p>` : ""}
      `, BRAND.amber)}
      <p>Para evitar cobranças futuras, cancele com pelo menos 2h de antecedência.</p>
    `),
  }),

  doctor_invite_code: (d) => ({
    subject: "🔑 Seu Código de Convite — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">Código de Convite</h2>
      <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
      <p>Seu cadastro foi aprovado! Use o código abaixo para completar seu registro na plataforma:</p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:white;border:2px dashed ${BRAND.color};padding:16px 40px;border-radius:12px;font-size:28px;font-weight:bold;color:${BRAND.color};letter-spacing:4px;">${d.invite_code}</div>
      </div>
      ${btn(d.register_url || URLS.doctorAuth, "Completar Cadastro")}
      <p style="color:${BRAND.muted};font-size:13px;">Este código é de uso único. Não compartilhe com terceiros.</p>
    `, "doctor_invite_code"),
  }),

  b2b_lead_received: (d) => ({
    subject: "📩 Nova Solicitação B2B — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Nova Solicitação B2B</h2>
      ${card(`
        <p><strong>Empresa:</strong> ${d.company_name || "—"}</p>
        <p><strong>Contato:</strong> ${d.contact_name || "—"}</p>
        <p><strong>E-mail:</strong> ${d.email || "—"}</p>
        <p><strong>Telefone:</strong> ${d.phone || "—"}</p>
        ${d.message ? `<p><strong>Mensagem:</strong> ${d.message}</p>` : ""}
      `)}
    `),
  }),

  nps_survey: (d) => ({
    subject: "⭐ Como foi sua experiência? — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.color};margin:0 0 16px;">Avalie Sua Experiência</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Sua opinião é muito importante! Avalie sua consulta com <strong>${d.doctor_name || "o médico"}</strong>.</p>
      ${btn(d.survey_url || URLS.patientDashboard, "Avaliar Agora ⭐")}
    `, "nps_survey"),
  }),

  waitlist_slot_available: (d) => ({
    subject: "🎉 Vaga Disponível! — AloClínica",
    html: wrap(`
      <h2 style="color:${BRAND.green};margin:0 0 16px;">Vaga Disponível!</h2>
      <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
      <p>Uma vaga abriu para sua consulta com <strong>${d.doctor_name}</strong> no dia <strong>${d.date}</strong>!</p>
      ${card(`<p>⚡ Reserve rápido — a vaga é por ordem de chegada!</p>`, BRAND.green)}
      ${btn(URLS.patientSchedule, "Reservar Agora", BRAND.green)}
    `),
  }),
};

// ─── Server ────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      const body: EmailRequest = await req.json();
      console.info("[DEV] Email would be sent:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ success: true, dev: true, message: "Email logged (RESEND_API_KEY not configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EmailRequest = await req.json();
    const { type, to, data } = body;

    const template = templates[type];
    if (!template) {
      return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = template(data);
    const fromEmail = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@aloclinica.com.br";
    const fromName = Deno.env.get("EMAIL_FROM_NAME") || "AloClínica";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      // Handle domain not verified gracefully
      const errStr = JSON.stringify(result);
      if (errStr.includes("verify") || errStr.includes("domain") || errStr.includes("sender")) {
        console.warn("Resend domain not verified — email skipped:", to, "template:", type);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "domain_not_verified", details: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: "Failed to send email", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email sent via Resend:", type, "to:", to, "id:", result.id);
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
