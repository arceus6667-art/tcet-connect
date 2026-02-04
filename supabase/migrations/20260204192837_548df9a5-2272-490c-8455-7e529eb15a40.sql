-- Create chat messages table for exchange partner communication
CREATE TABLE public.exchange_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.exchange_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.exchange_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_exchange_chat_match_id ON public.exchange_chat_messages(match_id);
CREATE INDEX idx_exchange_chat_created_at ON public.exchange_chat_messages(created_at);

-- RLS Policies: Only matched students can view and send messages
CREATE POLICY "Users can view messages for their matches"
ON public.exchange_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exchange_matches em
    WHERE em.id = match_id
    AND (em.student_1_id = auth.uid() OR em.student_2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages for their matches"
ON public.exchange_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.exchange_matches em
    WHERE em.id = match_id
    AND (em.student_1_id = auth.uid() OR em.student_2_id = auth.uid())
  )
);

CREATE POLICY "Users can update read status of received messages"
ON public.exchange_chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.exchange_matches em
    WHERE em.id = match_id
    AND (em.student_1_id = auth.uid() OR em.student_2_id = auth.uid())
  )
  AND sender_id != auth.uid()
);

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages"
ON public.exchange_chat_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_chat_messages;