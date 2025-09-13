import { addDays, subDays, startOfMonth, endOfMonth, differenceInDays, format } from "date-fns";

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  closeDate?: string | Date | null;
  probability?: number | null;
  transitions?: { fromStage: string; toStage: string; transitionAt: string | Date }[];
}

export interface Activity {
  id: string;
  type: string;
  date: string | Date;
  createdAt: string | Date;
}

// Calculate average time deals spend in each stage
export function calculateStageVelocity(deals: Deal[]) {
  const stageTimings: Record<string, number[]> = {};
  
  deals.forEach(deal => {
    if (deal.transitions && deal.transitions.length > 0) {
      deal.transitions.forEach((transition, index) => {
        if (index > 0) {
          const prevTransition = deal.transitions![index - 1];
          const daysInStage = differenceInDays(
            new Date(transition.transitionAt),
            new Date(prevTransition.transitionAt)
          );
          
          if (!stageTimings[prevTransition.toStage]) {
            stageTimings[prevTransition.toStage] = [];
          }
          stageTimings[prevTransition.toStage].push(daysInStage);
        }
      });
    }
  });
  
  // Calculate averages
  const averages: Record<string, number> = {};
  Object.keys(stageTimings).forEach(stage => {
    const times = stageTimings[stage];
    averages[stage] = times.reduce((a, b) => a + b, 0) / times.length;
  });
  
  return averages;
}

// Calculate win rate by stage
export function calculateWinRateByStage(deals: Deal[]) {
  const stages = ["lead", "qualified", "proposal", "negotiation", "closed-won"];
  const stageStats: Record<string, { total: number; won: number }> = {};
  
  stages.forEach(stage => {
    stageStats[stage] = { total: 0, won: 0 };
  });
  
  deals.forEach(deal => {
    // Track which stages this deal has been through
    const dealStages = new Set<string>();
    dealStages.add(deal.stage);
    
    if (deal.transitions) {
      deal.transitions.forEach(t => {
        dealStages.add(t.fromStage);
        dealStages.add(t.toStage);
      });
    }
    
    // Count this deal for each stage it's been through
    dealStages.forEach(stage => {
      if (stageStats[stage]) {
        stageStats[stage].total++;
        if (deal.stage === "closed-won") {
          stageStats[stage].won++;
        }
      }
    });
  });
  
  return Object.entries(stageStats).map(([stage, stats]) => ({
    stage,
    winRate: stats.total > 0 ? (stats.won / stats.total) * 100 : 0,
    total: stats.total,
    won: stats.won
  }));
}

// Calculate pipeline value over time (last 6 months)
export function calculatePipelineTrend(deals: Deal[]) {
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = subDays(today, i * 30);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    // Calculate pipeline value for this month
    const monthDeals = deals.filter(deal => {
      const createdDate = new Date(deal.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd &&
             deal.stage !== "closed-lost";
    });
    
    const totalValue = monthDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    months.push({
      month: format(date, "MMM"),
      value: totalValue,
      deals: monthDeals.length
    });
  }
  
  return months;
}

// Calculate activity effectiveness (activities to deals ratio)
export function calculateActivityEffectiveness(activities: Activity[], deals: Deal[]) {
  const weeks = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = subDays(today, i * 7);
    const weekEnd = addDays(weekStart, 7);
    
    const weekActivities = activities.filter(a => {
      const date = new Date(a.date);
      return date >= weekStart && date < weekEnd;
    });
    
    const weekDeals = deals.filter(d => {
      const date = new Date(d.createdAt);
      return date >= weekStart && date < weekEnd;
    });
    
    weeks.push({
      week: format(weekStart, "MMM d"),
      activities: weekActivities.length,
      newDeals: weekDeals.length,
      ratio: weekActivities.length > 0 ? weekDeals.length / weekActivities.length : 0
    });
  }
  
  return weeks;
}

