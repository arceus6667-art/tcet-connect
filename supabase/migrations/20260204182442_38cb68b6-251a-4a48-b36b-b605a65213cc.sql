-- Create enum for time slot periods
CREATE TYPE public.time_slot_period AS ENUM ('morning', 'afternoon', 'evening');

-- Create exchange locations table
CREATE TABLE public.exchange_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create exchange time slots table
CREATE TABLE public.exchange_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  period time_slot_period NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_id UUID REFERENCES public.exchange_locations(id),
  max_exchanges INTEGER DEFAULT 10,
  current_exchanges INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(date, period)
);

-- Create exchange matches table
CREATE TABLE public.exchange_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time_slot_id UUID REFERENCES public.exchange_time_slots(id),
  location_id UUID REFERENCES public.exchange_locations(id),
  match_status TEXT NOT NULL DEFAULT 'matched' CHECK (match_status IN ('matched', 'confirmed', 'completed', 'cancelled')),
  student_1_confirmed BOOLEAN DEFAULT false,
  student_2_confirmed BOOLEAN DEFAULT false,
  admin_approved BOOLEAN DEFAULT false,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(student_1_id, semester, academic_year),
  UNIQUE(student_2_id, semester, academic_year)
);

-- Create index for faster matching queries
CREATE INDEX idx_student_academic_slot ON public.student_academic_info(slot, exchange_status);
CREATE INDEX idx_exchange_matches_students ON public.exchange_matches(student_1_id, student_2_id);
CREATE INDEX idx_exchange_matches_semester ON public.exchange_matches(semester, academic_year);

-- Enable RLS on new tables
ALTER TABLE public.exchange_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_locations (read by all authenticated, managed by admins)
CREATE POLICY "Anyone can view active locations"
ON public.exchange_locations FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage locations"
ON public.exchange_locations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for exchange_time_slots (read by all authenticated, managed by admins)
CREATE POLICY "Anyone can view active time slots"
ON public.exchange_time_slots FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage time slots"
ON public.exchange_time_slots FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for exchange_matches
CREATE POLICY "Students can view their own matches"
ON public.exchange_matches FOR SELECT
USING (auth.uid() = student_1_id OR auth.uid() = student_2_id);

CREATE POLICY "Students can update confirmation for their matches"
ON public.exchange_matches FOR UPDATE
USING (auth.uid() = student_1_id OR auth.uid() = student_2_id);

CREATE POLICY "Admins can view all matches"
ON public.exchange_matches FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all matches"
ON public.exchange_matches FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to get current semester info
CREATE OR REPLACE FUNCTION public.get_current_semester()
RETURNS TABLE(semester TEXT, academic_year TEXT)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Odd semester: July to December, Even semester: January to June
  IF current_month >= 7 THEN
    semester := 'odd';
    academic_year := current_year || '-' || (current_year + 1);
  ELSE
    semester := 'even';
    academic_year := (current_year - 1) || '-' || current_year;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Function to check if student is already matched this semester
CREATE OR REPLACE FUNCTION public.is_student_matched_this_semester(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exchange_matches em
    CROSS JOIN public.get_current_semester() cs
    WHERE (em.student_1_id = _user_id OR em.student_2_id = _user_id)
      AND em.semester = cs.semester
      AND em.academic_year = cs.academic_year
      AND em.match_status != 'cancelled'
  )
$$;

-- Trigger to update exchange_matches updated_at
CREATE TRIGGER update_exchange_matches_updated_at
BEFORE UPDATE ON public.exchange_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exchange locations
INSERT INTO public.exchange_locations (name, description) VALUES
('Central Library', 'Main library building, ground floor near entrance'),
('Student Common Area', 'Common area in the main building'),
('Cafeteria', 'College cafeteria during non-peak hours');

-- Insert sample time slots for the next 7 days
INSERT INTO public.exchange_time_slots (date, period, start_time, end_time, location_id)
SELECT 
  CURRENT_DATE + i,
  period,
  CASE period 
    WHEN 'morning' THEN '09:00'::TIME 
    WHEN 'afternoon' THEN '14:00'::TIME 
    WHEN 'evening' THEN '17:00'::TIME 
  END,
  CASE period 
    WHEN 'morning' THEN '12:00'::TIME 
    WHEN 'afternoon' THEN '16:00'::TIME 
    WHEN 'evening' THEN '19:00'::TIME 
  END,
  (SELECT id FROM public.exchange_locations WHERE name = 'Central Library')
FROM generate_series(1, 7) AS i
CROSS JOIN (SELECT unnest(ARRAY['morning', 'afternoon', 'evening']::time_slot_period[]) AS period) AS periods;