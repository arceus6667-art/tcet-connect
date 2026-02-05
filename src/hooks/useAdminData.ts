import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserWithDetails {
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: string | null;
  is_approved: boolean;
  branch?: string;
  division?: string;
  roll_number?: number;
  slot?: number;
  exchange_status?: string;
  created_at: string;
}

export interface ExchangeMatchWithDetails {
  id: string;
  student_1_id: string;
  student_2_id: string;
  student_1_name: string;
  student_2_name: string;
  student_1_email: string;
  student_2_email: string;
  student_1_branch: string;
  student_2_branch: string;
  student_1_slot: number;
  student_2_slot: number;
  match_status: string;
  student_1_confirmed: boolean;
  student_2_confirmed: boolean;
  semester: string;
  academic_year: string;
  matched_at: string;
  time_slot_id?: string;
  location_id?: string;
  time_slot_date?: string;
  time_slot_period?: string;
  location_name?: string;
}

export interface AdminActionLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action_type: string;
  action_description: string;
  target_user_id?: string | null;
  target_match_id?: string | null;
  metadata?: unknown;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
}

export interface StudentFilters {
  slot?: number;
  branch?: string;
  exchange_status?: string;
  search?: string;
}

// Fetch all users with details
export const useAllUsers = (roleFilter?: string) => {
  return useQuery({
    queryKey: ['admin-all-users', roleFilter],
    queryFn: async (): Promise<UserWithDetails[]> => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, is_active, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_approved');

      if (rolesError) throw rolesError;

      // Get student academic info
      const { data: academicInfo, error: academicError } = await supabase
        .from('student_academic_info')
        .select('user_id, branch, division, roll_number, slot, exchange_status');

      if (academicError) throw academicError;

      // Merge data
      const users = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const academic = academicInfo?.find(a => a.user_id === profile.user_id);
        
        return {
          ...profile,
          role: userRole?.role || null,
          is_approved: userRole?.is_approved || false,
          branch: academic?.branch,
          division: academic?.division,
          roll_number: academic?.roll_number,
          slot: academic?.slot,
          exchange_status: academic?.exchange_status,
        };
      }) || [];

      // Filter by role if specified
      if (roleFilter && roleFilter !== 'all') {
        return users.filter(u => u.role === roleFilter);
      }

      return users;
    },
  });
};

// Fetch eligible students for manual matching
// Fetch available time slots
export const useAvailableTimeSlots = () => {
  return useQuery({
    queryKey: ['available-time-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_time_slots')
        .select(`
          id,
          date,
          start_time,
          end_time,
          period,
          max_exchanges,
          current_exchanges,
          location_id
        `)
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

// Fetch available locations
export const useAvailableLocations = () => {
  return useQuery({
    queryKey: ['available-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_locations')
        .select('id, name, description')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
  });
};

// Assign time slot and location to a match
export const useAssignTimeSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      matchId, 
      timeSlotId, 
      locationId 
    }: { 
      matchId: string; 
      timeSlotId: string | null;
      locationId: string | null;
    }) => {
      const { error } = await supabase
        .from('exchange_matches')
        .update({ 
          time_slot_id: timeSlotId,
          location_id: locationId,
        })
        .eq('id', matchId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        _action_type: 'TIME_SLOT_ASSIGNED',
        _action_description: 'Time slot and location assigned to match',
        _target_match_id: matchId,
        _metadata: JSON.stringify({ timeSlotId, locationId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-matches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Time slot assigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to assign time slot: ' + error.message);
    },
  });
};

// Send notification to students
export const useSendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userIds, 
      title, 
      message, 
      type = 'info',
      matchId 
    }: { 
      userIds: string[]; 
      title: string;
      message: string;
      type?: string;
      matchId?: string;
    }) => {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        match_id: matchId || null,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        _action_type: 'NOTIFICATION_SENT',
        _action_description: `Notification sent to ${userIds.length} user(s): ${title}`,
        _metadata: JSON.stringify({ userIds, title }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Notification sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send notification: ' + error.message);
    },
  });
};

export interface EligibleStudent {
  user_id: string;
  full_name: string;
  email: string;
  branch: string;
  division: string;
  roll_number: number;
  slot: number;
  books_owned: string[];
  books_required: string[];
}

