import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAnalytics, useSystemSettings } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, Users, BarChart3, ArrowLeftRight, Play, RefreshCw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import AdminUsersPage from '@/components/admin/AdminUsersPage';
import AdminExchangesPage from '@/components/admin/AdminExchangesPage';
import AdminAnalyticsPage from '@/components/admin/AdminAnalyticsPage';
import AdminContentPage from '@/components/admin/AdminContentPage';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: analytics } = useAdminAnalytics();
  const { data: settings } = useSystemSettings();
  
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const matchingEnabled = settings?.find(s => s.key === 'matching_engine_enabled')?.value === 'true';

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
    if (!matchingEnabled) {
      toast.error('Matching engine is paused. Enable it first to run.');
      return;
    }

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
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
        queryClient.invalidateQueries({ queryKey: ['admin-all-matches'] });

        // Log the action
        await supabase.rpc('log_admin_action', {
          _action_type: 'MATCHING_ENGINE_RUN',
          _action_description: `Matching engine executed: ${result.matches_created} matches created`,
          _metadata: JSON.stringify(result),
        });

        queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Admin Dashboard</h2>
              <p className="text-muted-foreground">Manage users, exchanges, and system settings</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={matchingEnabled ? 'default' : 'secondary'} className="gap-1">
                {matchingEnabled ? 'Engine Active' : 'Engine Paused'}
              </Badge>
              <Button 
                onClick={runMatchingEngine} 
                disabled={isRunningEngine || !matchingEnabled}
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
                    Run Matching
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="exchanges" className="gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">Exchanges</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics?.totalStudents || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics?.pendingStudents || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics?.matchedStudents || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics?.completedExchanges || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveTab('users')}
              >
                <CardHeader>
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all registered users, roles, and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Manage Users</Button>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveTab('exchanges')}
              >
                <CardHeader>
                  <ArrowLeftRight className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Exchange Management</CardTitle>
                  <CardDescription>View, approve, or cancel exchange matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Manage Exchanges</Button>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveTab('analytics')}
              >
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Analytics & Logs</CardTitle>
                  <CardDescription>View statistics, charts, and admin action logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">View Analytics</Button>
                </CardContent>
              </Card>
            </div>

            {/* Slot Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Slot Distribution</CardTitle>
                <CardDescription>Current student distribution across slots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Slot 1 (Odd Roll Numbers)</span>
                      <Badge variant="outline">{analytics?.slot1Students || 0} students</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Engineering Mechanics, Chemistry, PPS, IKS
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Slot 2 (Even Roll Numbers)</span>
                      <Badge variant="outline">{analytics?.slot2Students || 0} students</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Physics, BEE, EGD, English
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUsersPage />
          </TabsContent>

          {/* Exchanges Tab */}
          <TabsContent value="exchanges">
            <AdminExchangesPage />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <AdminContentPage />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalyticsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
