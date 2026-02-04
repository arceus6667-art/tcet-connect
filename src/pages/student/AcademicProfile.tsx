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
import { GraduationCap, BookOpen, Info } from 'lucide-react';

const BRANCHES = [
  { value: 'CS', label: 'Computer Science (CS)' },
  { value: 'IT', label: 'Information Technology (IT)' },
  { value: 'EXTC', label: 'Electronics & Telecommunication (EXTC)' },
  { value: 'MECH', label: 'Mechanical Engineering (MECH)' },
  { value: 'CIVIL', label: 'Civil Engineering (CIVIL)' },
  { value: 'AIDS', label: 'AI & Data Science (AIDS)' },
  { value: 'AIML', label: 'AI & Machine Learning (AIML)' },
];

const DIVISIONS = ['A', 'B', 'C', 'D'];

const AcademicProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: academicInfo, isLoading: academicLoading } = useStudentAcademicInfo();

  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview of slot and books
  const rollNum = parseInt(rollNumber) || 0;
  const previewSlot = rollNum > 0 ? (rollNum % 2 === 1 ? 1 : 2) : null;

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

  const previewBooksOwned = previewSlot === 1 ? slot1Books : previewSlot === 2 ? slot2Books : [];
  const previewBooksRequired = previewSlot === 1 ? slot2Books : previewSlot === 2 ? slot1Books : [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!academicLoading && academicInfo) {
      // Already has academic info, redirect to dashboard
      navigate('/student/dashboard');
    }
  }, [authLoading, user, academicLoading, academicInfo, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!branch || !division || !rollNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    const rollNum = parseInt(rollNumber);
    if (isNaN(rollNum) || rollNum < 1 || rollNum > 100) {
      toast.error('Roll number must be between 1 and 100');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate slot (backend will also calculate via trigger, but we do it here for immediate feedback)
      const slot = rollNum % 2 === 1 ? 1 : 2;
      const booksOwned = slot === 1 ? slot1Books : slot2Books;
      const booksRequired = slot === 1 ? slot2Books : slot1Books;

      const { error } = await supabase
        .from('student_academic_info')
        .insert({
          user_id: user.id,
          branch: branch as 'CS' | 'IT' | 'EXTC' | 'MECH' | 'CIVIL' | 'AIDS' | 'AIML',
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

  if (authLoading || academicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Academic Profile</CardTitle>
            <CardDescription className="text-base">
              Enter your academic details to determine your book slot assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Select value={division} onValueChange={setDivision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          Division {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Enter roll number (1-100)"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              {previewSlot && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    <p className="font-medium">
                      Based on your roll number, you are assigned to <strong>Slot {previewSlot}</strong>
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <p className="font-medium text-green-600">Books You Own</p>
                      </div>
                      <ul className="text-sm space-y-1 pl-6">
                        {previewBooksOwned.map((book) => (
                          <li key={book} className="list-disc text-muted-foreground">
                            {book}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                        <p className="font-medium text-orange-600">Books You Require</p>
                      </div>
                      <ul className="text-sm space-y-1 pl-6">
                        {previewBooksRequired.map((book) => (
                          <li key={book} className="list-disc text-muted-foreground">
                            {book}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> Maths 1 and Maths 2 are non-exchangeable and not included in the book exchange system.
                    </p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Academic Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcademicProfile;
