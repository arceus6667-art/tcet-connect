 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Bell, Check, CheckCheck } from 'lucide-react';
 import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
 import { formatDistanceToNow } from 'date-fns';
 
 const NotificationBell = () => {
   const [open, setOpen] = useState(false);
   const { data: notifications, isLoading } = useNotifications();
   const { data: unreadCount } = useUnreadCount();
   const markAsRead = useMarkAsRead();
   const markAllAsRead = useMarkAllAsRead();
 
   const getTypeIcon = (type: string) => {
     switch (type) {
       case 'success': return '✅';
       case 'warning': return '⚠️';
       case 'match_update': return '🔄';
       default: return 'ℹ️';
     }
   };
 
   const handleMarkAsRead = (id: string) => {
     markAsRead.mutate(id);
   };
 
   const handleMarkAllAsRead = () => {
     markAllAsRead.mutate();
   };
 
   return (
     <Popover open={open} onOpenChange={setOpen}>
       <PopoverTrigger asChild>
         <Button variant="ghost" size="icon" className="relative">
           <Bell className="w-5 h-5" />
           {(unreadCount ?? 0) > 0 && (
             <Badge 
               className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
               variant="destructive"
             >
               {unreadCount}
             </Badge>
           )}
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-80 p-0" align="end">
         <div className="flex items-center justify-between p-3 border-b">
           <h4 className="font-semibold">Notifications</h4>
           {(unreadCount ?? 0) > 0 && (
             <Button 
               variant="ghost" 
               size="sm" 
               className="text-xs gap-1"
               onClick={handleMarkAllAsRead}
             >
               <CheckCheck className="w-3 h-3" />
               Mark all read
             </Button>
           )}
         </div>
         <ScrollArea className="h-[300px]">
           {isLoading ? (
             <div className="p-4 text-center text-muted-foreground">
               Loading...
             </div>
           ) : notifications?.length === 0 ? (
             <div className="p-4 text-center text-muted-foreground">
               No notifications yet
             </div>
           ) : (
             <div className="divide-y">
               {notifications?.map((notification) => (
                 <div 
                   key={notification.id}
                   className={`p-3 hover:bg-muted/50 transition-colors ${
                     !notification.is_read ? 'bg-primary/5' : ''
                   }`}
                 >
                   <div className="flex items-start justify-between gap-2">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <span>{getTypeIcon(notification.type)}</span>
                         <span className="font-medium text-sm truncate">
                           {notification.title}
                         </span>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                         {notification.message}
                       </p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                       </p>
                     </div>
                     {!notification.is_read && (
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-6 w-6 shrink-0"
                         onClick={() => handleMarkAsRead(notification.id)}
                       >
                         <Check className="w-3 h-3" />
                       </Button>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           )}
         </ScrollArea>
       </PopoverContent>
     </Popover>
   );
 };
 
 export default NotificationBell;