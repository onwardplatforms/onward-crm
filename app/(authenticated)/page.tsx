"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Building2, Briefcase, TrendingUp, Activity, Calendar,
  AlertCircle, Target, DollarSign, Clock, ArrowUp, ArrowDown,
  ChevronRight, Zap, Plus, UserPlus, Building
} from "lucide-react";
import { formatCurrency, formatCompactCurrency } from "@/lib/currency";
import { format, differenceInDays } from "date-fns";
import { DEAL_STAGES, ACTIVITY_TYPES } from "@/lib/types";
import {
  calculateStageVelocity,
  calculateWinRateByStage,
  calculatePipelineTrend,
  getDealsNeedingAttention,
  calculateSalesVelocity,
  calculateForecast
} from "@/lib/metrics";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar, BarChart,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend, Cell, RadialBar, RadialBarChart
} from "recharts";
import { cn } from "@/lib/utils";

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
  deals: {
    label: "Deals",
    color: "hsl(var(--chart-2))",
  },
  activities: {
    label: "Activities",
    color: "hsl(var(--chart-3))",
  },
  newDeals: {
    label: "New Deals",
    color: "hsl(var(--chart-4))",
  },
  committed: {
    label: "Committed",
    color: "hsl(var(--chart-1))",
  },
  bestCase: {
    label: "Best Case (100%)",
    color: "hsl(var(--chart-2))",
  },
  weighted: {
    label: "Weighted by Probability",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  // Calculated metrics
  const [salesVelocity, setSalesVelocity] = useState<any>(null);
  const [stageVelocity, setStageVelocity] = useState<any>({});
  const [pipelineTrend, setPipelineTrend] = useState<any[]>([]);
  const [winRateByStage, setWinRateByStage] = useState<any[]>([]);
  const [dealsNeedingAttention, setDealsNeedingAttention] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [contactsRes, companiesRes, dealsRes, activitiesRes, sessionRes, usersRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/companies"),
        fetch("/api/deals"),
        fetch("/api/activities"),
        fetch("/api/auth/get-session"),
        fetch("/api/users"),
      ]);

      const contactsData = contactsRes.ok ? await contactsRes.json() : [];
      const companiesData = companiesRes.ok ? await companiesRes.json() : [];
      const dealsData = dealsRes.ok ? await dealsRes.json() : [];
      const activitiesData = activitiesRes.ok ? await activitiesRes.json() : [];
      const sessionData = sessionRes.ok ? await sessionRes.json() : null;
      const usersData = usersRes.ok ? await usersRes.json() : [];

      // Ensure all data is arrays
      const contacts = Array.isArray(contactsData) ? contactsData : [];
      const companies = Array.isArray(companiesData) ? companiesData : [];
      const deals = Array.isArray(dealsData) ? dealsData : [];
      const activities = Array.isArray(activitiesData) ? activitiesData : [];
      const users = Array.isArray(usersData) ? usersData : [];

      setContacts(contacts);
      setCompanies(companies);
      setDeals(deals);
      setActivities(activities);
      setCurrentUser(sessionData?.user || null);
      setUsers(users);

      // Calculate all metrics
      setSalesVelocity(calculateSalesVelocity(deals));
      setStageVelocity(calculateStageVelocity(deals));
      setPipelineTrend(calculatePipelineTrend(deals));
      setWinRateByStage(calculateWinRateByStage(deals));
      setDealsNeedingAttention(getDealsNeedingAttention(deals));
      setForecast(calculateForecast(deals));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const openDeals = deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage));
  const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const closedThisMonth = deals.filter(d => {
    if (d.stage !== "closed-won") return false;
    const closeDate = d.closeDate ? new Date(d.closeDate) : new Date(d.updatedAt);
    const now = new Date();
    return closeDate.getMonth() === now.getMonth() && closeDate.getFullYear() === now.getFullYear();
  });
  const revenueThisMonth = closedThisMonth.reduce((sum, d) => sum + (d.value || 0), 0);

  // Calculate month-over-month growth
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const closedLastMonth = deals.filter(d => {
    if (d.stage !== "closed-won") return false;
    const closeDate = d.closeDate ? new Date(d.closeDate) : new Date(d.updatedAt);
    return closeDate.getMonth() === lastMonthStart.getMonth() && 
           closeDate.getFullYear() === lastMonthStart.getFullYear();
  });
  const revenueLastMonth = closedLastMonth.reduce((sum, d) => sum + (d.value || 0), 0);
  const revenueGrowth = revenueLastMonth > 0 
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
        <p className="text-muted-foreground">
          Real-time insights into your sales performance
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{openDeals.length} open deals</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueThisMonth)}</div>
            <div className="flex items-center text-xs mt-1">
              {revenueGrowth > 0 ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={cn(
                "font-medium",
                revenueGrowth > 0 ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesVelocity?.winRate ? salesVelocity.winRate.toFixed(1) : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg deal: {formatCurrency(salesVelocity?.avgDealSize || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesVelocity?.velocity || 0)}/day
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {salesVelocity?.avgCycleLength || 0} day avg cycle
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Trend & Revenue Forecast */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Trend</CardTitle>
            <CardDescription>Total pipeline value over last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-1))"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Weighted pipeline by probability and close date</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(value) => value > 0 ? formatCompactCurrency(value) : '$0'}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="weighted" fill="hsl(var(--chart-1))" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Deal Momentum & Activity Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deal Momentum */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Momentum</CardTitle>
            <CardDescription>Deals by stage this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEAL_STAGES.filter(stage => !['closed-won', 'closed-lost'].includes(stage.value)).map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage.value);
                const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
                const maxValue = Math.max(...DEAL_STAGES.map(s => 
                  deals.filter(d => d.stage === s.value).reduce((sum, d) => sum + (d.value || 0), 0)
                ));
                const percentage = maxValue > 0 ? (stageValue / maxValue) * 100 : 0;
                
                return (
                  <div key={stage.value} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-muted-foreground">
                        {stageDeals.length} deals · {formatCompactCurrency(stageValue)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
            <CardDescription>By type this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                activities.reduce((acc, activity) => {
                  const type = activity.type;
                  if (!acc[type]) acc[type] = 0;
                  acc[type]++;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const total = activities.length;
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  const typeColors: Record<string, string> = {
                    call: 'hsl(var(--chart-1))',
                    email: 'hsl(var(--chart-2))',
                    meeting: 'hsl(var(--chart-3))',
                    task: 'hsl(var(--chart-4))',
                    note: 'hsl(var(--chart-5))',
                  };
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals Needing Attention */}
      {dealsNeedingAttention.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deals Requiring Attention</CardTitle>
                <CardDescription>
                  {dealsNeedingAttention.length} deals need immediate action
                </CardDescription>
              </div>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dealsNeedingAttention.map((deal) => (
                <div key={deal.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{deal.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {deal.stage}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(deal.value || 0)}
                      {deal.company && ` • ${deal.company.name}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {deal.attentionReasons.map((reason: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Top performers this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Group deals by owner and calculate metrics */}
            {Object.entries(
              deals.reduce((acc, deal) => {
                const owner = deal.ownerId || 'unassigned';
                if (!acc[owner]) {
                  acc[owner] = {
                    closedWon: 0,
                    totalValue: 0,
                    activitiesCount: 0,
                    name: users.find(u => u.id === owner)?.name || 'Unassigned',
                  };
                }
                if (deal.stage === 'closed-won') {
                  acc[owner].closedWon++;
                  acc[owner].totalValue += deal.value;
                }
                // Count activities for this owner's deals
                acc[owner].activitiesCount += activities.filter(
                  a => a.dealId === deal.id
                ).length;
                return acc;
              }, {} as Record<string, any>)
            )
              .sort(([, a], [, b]) => b.totalValue - a.totalValue)
              .slice(0, 3)
              .map(([ownerId, stats], index) => (
                <div key={ownerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {stats.name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.closedWon} deals • {formatCurrency(stats.totalValue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{stats.activitiesCount}</p>
                    <p className="text-xs text-muted-foreground">activities</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>


      {/* Stage Duration Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Duration</CardTitle>
          <CardDescription>Average days in each stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stageVelocity)
              .sort(([, a], [, b]) => a - b)
              .map(([stage, avgDays]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm capitalize">{stage.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{Math.round(avgDays)}</span>
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/deals/new">
                <Plus className="mr-2 h-4 w-4" />
                New Deal
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/contacts/new">
                <UserPlus className="mr-2 h-4 w-4" />
                New Contact
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/activities/new">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Activity
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/companies/new">
                <Building className="mr-2 h-4 w-4" />
                New Company
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {companies.length} companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => {
                const date = new Date(a.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activities.filter(a => {
                const date = new Date(a.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date >= today;
              }).length} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesVelocity?.avgDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {deals.filter(d => d.stage === "closed-won").length} deals closed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}