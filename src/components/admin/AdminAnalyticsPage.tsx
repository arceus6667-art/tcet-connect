import { useAdminAnalytics, useAdminLogs } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  ArrowLeftRight, 
  CheckCircle, 
  Clock,
  TrendingUp,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AdminAnalyticsPage = () => {
  const { data: analytics } = useAdminAnalytics();
  const { data: logs, isLoading: logsLoading } = useAdminLogs();

  const branchData = analytics?.branchCounts 
    ? Object.entries(analytics.branchCounts).map(([name, value]) => ({ name, value }))
    : [];

  const slotData = [
    { name: 'Slot 1', value: analytics?.slot1Students || 0 },
    { name: 'Slot 2', value: analytics?.slot2Students || 0 },
  ];

  const statusData = [
    { name: 'Pending', value: analytics?.pendingStudents || 0 },
    { name: 'Matched', value: analytics?.matchedStudents || 0 },
    { name: 'Completed', value: analytics?.completedExchanges || 0 },
  ];

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('USER')) return <Users className="w-4 h-4" />;
    if (actionType.includes('MATCH')) return <ArrowLeftRight className="w-4 h-4" />;
    if (actionType.includes('ROLE')) return <Users className="w-4 h-4" />;
    return <History className="w-4 h-4" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('CANCELLED') || actionType.includes('DEACTIVATED')) return 'text-destructive';
    if (actionType.includes('COMPLETED') || actionType.includes('ACTIVATED')) return 'text-green-600';
    return 'text-primary';
  };

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
            <p className="text-3xl font-bold">{analytics?.totalStudents || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.pendingStudents || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting match</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Total Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.totalMatches || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Created this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.completedExchanges || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Successful exchanges</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Slot Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Slot Distribution
            </CardTitle>
            <CardDescription>Students by slot assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slotData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {slotData.map((_, index) => (
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

        {/* Exchange Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Exchange Status
            </CardTitle>
            <CardDescription>Current status of all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Branch Distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Students by Branch
            </CardTitle>
            <CardDescription>Distribution across engineering branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Action Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Admin Action Logs
          </CardTitle>
          <CardDescription>Recent administrative actions for transparency</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading logs...</p>
          ) : logs?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No actions logged yet</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {logs?.slice(0, 20).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className={`mt-0.5 ${getActionColor(log.action_type)}`}>
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {log.admin_name}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{log.action_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;
