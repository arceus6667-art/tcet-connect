import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAcademicInfo } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GraduationCap, BookOpen, Info, ArrowLeft } from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

const SLOT_1_CLASSES = [
  'COMP-A', 'COMP-B', 'COMP-C', 'COMP-D',
  'CSC-A', 'CSC-B', 'CSC-C',
  'AIDS-A', 'AIDS-B', 'AIDS-C', 'AIDS-D',
  'CSC-IOT-A', 'CSC-IOT-B',
  'MME-A'
];

const SLOT_2_CLASSES = [
  'AIML-A', 'AIML-B', 'AIML-C', 'AIML-D',
  'IT-A', 'IT-B', 'IT-C', 'IT-D',
  'MECH-A'
];

const ALL_CLASSES = [
  ...SLOT_1_CLASSES.map(c => ({ value: c, slot: 1 })),
  ...SLOT_2_CLASSES.map(c => ({ value: c, slot: 2 }))
];

const slot1Books = [
  'Engineering Mechanics',
  'Chemistry',
  'Programming for Problem Solving (PPS)',
  'Indian Knowledge System (IKS)',
];

const slot2Books = [
  'Physics',
  'Basic Electrical Engineering (BEE)',
  'Engineering Graphics & Design (EGD)',
  'English – General & Professional Communication',
];

const AcademicProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: academicInfo, isLoading: academicLoading } = useStudentAcademicInfo();

  const [selectedClass, setSelectedClass] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview of slot and books based on selected class
  const selectedClassInfo = ALL_CLASSES.find(c => c.value === selectedClass);
  const previewSlot = selectedClassInfo?.slot || null;
  const previewBooksOwned = previewSlot === 1 ? slot1Books : previewSlot === 2 ? slot2Books : [];
  const previewBooksRequired = previewSlot === 1 ? slot2Books : previewSlot === 2 ? slot1Books : [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!academicLoading && academicInfo) {
      navigate('/student/dashboard');
    }
  }, [authLoading, user, academicLoading, academicInfo, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!selectedClass || !rollNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    const rollNum = parseInt(rollNumber);
    if (isNaN(rollNum) || rollNum < 1 || rollNum > 63) {
      toast.error('Roll number must be between 1 and 63');
      return;
    }

    const classInfo = ALL_CLASSES.find(c => c.value === selectedClass);
    if (!classInfo) {
      toast.error('Invalid class selected');
      return;
    }

    setIsSubmitting(true);

    try {
      const slot = classInfo.slot;
      const booksOwned = slot === 1 ? slot1Books : slot2Books;
      const booksRequired = slot === 1 ? slot2Books : slot1Books;

      // Extract branch from class (e.g., "COMP-A" -> "CS", "AIDS-A" -> "AIDS")
      const classPrefix = selectedClass.split('-')[0];
      const branchMap: Record<string, 'CS' | 'IT' | 'EXTC' | 'MECH' | 'CIVIL' | 'AIDS' | 'AIML'> = {
        'COMP': 'CS', 'CSC': 'CS', 'CSC-IOT': 'CS',
        'AIDS': 'AIDS', 'AIML': 'AIML', 'IT': 'IT',
        'MECH': 'MECH', 'MME': 'MECH'
      };
      const branch = branchMap[classPrefix] || 'CS';
      const division = selectedClass.split('-').pop() || 'A';

      const { error } = await supabase
        .from('student_academic_info')
        .insert({
          user_id: user.id,
          branch,
          division,
          roll_number: rollNum,
          slot,
          books_owned: booksOwned,
          books_required: booksRequired,
          exchange_status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Academic profile already exists');
        } else {
          throw error;
        }
      } else {
        toast.success('Academic profile saved successfully!');
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Error saving academic profile:', error);
      toast.error('Failed to save academic profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || academicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <AnimatedBackground />

      {/* Back button */}
      <div className="relative z-10 max-w-4xl mx-auto pt-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6 pb-8 animate-fade-in">
        <Card className="glass-card shadow-2xl border-0 overflow-hidden">
          {/* Gradient top border */}
          <div className="h-1 w-full animated-gradient-bg" />

          <CardHeader className="text-center space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">Academic Profile</CardTitle>
            <CardDescription className="text-base">
              Enter your academic details to determine your book slot assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class" className="text-sm font-medium">Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select your class" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Slot 1 Classes</div>
                      {SLOT_1_CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Slot 2 Classes</div>
                      {SLOT_2_CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNumber" className="text-sm font-medium">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    type="number"
                    min="1"
                    max="63"
                    placeholder="Enter roll number (1-63)"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              {previewSlot && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Info className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-medium">
                      Based on your roll number, you are assigned to <span className="text-gradient font-bold">Slot {previewSlot}</span>
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-4 bg-success/5 border border-success/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-success" />
                        <p className="font-medium text-success">Books You Own</p>
                      </div>
                      <ul className="text-sm space-y-2">
                        {previewBooksOwned.map((book) => (
                          <li key={book} className="flex items-start gap-2 text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                            {book}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 p-4 bg-warning/5 border border-warning/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-warning" />
                        <p className="font-medium text-warning">Books You Require</p>
                      </div>
                      <ul className="text-sm space-y-2">
                        {previewBooksRequired.map((book) => (
                          <li key={book} className="flex items-start gap-2 text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                            {book}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-accent">Note:</strong> Maths 1 and Maths 2 are non-exchangeable and not included in the book exchange system.
                    </p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Academic Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcademicProfile;
