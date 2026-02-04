import { useState } from 'react';
import { 
  useTeacherContent, 
  useSubjects, 
  useCreateContent,
  useUpdateContent,
  useSubmitForApproval,
  useDeleteContent,
  type RevisionContent,
  type FlashcardData,
  type NotesData
} from '@/hooks/useRevisionContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  FileText, 
  BookOpen, 
  Layers, 
  Upload, 
  Edit, 
  Trash2, 
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

const ContentManager = () => {
  const { data: content, isLoading } = useTeacherContent();
  const { data: subjects } = useSubjects();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const submitForApproval = useSubmitForApproval();
  const deleteContent = useDeleteContent();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContent, setEditingContent] = useState<RevisionContent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    subject_id: '',
    title: '',
    description: '',
    content_type: 'notes' as 'pdf' | 'notes' | 'flashcard',
  });
  const [notesContent, setNotesContent] = useState('');
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([{ id: '1', front: '', back: '' }]);
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData({ subject_id: '', title: '', description: '', content_type: 'notes' });
    setNotesContent('');
    setFlashcards([{ id: '1', front: '', back: '' }]);
    setFile(null);
    setEditingContent(null);
  };

  const handleCreate = async () => {
    const contentData = 
      formData.content_type === 'notes' 
        ? { content: notesContent } as NotesData
        : formData.content_type === 'flashcard' 
          ? flashcards 
          : undefined;

    await createContent.mutateAsync({
      ...formData,
      content_data: contentData,
      file: file || undefined,
    });

    resetForm();
    setShowCreateDialog(false);
  };

  const handleUpdate = async () => {
    if (!editingContent) return;

    const contentData = 
      editingContent.content_type === 'notes' 
        ? { content: notesContent } as NotesData
        : editingContent.content_type === 'flashcard' 
          ? flashcards 
          : undefined;

    await updateContent.mutateAsync({
      id: editingContent.id,
      title: formData.title,
      description: formData.description,
      content_data: contentData,
      file: file || undefined,
    });

    resetForm();
  };

  const openEditDialog = (item: RevisionContent) => {
    setEditingContent(item);
    setFormData({
      subject_id: item.subject_id,
      title: item.title,
      description: item.description || '',
      content_type: item.content_type,
    });
    
    if (item.content_type === 'notes' && item.content_data) {
      setNotesContent((item.content_data as NotesData).content || '');
    } else if (item.content_type === 'flashcard' && item.content_data) {
      setFlashcards(item.content_data as FlashcardData[]);
    }
  };

  const addFlashcard = () => {
    setFlashcards([...flashcards, { id: Date.now().toString(), front: '', back: '' }]);
  };

  const updateFlashcard = (id: string, field: 'front' | 'back', value: string) => {
    setFlashcards(cards => 
      cards.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  const removeFlashcard = (id: string) => {
    if (flashcards.length > 1) {
      setFlashcards(cards => cards.filter(c => c.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'outline', icon: <Edit className="w-3 h-3" /> },
      pending_approval: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      approved: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
    };
    const config = configs[status] || { variant: 'secondary' as const, icon: null };
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Revision Content</h3>
          <p className="text-sm text-muted-foreground">Create and manage revision materials for students</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Content
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : content?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No content created yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              Create your first content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {content?.map(item => (
            <Card key={item.id} className={item.status === 'rejected' ? 'border-destructive/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getContentTypeIcon(item.content_type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.subject?.name || 'Unknown Subject'}
                        </Badge>
                        <span>•</span>
                        <span className="capitalize">{item.content_type}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                )}
                
                {item.status === 'rejected' && item.rejection_reason && (
                  <div className="p-3 bg-destructive/10 rounded-lg mb-3">
                    <p className="text-sm text-destructive">
                      <strong>Rejection reason:</strong> {item.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Updated {format(new Date(item.updated_at), 'MMM d, yyyy')}</span>
                    {item.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.view_count} views
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {item.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => submitForApproval.mutate(item.id)}
                          disabled={submitForApproval.isPending}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Submit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {item.status === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Revise
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingContent} 
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
            setShowCreateDialog(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit Content' : 'Create New Content'}</DialogTitle>
            <DialogDescription>
              {editingContent 
                ? 'Update your revision content. You can resubmit for approval after making changes.'
                : 'Create revision material for students. Choose a subject and content type.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingContent && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select 
                      value={formData.subject_id} 
                      onValueChange={(v) => setFormData(f => ({ ...f, subject_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} (Slot {s.slot})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select 
                      value={formData.content_type} 
                      onValueChange={(v) => setFormData(f => ({ ...f, content_type: v as 'pdf' | 'notes' | 'flashcard' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notes">Short Notes</SelectItem>
                        <SelectItem value="flashcard">Flashcards</SelectItem>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Chapter 1 Quick Revision"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the content"
                rows={2}
              />
            </div>

            {/* Content type specific fields */}
            {(formData.content_type === 'notes' || editingContent?.content_type === 'notes') && (
              <div className="space-y-2">
                <Label>Notes Content</Label>
                <Textarea 
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Write your revision notes here... (Markdown supported)"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {(formData.content_type === 'flashcard' || editingContent?.content_type === 'flashcard') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Flashcards</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addFlashcard}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Card
                  </Button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {flashcards.map((card, index) => (
                    <div key={card.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Card {index + 1}</span>
                        {flashcards.length > 1 && (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeFlashcard(card.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Input 
                        placeholder="Front (Question)"
                        value={card.front}
                        onChange={(e) => updateFlashcard(card.id, 'front', e.target.value)}
                      />
                      <Input 
                        placeholder="Back (Answer)"
                        value={card.back}
                        onChange={(e) => updateFlashcard(card.id, 'back', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(formData.content_type === 'pdf' || editingContent?.content_type === 'pdf') && (
              <div className="space-y-2">
                <Label>PDF File</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    {file ? (
                      <p className="text-sm">{file.name}</p>
                    ) : editingContent?.file_name ? (
                      <p className="text-sm">Current: {editingContent.file_name} (click to replace)</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click to upload PDF</p>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowCreateDialog(false); }}>
              Cancel
            </Button>
            <Button 
              onClick={editingContent ? handleUpdate : handleCreate}
              disabled={createContent.isPending || updateContent.isPending || !formData.title || (!editingContent && !formData.subject_id)}
            >
              {editingContent ? 'Save Changes' : 'Create Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteContent.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentManager;
