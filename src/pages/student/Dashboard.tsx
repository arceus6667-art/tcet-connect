import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useStudentAcademicInfo, useUserRole } from '@/hooks/useUserRole';
import { useExchangeMatch, useConfirmExchange } from '@/hooks/useExchangeMatch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeftRight,
  MapPin,
  Calendar,
  UserCheck,
  Mail,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import RevisionContentViewer from '@/components/student/RevisionContentViewer';
import ExchangeChat from '@/components/student/ExchangeChat';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import NotificationBell from '@/components/student/NotificationBell';
import tcetLogo from '@/assets/tcet-logo.png';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: academicInfo, isLoading: academicLoading } = useStudentAcademicInfo();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: exchangeMatch, isLoading: matchLoading } = useExchangeMatch();
  const confirmExchange = useConfirmExchange();
  const [activeTab, setActiveTab] = useState('exchange');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!roleLoading && userRole && userRole.role !== 'student') {
      navigate(userRole.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard');
      return;
    }

    if (!academicLoading && !academicInfo && user) {
      navigate('/student/academic-profile');
    }
  }, [authLoading, user, academicLoading, academicInfo, roleLoading, userRole, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleConfirmExchange = () => {
    if (exchangeMatch?.match.id) {
      confirmExchange.mutate(exchangeMatch.match.id);
    }
  };

  const isLoading = authLoading || profileLoading || academicLoading || roleLoading || matchLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
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
        return <Badge className="gap-1 bg-blue-500"><UserCheck className="w-3 h-3" /> Matched</Badge>;
      case 'confirmed':
        return <Badge className="gap-1 bg-purple-500"><CheckCircle className="w-3 h-3" /> Confirmed</Badge>;
      case 'completed':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasConfirmed = exchangeMatch?.isStudent1 
    ? exchangeMatch.match.student_1_confirmed 
    : exchangeMatch?.match.student_2_confirmed;

  const partnerHasConfirmed = exchangeMatch?.isStudent1 
    ? exchangeMatch.match.student_2_confirmed 
    : exchangeMatch?.match.student_1_confirmed;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-lg">
              <img src={tcetLogo} alt="TCET Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gradient">TCET Book Exchange</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut} className="rounded-xl">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}!</h2>
              <p className="text-muted-foreground">Manage your book exchange and access revision materials</p>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="exchange" className="gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Book Exchange</span>
            </TabsTrigger>
            <TabsTrigger value="revision" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span>One-Shot Revision</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exchange" className="space-y-6">
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
                {exchangeMatch ? 'You have been matched!' : 'Waiting for a match...'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exchange Match Details */}
        {exchangeMatch && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-primary" />
                  <CardTitle>Exchange Partner Found!</CardTitle>
                </div>
                {getStatusBadge(exchangeMatch.match.match_status)}
              </div>
              <CardDescription>
                You have been matched with a Slot {exchangeMatch.partnerAcademic.slot} student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Partner Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Partner Details
                  </h4>
                  <div className="space-y-2 bg-background p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{exchangeMatch.partner.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${exchangeMatch.partner.email}`} className="text-primary hover:underline">
                        {exchangeMatch.partner.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Branch:</span>
                      <span>{exchangeMatch.partnerAcademic.branch} - Division {exchangeMatch.partnerAcademic.division}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Roll No:</span>
                      <span>{exchangeMatch.partnerAcademic.roll_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Slot:</span>
                      <Badge variant="outline">Slot {exchangeMatch.partnerAcademic.slot}</Badge>
                    </div>
                  </div>
                </div>

                {/* Time Slot & Location */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Exchange Schedule
                  </h4>
                  <div className="space-y-2 bg-background p-4 rounded-lg">
                    {exchangeMatch.timeSlot ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(exchangeMatch.timeSlot.date), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {exchangeMatch.timeSlot.start_time.slice(0, 5)} - {exchangeMatch.timeSlot.end_time.slice(0, 5)}
                          </span>
                          <Badge variant="secondary" className="capitalize">
                            {exchangeMatch.timeSlot.period}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Time slot not assigned yet</p>
                    )}
                    
                    {exchangeMatch.location && (
                      <div className="flex items-start gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{exchangeMatch.location.name}</p>
                          <p className="text-sm text-muted-foreground">{exchangeMatch.location.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Books to Exchange */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">
                    Books You Will Give
                  </h5>
                  <ul className="text-sm space-y-1">
                    {academicInfo?.books_owned?.map((book, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ArrowLeftRight className="w-3 h-3" />
                        {book}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Books You Will Receive
                  </h5>
                  <ul className="text-sm space-y-1">
                    {exchangeMatch.partnerAcademic.books_owned?.map((book, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ArrowLeftRight className="w-3 h-3" />
                        {book}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confirmation Status */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">Confirmation Status</p>
                  <div className="flex gap-4 text-sm">
                    <span className={hasConfirmed ? 'text-green-600' : 'text-muted-foreground'}>
                      You: {hasConfirmed ? '✓ Confirmed' : 'Not confirmed'}
                    </span>
                    <span className={partnerHasConfirmed ? 'text-green-600' : 'text-muted-foreground'}>
                      Partner: {partnerHasConfirmed ? '✓ Confirmed' : 'Not confirmed'}
                    </span>
                  </div>
                </div>
                
                {exchangeMatch.match.match_status === 'matched' && !hasConfirmed && (
                  <Button 
                    onClick={handleConfirmExchange}
                    disabled={confirmExchange.isPending}
                  >
                    {confirmExchange.isPending ? 'Confirming...' : 'Confirm Exchange'}
                  </Button>
                )}
                
                {exchangeMatch.match.match_status === 'confirmed' && (
                  <Badge className="bg-purple-500">Awaiting Admin Approval</Badge>
                )}
                
                {exchangeMatch.match.match_status === 'completed' && (
                  <Badge className="bg-green-500">Exchange Completed!</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat with Exchange Partner */}
        {exchangeMatch && (
          <ExchangeChat
            matchId={exchangeMatch.match.id}
            partnerId={exchangeMatch.isStudent1 ? exchangeMatch.match.student_2_id : exchangeMatch.match.student_1_id}
            partnerName={exchangeMatch.partner.full_name}
            partnerEmail={exchangeMatch.partner.email}
          />
        )}

        {/* No Match Yet */}
        {!exchangeMatch && academicInfo?.exchange_status === 'pending' && (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle>Waiting for Match</CardTitle>
              <CardDescription>
                The system is scanning for compatible exchange partners. You'll be notified when a match is found.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

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
              <li>You can only be matched once per semester.</li>
              <li>Both students must confirm the exchange for it to be completed.</li>
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
          </TabsContent>

          <TabsContent value="revision">
            <RevisionContentViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
