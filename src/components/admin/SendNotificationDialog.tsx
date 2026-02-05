 import { useState } from 'react';
 import { 
   Dialog, 
   DialogContent, 
   DialogDescription, 
   DialogHeader, 
   DialogTitle,
   DialogFooter 
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { useSendNotification, type ExchangeMatchWithDetails } from '@/hooks/useAdminData';
 import { Bell, Send } from 'lucide-react';
 
 interface SendNotificationDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   match: ExchangeMatchWithDetails | null;
 }
 
 const SendNotificationDialog = ({ open, onOpenChange, match }: SendNotificationDialogProps) => {
   const [title, setTitle] = useState('');
   const [message, setMessage] = useState('');
   const [notificationType, setNotificationType] = useState('info');
 
   const sendNotification = useSendNotification();
 
   const handleSend = async () => {
     if (!match || !title || !message) return;
 
     await sendNotification.mutateAsync({
       userIds: [match.student_1_id, match.student_2_id],
       title,
       message,
       type: notificationType,
       matchId: match.id,
     });
 
     handleClose();
   };
 
   const handleClose = () => {
     setTitle('');
     setMessage('');
     setNotificationType('info');
     onOpenChange(false);
   };
 
   const quickMessages = [
     { title: 'Exchange Reminder', message: 'Reminder: Your book exchange is coming up soon. Please arrive on time.' },
     { title: 'Location Change', message: 'Important: The location for your exchange has been updated. Please check the details.' },
     { title: 'Exchange Confirmed', message: 'Your exchange has been confirmed. See you at the scheduled time!' },
     { title: 'Action Required', message: 'Please confirm your exchange match to proceed with the scheduling.' },
   ];
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Bell className="w-5 h-5" />
             Send Notification
           </DialogTitle>
           <DialogDescription>
             Send an in-app notification to both students in this match.
           </DialogDescription>
         </DialogHeader>
 
         {match && (
           <div className="space-y-4">
             {/* Recipients */}
             <div className="p-3 bg-muted rounded-lg">
               <p className="text-xs text-muted-foreground mb-2">Recipients:</p>
               <div className="flex gap-2">
                 <Badge variant="secondary">{match.student_1_name}</Badge>
                 <Badge variant="secondary">{match.student_2_name}</Badge>
               </div>
             </div>
 
             {/* Quick Messages */}
             <div className="space-y-2">
               <Label>Quick Messages</Label>
               <div className="flex flex-wrap gap-2">
                 {quickMessages.map((qm, i) => (
                   <Button
                     key={i}
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setTitle(qm.title);
                       setMessage(qm.message);
                     }}
                   >
                     {qm.title}
                   </Button>
                 ))}
               </div>
             </div>
 
             {/* Notification Type */}
             <div className="space-y-2">
               <Label>Type</Label>
               <Select value={notificationType} onValueChange={setNotificationType}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="info">ℹ️ Info</SelectItem>
                   <SelectItem value="success">✅ Success</SelectItem>
                   <SelectItem value="warning">⚠️ Warning</SelectItem>
                   <SelectItem value="match_update">🔄 Match Update</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             {/* Title */}
             <div className="space-y-2">
               <Label htmlFor="title">Title</Label>
               <Input
                 id="title"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="Notification title"
               />
             </div>
 
             {/* Message */}
             <div className="space-y-2">
               <Label htmlFor="message">Message</Label>
               <Textarea
                 id="message"
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Write your message here..."
                 rows={3}
               />
             </div>
           </div>
         )}
 
         <DialogFooter>
           <Button variant="outline" onClick={handleClose}>
             Cancel
           </Button>
           <Button 
             onClick={handleSend}
             disabled={!title || !message || sendNotification.isPending}
             className="gap-2"
           >
             <Send className="w-4 h-4" />
             {sendNotification.isPending ? 'Sending...' : 'Send Notification'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default SendNotificationDialog;