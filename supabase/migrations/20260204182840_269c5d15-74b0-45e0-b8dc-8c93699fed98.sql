-- Create admin action logs table
CREATE TABLE public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_match_id UUID REFERENCES public.exchange_matches(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_admin_logs_admin_id ON public.admin_action_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_action_logs(created_at DESC);
CREATE INDEX idx_admin_logs_action_type ON public.admin_action_logs(action_type);

-- Enable RLS
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_action_logs (only admins)
CREATE POLICY "Admins can view all logs"
ON public.admin_action_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert logs"
ON public.admin_action_logs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for system_settings (read by all authenticated, managed by admins)
CREATE POLICY "Authenticated users can view settings"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.system_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('matching_engine_enabled', 'true', 'Controls whether the matching engine can run'),
('current_semester', '{"semester": "even", "academic_year": "2025-2026"}', 'Current semester configuration'),
('exchange_deadline', '"2026-03-31"', 'Deadline for book exchanges this semester');

-- Add is_active column to profiles for soft delete
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update exchange_matches to allow admin modifications
CREATE POLICY "Admins can insert matches"
ON public.exchange_matches FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete matches"
ON public.exchange_matches FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type TEXT,
  _action_description TEXT,
  _target_user_id UUID DEFAULT NULL,
  _target_match_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_action_logs (
    admin_id,
    action_type,
    action_description,
    target_user_id,
    target_match_id,
    metadata
  ) VALUES (
    auth.uid(),
    _action_type,
    _action_description,
    _target_user_id,
    _target_match_id,
    _metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;