export const useEligibleStudents = (slot?: number) => {
  return useQuery({
    queryKey: ['admin-eligible-students', slot],
    queryFn: async (): Promise<EligibleStudent[]> => {
      let query = supabase
        .from('student_academic_info')
        .select('user_id, branch, division, roll_number, slot, books_owned, books_required')
        .eq('exchange_status', 'pending');

      if (slot) {
        query = query.eq('slot', slot);
      }

      const { data: students, error } = await query;
      if (error) throw error;

      if (!students || students.length === 0) return [];

      const userIds = students.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      return students.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id);
        return {
          ...student,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
        };
      });
    },
  });
};

// Create manual match
export const useCreateManualMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      student1Id, 
      student2Id 
    }: { 
      student1Id: string; 
      student2Id: string;
    }) => {
      // Get current semester info
      const { data: semesterData, error: semesterError } = await supabase
        .rpc('get_current_semester');

      if (semesterError) throw semesterError;
      
      const semester = semesterData?.[0]?.semester || 'even';
      const academicYear = semesterData?.[0]?.academic_year || '2025-2026';

      // Create the match
      const { data: match, error: matchError } = await supabase
        .from('exchange_matches')
        .insert({
          student_1_id: student1Id,
          student_2_id: student2Id,
          match_status: 'matched',
          semester,
          academic_year: academicYear,
          matched_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Update both students' exchange status
      await supabase
        .from('student_academic_info')
        .update({ exchange_status: 'matched' })
        .in('user_id', [student1Id, student2Id]);

      // Log action
      await supabase.rpc('log_admin_action', {
        _action_type: 'MANUAL_MATCH_CREATED',
        _action_description: 'Manual exchange match created by admin',
        _target_match_id: match.id,
        _metadata: JSON.stringify({ student1Id, student2Id }),
      });

      return match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-matches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-eligible-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Manual match created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create match: ' + error.message);
    },
  });
};

// Restore cancelled match
export const useRestoreMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const { data: match, error: fetchError } = await supabase
        .from('exchange_matches')
        .select('student_1_id, student_2_id')
        .eq('id', matchId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('exchange_matches')
        .update({ match_status: 'matched' })
        .eq('id', matchId);

      if (updateError) throw updateError;

      await supabase
        .from('student_academic_info')
        .update({ exchange_status: 'matched' })
        .in('user_id', [match.student_1_id, match.student_2_id]);

      await supabase.rpc('log_admin_action', {
        _action_type: 'MATCH_RESTORED',
        _action_description: 'Cancelled exchange match restored by admin',
        _target_match_id: matchId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-matches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-eligible-students'] });
      toast.success('Match restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to restore match: ' + error.message);
    },
  });
};

// Update student slot
export const useUpdateStudentSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newSlot }: { userId: string; newSlot: number }) => {
      const { data: booksOwned, error: ownedError } = await supabase
        .rpc('get_books_owned', { slot_num: newSlot });
      
      if (ownedError) throw ownedError;

      const { data: booksRequired, error: requiredError } = await supabase
        .rpc('get_books_required', { slot_num: newSlot });
      
      if (requiredError) throw requiredError;

      const { error: updateError } = await supabase
        .from('student_academic_info')
        .update({ 
          slot: newSlot,
          books_owned: booksOwned || [],
          books_required: booksRequired || [],
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      await supabase.rpc('log_admin_action', {
        _action_type: 'SLOT_CHANGED',
        _action_description: `Student slot changed to Slot ${newSlot}`,
        _target_user_id: userId,
        _metadata: JSON.stringify({ newSlot }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-filtered-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-eligible-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Student slot updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update slot: ' + error.message);
    },
  });
};

// Fetch students with filters
export const useFilteredStudents = (filters: StudentFilters) => {
  return useQuery({
    queryKey: ['admin-filtered-students', filters],
    queryFn: async (): Promise<UserWithDetails[]> => {
      let query = supabase
        .from('student_academic_info')
        .select('user_id, branch, division, roll_number, slot, exchange_status');

      if (filters.slot) {
        query = query.eq('slot', filters.slot);
      }
      if (filters.branch) {
        query = query.eq('branch', filters.branch as 'CS' | 'IT' | 'EXTC' | 'MECH' | 'CIVIL' | 'AIDS' | 'AIML');
      }
      if (filters.exchange_status) {
        query = query.eq('exchange_status', filters.exchange_status as 'pending' | 'requested' | 'matched' | 'completed' | 'cancelled');
      }

      const { data: students, error: studentsError } = await query;
      if (studentsError) throw studentsError;

      // Get profiles for these students
      const userIds = students?.map(s => s.user_id) || [];
      
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, is_active, created_at')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role, is_approved')
        .in('user_id', userIds);

      // Merge data
      const result = students?.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id);
        const role = roles?.find(r => r.user_id === student.user_id);
        
        return {
          user_id: student.user_id,
          email: profile?.email || '',
          full_name: profile?.full_name || '',
          is_active: profile?.is_active ?? true,
          created_at: profile?.created_at || '',
          role: role?.role || 'student',
          is_approved: role?.is_approved || false,
          ...student,
        };
      }) || [];

      // Apply search filter if present
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return result.filter(u => 
          u.full_name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.roll_number?.toString().includes(searchLower)
        );
      }

      return result;
    },
  });
};

