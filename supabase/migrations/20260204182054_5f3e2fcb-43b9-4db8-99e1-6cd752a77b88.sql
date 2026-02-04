-- Fix function search_path warnings by recreating functions with SET search_path

-- Fix determine_slot function
CREATE OR REPLACE FUNCTION public.determine_slot(roll_num INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF roll_num % 2 = 1 THEN
    RETURN 1;
  ELSE
    RETURN 2;
  END IF;
END;
$$;

-- Fix get_books_owned function
CREATE OR REPLACE FUNCTION public.get_books_owned(slot_num INTEGER)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF slot_num = 1 THEN
    RETURN ARRAY['Engineering Mechanics', 'Chemistry', 'Programming for Problem Solving (PPS)', 'Indian Knowledge System (IKS)'];
  ELSE
    RETURN ARRAY['Physics', 'Basic Electrical Engineering (BEE)', 'Engineering Graphics & Design (EGD)', 'English – General & Professional Communication'];
  END IF;
END;
$$;

-- Fix get_books_required function
CREATE OR REPLACE FUNCTION public.get_books_required(slot_num INTEGER)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF slot_num = 1 THEN
    RETURN ARRAY['Physics', 'Basic Electrical Engineering (BEE)', 'Engineering Graphics & Design (EGD)', 'English – General & Professional Communication'];
  ELSE
    RETURN ARRAY['Engineering Mechanics', 'Chemistry', 'Programming for Problem Solving (PPS)', 'Indian Knowledge System (IKS)'];
  END IF;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;