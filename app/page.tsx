import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, TrendingUp, Activity, Calendar } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your CRM.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">$0 pipeline value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No recent activities</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No upcoming tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">Lead</div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-muted-foreground">$0</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Qualified</div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-muted-foreground">$0</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Proposal</div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-muted-foreground">$0</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Negotiation</div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-muted-foreground">$0</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Closed Won</div>
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-muted-foreground">$0</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Closed Lost</div>
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-muted-foreground">$0</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}