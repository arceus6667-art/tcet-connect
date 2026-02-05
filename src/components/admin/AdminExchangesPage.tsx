import { useState } from 'react';
import { 
  useAllExchangeMatches, 
  useCancelMatch, 
  useCompleteMatch,
  useRestoreMatch,
  useSystemSettings,
  useUpdateSystemSetting,
  type ExchangeMatchWithDetails
} from '@/hooks/useAdminData';
import ManualMatchDialog from './ManualMatchDialog';
import AssignTimeSlotDialog from './AssignTimeSlotDialog';
import SendNotificationDialog from './SendNotificationDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  ArrowLeftRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  MapPin,
  Play,
  Pause,
  Settings,
  Plus,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

const AdminExchangesPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'complete' | null>(null);
  const [showManualMatch, setShowManualMatch] = useState(false);
  const [restoreMatchId, setRestoreMatchId] = useState<string | null>(null);
  const [assignMatch, setAssignMatch] = useState<ExchangeMatchWithDetails | null>(null);
  const [notifyMatch, setNotifyMatch] = useState<ExchangeMatchWithDetails | null>(null);

  const { data: matches, isLoading: matchesLoading } = useAllExchangeMatches(statusFilter);
  const { data: settings } = useSystemSettings();
  const cancelMatch = useCancelMatch();
  const completeMatch = useCompleteMatch();
  const restoreMatch = useRestoreMatch();
  const updateSetting = useUpdateSystemSetting();

  const matchingEnabled = settings?.find(s => s.key === 'matching_engine_enabled')?.value === 'true';

  const handleToggleMatchingEngine = () => {
    updateSetting.mutate({
      key: 'matching_engine_enabled',
      value: !matchingEnabled,
    });
  };

  const handleConfirmAction = () => {
    if (!selectedMatch || !actionType) return;

    if (actionType === 'cancel') {
      cancelMatch.mutate(selectedMatch);
    } else if (actionType === 'complete') {
      completeMatch.mutate(selectedMatch);
    }

    setSelectedMatch(null);
    setActionType(null);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      matched: { variant: 'outline', icon: <Clock className="w-3 h-3" /> },
      confirmed: { variant: 'secondary', icon: <CheckCircle className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
    };
    
    const config = configs[status] || { variant: 'secondary' as const, icon: null };
    
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matching Engine Control */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Matching Engine Control
              </CardTitle>
              <CardDescription>
                Control the automated matching engine
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setShowManualMatch(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Manual Match
              </Button>
              <div className="flex items-center gap-2">
                <Label htmlFor="matching-toggle">
                  {matchingEnabled ? (
                    <Badge className="bg-green-500 gap-1">
                      <Play className="w-3 h-3" />
                      Running
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Pause className="w-3 h-3" />
                      Paused
                    </Badge>
                  )}
                </Label>
                <Switch
                  id="matching-toggle"
                  checked={matchingEnabled}
                  onCheckedChange={handleToggleMatchingEngine}
                  disabled={updateSetting.isPending}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When enabled, the matching engine will automatically pair compatible Slot 1 and Slot 2 students.
            Pause the engine to manually manage matches or resolve conflicts.
          </p>
        </CardContent>
      </Card>

      {/* Exchanges List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Exchange Matches
              </CardTitle>
              <CardDescription>
                View and manage all exchange matches
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{matches?.length || 0} matches</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student 1</TableHead>
                  <TableHead>Student 2</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmations</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Matched</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchesLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : matches?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No matches found
                    </TableCell>
                  </TableRow>
                ) : (
                  matches?.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{match.student_1_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {match.student_1_branch} • Slot {match.student_1_slot}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{match.student_2_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {match.student_2_branch} • Slot {match.student_2_slot}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(match.match_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={match.student_1_confirmed ? 'default' : 'outline'} className="text-xs">
                            S1: {match.student_1_confirmed ? '✓' : '○'}
                          </Badge>
                          <Badge variant={match.student_2_confirmed ? 'default' : 'outline'} className="text-xs">
                            S2: {match.student_2_confirmed ? '✓' : '○'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.time_slot_date ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(match.time_slot_date), 'MMM d')}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {match.location_name || 'TBD'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(match.matched_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {match.match_status !== 'completed' && match.match_status !== 'cancelled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => {
                                  setSelectedMatch(match.id);
                                  setActionType('complete');
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={() => {
                                  setSelectedMatch(match.id);
                                  setActionType('cancel');
                                }}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                        {match.match_status === 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => setRestoreMatchId(match.id)}
                          >
                            <ArrowLeftRight className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                        )}
                        {match.match_status !== 'cancelled' && match.match_status !== 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => setAssignMatch(match)}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Schedule
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => setNotifyMatch(match)}
                            >
                              <Bell className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={!!selectedMatch && !!actionType} 
        onOpenChange={() => { setSelectedMatch(null); setActionType(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'cancel' ? 'Cancel Exchange Match?' : 'Complete Exchange Match?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'cancel' 
                ? 'This will cancel the match and reset both students to pending status. They can be matched again.'
                : 'This will mark the exchange as completed. Both students will be marked as having completed their exchange for this semester.'
              }
              <br /><br />
              This action will be logged for transparency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={actionType === 'cancel' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionType === 'cancel' ? 'Yes, Cancel Match' : 'Yes, Complete Match'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Match Confirmation Dialog */}
      <AlertDialog 
        open={!!restoreMatchId} 
        onOpenChange={() => setRestoreMatchId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Cancelled Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the cancelled match and set both students' status back to "matched".
              They will be able to continue with their exchange.
              <br /><br />
              This action will be logged for transparency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreMatchId) {
                  restoreMatch.mutate(restoreMatchId);
                  setRestoreMatchId(null);
                }
              }}
            >
              Yes, Restore Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Match Dialog */}
      <ManualMatchDialog 
        open={showManualMatch} 
        onOpenChange={setShowManualMatch} 
      />

      {/* Assign Time Slot Dialog */}
      <AssignTimeSlotDialog
        open={!!assignMatch}
        onOpenChange={(open) => !open && setAssignMatch(null)}
        match={assignMatch}
      />

      {/* Send Notification Dialog */}
      <SendNotificationDialog
        open={!!notifyMatch}
        onOpenChange={(open) => !open && setNotifyMatch(null)}
        match={notifyMatch}
      />
    </div>
  );
};

export default AdminExchangesPage;
