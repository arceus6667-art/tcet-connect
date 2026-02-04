import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogOut, Users, Settings, BarChart3, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

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
          <p className="text-muted-foreground">Manage users, view analytics, and configure system settings.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

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
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system usage and exchange statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Settings className="w-8 h-8 text-primary mb-2" />
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
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
