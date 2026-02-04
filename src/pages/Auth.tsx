import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, Sparkles, BookOpen, ArrowRight, Mail, Lock, Wand2 } from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Magic Link state
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/onboarding');
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/onboarding',
      });

      if (error) {
        toast.error('Failed to sign in with Google');
        console.error(error);
      }
    } catch (error) {
      toast.error('An error occurred during sign in');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin + '/onboarding',
      });

      if (error) {
        toast.error('Failed to sign in with Apple');
        console.error(error);
      }
    } catch (error) {
      toast.error('An error occurred during sign in');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/onboarding',
          },
        });

        if (error) throw error;
        toast.success('Check your email to verify your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate('/onboarding');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!magicLinkEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo: window.location.origin + '/onboarding',
        },
      });

      if (error) throw error;
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email or enter the OTP below.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: magicLinkEmail,
        token: otpValue,
        type: 'email',
      });

      if (error) throw error;
      toast.success('Verified successfully!');
      navigate('/onboarding');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Floating decorative elements - hidden on small screens */}
      <div className="hidden sm:block absolute top-20 left-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/20 rounded-full blur-2xl animate-pulse" />
      <div className="hidden sm:block absolute bottom-32 right-16 w-24 sm:w-32 h-24 sm:h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="hidden md:block absolute top-1/3 right-1/4 w-16 h-16 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Card className="glass-card shadow-2xl border-0 overflow-hidden">
          {/* Gradient top border */}
          <div className="h-1 w-full animated-gradient-bg" />
          
          <CardHeader className="text-center space-y-4 sm:space-y-6 pt-6 sm:pt-8 pb-2 sm:pb-4 px-4 sm:px-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg glow-primary transform hover:scale-105 transition-transform">
              <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gradient">
                TCET Book Exchange
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
                Connect with fellow students and exchange textbooks seamlessly
              </CardDescription>
            </div>

            {/* Feature highlights - responsive grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 sm:pt-4">
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">Smart Matching</span>
              </div>
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">One-Shot Revision</span>
              </div>
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">Easy Exchange</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6">
            <Tabs defaultValue="social" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="social" className="text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">Social</TabsTrigger>
                <TabsTrigger value="email" className="text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">Email</TabsTrigger>
                <TabsTrigger value="magic" className="text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">Magic Link</TabsTrigger>
              </TabsList>

              {/* Social Login Tab */}
              <TabsContent value="social" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base gap-2 sm:gap-3 bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
                  size="lg"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>

                <Button
                  onClick={handleAppleSignIn}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 sm:h-14 text-sm sm:text-base gap-2 sm:gap-3 border-2 hover:bg-muted/50 transition-colors"
                  size="lg"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Continue with Apple'}
                </Button>
              </TabsContent>

              {/* Email/Password Tab */}
              <TabsContent value="email" className="space-y-4 mt-4 sm:mt-6">
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={authMode === 'login' ? 'default' : 'ghost'}
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => setAuthMode('login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === 'signup' ? 'default' : 'ghost'}
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign Up
                  </Button>
                </div>

                <form onSubmit={handleEmailPasswordAuth} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {isLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>

                {authMode === 'signup' && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    You'll receive a verification email to confirm your account
                  </p>
                )}
              </TabsContent>

              {/* Magic Link Tab */}
              <TabsContent value="magic" className="space-y-4 mt-4 sm:mt-6">
                {!magicLinkSent ? (
                  <form onSubmit={handleMagicLink} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="magicEmail" className="text-xs sm:text-sm">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="magicEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 sm:h-12 text-sm sm:text-base gap-2 bg-gradient-to-r from-secondary to-primary"
                    >
                      <Wand2 className="w-4 h-4" />
                      {isLoading ? 'Sending...' : 'Send Magic Link'}
                    </Button>

                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      We'll send you a one-time login link to your email
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4 sm:space-y-6 text-center">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <p className="text-sm sm:text-base font-medium">Check your email!</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        We sent a login link to <span className="font-medium text-foreground">{magicLinkEmail}</span>
                      </p>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm text-muted-foreground">Or enter the 6-digit code:</p>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otpValue}
                          onChange={setOtpValue}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otpValue.length !== 6}
                        className="w-full h-10 sm:h-11 text-sm sm:text-base"
                      >
                        {isLoading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setOtpValue('');
                      }}
                    >
                      Use different email
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="text-center pt-2 sm:pt-4">
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <div className="w-6 sm:w-8 h-px bg-border" />
                <span className="text-center">Thakur College of Engineering and Technology</span>
                <div className="w-6 sm:w-8 h-px bg-border" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
