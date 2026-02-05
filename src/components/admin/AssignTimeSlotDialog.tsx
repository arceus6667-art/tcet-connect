 import { useState, useEffect } from 'react';
 import { 
   Dialog, 
   DialogContent, 
   DialogDescription, 
   DialogHeader, 
   DialogTitle,
   DialogFooter 
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Switch } from '@/components/ui/switch';
 import { 
   useAvailableTimeSlots, 
   useAvailableLocations, 
   useAssignTimeSlot,
   useSendNotification,
   type ExchangeMatchWithDetails 
 } from '@/hooks/useAdminData';
 import { Calendar, Clock, MapPin, Bell } from 'lucide-react';
 import { format } from 'date-fns';
 
 interface AssignTimeSlotDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   match: ExchangeMatchWithDetails | null;
 }
 
 const AssignTimeSlotDialog = ({ open, onOpenChange, match }: AssignTimeSlotDialogProps) => {
   const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
   const [selectedLocation, setSelectedLocation] = useState<string>('');
   const [notifyStudents, setNotifyStudents] = useState(true);
 
   const { data: timeSlots } = useAvailableTimeSlots();
   const { data: locations } = useAvailableLocations();
   const assignTimeSlot = useAssignTimeSlot();
   const sendNotification = useSendNotification();
 
   useEffect(() => {
     if (match) {
       setSelectedTimeSlot(match.time_slot_id || '');
       setSelectedLocation(match.location_id || '');
     }
   }, [match]);
 
   const handleAssign = async () => {
     if (!match) return;
 
     await assignTimeSlot.mutateAsync({
       matchId: match.id,
       timeSlotId: selectedTimeSlot || null,
       locationId: selectedLocation || null,
     });
 
     if (notifyStudents && selectedTimeSlot && selectedLocation) {
       const selectedSlot = timeSlots?.find(t => t.id === selectedTimeSlot);
       const selectedLoc = locations?.find(l => l.id === selectedLocation);
       
       await sendNotification.mutateAsync({
         userIds: [match.student_1_id, match.student_2_id],
         title: 'Exchange Scheduled',
         message: `Your book exchange has been scheduled for ${selectedSlot ? format(new Date(selectedSlot.date), 'MMM d, yyyy') : 'TBD'} at ${selectedLoc?.name || 'TBD'}. Please be on time!`,
         type: 'match_update',
         matchId: match.id,
       });
     }
 
     onOpenChange(false);
   };
 
   const handleClose = () => {
     setSelectedTimeSlot('');
     setSelectedLocation('');
     setNotifyStudents(true);
     onOpenChange(false);
   };
 
   const getPeriodLabel = (period: string) => {
     const labels: Record<string, string> = {
       morning: '🌅 Morning',
       afternoon: '☀️ Afternoon',
       evening: '🌆 Evening',
     };
     return labels[period] || period;
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Calendar className="w-5 h-5" />
             Assign Time Slot & Location
           </DialogTitle>
           <DialogDescription>
             Schedule when and where the exchange will take place.
           </DialogDescription>
         </DialogHeader>
 
         {match && (
           <div className="space-y-4">
             {/* Match Info */}
             <div className="p-3 bg-muted rounded-lg">
               <p className="text-sm font-medium">
                 {match.student_1_name} ↔ {match.student_2_name}
               </p>
               <p className="text-xs text-muted-foreground">
                 {match.student_1_branch} (Slot {match.student_1_slot}) ↔ {match.student_2_branch} (Slot {match.student_2_slot})
               </p>
             </div>
 
             {/* Time Slot Selection */}
             <div className="space-y-2">
               <Label className="flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 Time Slot
               </Label>
               <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select a time slot" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="">No time slot</SelectItem>
                   {timeSlots?.map(slot => (
                     <SelectItem key={slot.id} value={slot.id}>
                       <div className="flex items-center gap-2">
                         <span>{format(new Date(slot.date), 'MMM d, yyyy')}</span>
                         <Badge variant="outline" className="text-xs">
                           {getPeriodLabel(slot.period)}
                         </Badge>
                         <span className="text-xs text-muted-foreground">
                           ({slot.current_exchanges}/{slot.max_exchanges})
                         </span>
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {/* Location Selection */}
             <div className="space-y-2">
               <Label className="flex items-center gap-2">
                 <MapPin className="w-4 h-4" />
                 Location
               </Label>
               <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select a location" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="">No location</SelectItem>
                   {locations?.map(loc => (
                     <SelectItem key={loc.id} value={loc.id}>
                       {loc.name}
                       {loc.description && (
                         <span className="text-xs text-muted-foreground ml-2">
                           - {loc.description}
                         </span>
                       )}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {/* Notify Students Toggle */}
             <div className="flex items-center justify-between p-3 border rounded-lg">
               <div className="flex items-center gap-2">
                 <Bell className="w-4 h-4 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Notify Students</p>
                   <p className="text-xs text-muted-foreground">
                     Send in-app notification about the schedule
                   </p>
                 </div>
               </div>
               <Switch
                 checked={notifyStudents}
                 onCheckedChange={setNotifyStudents}
               />
             </div>
           </div>
         )}
 
         <DialogFooter>
           <Button variant="outline" onClick={handleClose}>
             Cancel
           </Button>
           <Button 
             onClick={handleAssign}
             disabled={assignTimeSlot.isPending || sendNotification.isPending}
           >
             {assignTimeSlot.isPending ? 'Saving...' : 'Save Schedule'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AssignTimeSlotDialog;