import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Subject {
  id: string;
  name: string;
  code: string;
  slot: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RevisionContent {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  content_type: 'pdf' | 'notes' | 'flashcard';
  content_data: FlashcardData[] | NotesData | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_by: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  subject?: Subject;
  creator_name?: string;
}

export interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

export interface NotesData {
  content: string;
}

export interface CreateContentInput {
  subject_id: string;
  title: string;
  description?: string;
  content_type: 'pdf' | 'notes' | 'flashcard';
  content_data?: FlashcardData[] | NotesData;
  file?: File;
}

// Fetch all subjects
export const useSubjects = (slot?: number) => {
  return useQuery({
    queryKey: ['subjects', slot],
    queryFn: async (): Promise<Subject[]> => {
      let query = supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('slot')
        .order('name');

      if (slot) {
        query = query.eq('slot', slot);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

// Fetch revision content for students (approved only)
export const useApprovedContent = (subjectId?: string, contentType?: string) => {
  return useQuery({
    queryKey: ['approved-content', subjectId, contentType],
    queryFn: async (): Promise<RevisionContent[]> => {
      let query = supabase
        .from('revision_content')
        .select(`
          *,
          subjects:subject_id (*)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      if (contentType) {
        query = query.eq('content_type', contentType as 'pdf' | 'notes' | 'flashcard');
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        subject: item.subjects as unknown as Subject,
        content_data: item.content_data as unknown as FlashcardData[] | NotesData | null,
      }));
    },
  });
};

// Fetch teacher's own content
export const useTeacherContent = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['teacher-content', user?.id],
    queryFn: async (): Promise<RevisionContent[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('revision_content')
        .select(`
          *,
          subjects:subject_id (*)
        `)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        subject: item.subjects as unknown as Subject,
        content_data: item.content_data as unknown as FlashcardData[] | NotesData | null,
      }));
    },
    enabled: !!user,
  });
};

// Fetch all content for admin
export const useAllContent = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['all-content', statusFilter],
    queryFn: async (): Promise<RevisionContent[]> => {
      let query = supabase
        .from('revision_content')
        .select(`
          *,
          subjects:subject_id (*)
        `)
        .order('updated_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'pending_approval' | 'approved' | 'rejected');
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Get creator names
      const creatorIds = [...new Set((data || []).map(d => d.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', creatorIds);

      return (data || []).map(item => ({
        ...item,
        subject: item.subjects as unknown as Subject,
        content_data: item.content_data as unknown as FlashcardData[] | NotesData | null,
        creator_name: profiles?.find(p => p.user_id === item.created_by)?.full_name || 'Unknown',
      }));
    },
  });
};

// Create new content
export const useCreateContent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateContentInput) => {
      if (!user) throw new Error('Not authenticated');

      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Upload file if present
      if (input.file) {
        const fileExt = input.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('revision-content')
          .upload(filePath, input.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('revision-content')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = input.file.name;
        fileSize = input.file.size;
      }

      const { data, error } = await supabase
        .from('revision_content')
        .insert({
          subject_id: input.subject_id,
          title: input.title,
          description: input.description,
          content_type: input.content_type,
          content_data: input.content_data as unknown as string,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-content'] });
      toast.success('Content created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create content: ' + error.message);
    },
  });
};

// Update content
export const useUpdateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<RevisionContent> & { id: string; file?: File }) => {
      let fileUrl = updates.file_url;
      let fileName = updates.file_name;
      let fileSize = updates.file_size;

      // Upload new file if present
      if (updates.file) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = updates.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('revision-content')
          .upload(filePath, updates.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('revision-content')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = updates.file.name;
        fileSize = updates.file.size;
      }

      const { data, error } = await supabase
        .from('revision_content')
        .update({
          title: updates.title,
          description: updates.description,
          content_data: updates.content_data as unknown as string,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-content'] });
      queryClient.invalidateQueries({ queryKey: ['all-content'] });
      toast.success('Content updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update content: ' + error.message);
    },
  });
};

// Submit for approval
export const useSubmitForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('revision_content')
        .update({ status: 'pending_approval' })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-content'] });
      toast.success('Content submitted for approval');
    },
    onError: (error) => {
      toast.error('Failed to submit: ' + error.message);
    },
  });
};

// Approve content (admin only)
export const useApproveContent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('revision_content')
        .update({ 
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-content'] });
      queryClient.invalidateQueries({ queryKey: ['approved-content'] });
      toast.success('Content approved');
    },
    onError: (error) => {
      toast.error('Failed to approve: ' + error.message);
    },
  });
};

// Reject content (admin only)
export const useRejectContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, reason }: { contentId: string; reason: string }) => {
      const { error } = await supabase
        .from('revision_content')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-content'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-content'] });
      toast.success('Content rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject: ' + error.message);
    },
  });
};

// Delete content
export const useDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('revision_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-content'] });
      queryClient.invalidateQueries({ queryKey: ['all-content'] });
      toast.success('Content deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
};

// Increment view count
export const useIncrementViewCount = () => {
  return useMutation({
    mutationFn: async (contentId: string) => {
      // Get current view count and increment
      const { data } = await supabase
        .from('revision_content')
        .select('view_count')
        .eq('id', contentId)
        .single();

      await supabase
        .from('revision_content')
        .update({ view_count: (data?.view_count || 0) + 1 })
        .eq('id', contentId);
    },
  });
};

// Teacher statistics (anonymized)
export const useTeacherStats = () => {
  return useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      // Get exchange statistics (anonymized)
      const [
        { count: totalStudents },
        { count: slot1Count },
        { count: slot2Count },
        { count: pendingCount },
        { count: matchedCount },
        { count: completedCount },
      ] = await Promise.all([
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('slot', 1),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('slot', 2),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('exchange_status', 'pending'),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('exchange_status', 'matched'),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('exchange_status', 'completed'),
      ]);

      // Get content statistics
      const [
        { count: totalContent },
        { count: approvedContent },
        { count: pendingApproval },
      ] = await Promise.all([
        supabase.from('revision_content').select('*', { count: 'exact', head: true }),
        supabase.from('revision_content').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('revision_content').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      ]);

      return {
        totalStudents: totalStudents || 0,
        slot1Count: slot1Count || 0,
        slot2Count: slot2Count || 0,
        pendingCount: pendingCount || 0,
        matchedCount: matchedCount || 0,
        completedCount: completedCount || 0,
        totalContent: totalContent || 0,
        approvedContent: approvedContent || 0,
        pendingApproval: pendingApproval || 0,
      };
    },
  });
};
