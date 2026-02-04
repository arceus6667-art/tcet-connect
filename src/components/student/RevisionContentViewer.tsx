import { useState } from 'react';
import { 
  useApprovedContent, 
  useSubjects,
  useIncrementViewCount,
  type RevisionContent,
  type FlashcardData,
  type NotesData
} from '@/hooks/useRevisionContent';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  BookOpen, 
  FileText, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Eye,
  GraduationCap,
  Sparkles
} from 'lucide-react';

// Get student's slot
const useStudentSlot = () => {
  const { data: userRole } = useUserRole();
  
  return useQuery({
    queryKey: ['student-slot'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('student_academic_info')
        .select('slot')
        .eq('user_id', user.id)
        .single();
      
      return data?.slot || null;
    },
    enabled: userRole?.role === 'student',
  });
};

interface FlashcardViewerProps {
  cards: FlashcardData[];
}

const FlashcardViewer = ({ cards }: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const goNext = () => {
    setIsFlipped(false);
    setCurrentIndex(i => Math.min(i + 1, cards.length - 1));
  };

  const goPrev = () => {
    setIsFlipped(false);
    setCurrentIndex(i => Math.max(i - 1, 0));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <span>Click card to flip</span>
      </div>
      
      <div 
        className="relative h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className={`absolute inset-0 backface-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 flex items-center justify-center ${isFlipped ? 'invisible' : ''}`}>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Question</p>
              <p className="text-lg font-medium">{currentCard.front}</p>
            </div>
          </div>
          
          {/* Back */}
          <div className={`absolute inset-0 backface-hidden bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 rounded-xl p-6 flex items-center justify-center rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Answer</p>
              <p className="text-lg font-medium">{currentCard.back}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const RevisionContentViewer = () => {
  const { data: studentSlot } = useStudentSlot();
  const { data: subjects } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewingContent, setViewingContent] = useState<RevisionContent | null>(null);
  const incrementView = useIncrementViewCount();

  // Filter subjects by student's required slot (opposite of their owned books)
  const requiredSlot = studentSlot === 1 ? 2 : studentSlot === 2 ? 1 : null;
  const relevantSubjects = requiredSlot 
    ? subjects?.filter(s => s.slot === requiredSlot)
    : subjects;

  const { data: content, isLoading } = useApprovedContent(
    selectedSubject === 'all' ? undefined : selectedSubject,
    selectedType === 'all' ? undefined : selectedType
  );

  // Filter content by relevant subjects if student has a slot
  const filteredContent = requiredSlot && selectedSubject === 'all'
    ? content?.filter(c => c.subject?.slot === requiredSlot)
    : content;

  const handleViewContent = (item: RevisionContent) => {
    setViewingContent(item);
    incrementView.mutate(item.id);
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'notes': return <BookOpen className="w-4 h-4" />;
      case 'flashcard': return <Layers className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                One-Shot Revision
                <Badge variant="secondary">Phase 2</Badge>
              </CardTitle>
              <CardDescription>
                Quick revision materials to help you prepare for your exams
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {requiredSlot && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm bg-background/50 p-3 rounded-lg">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>
                Showing content for <strong>Slot {requiredSlot}</strong> subjects 
                (the books you need to receive)
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {(relevantSubjects || subjects)?.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="notes">Short Notes</SelectItem>
            <SelectItem value="flashcard">Flashcards</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading content...</div>
      ) : filteredContent?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No revision content available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Teachers are working on uploading materials. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent?.map(item => (
            <Card 
              key={item.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleViewContent(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                      {getContentTypeIcon(item.content_type)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.subject?.code || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    {item.view_count}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {item.content_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Slot {item.subject?.slot}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Viewer Dialog */}
      <Dialog open={!!viewingContent} onOpenChange={() => setViewingContent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingContent && getContentTypeIcon(viewingContent.content_type)}
              {viewingContent?.title}
            </DialogTitle>
            {viewingContent?.description && (
              <p className="text-sm text-muted-foreground">{viewingContent.description}</p>
            )}
          </DialogHeader>

          <div className="py-4">
            {viewingContent?.content_type === 'flashcard' && viewingContent.content_data && (
              <FlashcardViewer cards={viewingContent.content_data as FlashcardData[]} />
            )}

            {viewingContent?.content_type === 'notes' && viewingContent.content_data && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {(viewingContent.content_data as NotesData).content}
                </div>
              </div>
            )}

            {viewingContent?.content_type === 'pdf' && viewingContent.file_url && (
              <div className="text-center">
                <div className="p-8 bg-muted/50 rounded-lg mb-4">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">{viewingContent.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {viewingContent.file_size 
                      ? `${(viewingContent.file_size / 1024 / 1024).toFixed(2)} MB`
                      : 'PDF Document'}
                  </p>
                </div>
                <Button asChild>
                  <a href={viewingContent.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open PDF
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS for flashcard flip animation */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default RevisionContentViewer;
