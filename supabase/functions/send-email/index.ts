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

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  appointment_confirmation: (d) => ({
    subject: "✅ Consulta Confirmada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Consulta Confirmada!</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> foi confirmada.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📅 Data:</strong> ${d.date}</p>
          <p><strong>⏰ Horário:</strong> ${d.time}</p>
          <p><strong>🩺 Especialidade:</strong> ${d.specialty || "Clínica Geral"}</p>
        </div>
        <p>Acesse a plataforma 5 minutos antes para entrar na sala de espera virtual.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  appointment_reminder: (d) => ({
    subject: `⏰ Lembrete: Consulta em ${d.time_until} — AloClinica`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Lembrete de Consulta</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> acontece em <strong>${d.time_until}</strong>.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📅 Data:</strong> ${d.date}</p>
          <p><strong>⏰ Horário:</strong> ${d.time}</p>
        </div>
        <p>Prepare-se para acessar a plataforma no horário agendado.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  prescription_sent: (d) => ({
    subject: "💊 Nova Receita Médica — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Nova Receita Médica</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>O(a) <strong>${d.doctor_name}</strong> emitiu uma nova receita para você.</p>
        ${d.diagnosis ? `<div style="background:#fff8f0;padding:12px;border-radius:8px;margin:12px 0;"><strong>Diagnóstico:</strong> ${d.diagnosis}</div>` : ""}
        ${d.medications ? `<div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;"><strong>Medicamentos:</strong><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;margin-top:8px;">${d.medications}</pre></div>` : ""}
        <p>Acesse a plataforma para visualizar e baixar sua receita completa em PDF.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  welcome: (d) => ({
    subject: "🎉 Bem-vindo(a) à AloClinica!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Bem-vindo(a) à AloClinica!</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Sua conta foi criada com sucesso. Agora você pode:</p>
        <ul>
          <li>Buscar médicos por especialidade</li>
          <li>Agendar consultas online</li>
          <li>Receber receitas e atestados digitais</li>
        </ul>
        <p>Acesse a plataforma e comece agora!</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  welcome_doctor: (d) => ({
    subject: "🩺 Bem-vindo(a), Dr(a)! — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Bem-vindo(a) ao Portal Médico!</h2>
        <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
        <p>Seu cadastro como médico(a) foi recebido com sucesso!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
          <p><strong>CRM:</strong> ${d.crm || "—"}</p>
          <p><strong>Próximos passos:</strong></p>
          <ol style="margin-top:8px;padding-left:20px;">
            <li>Aguarde a aprovação do administrador</li>
            <li>Complete o onboarding no painel</li>
            <li>Configure sua disponibilidade</li>
          </ol>
        </div>
        <p>Enquanto isso, explore o painel e familiarize-se com a plataforma.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  welcome_clinic: (d) => ({
    subject: "🏥 Clínica Cadastrada! — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Clínica Cadastrada com Sucesso!</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Sua clínica <strong>${d.clinic_name}</strong> foi cadastrada na plataforma AloClinica.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p>📋 <strong>Status:</strong> Aguardando aprovação do administrador</p>
          <p>Assim que aprovada, você poderá vincular médicos e gerenciar agendas.</p>
        </div>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  appointment_cancelled: (d) => ({
    subject: "❌ Consulta Cancelada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#ef4444;">Consulta Cancelada</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> foi <strong style="color:#ef4444;">cancelada</strong>.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📅 Data:</strong> ${d.date}</p>
          <p><strong>⏰ Horário:</strong> ${d.time}</p>
          ${d.reason ? `<p><strong>📝 Motivo:</strong> ${d.reason}</p>` : ""}
          <p><strong>Cancelado por:</strong> ${d.cancelled_by || "—"}</p>
        </div>
        <p>Deseja reagendar? Acesse a plataforma e escolha um novo horário.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  appointment_rescheduled: (d) => ({
    subject: "🔄 Consulta Reagendada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#f59e0b;">Consulta Reagendada</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> foi reagendada.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📅 Nova Data:</strong> ${d.new_date}</p>
          <p><strong>⏰ Novo Horário:</strong> ${d.new_time}</p>
        </div>
        <p>Acesse a plataforma para mais detalhes.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  certificate_sent: (d) => ({
    subject: "📋 Atestado Médico Emitido — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Atestado Médico Emitido</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>O(a) <strong>${d.doctor_name}</strong> emitiu um ${d.cert_type || "atestado médico"} para você.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          ${d.days ? `<p><strong>📅 Dias de afastamento:</strong> ${d.days}</p>` : ""}
          <p><strong>🔐 Código de verificação:</strong> ${d.verification_code || "—"}</p>
        </div>
        <p>Acesse a plataforma para baixar o documento em PDF.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  doctor_approved: (d) => ({
    subject: "✅ Cadastro Médico Aprovado! — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">🎉 Cadastro Aprovado!</h2>
        <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
        <p>Seu cadastro na AloClinica foi <strong style="color:#22c55e;">APROVADO</strong>!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
          <p>Agora você pode:</p>
          <ul>
            <li>Configurar sua disponibilidade</li>
            <li>Receber agendamentos de pacientes</li>
            <li>Emitir receitas e atestados digitais</li>
          </ul>
        </div>
        <a href="${d.login_url}" style="display:inline-block;background:#1a6fc4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Acessar Painel Médico</a>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  doctor_rejected: (d) => ({
    subject: "❌ Cadastro Médico Não Aprovado — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#ef4444;">Cadastro Não Aprovado</h2>
        <p>Olá <strong>Dr(a). ${d.name}</strong>,</p>
        <p>Infelizmente, seu cadastro na AloClinica <strong style="color:#ef4444;">não foi aprovado</strong> neste momento.</p>
        ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
        <p>Se acredita que houve um engano, entre em contato com o suporte.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  consultation_started: (d) => ({
    subject: "📹 Seu Médico Está Online! — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Seu Médico Entrou na Sala!</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p><strong>${d.doctor_name}</strong> já está na sala de consulta virtual.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p>Clique no botão abaixo para entrar na consulta:</p>
        </div>
        <a href="${d.consultation_url}" style="display:inline-block;background:#1a6fc4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Entrar na Consulta 📹</a>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  document_uploaded: (d) => ({
    subject: "📎 Novo Documento Disponível — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Novo Documento Disponível</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>O(a) <strong>${d.doctor_name}</strong> enviou um novo documento para você:</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📄 Arquivo:</strong> ${d.file_name || "Documento"}</p>
          ${d.description ? `<p><strong>📝 Descrição:</strong> ${d.description}</p>` : ""}
        </div>
        <p>Acesse a plataforma para visualizar e baixar.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  affiliate_approved: (d) => ({
    subject: "✅ Afiliação Aprovada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">🎉 Parabéns, ${d.name}!</h2>
        <p>Sua solicitação de afiliação à <strong>AloClinica</strong> foi <strong style="color:#22c55e;">APROVADA</strong>!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
          <p><strong>💰 Comissão:</strong> 2% sobre todos os ganhos dos pacientes indicados por você</p>
          <p><strong>🔄 Recorrência:</strong> Comissão em assinaturas mensais e consultas avulsas</p>
          <p><strong>💳 Saque:</strong> Solicite saques diretamente pelo painel</p>
        </div>
        <p>Acesse o portal de afiliados para gerar seu link de indicação e começar a ganhar!</p>
        <a href="${d.login_url}" style="display:inline-block;background:#1a6fc4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">Acessar Painel de Afiliado</a>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Programa de Afiliados</p>
      </div>
    `,
  }),
  affiliate_rejected: (d) => ({
    subject: "❌ Solicitação de Afiliação — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#ef4444;">Solicitação não aprovada</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Infelizmente, sua solicitação de afiliação à AloClinica <strong style="color:#ef4444;">não foi aprovada</strong> neste momento.</p>
        ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
        <p>Se você acredita que houve um engano, entre em contato com nosso suporte.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Programa de Afiliados</p>
      </div>
    `,
  }),
  clinic_approved: (d) => ({
    subject: "✅ Clínica Aprovada! — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">🏥 Clínica Aprovada!</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Sua clínica <strong>${d.clinic_name || ""}</strong> foi <strong style="color:#22c55e;">APROVADA</strong> na AloClinica!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
          <p>Agora você pode:</p>
          <ul>
            <li>Vincular médicos à sua clínica</li>
            <li>Gerenciar agendas e recepção</li>
            <li>Acompanhar financeiro e relatórios</li>
          </ul>
        </div>
        <a href="${d.login_url}" style="display:inline-block;background:#1a6fc4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Acessar Painel da Clínica</a>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  clinic_rejected: (d) => ({
    subject: "❌ Clínica Não Aprovada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#ef4444;">Clínica Não Aprovada</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Infelizmente, sua clínica <strong>${d.clinic_name || ""}</strong> <strong style="color:#ef4444;">não foi aprovada</strong> neste momento.</p>
        ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
        <p>Se acredita que houve um engano, entre em contato com o suporte.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  consultation_completed: (d) => ({
    subject: "🎉 Consulta Finalizada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">Consulta Finalizada!</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> foi concluída com sucesso!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p>📋 Receitas e documentos já estão disponíveis no seu painel.</p>
          <p>⭐ Avalie sua experiência para ajudar outros pacientes!</p>
        </div>
        <p>Obrigado por usar a AloClinica! 💚</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  password_reset: (d) => ({
    subject: "🔐 Redefinição de Senha — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Redefinição de Senha</h2>
        <p>Olá${d.name ? ` <strong>${d.name}</strong>` : ""},</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta AloClinica.</p>
        ${d.reset_link ? `<div style="text-align:center;margin:24px 0;"><a href="${d.reset_link}" style="background:#1a6fc4;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Redefinir Senha</a></div>` : ""}
        <p style="color:#666;font-size:13px;">Este link expira em 1 hora. Se não solicitou a redefinição, ignore este e-mail.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  subscription_activated: (d) => ({
    subject: "🎉 Plano Ativado com Sucesso — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">Plano Ativado!</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>Seu <strong>${d.plan_name || "plano"}</strong> foi ativado com sucesso.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #22c55e;">
          <p><strong>Plano:</strong> ${d.plan_name || "—"}</p>
          <p><strong>Válido até:</strong> ${d.expires_at || "—"}</p>
          <p><strong>Consultas incluídas:</strong> ${d.max_appointments || "Ilimitadas"}</p>
        </div>
        <p>Acesse a plataforma para agendar sua primeira consulta!</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  subscription_expiring: (d) => ({
    subject: "⚠️ Seu Plano Expira em Breve — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#f59e0b;">Plano Expirando</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>Seu plano <strong>${d.plan_name || "atual"}</strong> expira em <strong>${d.days_left || "poucos"} dias</strong>.</p>
        <div style="background:#fff8f0;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
          <p><strong>Data de expiração:</strong> ${d.expires_at || "—"}</p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${d.renew_link || "https://app.aloclinica.com.br/dashboard/plans"}" style="background:#1a6fc4;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Renovar Plano</a>
        </div>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  payment_confirmed: (d) => ({
    subject: "✅ Pagamento Confirmado — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">Pagamento Confirmado! ✅</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>Seu pagamento${d.amount ? ` de <strong>R$ ${d.amount}</strong>` : ""} foi confirmado com sucesso!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #22c55e;">
          <p><strong>🩺 Médico:</strong> ${d.doctor_name || "—"}</p>
          <p><strong>📅 Data:</strong> ${d.date || "—"}</p>
          <p><strong>⏰ Horário:</strong> ${d.time || "—"}</p>
        </div>
        <p>Sua consulta está <strong>garantida</strong>. Acesse a plataforma 5 minutos antes do horário.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://app.aloclinica.com.br/dashboard/appointments" style="background:#1a6fc4;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver Minhas Consultas</a>
        </div>
        <div style="background:#f0f9ff;padding:12px;border-radius:8px;margin:16px 0;">
          <p style="font-size:13px;color:#0369a1;margin:0;">💡 <strong>Dica:</strong> Prepare suas dúvidas e exames anteriores para aproveitar ao máximo sua consulta.</p>
        </div>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  exam_report_ready: (d) => ({
    subject: "📋 Resultado de Exame Disponível — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Seu Laudo Está Pronto! 📋</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>O laudo do seu exame de <strong>${d.exam_type || "exame"}</strong> foi finalizado pelo <strong>${d.doctor_name || "médico"}</strong>.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #1a6fc4;">
          <p><strong>🔬 Tipo de Exame:</strong> ${d.exam_type || "—"}</p>
          <p><strong>🩺 Laudista:</strong> ${d.doctor_name || "—"}</p>
          ${d.verification_code ? `<p><strong>🔐 Código de Verificação:</strong> ${d.verification_code}</p>` : ""}
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${d.download_link || "https://app.aloclinica.com.br/dashboard/health"}" style="background:#1a6fc4;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Acessar Meu Laudo</a>
        </div>
        ${d.verification_code ? `<p style="font-size:12px;color:#666;">Verifique a autenticidade em: <a href="${d.validate_link || "#"}" style="color:#1a6fc4;">${d.validate_link || "aloclinica.com.br/validar"}</a></p>` : ""}
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  card_activated: (d) => ({
    subject: "🎉 Cartão de Benefícios Ativado — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">🎉 Cartão de Benefícios Ativado!</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>Seu <strong>Cartão de Benefícios ${d.plan_name || ""}</strong> foi ativado com sucesso!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
          <p><strong>💳 Plano:</strong> ${d.plan_name || "—"}</p>
          <p><strong>📅 Válido até:</strong> ${d.valid_until || "—"}</p>
          <p><strong>💰 Desconto:</strong> ${d.discount_percent || "30"}% em consultas</p>
        </div>
        <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="font-weight:bold;color:#166534;margin:0 0 8px;">Seus benefícios:</p>
          <ul style="color:#166534;font-size:14px;padding-left:20px;margin:0;">
            <li>Telemedicina 24h/7</li>
            <li>Clube de Vantagens (até 80% off)</li>
            <li>Reagendamentos gratuitos</li>
            ${d.plan_name?.includes("Família") ? "<li>Cobertura para dependentes</li>" : ""}
          </ul>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://app.aloclinica.com.br/dashboard/schedule" style="background:#22c55e;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Agendar Consulta com Desconto</a>
        </div>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  card_expiring: (d) => ({
    subject: "⚠️ Cartão de Benefícios Expirando — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#f59e0b;">⚠️ Cartão Expirando!</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>Seu <strong>Cartão de Benefícios ${d.plan_name || ""}</strong> expira em <strong>${d.days_left || "poucos"} dias</strong>.</p>
        <div style="background:#fff8f0;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
          <p><strong>📅 Expira em:</strong> ${d.valid_until || "—"}</p>
          <p>Renove para manter seus descontos e benefícios!</p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://app.aloclinica.com.br/dashboard/plans" style="background:#f59e0b;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Renovar Meu Cartão</a>
        </div>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  refund_processed: (d) => ({
    subject: "💸 Reembolso Processado — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Reembolso Processado 💸</h2>
        <p>Olá <strong>${d.patient_name || "Paciente"}</strong>,</p>
        <p>Seu reembolso${d.amount ? ` de <strong>R$ ${d.amount}</strong>` : ""} foi processado com sucesso.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          ${d.reason ? `<p><strong>Motivo:</strong> ${d.reason}</p>` : ""}
          <p><strong>Prazo:</strong> O valor será devolvido em até 10 dias úteis.</p>
        </div>
        <p>Deseja reagendar sua consulta? Acesse a plataforma!</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),

};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support both Brevo (primary) and Resend (fallback)
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!BREVO_API_KEY && !RESEND_API_KEY) {
      const body: EmailRequest = await req.json();
      console.info("[DEV] Email would be sent:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ success: true, dev: true, message: "Email logged (no email provider configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EmailRequest = await req.json();
    const { type, to, data } = body;

    const template = templates[type];
    if (!template) {
      return new Response(JSON.stringify({ error: "Unknown email type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = template(data);

    const fromEmail = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@aloclinica.com.br";
    const fromName = Deno.env.get("EMAIL_FROM_NAME") || "AloClínica";

    let res: Response;
    let result: Record<string, unknown>;

    if (BREVO_API_KEY) {
      // Brevo (Sendinblue) API v3
      res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      result = res.ok ? { success: true, messageId: (await res.json()).messageId } : await res.json();
    } else {
      // Resend fallback
      res = await fetch("https://api.resend.com/emails", {
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
      result = await res.json();
    }

    if (!res.ok) {
      // If Resend rejects due to unverified domain, log but return success
      // so callers don't break. The email simply won't be delivered.
      if (result?.name === "validation_error" && result?.message?.includes("verify a domain")) {
        console.warn("Resend domain not verified — email skipped:", to, "template:", type);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "domain_not_verified" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: "Failed to send email", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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