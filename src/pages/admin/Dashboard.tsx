import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, Users, Settings, BarChart3, UserCheck, Play, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MatchStats {
  total_students: number;
  pending_students: number;
  matched_students: number;
  completed_exchanges: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<MatchStats> => {
      // Get total students
      const { count: totalStudents } = await supabase
        .from('student_academic_info')
        .select('*', { count: 'exact', head: true });

      // Get pending students
      const { count: pendingStudents } = await supabase
        .from('student_academic_info')
        .select('*', { count: 'exact', head: true })
        .eq('exchange_status', 'pending');

      // Get matched students
      const { count: matchedStudents } = await supabase
        .from('student_academic_info')
        .select('*', { count: 'exact', head: true })
        .eq('exchange_status', 'matched');

      // Get completed exchanges
      const { count: completedExchanges } = await supabase
        .from('exchange_matches')
        .select('*', { count: 'exact', head: true })
        .eq('match_status', 'completed');

      return {
        total_students: totalStudents || 0,
        pending_students: pendingStudents || 0,
        matched_students: matchedStudents || 0,
        completed_exchanges: completedExchanges || 0,
      };
    },
    enabled: !!userRole && userRole.role === 'admin',
  });

  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches'],
    queryFn: async () => {
      const { data } = await supabase
        .from('exchange_matches')
        .select(`
          id,
          match_status,
          matched_at,
          semester,
          academic_year
        `)
        .order('matched_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!userRole && userRole.role === 'admin',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!roleLoading && userRole && userRole.role !== 'admin') {
      navigate(userRole.role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
    }
  }, [authLoading, user, roleLoading, userRole, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const runMatchingEngine = async () => {
    setIsRunningEngine(true);
    try {
      const response = await supabase.functions.invoke('run-matching-engine');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.success) {
        toast.success(`Matching complete! ${result.matches_created} new matches created.`);
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-matches'] });
      } else {
        toast.error('Matching failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error running matching engine:', error);
      toast.error('Failed to run matching engine');
    } finally {
      setIsRunningEngine(false);
    }
  };

  const isLoading = authLoading || profileLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TCET Book Exchange</h1>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage users, run matching engine, and view analytics.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.total_students || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.pending_students || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Matched</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.matched_students || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Exchanges</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.completed_exchanges || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Matching Engine Control */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Matching Engine
                </CardTitle>
                <CardDescription>
                  Scan for compatible Slot 1 and Slot 2 students and create matches automatically
                </CardDescription>
              </div>
              <Button 
                onClick={runMatchingEngine} 
                disabled={isRunningEngine}
                size="lg"
                className="gap-2"
              >
                {isRunningEngine ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Matching Engine
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Matching Logic</p>
                <p className="font-medium">Slot 1 ↔ Slot 2 pairing</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Priority</p>
                <p className="font-medium">Same branch/division first</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Constraint</p>
                <p className="font-medium">One match per student per semester</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Latest exchange matches created by the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMatches && recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Match #{match.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {match.semester} semester, {match.academic_year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={match.match_status === 'completed' ? 'default' : 'secondary'}>
                        {match.match_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.matched_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No matches created yet</p>
            )}
          </CardContent>
        </Card>

        {/* Admin Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <UserCheck className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Role Approvals</CardTitle>
              <CardDescription>Approve or reject pending role requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Settings className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Time Slots</CardTitle>
              <CardDescription>Manage exchange time slots and locations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