// Fetch all exchange matches with details
export const useAllExchangeMatches = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['admin-all-matches', statusFilter],
    queryFn: async (): Promise<ExchangeMatchWithDetails[]> => {
      let query = supabase
        .from('exchange_matches')
        .select(`
          id,
          student_1_id,
          student_2_id,
          match_status,
          student_1_confirmed,
          student_2_confirmed,
          semester,
          academic_year,
          matched_at,
          time_slot_id,
          location_id
        `)
        .order('matched_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('match_status', statusFilter);
      }

      const { data: matches, error: matchesError } = await query;
      if (matchesError) throw matchesError;

      if (!matches || matches.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set(matches.flatMap(m => [m.student_1_id, m.student_2_id]))];
      
      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Get academic info
      const { data: academic } = await supabase
        .from('student_academic_info')
        .select('user_id, branch, slot')
        .in('user_id', userIds);

      // Get time slots
      const timeSlotIds = matches.map(m => m.time_slot_id).filter(Boolean);
      const { data: timeSlots } = await supabase
        .from('exchange_time_slots')
        .select('id, date, period')
        .in('id', timeSlotIds);

      // Get locations
      const locationIds = matches.map(m => m.location_id).filter(Boolean);
      const { data: locations } = await supabase
        .from('exchange_locations')
        .select('id, name')
        .in('id', locationIds);

      // Merge data
      return matches.map(match => {
        const student1Profile = profiles?.find(p => p.user_id === match.student_1_id);
        const student2Profile = profiles?.find(p => p.user_id === match.student_2_id);
        const student1Academic = academic?.find(a => a.user_id === match.student_1_id);
        const student2Academic = academic?.find(a => a.user_id === match.student_2_id);
        const timeSlot = timeSlots?.find(t => t.id === match.time_slot_id);
        const location = locations?.find(l => l.id === match.location_id);

        return {
          ...match,
          student_1_name: student1Profile?.full_name || 'Unknown',
          student_2_name: student2Profile?.full_name || 'Unknown',
          student_1_email: student1Profile?.email || '',
          student_2_email: student2Profile?.email || '',
          student_1_branch: student1Academic?.branch || '',
          student_2_branch: student2Academic?.branch || '',
          student_1_slot: student1Academic?.slot || 0,
          student_2_slot: student2Academic?.slot || 0,
          time_slot_date: timeSlot?.date,
          time_slot_period: timeSlot?.period,
          location_name: location?.name,
        };
      });
    },
  });
};

// Fetch admin action logs
export const useAdminLogs = () => {
  return useQuery({
    queryKey: ['admin-action-logs'],
    queryFn: async (): Promise<AdminActionLog[]> => {
      const { data: logs, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get admin profiles
      const adminIds = [...new Set(logs?.map(l => l.admin_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);

      return logs?.map(log => ({
        ...log,
        admin_name: profiles?.find(p => p.user_id === log.admin_id)?.full_name || 'Unknown',
      })) || [];
    },
  });
};

// Fetch system settings
export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async (): Promise<SystemSetting[]> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      return data || [];
    },
  });
};

