import { useTeacherStats } from '@/hooks/useRevisionContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowLeftRight, Clock, CheckCircle, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981'];

const TeacherStatsCard = () => {
  const { data: stats, isLoading } = useTeacherStats();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  const exchangeData = [
    { name: 'Pending', value: stats?.pendingCount || 0 },
    { name: 'Matched', value: stats?.matchedCount || 0 },
    { name: 'Completed', value: stats?.completedCount || 0 },
  ];


  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Exchange Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.completedCount || 0}</p>
            <p className="text-xs text-muted-foreground">Completed exchanges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalContent || 0}</p>
            <p className="text-xs text-muted-foreground">Revision materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.pendingApproval || 0}</p>
            <p className="text-xs text-muted-foreground">Content awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exchange Status Distribution</CardTitle>
            <CardDescription>Anonymized student exchange progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exchangeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {exchangeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Slot Distribution</CardTitle>
            <CardDescription>Students by slot assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slot 1 (Odd Roll Numbers)</span>
                  <Badge variant="outline">{stats?.slot1Count || 0}</Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ 
                      width: `${stats?.totalStudents ? (stats.slot1Count / stats.totalStudents) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slot 2 (Even Roll Numbers)</span>
                  <Badge variant="outline">{stats?.slot2Count || 0}</Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all" 
                    style={{ 
                      width: `${stats?.totalStudents ? (stats.slot2Count / stats.totalStudents) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {stats?.completedCount || 0} successful exchanges this semester
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherStatsCard;
