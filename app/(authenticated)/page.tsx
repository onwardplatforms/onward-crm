"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, TrendingUp, Activity, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { DEAL_STAGES, ACTIVITY_TYPES } from "@/lib/types";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCompanies: 0,
    openDeals: 0,
    pipelineValue: 0,
    dealsByStage: {} as Record<string, { count: number; value: number }>,
    recentActivities: [] as any[],
    upcomingActivities: [] as any[],
    conversionRate: 0,
    monthlyGrowth: {
      contacts: 0,
      companies: 0,
      deals: 0,
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [contactsRes, companiesRes, dealsRes, activitiesRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/companies"),
        fetch("/api/deals"),
        fetch("/api/activities"),
      ]);

      const contactsData = contactsRes.ok ? await contactsRes.json() : [];
      const companiesData = companiesRes.ok ? await companiesRes.json() : [];
      const dealsData = dealsRes.ok ? await dealsRes.json() : [];
      const activitiesData = activitiesRes.ok ? await activitiesRes.json() : [];

      // Ensure all data is arrays
      const contacts = Array.isArray(contactsData) ? contactsData : [];
      const companies = Array.isArray(companiesData) ? companiesData : [];
      const deals = Array.isArray(dealsData) ? dealsData : [];
      const activities = Array.isArray(activitiesData) ? activitiesData : [];

      // Calculate deal statistics
      const openDeals = deals.filter((d: any) => 
        d.stage !== "closed-won" && d.stage !== "closed-lost"
      );
      
      const pipelineValue = openDeals.reduce((sum: number, deal: any) => 
        sum + (parseFloat(deal.value) || 0), 0
      );

      // Calculate deals by stage
      const dealsByStage: Record<string, { count: number; value: number }> = {};
      DEAL_STAGES.forEach(stage => {
        const stageDeals = deals.filter((d: any) => d.stage === stage.value);
        dealsByStage[stage.value] = {
          count: stageDeals.length,
          value: stageDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.value) || 0), 0)
        };
      });

      // Calculate conversion rate
      const closedWonDeals = deals.filter((d: any) => d.stage === "closed-won");
      const closedDeals = deals.filter((d: any) => 
        d.stage === "closed-won" || d.stage === "closed-lost"
      );
      const conversionRate = closedDeals.length > 0 
        ? (closedWonDeals.length / closedDeals.length) * 100 
        : 0;

      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get recent activities (past activities only - before today)
      const recentActivities = activities
        .filter((a: any) => new Date(a.date) < today)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      // Get upcoming activities (today and future)
      const upcomingActivities = activities
        .filter((a: any) => new Date(a.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

      setStats({
        totalContacts: contacts.length,
        totalCompanies: companies.length,
        openDeals: openDeals.length,
        pipelineValue,
        dealsByStage,
        recentActivities,
        upcomingActivities,
        conversionRate,
        monthlyGrowth: {
          contacts: 0, // Would need historical data
          companies: 0,
          deals: 0,
        }
      });
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
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyGrowth.contacts > 0 ? '+' : ''}{stats.monthlyGrowth.contacts}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyGrowth.companies > 0 ? '+' : ''}{stats.monthlyGrowth.companies}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openDeals}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pipelineValue)} pipeline value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Win rate this period</p>
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
              {stats.recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities</p>
              ) : (
                stats.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), "MMM d, yyyy")}
                        {activity.contacts?.length > 0 && 
                          ` • ${activity.contacts[0].firstName} ${activity.contacts[0].lastName}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming activities</p>
              ) : (
                stats.upcomingActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), "MMM d, yyyy")}
                        {activity.deal && ` • ${activity.deal.name}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
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
            <div className="grid grid-cols-7 gap-2 text-sm">
              {DEAL_STAGES.map((stage) => {
                const stageData = stats.dealsByStage[stage.value] || { count: 0, value: 0 };
                return (
                  <div key={stage.value} className="text-center">
                    <div className="font-medium text-xs uppercase text-muted-foreground truncate">
                      {stage.label}
                    </div>
                    <div className="text-xl font-bold mt-1">{stageData.count}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {formatCurrency(stageData.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}