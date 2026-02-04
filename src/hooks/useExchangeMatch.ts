import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ExchangeMatch {
  id: string;
  student_1_id: string;
  student_2_id: string;
  time_slot_id: string;
  location_id: string;
  match_status: string;
  student_1_confirmed: boolean;
  student_2_confirmed: boolean;
  admin_approved: boolean;
  semester: string;
  academic_year: string;
  matched_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
}

export interface ExchangeLocation {
  id: string;
  name: string;
  description: string;
}

export interface ExchangeTimeSlot {
  id: string;
  date: string;
  period: string;
  start_time: string;
  end_time: string;
  location_id: string;
}

export interface PartnerProfile {
  full_name: string;
  email: string;
}

export interface PartnerAcademicInfo {
  branch: string;
  division: string;
  roll_number: number;
  slot: number;
  books_owned: string[];
  books_required: string[];
}

export interface ExchangeMatchDetails {
  match: ExchangeMatch;
  partner: PartnerProfile;
  partnerAcademic: PartnerAcademicInfo;
  timeSlot: ExchangeTimeSlot | null;
  location: ExchangeLocation | null;
  isStudent1: boolean;
}

export const useExchangeMatch = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exchange-match', user?.id],
    queryFn: async (): Promise<ExchangeMatchDetails | null> => {
      if (!user) return null;

      // Get current semester
      const { data: semesterData, error: semesterError } = await supabase
        .rpc('get_current_semester');

      if (semesterError) throw semesterError;
      const { semester, academic_year } = semesterData[0];

      // Find match for current user in current semester
      const { data: matches, error: matchError } = await supabase
        .from('exchange_matches')
        .select('*')
        .eq('semester', semester)
        .eq('academic_year', academic_year)
        .neq('match_status', 'cancelled')
        .or(`student_1_id.eq.${user.id},student_2_id.eq.${user.id}`);

      if (matchError) throw matchError;
      if (!matches || matches.length === 0) return null;

      const match = matches[0] as ExchangeMatch;
      const isStudent1 = match.student_1_id === user.id;
      const partnerId = isStudent1 ? match.student_2_id : match.student_1_id;

      // Get partner profile
      const { data: partnerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', partnerId)
        .single();

      if (profileError) throw profileError;

      // Get partner academic info
      const { data: partnerAcademic, error: academicError } = await supabase
        .from('student_academic_info')
        .select('branch, division, roll_number, slot, books_owned, books_required')
        .eq('user_id', partnerId)
        .single();

      if (academicError) throw academicError;

      // Get time slot if assigned
      let timeSlot: ExchangeTimeSlot | null = null;
      if (match.time_slot_id) {
        const { data: slotData } = await supabase
          .from('exchange_time_slots')
          .select('id, date, period, start_time, end_time, location_id')
          .eq('id', match.time_slot_id)
          .single();
        timeSlot = slotData as ExchangeTimeSlot;
      }

      // Get location if assigned
      let location: ExchangeLocation | null = null;
      if (match.location_id) {
        const { data: locationData } = await supabase
          .from('exchange_locations')
          .select('id, name, description')
          .eq('id', match.location_id)
          .single();
        location = locationData as ExchangeLocation;
      }

      return {
        match,
        partner: partnerProfile as PartnerProfile,
        partnerAcademic: partnerAcademic as PartnerAcademicInfo,
        timeSlot,
        location,
        isStudent1,
      };
    },
    enabled: !!user,
  });
};

export const useConfirmExchange = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the match to determine which student field to update
      const { data: match, error: fetchError } = await supabase
        .from('exchange_matches')
        .select('student_1_id, student_2_id, student_1_confirmed, student_2_confirmed')
        .eq('id', matchId)
        .single();

      if (fetchError) throw fetchError;

      const isStudent1 = match.student_1_id === user.id;
      const updateField = isStudent1 ? 'student_1_confirmed' : 'student_2_confirmed';
      const otherConfirmed = isStudent1 ? match.student_2_confirmed : match.student_1_confirmed;

      // Update confirmation
      const updateData: Record<string, boolean | string> = {
        [updateField]: true,
      };

      // If both will be confirmed, update status and confirmed_at
      if (otherConfirmed) {
        updateData.match_status = 'confirmed';
        updateData.confirmed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('exchange_matches')
        .update(updateData)
        .eq('id', matchId);

      if (updateError) throw updateError;

      // If both confirmed, update student exchange statuses
      if (otherConfirmed) {
        await supabase
          .from('student_academic_info')
          .update({ exchange_status: 'completed' })
          .in('user_id', [match.student_1_id, match.student_2_id]);
      }

      return { bothConfirmed: otherConfirmed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exchange-match'] });
      queryClient.invalidateQueries({ queryKey: ['student-academic-info'] });
      
      if (data.bothConfirmed) {
        toast.success('Exchange confirmed by both students! Status updated to Completed.');
      } else {
        toast.success('You have confirmed the exchange. Waiting for your partner to confirm.');
      }
    },
    onError: (error) => {
      toast.error('Failed to confirm exchange: ' + error.message);
    },
  });
};
