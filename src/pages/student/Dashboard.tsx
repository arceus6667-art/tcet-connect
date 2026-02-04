import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useStudentAcademicInfo, useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  GraduationCap, 
  BookOpen, 
  User, 
  LogOut, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeftRight 
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: academicInfo, isLoading: academicLoading } = useStudentAcademicInfo();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!roleLoading && userRole && userRole.role !== 'student') {
      // Redirect to appropriate dashboard
      navigate(userRole.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard');
      return;
    }

    if (!academicLoading && !academicInfo && user) {
      // Academic profile not completed
      navigate('/student/academic-profile');
    }
  }, [authLoading, user, academicLoading, academicInfo, roleLoading, userRole, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isLoading = authLoading || profileLoading || academicLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'requested':
        return <Badge variant="outline" className="gap-1"><ArrowLeftRight className="w-3 h-3" /> Requested</Badge>;
      case 'matched':
        return <Badge className="gap-1 bg-blue-500"><CheckCircle className="w-3 h-3" /> Matched</Badge>;
      case 'completed':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TCET Book Exchange</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
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
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}!</h2>
          <p className="text-muted-foreground">Here's your book exchange status and information.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Slot Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">Slot {academicInfo?.slot}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Roll No: {academicInfo?.roll_number}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Academic Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{academicInfo?.branch}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Division {academicInfo?.division}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exchange Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusBadge(academicInfo?.exchange_status || 'pending')}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your current exchange request status
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Books Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                <CardTitle>Books You Own</CardTitle>
              </div>
              <CardDescription>
                These are the books assigned to Slot {academicInfo?.slot} students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {academicInfo?.books_owned?.map((book, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{book}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                <CardTitle>Books You Need</CardTitle>
              </div>
              <CardDescription>
                These books are available from Slot {academicInfo?.slot === 1 ? 2 : 1} students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {academicInfo?.books_required?.map((book, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{book}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-800 dark:text-yellow-200">
            <ul className="space-y-2 list-disc pl-5">
              <li><strong>Maths 1 and Maths 2</strong> are non-exchangeable and must be purchased separately.</li>
              <li>Book ownership is determined by your roll number and cannot be manually changed.</li>
              <li>Your exchange status will be updated by the administration.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>Your Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile?.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-medium">{academicInfo?.branch}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Division</p>
                <p className="font-medium">Division {academicInfo?.division}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium">{academicInfo?.roll_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Slot</p>
                <p className="font-medium">Slot {academicInfo?.slot}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
