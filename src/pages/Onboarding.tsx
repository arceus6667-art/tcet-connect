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
import { GraduationCap, User, BookOpen, Shield, AlertCircle } from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import type { AppRole } from '@/hooks/useUserRole';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApprovedAdmin, setIsApprovedAdmin] = useState(false);

  const isTCETEmail = email.endsWith('@tcetmumbai.in');
  
  // Check if email is an approved admin email
  useEffect(() => {
    const checkApprovedAdmin = async () => {
      if (!email) {
        setIsApprovedAdmin(false);
        return;
      }
      
      const { data } = await supabase.rpc('is_approved_admin_email', { _email: email });
      setIsApprovedAdmin(!!data);
    };
    
    checkApprovedAdmin();
  }, [email]);
  
  // Allow registration if TCET email OR approved admin email
  const canRegister = isTCETEmail || isApprovedAdmin;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // Set email from user if not already set
    if (user?.email && !email) {
      setEmail(user.email);
    }

    if (!roleLoading && !profileLoading && profile && userRole) {
      // User has completed onboarding, redirect based on role
      redirectBasedOnRole(userRole.role);
    }
  }, [authLoading, user, roleLoading, profileLoading, profile, userRole, navigate, email]);

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

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate TCET email domain OR approved admin email
    if (!canRegister) {
      toast.error('Only @tcetmumbai.in email addresses or pre-approved admin emails are allowed to register');
      return;
    }
    
    // If not a TCET email but trying to register as student/teacher, block it
    if (!isTCETEmail && selectedRole !== 'admin') {
      toast.error('Non-TCET emails can only register as Admin (if pre-approved)');
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
          email: email.trim(),
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
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-20 w-24 h-24 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <Card className="glass-card shadow-2xl border-0 overflow-hidden">
          {/* Gradient top border */}
          <div className="h-1 w-full animated-gradient-bg" />

          <CardHeader className="text-center space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">Complete Your Profile</CardTitle>
            <CardDescription className="text-base">
              Welcome to TCET Book Exchange! Please complete your profile to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            {/* Email Validation Notice */}
            {!isTCETEmail && !isApprovedAdmin && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Invalid Email Domain</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only <strong>@tcetmumbai.in</strong> email addresses are allowed to register. 
                    Pre-approved admin emails can also register as Admin.
                  </p>
                </div>
              </div>
            )}
            
            {/* Approved Admin Notice */}
            {isApprovedAdmin && !isTCETEmail && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
                <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-success">Pre-Approved Admin Email</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This email is pre-approved for admin access. Please select <strong>Admin</strong> role below.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Official TCET G-Suite Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@tcetmumbai.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 ${!isTCETEmail && email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {isTCETEmail && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Valid TCET email
                  </p>
                )}
                {isApprovedAdmin && !isTCETEmail && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Pre-approved admin email
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={!canRegister}
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Your Role</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as AppRole)}
                  className="grid gap-3"
                  disabled={!canRegister}
                >
                  <div className={`flex items-center space-x-3 p-4 border rounded-xl hover:bg-primary/5 cursor-pointer transition-all ${selectedRole === 'student' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}>
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Student</p>
                        <p className="text-sm text-muted-foreground">Access book exchange & revision materials</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 p-4 border rounded-xl hover:bg-secondary/5 cursor-pointer transition-all ${selectedRole === 'teacher' ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-border'}`}>
                    <RadioGroupItem value="teacher" id="teacher" />
                    <Label htmlFor="teacher" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Teacher</p>
                        <p className="text-sm text-muted-foreground">Upload & manage revision content</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 p-4 border rounded-xl hover:bg-accent/5 cursor-pointer transition-all ${selectedRole === 'admin' ? 'border-accent bg-accent/5 shadow-sm' : 'border-border'}`}>
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Admin</p>
                        <p className="text-sm text-muted-foreground">Requires pre-approved credentials</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg" 
                disabled={isSubmitting || !canRegister}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating Profile...
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
