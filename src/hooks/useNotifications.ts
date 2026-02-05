 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface Notification {
   id: string;
   user_id: string;
   title: string;
   message: string;
   type: string;
   is_read: boolean;
   match_id: string | null;
   created_at: string;
   read_at: string | null;
 }
 
 export const useNotifications = () => {
   const { user } = useAuth();
 
   return useQuery({
     queryKey: ['notifications', user?.id],
     queryFn: async (): Promise<Notification[]> => {
       if (!user) return [];
 
       const { data, error } = await supabase
         .from('notifications')
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false })
         .limit(50);
 
       if (error) throw error;
       return data || [];
     },
     enabled: !!user,
   });
 };
 
 export const useUnreadCount = () => {
   const { user } = useAuth();
 
   return useQuery({
     queryKey: ['notifications-unread-count', user?.id],
     queryFn: async (): Promise<number> => {
       if (!user) return 0;
 
       const { count, error } = await supabase
         .from('notifications')
         .select('*', { count: 'exact', head: true })
         .eq('user_id', user.id)
         .eq('is_read', false);
 
       if (error) throw error;
       return count || 0;
     },
     enabled: !!user,
   });
 };
 
 export const useMarkAsRead = () => {
   const queryClient = useQueryClient();
   const { user } = useAuth();
 
   return useMutation({
     mutationFn: async (notificationId: string) => {
       const { error } = await supabase
         .from('notifications')
         .update({ is_read: true, read_at: new Date().toISOString() })
         .eq('id', notificationId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
       queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
     },
   });
 };
 
 export const useMarkAllAsRead = () => {
   const queryClient = useQueryClient();
   const { user } = useAuth();
 
   return useMutation({
     mutationFn: async () => {
       if (!user) return;
 
       const { error } = await supabase
         .from('notifications')
         .update({ is_read: true, read_at: new Date().toISOString() })
         .eq('user_id', user.id)
         .eq('is_read', false);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
       queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
     },
   });
 };