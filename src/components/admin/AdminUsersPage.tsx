import { useState } from 'react';
import { 
  useAllUsers, 
  useFilteredStudents, 
  useUpdateUserStatus, 
  useUpdateUserRole,
  type StudentFilters 
} from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  GraduationCap, 
  BookOpen,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BRANCHES = ['CS', 'IT', 'EXTC', 'MECH', 'CIVIL', 'AIDS', 'AIML'];
const EXCHANGE_STATUSES = ['pending', 'requested', 'matched', 'completed', 'cancelled'];

const AdminUsersPage = () => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [studentFilters, setStudentFilters] = useState<StudentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ userId: string; action: 'role' | 'status' } | null>(null);
  const [newRole, setNewRole] = useState<'student' | 'teacher' | 'admin'>('student');

  const { data: allUsers, isLoading: usersLoading } = useAllUsers(roleFilter);
  const { data: filteredStudents, isLoading: studentsLoading } = useFilteredStudents({
    ...studentFilters,
    search: searchTerm,
  });
  const updateUserStatus = useUpdateUserStatus();
  const updateUserRole = useUpdateUserRole();

  const displayUsers = roleFilter === 'student' && (studentFilters.slot || studentFilters.branch || studentFilters.exchange_status)
    ? filteredStudents
    : allUsers?.filter(u => 
        !searchTerm || 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    updateUserStatus.mutate({ userId, isActive: !currentStatus });
  };

  const handleUpdateRole = () => {
    if (selectedUser) {
      updateUserRole.mutate({ 
        userId: selectedUser.userId, 
        role: newRole, 
        isApproved: true 
      });
      setSelectedUser(null);
    }
  };

  const getRoleBadge = (role: string | null, isApproved: boolean) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
      student: { variant: 'secondary', icon: <GraduationCap className="w-3 h-3" /> },
      teacher: { variant: 'default', icon: <BookOpen className="w-3 h-3" /> },
      admin: { variant: 'destructive', icon: <Shield className="w-3 h-3" /> },
    };

    const config = variants[role] || { variant: 'secondary' as const, icon: null };
    
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {role}
        {!isApproved && <span className="text-xs">(pending)</span>}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      requested: 'bg-blue-100 text-blue-800',
      matched: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{displayUsers?.length || 0} users</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            {roleFilter === 'student' && (
              <>
                <Select 
                  value={studentFilters.slot?.toString() || 'all'} 
                  onValueChange={(v) => setStudentFilters(f => ({ ...f, slot: v === 'all' ? undefined : parseInt(v) }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Slots</SelectItem>
                    <SelectItem value="1">Slot 1</SelectItem>
                    <SelectItem value="2">Slot 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={studentFilters.branch || 'all'} 
                  onValueChange={(v) => setStudentFilters(f => ({ ...f, branch: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {BRANCHES.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={studentFilters.exchange_status || 'all'} 
                  onValueChange={(v) => setStudentFilters(f => ({ ...f, exchange_status: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {EXCHANGE_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {roleFilter === 'student' && (
                    <>
                      <TableHead>Branch</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Exchange</TableHead>
                    </>
                  )}
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersLoading || studentsLoading) ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : displayUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayUsers?.map((user) => (
                    <TableRow key={user.user_id} className={!user.is_active ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role, user.is_approved)}</TableCell>
                      {roleFilter === 'student' && (
                        <>
                          <TableCell>{user.branch || '-'}</TableCell>
                          <TableCell>
                            {user.slot ? <Badge variant="outline">Slot {user.slot}</Badge> : '-'}
                          </TableCell>
                          <TableCell>
                            {user.exchange_status ? getStatusBadge(user.exchange_status) : '-'}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser({ userId: user.user_id, action: 'role' });
                              setNewRole((user.role as 'student' | 'teacher' | 'admin') || 'student');
                            }}>
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                              className={user.is_active ? 'text-destructive' : 'text-green-600'}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Disable User
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Enable User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={selectedUser?.action === 'role'} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select the new role for this user. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as 'student' | 'teacher' | 'admin')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={updateUserRole.isPending}>
              {updateUserRole.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