// Update user status (activate/deactivate)
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) throw error;

      // Log action
      await supabase.rpc('log_admin_action', {
        _action_type: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        _action_description: `User ${isActive ? 'activated' : 'deactivated'}`,
        _target_user_id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('User status updated');
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    },
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      role, 
      isApproved 
    }: { 
      userId: string; 
      role: 'student' | 'teacher' | 'admin'; 
      isApproved: boolean;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role, is_approved: isApproved })
        .eq('user_id', userId);

      if (error) throw error;

      // Log action
      await supabase.rpc('log_admin_action', {
        _action_type: 'ROLE_UPDATED',
        _action_description: `Role updated to ${role} (approved: ${isApproved})`,
        _target_user_id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('User role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });
};

// Cancel a match
export const useCancelMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      // Get match details first
      const { data: match, error: fetchError } = await supabase
        .from('exchange_matches')
        .select('student_1_id, student_2_id')
        .eq('id', matchId)
        .single();

      if (fetchError) throw fetchError;

      // Update match status
      const { error: updateError } = await supabase
        .from('exchange_matches')
        .update({ match_status: 'cancelled' })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Reset student exchange statuses back to pending
      await supabase
        .from('student_academic_info')
        .update({ exchange_status: 'pending' })
        .in('user_id', [match.student_1_id, match.student_2_id]);

      // Log action
      await supabase.rpc('log_admin_action', {
        _action_type: 'MATCH_CANCELLED',
        _action_description: 'Exchange match cancelled by admin',
        _target_match_id: matchId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-matches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Match cancelled successfully');
    },
    onError: (error) => {
      toast.error('Failed to cancel match: ' + error.message);
    },
  });
};

// Complete a match (admin approval)
export const useCompleteMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      // Get match details first
      const { data: match, error: fetchError } = await supabase
        .from('exchange_matches')
        .select('student_1_id, student_2_id')
        .eq('id', matchId)
        .single();

      if (fetchError) throw fetchError;

      // Update match status
      const { error: updateError } = await supabase
        .from('exchange_matches')
        .update({ 
          match_status: 'completed',
          admin_approved: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Update student exchange statuses
      await supabase
        .from('student_academic_info')
        .update({ exchange_status: 'completed' })
        .in('user_id', [match.student_1_id, match.student_2_id]);

      // Log action
      await supabase.rpc('log_admin_action', {
        _action_type: 'MATCH_COMPLETED',
        _action_description: 'Exchange match completed by admin',
        _target_match_id: matchId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-matches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Match marked as completed');
    },
    onError: (error) => {
      toast.error('Failed to complete match: ' + error.message);
    },
  });
};

// Update system setting
export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      // Log action
      await supabase.rpc('log_admin_action', {
        _action_type: 'SETTING_UPDATED',
        _action_description: `System setting "${key}" updated`,
        _metadata: JSON.stringify({ key, value }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
      toast.success('Setting updated');
    },
    onError: (error) => {
      toast.error('Failed to update setting: ' + error.message);
    },
  });
};

// Analytics data
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      // Get total counts
      const [
        { count: totalStudents },
        { count: slot1Students },
        { count: slot2Students },
        { count: pendingStudents },
        { count: matchedStudents },
        { count: completedExchanges },
        { count: totalMatches },
      ] = await Promise.all([
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('slot', 1),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('slot', 2),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('exchange_status', 'pending'),
        supabase.from('student_academic_info').select('*', { count: 'exact', head: true }).eq('exchange_status', 'matched'),
        supabase.from('exchange_matches').select('*', { count: 'exact', head: true }).eq('match_status', 'completed'),
        supabase.from('exchange_matches').select('*', { count: 'exact', head: true }),
      ]);

      // Get branch-wise breakdown
      const { data: branchData } = await supabase
        .from('student_academic_info')
        .select('branch');

      const branchCounts: Record<string, number> = {};
      branchData?.forEach(s => {
        branchCounts[s.branch] = (branchCounts[s.branch] || 0) + 1;
      });

      return {
        totalStudents: totalStudents || 0,
        slot1Students: slot1Students || 0,
        slot2Students: slot2Students || 0,
        pendingStudents: pendingStudents || 0,
        matchedStudents: matchedStudents || 0,
        completedExchanges: completedExchanges || 0,
        totalMatches: totalMatches || 0,
        branchCounts,
      };
    },
  });
};
