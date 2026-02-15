

# Alô Médico — Plataforma de Telemedicina

## Visão Geral
Plataforma completa de telemedicina com videochamadas, agendamento, receitas médicas e gestão de clínicas. Design profissional médico com tons de azul e verde, transmitindo confiança e saúde.

---

## 1. Landing Page & Identidade Visual
- Página inicial institucional com logo "Alô Médico"
- Paleta de cores médica (azul, verde, branco)
- Seções: Hero, Como funciona, Especialidades, Planos, Depoimentos, FAQ, Footer
- Botões de CTA para cadastro de pacientes e médicos
- Design responsivo para mobile

## 2. Sistema de Autenticação (4 tipos de usuário)
- **Pacientes**: cadastro com dados pessoais, CPF, convênio
- **Médicos**: cadastro com CRM, especialidades, formação, foto
- **Clínicas**: cadastro com CNPJ, endereço, lista de médicos vinculados
- **Administradores**: acesso total à plataforma
- Login/cadastro com email e senha
- Recuperação de senha

## 3. Painel do Paciente
- Dashboard com próximas consultas e histórico
- Busca de médicos por especialidade, nome ou disponibilidade
- Agendamento de consultas (escolher data, horário e médico)
- Sala de espera virtual antes da videochamada
- Histórico de consultas com receitas e prontuários
- Perfil com dados pessoais e dependentes
- Área de planos (mensal vs consulta avulsa — simulado)

## 4. Painel do Médico
- Dashboard com agenda do dia e próximas consultas
- Calendário com gerenciamento de disponibilidade (dias e horários)
- Lista de pacientes atendidos
- Durante a consulta: anotações, prescrição de receitas, atestados
- Geração de receita médica digital (PDF)
- Perfil profissional público (especialidades, formação, avaliações)

## 5. Painel da Clínica
- Cadastro e gestão de médicos vinculados à clínica
- Visão geral de todas as consultas dos médicos da clínica
- Relatórios de atendimentos
- Configurações da clínica (horários, especialidades oferecidas)

## 6. Painel Administrativo
- Dashboard com métricas gerais (consultas, usuários, receita)
- Gestão de médicos (aprovação de cadastros, verificação de CRM)
- Gestão de pacientes e clínicas
- Gestão de especialidades médicas
- Configuração de planos e preços (simulado)
- Relatórios e estatísticas

## 7. Sistema de Videochamada
- Interface de videochamada integrada (usando serviço externo como Daily.co)
- Sala de consulta com vídeo, áudio e chat de apoio
- Botões de controle (microfone, câmera, encerrar)
- Timer da consulta
- Área lateral para anotações do médico durante a chamada

## 8. Receita Médica Digital
- Formulário de prescrição durante/após consulta
- Dados do médico, paciente, medicamentos, posologia
- Geração de PDF com layout profissional
- Histórico de receitas acessível pelo paciente

## 9. Sistema de Agendamento
- Calendário interativo com slots disponíveis
- Filtro por especialidade, médico e horário
- Confirmação e lembretes de consulta
- Opção de reagendamento e cancelamento

## 10. Planos e Pagamentos (Simulado)
- Página de planos com comparativo (mensal vs avulso)
- Tela de checkout simulada (sem gateway real)
- Indicação visual do plano ativo do paciente
- Preparado para integração futura com gateway de pagamento

## Tecnologia
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (banco de dados, autenticação, edge functions, storage)
- **Videochamada**: Integração com serviço externo (Daily.co ou similar)
- **PDF**: Geração de receitas em PDF no navegador

