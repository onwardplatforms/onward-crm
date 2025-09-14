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
import { CompanyForm } from "@/components/forms/company-form";
import { ContactForm } from "@/components/forms/contact-form";
import { DealForm } from "@/components/forms/deal-form";
import { ActivityForm } from "@/components/forms/activity-form";

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

interface Deal {
  id: string;
  name: string;
  value?: number;
  stage: string;
  closeDate?: string | Date | null;
  probability?: number;
  company?: { name: string };
  contact?: { firstName: string; lastName: string };
  assignedTo?: { id: string; name?: string; email: string };
  user?: { id: string; name?: string; email: string };
  assignedToId?: string;
  userId?: string;
  updatedAt: string | Date;
  createdAt: string | Date;
  attentionReasons?: string[];
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  date: string | Date;
  contacts?: Array<{ id: string }>;
  dealId?: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: { name: string };
}

interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
}

interface SalesVelocityMetrics {
  velocity: number;
  winRate: number;
  avgDealSize: number;
  avgCycleLength: number;
  qualifiedDeals: number;
}

interface StageMetrics {
  stage: string;
  winRate: number;
  total: number;
  won: number;
}

interface PipelineMetric {
  month: string;
  value: number;
  deals: number;
}

interface ForecastMetric {
  month: string;
  committed: number;
  bestCase: number;
  weighted: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Form states for quick actions
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  
  // Calculated metrics
  const [salesVelocity, setSalesVelocity] = useState<SalesVelocityMetrics | null>(null);
  const [stageVelocity, setStageVelocity] = useState<Record<string, number>>({});
  const [pipelineTrend, setPipelineTrend] = useState<PipelineMetric[]>([]);
  const [winRateByStage, setWinRateByStage] = useState<StageMetrics[]>([]);
  const [dealsNeedingAttention, setDealsNeedingAttention] = useState<Deal[]>([]);
  const [forecast, setForecast] = useState<ForecastMetric[]>([]);

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
      const salesVelocityResult = calculateSalesVelocity(deals);
      setSalesVelocity(salesVelocityResult === 0 ? null : salesVelocityResult);
      setStageVelocity(calculateStageVelocity(deals));
      setPipelineTrend(calculatePipelineTrend(deals));
      setWinRateByStage(calculateWinRateByStage(deals));
      setDealsNeedingAttention(getDealsNeedingAttention(deals) as Deal[]);
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
            <div className="flex items-center text-xs mt-1">
              <span className="font-medium">{openDeals.length}</span>
              <span className="text-muted-foreground ml-1">open deals</span>
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
                <ArrowUp className="h-3 w-3 text-muted-foreground mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-muted-foreground mr-1" />
              )}
              <span className="font-medium">
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
            <div className="text-xs mt-1">
              <span className="text-muted-foreground">Avg deal: </span>
              <span className="font-medium">{formatCurrency(salesVelocity?.avgDealSize || 0)}</span>
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
            <div className="text-xs mt-1">
              <span className="font-medium">{salesVelocity?.avgCycleLength || 0}</span>
              <span className="text-muted-foreground ml-1">day avg cycle</span>
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
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(value) => formatCompactCurrency(value)}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="value"
                    fill="currentColor"
                    className="fill-foreground"
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
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar 
                    dataKey="weighted" 
                    fill="currentColor"
                    className="fill-foreground"
                    radius={[12, 12, 0, 0]} 
                  />
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
              {activities.length > 0 ? (
                Object.entries(
                  activities.reduce((acc, activity) => {
                    const type = activity.type;
                    if (!acc[type]) acc[type] = 0;
                    acc[type]++;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([type, count]) => {
                    const total = activities.length;
                    const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
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
                          <span className="font-medium">{count as number}</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activities logged yet</p>
                  <p className="text-xs mt-1">Click &ldquo;Log Activity&rdquo; to get started</p>
                </div>
              )}
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
                      {deal.attentionReasons?.map((reason: string, i: number) => (
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
                const owner = deal.assignedToId || deal.userId || 'unassigned';
                if (!acc[owner]) {
                  // First, try to get the name from the deal's assignedTo object
                  // Then try to find the user in the users list
                  // Finally fall back to 'Unassigned'
                  let ownerName = 'Unassigned';
                  if (deal.assignedTo?.name) {
                    ownerName = deal.assignedTo.name;
                  } else if (deal.user?.name) {
                    ownerName = deal.user.name;
                  } else {
                    const foundUser = users.find(u => u.id === owner);
                    if (foundUser?.name) {
                      ownerName = foundUser.name;
                    }
                  }
                  
                  acc[owner] = {
                    dealsCount: 0,
                    closedWon: 0,
                    totalValue: 0,
                    activitiesCount: 0,
                    name: ownerName,
                  };
                }
                if (deal.stage === 'closed-won') {
                  acc[owner].closedWon++;
                  acc[owner].totalValue += deal.value || 0;
                }
                // Count activities for this owner's deals
                acc[owner].activitiesCount += activities.filter(
                  a => a.dealId === deal.id
                ).length;
                return acc;
              }, {} as Record<string, { name: string; dealsCount: number; closedWon: number; totalValue: number; activitiesCount: number }>)
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
              .sort(([, a], [, b]) => (a as number) - (b as number))
              .map(([stage, avgDays]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm capitalize">{stage.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{Math.round(avgDays as number)}</span>
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
            <Button 
              variant="outline" 
              className="justify-start" 
              onClick={() => setDealFormOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setContactFormOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              New Contact
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setActivityFormOpen(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Log Activity
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setCompanyFormOpen(true)}
            >
              <Building className="mr-2 h-4 w-4" />
              New Company
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

      {/* Form Modals for Quick Actions */}
      <DealForm
        open={dealFormOpen}
        onOpenChange={setDealFormOpen}
        onSuccess={() => {
          setDealFormOpen(false);
          fetchDashboardData();
        }}
      />
      
      <ContactForm
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        onSuccess={() => {
          setContactFormOpen(false);
          fetchDashboardData();
        }}
      />
      
      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        onSuccess={() => {
          setActivityFormOpen(false);
          fetchDashboardData();
        }}
      />
      
      <CompanyForm
        open={companyFormOpen}
        onOpenChange={setCompanyFormOpen}
        onSuccess={() => {
          setCompanyFormOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}