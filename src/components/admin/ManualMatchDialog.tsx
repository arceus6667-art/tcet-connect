 import { useState, useMemo } from 'react';
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
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Input } from '@/components/ui/input';
 import { useEligibleStudents, useCreateManualMatch, EligibleStudent } from '@/hooks/useAdminData';
 import { Users, Search, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
 
 interface ManualMatchDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 const ManualMatchDialog = ({ open, onOpenChange }: ManualMatchDialogProps) => {
   const [selectedStudent1, setSelectedStudent1] = useState<EligibleStudent | null>(null);
   const [selectedStudent2, setSelectedStudent2] = useState<EligibleStudent | null>(null);
   const [search1, setSearch1] = useState('');
   const [search2, setSearch2] = useState('');
 
   const { data: slot1Students, isLoading: loading1 } = useEligibleStudents(1);
   const { data: slot2Students, isLoading: loading2 } = useEligibleStudents(2);
   const createMatch = useCreateManualMatch();
 
   const filteredSlot1 = useMemo(() => {
     if (!slot1Students) return [];
     const searchLower = search1.toLowerCase();
     return slot1Students.filter(s => 
       s.full_name.toLowerCase().includes(searchLower) ||
       s.email.toLowerCase().includes(searchLower) ||
       s.roll_number.toString().includes(searchLower)
     );
   }, [slot1Students, search1]);
 
   const filteredSlot2 = useMemo(() => {
     if (!slot2Students) return [];
     const searchLower = search2.toLowerCase();
     return slot2Students.filter(s => 
       s.full_name.toLowerCase().includes(searchLower) ||
       s.email.toLowerCase().includes(searchLower) ||
       s.roll_number.toString().includes(searchLower)
     );
   }, [slot2Students, search2]);
 
   const isCompatible = useMemo(() => {
     if (!selectedStudent1 || !selectedStudent2) return false;
     // Check if student 1's required books match student 2's owned books and vice versa
     const s1NeedsS2Has = selectedStudent1.books_required.some(book => 
       selectedStudent2.books_owned.includes(book)
     );
     const s2NeedsS1Has = selectedStudent2.books_required.some(book => 
       selectedStudent1.books_owned.includes(book)
     );
     return s1NeedsS2Has && s2NeedsS1Has;
   }, [selectedStudent1, selectedStudent2]);
 
   const handleCreateMatch = () => {
     if (!selectedStudent1 || !selectedStudent2) return;
     
     createMatch.mutate(
       { student1Id: selectedStudent1.user_id, student2Id: selectedStudent2.user_id },
       {
         onSuccess: () => {
           setSelectedStudent1(null);
           setSelectedStudent2(null);
           setSearch1('');
           setSearch2('');
           onOpenChange(false);
         },
       }
     );
   };
 
   const handleClose = () => {
     setSelectedStudent1(null);
     setSelectedStudent2(null);
     setSearch1('');
     setSearch2('');
     onOpenChange(false);
   };
 
   const StudentCard = ({ 
     student, 
     selected, 
     onSelect 
   }: { 
     student: EligibleStudent; 
     selected: boolean;
     onSelect: () => void;
   }) => (
     <div 
       className={`p-3 border rounded-lg cursor-pointer transition-all ${
         selected 
           ? 'border-primary bg-primary/5 ring-2 ring-primary' 
           : 'border-border hover:border-primary/50 hover:bg-muted/50'
       }`}
       onClick={onSelect}
     >
       <div className="flex items-center justify-between">
         <div>
           <p className="font-medium text-sm">{student.full_name}</p>
           <p className="text-xs text-muted-foreground">{student.email}</p>
         </div>
         {selected && <CheckCircle className="w-4 h-4 text-primary" />}
       </div>
       <div className="flex gap-1 mt-2 flex-wrap">
         <Badge variant="outline" className="text-xs">{student.branch}</Badge>
         <Badge variant="outline" className="text-xs">Div {student.division}</Badge>
         <Badge variant="outline" className="text-xs">Roll {student.roll_number}</Badge>
       </div>
       <div className="mt-2 text-xs">
         <p className="text-muted-foreground">
           <span className="font-medium">Has:</span> {student.books_owned.join(', ') || 'None'}
         </p>
         <p className="text-muted-foreground">
           <span className="font-medium">Needs:</span> {student.books_required.join(', ') || 'None'}
         </p>
       </div>
     </div>
   );
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="max-w-4xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Users className="w-5 h-5" />
             Create Manual Match
           </DialogTitle>
           <DialogDescription>
             Select one student from Slot 1 and one from Slot 2 to create a manual exchange match.
           </DialogDescription>
         </DialogHeader>
 
         <div className="grid grid-cols-2 gap-6">
           {/* Slot 1 Students */}
           <div className="space-y-3">
             <Label className="text-base font-semibold flex items-center gap-2">
               <Badge>Slot 1</Badge>
               Students ({slot1Students?.length || 0} eligible)
             </Label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Search by name, email, or roll..." 
                 value={search1}
                 onChange={(e) => setSearch1(e.target.value)}
                 className="pl-9"
               />
             </div>
             <ScrollArea className="h-[300px] border rounded-lg p-2">
               {loading1 ? (
                 <p className="text-center py-4 text-muted-foreground">Loading...</p>
               ) : filteredSlot1.length === 0 ? (
                 <p className="text-center py-4 text-muted-foreground">No eligible students</p>
               ) : (
                 <div className="space-y-2">
                   {filteredSlot1.map(student => (
                     <StudentCard
                       key={student.user_id}
                       student={student}
                       selected={selectedStudent1?.user_id === student.user_id}
                       onSelect={() => setSelectedStudent1(student)}
                     />
                   ))}
                 </div>
               )}
             </ScrollArea>
           </div>
 
           {/* Slot 2 Students */}
           <div className="space-y-3">
             <Label className="text-base font-semibold flex items-center gap-2">
               <Badge variant="secondary">Slot 2</Badge>
               Students ({slot2Students?.length || 0} eligible)
             </Label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Search by name, email, or roll..." 
                 value={search2}
                 onChange={(e) => setSearch2(e.target.value)}
                 className="pl-9"
               />
             </div>
             <ScrollArea className="h-[300px] border rounded-lg p-2">
               {loading2 ? (
                 <p className="text-center py-4 text-muted-foreground">Loading...</p>
               ) : filteredSlot2.length === 0 ? (
                 <p className="text-center py-4 text-muted-foreground">No eligible students</p>
               ) : (
                 <div className="space-y-2">
                   {filteredSlot2.map(student => (
                     <StudentCard
                       key={student.user_id}
                       student={student}
                       selected={selectedStudent2?.user_id === student.user_id}
                       onSelect={() => setSelectedStudent2(student)}
                     />
                   ))}
                 </div>
               )}
             </ScrollArea>
           </div>
         </div>
 
         {/* Match Preview */}
         {selectedStudent1 && selectedStudent2 && (
          <div className={`p-4 rounded-lg border-2 dark:bg-opacity-10 ${
            isCompatible ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary/10'
           }`}>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="text-center">
                   <p className="font-medium">{selectedStudent1.full_name}</p>
                   <Badge variant="outline" className="text-xs">{selectedStudent1.branch}</Badge>
                 </div>
                 <ArrowRight className="w-5 h-5 text-muted-foreground" />
                 <div className="text-center">
                   <p className="font-medium">{selectedStudent2.full_name}</p>
                   <Badge variant="outline" className="text-xs">{selectedStudent2.branch}</Badge>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {isCompatible ? (
                   <>
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Compatible</span>
                   </>
                 ) : (
                   <>
                    <AlertCircle className="w-5 h-5 text-secondary-foreground" />
                    <span className="text-sm font-medium text-secondary-foreground">May not be compatible</span>
                   </>
                 )}
               </div>
             </div>
           </div>
         )}
 
         <DialogFooter>
           <Button variant="outline" onClick={handleClose}>
             Cancel
           </Button>
           <Button 
             onClick={handleCreateMatch}
             disabled={!selectedStudent1 || !selectedStudent2 || createMatch.isPending}
           >
             {createMatch.isPending ? 'Creating...' : 'Create Match'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default ManualMatchDialog;