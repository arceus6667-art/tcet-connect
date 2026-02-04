import { useState } from 'react';
import { 
  useAllContent, 
  useApproveContent, 
  useRejectContent,
  type RevisionContent
} from '@/hooks/useRevisionContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  BookOpen, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

const AdminContentPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending_approval');
  const { data: content, isLoading } = useAllContent(statusFilter);
  const approveContent = useApproveContent();
  const rejectContent = useRejectContent();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewContent, setPreviewContent] = useState<RevisionContent | null>(null);

  const handleReject = async () => {
    if (rejectingId && rejectionReason) {
      await rejectContent.mutateAsync({ contentId: rejectingId, reason: rejectionReason });
      setRejectingId(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'outline', icon: null },
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Revision Content Management
              </CardTitle>
              <CardDescription>
                Review and approve teacher-submitted revision materials
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{content?.length || 0} items</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : content?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No content found
                    </TableCell>
                  </TableRow>
                ) : (
                  content?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.subject?.name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getContentTypeIcon(item.content_type)}
                          <span className="capitalize text-sm">{item.content_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.creator_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {item.view_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(item.updated_at), 'MMM d')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewContent(item)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {item.status === 'pending_approval' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => approveContent.mutate(item.id)}
                                disabled={approveContent.isPending}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={() => setRejectingId(item.id)}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be shown to the teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason || rejectContent.isPending}
            >
              Reject Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewContent && getContentTypeIcon(previewContent.content_type)}
              {previewContent?.title}
            </DialogTitle>
            <DialogDescription>
              {previewContent?.subject?.name} • Created by {previewContent?.creator_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {previewContent?.description && (
              <p className="text-sm text-muted-foreground mb-4">{previewContent.description}</p>
            )}
            
            {previewContent?.content_type === 'notes' && previewContent.content_data && (
              <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {(previewContent.content_data as { content: string }).content}
              </div>
            )}

            {previewContent?.content_type === 'flashcard' && previewContent.content_data && (
              <div className="space-y-3">
                {(previewContent.content_data as { id: string; front: string; back: string }[]).map((card, i) => (
                  <div key={card.id} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Card {i + 1}</p>
                    <p className="font-medium mb-2">Q: {card.front}</p>
                    <p className="text-muted-foreground">A: {card.back}</p>
                  </div>
                ))}
              </div>
            )}

            {previewContent?.content_type === 'pdf' && (
              <div className="text-center p-8 bg-muted/50 rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">{previewContent.file_name}</p>
                {previewContent.file_url && (
                  <Button variant="outline" className="mt-4" asChild>
                    <a href={previewContent.file_url} target="_blank" rel="noopener noreferrer">
                      Open PDF
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContentPage;
