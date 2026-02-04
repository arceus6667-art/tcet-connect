import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, useProfile } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (authLoading || roleLoading || profileLoading) return;

    if (user && profile && userRole) {
      // Redirect to appropriate dashboard
      switch (userRole.role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
      }
    } else if (user && !profile) {
      navigate('/onboarding');
    }
  }, [user, userRole, profile, authLoading, roleLoading, profileLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            TCET Book Exchange
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A seamless platform for Thakur College of Engineering and Technology students 
            to exchange course books based on slot assignments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Use your official TCET G-Suite ID to authenticate
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <CardTitle>Enter Details</CardTitle>
              <CardDescription>
                Provide your branch, division, and roll number
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <CardTitle>Exchange Books</CardTitle>
              <CardDescription>
                System determines your slot and books automatically
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Book Slots Info */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Book Slot System</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <CardTitle>Slot 1 (Odd Roll Numbers)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Engineering Mechanics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Chemistry
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Programming for Problem Solving (PPS)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Indian Knowledge System (IKS)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <CardTitle>Slot 2 (Even Roll Numbers)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Physics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Basic Electrical Engineering (BEE)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Engineering Graphics & Design (EGD)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  English – General & Professional Communication
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">
            <strong>Note:</strong> Maths 1 and Maths 2 are non-exchangeable and not part of this system.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            © 2024 Thakur College of Engineering and Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