// Calculate deals needing attention
export function getDealsNeedingAttention(deals: Deal[]) {
  const attentionNeeded = [];
  const today = new Date();
  
  for (const deal of deals) {
    const reasons = [];
    
    // Stale deals (no update in 14+ days)
    const daysSinceUpdate = differenceInDays(today, new Date(deal.updatedAt));
    if (daysSinceUpdate > 14 && !["closed-won", "closed-lost"].includes(deal.stage)) {
      reasons.push(`No update in ${daysSinceUpdate} days`);
    }
    
    // Past close date
    if (deal.closeDate && new Date(deal.closeDate) < today && 
        !["closed-won", "closed-lost"].includes(deal.stage)) {
      reasons.push("Past expected close date");
    }
    
    // Low probability but high value
    if (deal.probability && deal.probability < 30 && deal.value > 50000) {
      reasons.push("High value at risk");
    }
    
    if (reasons.length > 0) {
      attentionNeeded.push({
        ...deal,
        attentionReasons: reasons
      });
    }
  }
  
  return attentionNeeded.slice(0, 5); // Top 5 deals needing attention
}

// Calculate sales velocity (deals * win rate * avg deal size / sales cycle length)
export function calculateSalesVelocity(deals: Deal[]) {
  const closedWonDeals = deals.filter(d => d.stage === "closed-won");
  const closedLostDeals = deals.filter(d => d.stage === "closed-lost");
  const openDeals = deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage));
  
  if (closedWonDeals.length === 0 && closedLostDeals.length === 0) return 0;
  
  // Win rate is wins / (wins + losses), not including deals in pipeline
  const totalClosed = closedWonDeals.length + closedLostDeals.length;
  const winRate = totalClosed > 0 ? closedWonDeals.length / totalClosed : 0;
  const avgDealSize = closedWonDeals.length > 0 
    ? closedWonDeals.reduce((sum, d) => sum + (d.value || 0), 0) / closedWonDeals.length
    : 0;
  
  // Calculate average sales cycle
  const cycleLengths = closedWonDeals
    .filter(d => d.closeDate)
    .map(d => differenceInDays(new Date(d.closeDate!), new Date(d.createdAt)));
  
  const avgCycleLength = cycleLengths.length > 0 
    ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
    : 30; // Default to 30 days if no data
  
  // Sales velocity formula (using open deals in pipeline)
  const velocity = (openDeals.length * winRate * avgDealSize) / avgCycleLength;
  
  return {
    velocity: Math.round(velocity),
    winRate: winRate * 100,
    avgDealSize,
    avgCycleLength: Math.round(avgCycleLength),
    qualifiedDeals: openDeals.length
  };
}

// Calculate forecast based on pipeline and historical win rates
export function calculateForecast(deals: Deal[]) {
  const forecast = [];
  const today = new Date();
  
  // Default probabilities by stage if not set on deal
  const stageProbabilities: Record<string, number> = {
    'prospect': 10,
    'qualified': 30,
    'demo': 50,
    'proposal': 75,
    'closed-won': 100,
    'closed-lost': 0
  };
  
  for (let i = 0; i < 3; i++) {
    const monthDate = addDays(today, i * 30);
    const month = format(monthDate, "MMM");
    
    // Get open deals (use all open deals if no closeDate set)
    const monthDeals = deals.filter(d => {
      if (["closed-won", "closed-lost"].includes(d.stage)) return false;
      
      // If no closeDate, include in current month forecast
      if (!d.closeDate && i === 0) return true;
      if (!d.closeDate) return false;
      
      const closeDate = new Date(d.closeDate);
      return closeDate >= addDays(today, i * 30) && closeDate < addDays(today, (i + 1) * 30);
    });
    
    // Calculate weighted pipeline (value * probability)
    const committed = monthDeals
      .filter(d => {
        const prob = d.probability ?? stageProbabilities[d.stage] ?? 0;
        return prob >= 70;
      })
      .reduce((sum, d) => sum + (d.value || 0), 0);
    
    const bestCase = monthDeals
      .reduce((sum, d) => sum + (d.value || 0), 0);
    
    const weighted = monthDeals
      .reduce((sum, d) => {
        const prob = d.probability ?? stageProbabilities[d.stage] ?? 0;
        return sum + ((d.value || 0) * (prob / 100));
      }, 0);
    
    forecast.push({
      month,
      committed,
      bestCase,
      weighted
    });
  }
  
  return forecast;
}