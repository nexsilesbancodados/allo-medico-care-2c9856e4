
-- Create support_tickets table for organized support conversations
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  assigned_to uuid,
  subject text NOT NULL DEFAULT 'Atendimento',
  status text NOT NULL DEFAULT 'bot',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Patients can view/create own tickets
CREATE POLICY "Patients can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (patient_id = auth.uid() OR is_admin() OR is_support());

CREATE POLICY "Patients can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Support/Admin can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (is_admin() OR is_support() OR patient_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create support_messages table (linked to tickets)
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'patient',
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Participants can view messages
CREATE POLICY "Ticket participants can view messages"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND (t.patient_id = auth.uid() OR is_admin() OR is_support())
    )
  );

-- Participants can send messages
CREATE POLICY "Ticket participants can send messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND (t.patient_id = auth.uid() OR is_admin() OR is_support())
    )
  );

-- Support can mark messages as read
CREATE POLICY "Participants can mark messages read"
  ON public.support_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND (t.patient_id = auth.uid() OR is_admin() OR is_support())
    )
  );

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
