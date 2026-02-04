-- Create content type enum
CREATE TYPE public.content_type AS ENUM ('pdf', 'notes', 'flashcard');

-- Create content status enum
CREATE TYPE public.content_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');

-- Create subjects table for organizing content
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  slot INTEGER NOT NULL CHECK (slot IN (1, 2)),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create revision content table
CREATE TABLE public.revision_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type public.content_type NOT NULL,
  content_data JSONB, -- For flashcards and notes content
  file_url TEXT, -- For PDF uploads
  file_name TEXT,
  file_size INTEGER,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  status public.content_status DEFAULT 'draft' NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_revision_content_subject ON public.revision_content(subject_id);
CREATE INDEX idx_revision_content_status ON public.revision_content(status);
CREATE INDEX idx_revision_content_type ON public.revision_content(content_type);
CREATE INDEX idx_revision_content_created_by ON public.revision_content(created_by);
CREATE INDEX idx_subjects_slot ON public.subjects(slot);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_content ENABLE ROW LEVEL SECURITY;

-- Subjects RLS policies (everyone can read, admins can manage)
CREATE POLICY "Anyone can view active subjects"
ON public.subjects FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Revision content RLS policies
-- Students can only view approved content
CREATE POLICY "Students can view approved content"
ON public.revision_content FOR SELECT
USING (
  status = 'approved' AND 
  (public.has_role(auth.uid(), 'student') OR 
   public.has_role(auth.uid(), 'teacher') OR 
   public.has_role(auth.uid(), 'admin'))
);

-- Teachers can view and manage their own content
CREATE POLICY "Teachers can view their own content"
ON public.revision_content FOR SELECT
USING (
  created_by = auth.uid() AND 
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can insert content"
ON public.revision_content FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update their own content"
ON public.revision_content FOR UPDATE
USING (
  created_by = auth.uid() AND 
  public.has_role(auth.uid(), 'teacher') AND
  status IN ('draft', 'rejected')
);

CREATE POLICY "Teachers can delete their draft content"
ON public.revision_content FOR DELETE
USING (
  created_by = auth.uid() AND 
  public.has_role(auth.uid(), 'teacher') AND
  status = 'draft'
);

-- Admins can manage all content
CREATE POLICY "Admins can manage all content"
ON public.revision_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default subjects based on the slot system
INSERT INTO public.subjects (name, code, slot, description) VALUES
-- Slot 1 subjects (owned by odd roll numbers)
('Engineering Mechanics', 'EM', 1, 'Fundamentals of mechanics and engineering principles'),
('Chemistry', 'CHEM', 1, 'Basic and applied chemistry concepts'),
('Programming for Problem Solving', 'PPS', 1, 'Introduction to programming with C'),
('Indian Knowledge System', 'IKS', 1, 'Traditional knowledge systems of India'),
-- Slot 2 subjects (owned by even roll numbers)
('Physics', 'PHY', 2, 'Fundamentals of physics'),
('Basic Electrical Engineering', 'BEE', 2, 'Introduction to electrical engineering'),
('Engineering Graphics & Design', 'EGD', 2, 'Technical drawing and CAD'),
('English - General & Professional Communication', 'ENG', 2, 'Communication skills and technical writing');

-- Create storage bucket for revision content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'revision-content',
  'revision-content',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for revision content bucket
CREATE POLICY "Authenticated users can view revision files"
ON storage.objects FOR SELECT
USING (bucket_id = 'revision-content');

CREATE POLICY "Teachers can upload revision files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'revision-content' AND
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can update their files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'revision-content' AND
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Admins can manage all revision files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'revision-content' AND
  public.has_role(auth.uid(), 'admin')
);

-- Trigger to update updated_at
CREATE TRIGGER update_revision_content_updated_at
BEFORE UPDATE ON public.revision_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();