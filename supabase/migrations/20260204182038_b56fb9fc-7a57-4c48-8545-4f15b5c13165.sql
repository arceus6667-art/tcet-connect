-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create enum for exchange status
CREATE TYPE public.exchange_status AS ENUM ('pending', 'requested', 'matched', 'completed', 'cancelled');

-- Create enum for branches
CREATE TYPE public.branch AS ENUM ('CS', 'IT', 'EXTC', 'MECH', 'CIVIL', 'AIDS', 'AIML');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create student_academic_info table
CREATE TABLE public.student_academic_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  branch branch NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('A', 'B', 'C', 'D')),
  roll_number INTEGER NOT NULL CHECK (roll_number >= 1 AND roll_number <= 100),
  slot INTEGER NOT NULL CHECK (slot IN (1, 2)),
  books_owned TEXT[] NOT NULL,
  books_required TEXT[] NOT NULL,
  exchange_status exchange_status DEFAULT 'pending' NOT NULL,
  academic_info_completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pre-approved admins table
CREATE TABLE public.approved_admin_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_admin_emails ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_approved = true
  )
$$;

-- Security definer function to check if email is pre-approved admin
CREATE OR REPLACE FUNCTION public.is_approved_admin_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.approved_admin_emails
    WHERE LOWER(email) = LOWER(_email)
  )
$$;

-- Function to determine slot based on roll number
CREATE OR REPLACE FUNCTION public.determine_slot(roll_num INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Odd roll numbers = Slot 1, Even roll numbers = Slot 2
  IF roll_num % 2 = 1 THEN
    RETURN 1;
  ELSE
    RETURN 2;
  END IF;
END;
$$;

-- Function to get books owned based on slot
CREATE OR REPLACE FUNCTION public.get_books_owned(slot_num INTEGER)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF slot_num = 1 THEN
    RETURN ARRAY['Engineering Mechanics', 'Chemistry', 'Programming for Problem Solving (PPS)', 'Indian Knowledge System (IKS)'];
  ELSE
    RETURN ARRAY['Physics', 'Basic Electrical Engineering (BEE)', 'Engineering Graphics & Design (EGD)', 'English – General & Professional Communication'];
  END IF;
END;
$$;

-- Function to get books required based on slot
CREATE OR REPLACE FUNCTION public.get_books_required(slot_num INTEGER)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF slot_num = 1 THEN
    RETURN ARRAY['Physics', 'Basic Electrical Engineering (BEE)', 'Engineering Graphics & Design (EGD)', 'English – General & Professional Communication'];
  ELSE
    RETURN ARRAY['Engineering Mechanics', 'Chemistry', 'Programming for Problem Solving (PPS)', 'Indian Knowledge System (IKS)'];
  END IF;
END;
$$;

-- Trigger function to auto-populate slot and books on insert/update
CREATE OR REPLACE FUNCTION public.auto_populate_student_books()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_slot INTEGER;
BEGIN
  calculated_slot := public.determine_slot(NEW.roll_number);
  NEW.slot := calculated_slot;
  NEW.books_owned := public.get_books_owned(calculated_slot);
  NEW.books_required := public.get_books_required(calculated_slot);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger for student_academic_info
CREATE TRIGGER trigger_auto_populate_books
BEFORE INSERT OR UPDATE OF roll_number ON public.student_academic_info
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_student_books();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_academic_info
CREATE POLICY "Students can view their own academic info"
ON public.student_academic_info FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own academic info"
ON public.student_academic_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own academic info"
ON public.student_academic_info FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all student academic info"
ON public.student_academic_info FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for approved_admin_emails (only admins can view)
CREATE POLICY "Admins can view approved admin emails"
ON public.approved_admin_emails FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage approved admin emails"
ON public.approved_admin_emails FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_academic_info_updated_at
BEFORE UPDATE ON public.student_academic_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();