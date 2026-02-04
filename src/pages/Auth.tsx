import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovableClient } from '@/lib/lovable-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/onboarding');
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovableClient.auth.signInWithOAuth('google', {
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

  if (loading) {
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
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Card className="glass-card shadow-2xl border-0 overflow-hidden">
          {/* Gradient top border */}
          <div className="h-1 w-full animated-gradient-bg" />
          
          <CardHeader className="text-center space-y-6 pt-8 pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg glow-primary transform hover:scale-105 transition-transform">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gradient">
                TCET Book Exchange
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Connect with fellow students and exchange textbooks seamlessly
              </CardDescription>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground text-center">Smart Matching</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                <Sparkles className="w-5 h-5 text-secondary" />
                <span className="text-xs text-muted-foreground text-center">One-Shot Revision</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                <ArrowRight className="w-5 h-5 text-accent" />
                <span className="text-xs text-muted-foreground text-center">Easy Exchange</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-14 text-base gap-3 bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 transition-opacity shadow-lg glow-primary"
              size="lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Continue with Google'
              )}
            </Button>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in with any Google account to get started
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-8 h-px bg-border" />
                <span>Thakur College of Engineering and Technology</span>
                <div className="w-8 h-px bg-border" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
