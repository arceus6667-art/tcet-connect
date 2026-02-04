import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, useProfile } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { GraduationCap, User, BookOpen, Shield } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!roleLoading && !profileLoading && profile && userRole) {
      // User has completed onboarding, redirect based on role
      redirectBasedOnRole(userRole.role);
    }
  }, [authLoading, user, roleLoading, profileLoading, profile, userRole, navigate]);

  const redirectBasedOnRole = (role: AppRole) => {
    switch (role) {
      case 'student':
        navigate('/student/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    // Validate TCET email domain
    const email = user.email || '';
    if (!email.endsWith('@tcetmumbai.in')) {
      toast.error('Only @tcetmumbai.in email addresses are allowed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if trying to register as admin
      if (selectedRole === 'admin') {
        const { data: isApproved } = await supabase
          .rpc('is_approved_admin_email', { _email: email });
        
        if (!isApproved) {
          toast.error('Your email is not pre-approved for admin access. Please contact the administrator.');
          setIsSubmitting(false);
          return;
        }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          email: email,
          profile_completed: true,
        });

      if (profileError) {
        if (profileError.code === '23505') {
          toast.error('Profile already exists');
        } else {
          throw profileError;
        }
      }

      // Create user role
      const isAutoApproved = selectedRole !== 'admin';
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole,
          is_approved: isAutoApproved || selectedRole === 'admin', // Admins with pre-approved emails are auto-approved
        });

      if (roleError) {
        if (roleError.code === '23505') {
          toast.error('Role already assigned');
        } else {
          throw roleError;
        }
      }

      toast.success('Profile created successfully!');
      
      // Redirect based on role
      if (selectedRole === 'student') {
        navigate('/student/academic-profile');
      } else {
        redirectBasedOnRole(selectedRole);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription className="text-base">
            Welcome to TCET Book Exchange! Please complete your profile to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Official TCET G-Suite Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Select Your Role</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as AppRole)}
                className="grid gap-3"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="flex items-center gap-3 cursor-pointer flex-1">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Student</p>
                      <p className="text-sm text-muted-foreground">Access student dashboard and book exchange</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="flex items-center gap-3 cursor-pointer flex-1">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Teacher</p>
                      <p className="text-sm text-muted-foreground">Access teacher dashboard and manage classes</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-sm text-muted-foreground">Requires pre-approved admin credentials</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Profile...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
