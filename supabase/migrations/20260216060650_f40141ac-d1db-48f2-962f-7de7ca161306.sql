
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Messages table for doctor-patient chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = messages.appointment_id
      AND (a.patient_id = auth.uid() OR EXISTS (
        SELECT 1 FROM doctor_profiles dp WHERE dp.id = a.doctor_id AND dp.user_id = auth.uid()
      ))
    )
    OR is_admin()
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = messages.appointment_id
      AND (a.patient_id = auth.uid() OR EXISTS (
        SELECT 1 FROM doctor_profiles dp WHERE dp.id = a.doctor_id AND dp.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = messages.appointment_id
      AND (a.patient_id = auth.uid() OR EXISTS (
        SELECT 1 FROM doctor_profiles dp WHERE dp.id = a.doctor_id AND dp.user_id = auth.uid()
      ))
    )
  );

CREATE INDEX idx_messages_appointment ON public.messages (appointment_id, created_at);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
