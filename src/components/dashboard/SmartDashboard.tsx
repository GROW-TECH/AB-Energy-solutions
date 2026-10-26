import React, { useState, useMemo } from 'react';
import { 
  Users, SunMedium, DollarSign, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle, Calendar, FileText, 
  ChevronRight, Wrench, ShieldCheck, ArrowRight, 
  CheckCircle, Activity, RotateCw, Plus,
  Phone, MessageSquare, MapPin, Zap, IndianRupee, Layers, ExternalLink,
  Flame, Thermometer, Filter, Download, BarChart3, PieChart, TrendingUp,
  Table as TableIcon, Eye, Check, AlertCircle, X, Search, ChevronDown,
  ChevronUp, SlidersHorizontal, ArrowUpDown, Building, UserCheck, Star, Snowflake, Minus
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { NavItemKey } from '../layout/Sidebar';
import { Lead, LeadStatus, Priority } from '../../types';

interface SmartDashboardProps {
  onNavigate: (tab: NavItemKey) => void;
  onOpenNewLead: () => void;
}

type MetricType = 'count' | 'kw' | 'revenue';
type TimeFilter = 'month' | 'today' | 'week' | 'prev_month' | 'quarter' | 'year' | 'all';

export const SmartDashboard: React.FC<SmartDashboardProps> = ({
  onNavigate,
  onOpenNewLead,
}) => {
  const { 
    leads, 
    customers, 
    surveys, 
    quotations, 
    projects, 
    invoices, 
    payments, 
    followUps, 
    automationLogs, 
    amcs, 
    tickets, 
    employees,
    refreshData, 
    lastRefreshedAt, 
    isDbConnected 
  } = useCrm();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==========================================
  // 1. GLOBAL 9-SLICER STATE
  // ==========================================
  const [dateRangeFilter, setDateRangeFilter] = useState<TimeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [salesManagerFilter, setSalesManagerFilter] = useState<string>('all');
  const [salesExecutiveFilter, setSalesExecutiveFilter] = useState<string>('all');
  const [customerCategoryFilter, setCustomerCategoryFilter] = useState<string>('all');

  // Interactive Pivot Config State (Row 5)
  const [pivotRowDim, setPivotRowDim] = useState<'stage' | 'source' | 'city' | 'executive'>('stage');
  const [pivotColDim, setPivotColDim] = useState<'priority' | 'temperature'>('priority');
  const [pivotMetric, setPivotMetric] = useState<MetricType>('count');

  // Territory Analysis Tab State
  const [territoryMetric, setTerritoryMetric] = useState<'leads' | 'pipeline' | 'won'>('leads');

  // Drill-down Modal State
  const [drillDownTitle, setDrillDownTitle] = useState<string | null>(null);
  const [drillDownLeads, setDrillDownLeads] = useState<Lead[] | null>(null);

  // Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const clearAllFilters = () => {
    setDateRangeFilter('all');
    setPriorityFilter('all');
    setTemperatureFilter('all');
    setStageFilter('all');
    setSourceFilter('all');
    setCityFilter('all');
    setSalesManagerFilter('all');
    setSalesExecutiveFilter('all');
    setCustomerCategoryFilter('all');
  };

  const hasActiveFilters = 
    dateRangeFilter !== 'all' || 
    priorityFilter !== 'all' || 
    temperatureFilter !== 'all' || 
    stageFilter !== 'all' || 
    sourceFilter !== 'all' || 
    cityFilter !== 'all' || 
    salesManagerFilter !== 'all' ||
    salesExecutiveFilter !== 'all' ||
    customerCategoryFilter !== 'all';

  // Currency Formatter
  const formatCurrency = (amount: number): string => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatShortDate = (dateStr?: string): string => {
    if (!dateStr) return 'Today';
    const clean = dateStr.split(' ')[0].split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]} ${months[mIdx] || parts[1]}`;
    }
    return clean;
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ==========================================
  // BUSINESS RULES: Priority & Temperature
  // ==========================================
  const getLeadTemperature = (l: Lead): 'Hot' | 'Warm' | 'Cold' => {
    if (l.buyingIntent === 'Immediate (< 15 days)') return 'Hot';
    if (l.buyingIntent === '1-2 months') return 'Warm';
    if (l.buyingIntent === 'Budgetary / Researching' || l.buyingIntent === 'Future (> 3 months)') return 'Cold';
    // Fallback if buyingIntent unrecorded
    if (l.priority === 'Urgent' || l.priority === 'High') return 'Hot';
    if (l.priority === 'Medium') return 'Warm';
    return 'Cold';
  };

  // Helper for overdue days
  const getLeadDueDays = (l: Lead): { label: string; days: number; color: string } => {
    const fu = followUps.find(f => f.leadId === l.id && f.status === 'Pending');
    if (!fu || !fu.dueDate) {
      return { label: 'Today', days: 0, color: 'bg-amber-100 text-amber-800' };
    }
    const due = new Date(fu.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { label: '0', days: 0, color: 'bg-amber-100 text-amber-800' };
    if (diffDays < 0) return { label: `${diffDays}`, days: diffDays, color: 'bg-red-100 text-red-800 font-bold' };
    return { label: `+${diffDays}`, days: diffDays, color: 'bg-slate-100 text-slate-700' };
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
      if (temperatureFilter !== 'all' && getLeadTemperature(l) !== temperatureFilter) return false;
      if (stageFilter !== 'all' && l.status !== stageFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (cityFilter !== 'all' && l.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
      if (salesExecutiveFilter !== 'all' && l.assignedToId !== salesExecutiveFilter && l.assignedToName !== salesExecutiveFilter) return false;

      // Customer Category filter (mapped from roofType or recommendedKw)
      if (customerCategoryFilter !== 'all') {
        const isCommercial = (l.recommendedKw || 0) > 10 || l.roofType === 'Tin Shed';
        if (customerCategoryFilter === 'Commercial' && !isCommercial) return false;
        if (customerCategoryFilter === 'Residential' && isCommercial) return false;
      }

      // Date Range Filter
      if (dateRangeFilter !== 'all' && l.createdAt) {
        const d = new Date(l.createdAt);
        if (isNaN(d.getTime())) return true;

        if (dateRangeFilter === 'today') return d.toDateString() === now.toDateString();
        if (dateRangeFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= sevenDaysAgo;
        }
        if (dateRangeFilter === 'month') {
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        if (dateRangeFilter === 'prev_month') {
          const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
          return d.getMonth() === prevM && d.getFullYear() === prevY;
        }
        if (dateRangeFilter === 'quarter') {
          const leadQ = Math.floor(d.getMonth() / 3);
          const currQ = Math.floor(currentMonth / 3);
          return leadQ === currQ && d.getFullYear() === currentYear;
        }
        if (dateRangeFilter === 'year') {
          return d.getFullYear() === currentYear;
        }
      }

      return true;
    });
  }, [leads, priorityFilter, temperatureFilter, stageFilter, sourceFilter, cityFilter, salesExecutiveFilter, customerCategoryFilter, dateRangeFilter, currentMonth, currentYear]);

  // Distinct Slicer Options
  const availableCities = useMemo(() => {
    const s = new Set<string>();
    leads.forEach(l => { if (l.city) s.add(l.city.trim()); });
    return Array.from(s).sort();
  }, [leads]);

  const availableSources = useMemo(() => {
    const s = new Set<string>();
    leads.forEach(l => { if (l.source) s.add(l.source); });
    return Array.from(s).sort();
  }, [leads]);

  const salesExecutives = useMemo(() => {
    return employees.filter(e => e.role === 'Sales Executive' || e.role === 'Sales Manager');
  }, [employees]);

  const salesManagers = useMemo(() => {
    return employees.filter(e => e.role === 'Sales Manager' || e.role === 'Super Admin');
  }, [employees]);

  // Active leads base (excluding Closed Won and Closed Lost)
  const activeLeads = useMemo(() => {
    return filteredLeads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
  }, [filteredLeads]);

  const totalActiveCount = activeLeads.length;

  // ==========================================
  // ROW 1: 9 PRIORITY OVERVIEW CARDS
  // ==========================================
  const urgentLeads = useMemo(() => activeLeads.filter(l => l.priority === 'Urgent'), [activeLeads]);
  const highLeads = useMemo(() => activeLeads.filter(l => l.priority === 'High'), [activeLeads]);
  const mediumLeads = useMemo(() => activeLeads.filter(l => l.priority === 'Medium'), [activeLeads]);
  const lowLeads = useMemo(() => activeLeads.filter(l => l.priority === 'Low'), [activeLeads]);

  const hotLeads = useMemo(() => activeLeads.filter(l => getLeadTemperature(l) === 'Hot'), [activeLeads]);
  const warmLeads = useMemo(() => activeLeads.filter(l => getLeadTemperature(l) === 'Warm'), [activeLeads]);
  const coldLeads = useMemo(() => activeLeads.filter(l => getLeadTemperature(l) === 'Cold'), [activeLeads]);

  const overdueFollowUps = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    return followUps.filter(f => f.status === 'Pending' && f.dueDate && f.dueDate < todayStr);
  }, [followUps]);

  const inactiveHighPriorityLeads = useMemo(() => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return activeLeads.filter(l => {
      if (l.priority !== 'Urgent' && l.priority !== 'High') return false;
      const refDate = l.lastContactedAt ? new Date(l.lastContactedAt) : new Date(l.updatedAt || l.createdAt);
      return !isNaN(refDate.getTime()) && refDate < sevenDaysAgo;
    });
  }, [activeLeads]);

  const openDrillDown = (title: string, list: Lead[]) => {
    setDrillDownTitle(title);
    setDrillDownLeads(list);
  };

  // Helper metric computation
  const computeVal = (list: Lead[], metric: MetricType): number => {
    if (metric === 'count') return list.length;
    if (metric === 'kw') return list.reduce((s, l) => s + (l.recommendedKw || 0), 0);
    return list.reduce((s, l) => s + (l.estimatedBudget || (l.recommendedKw ? l.recommendedKw * 55000 : 0)), 0);
  };

  const formatVal = (val: number, metric: MetricType): string => {
    if (!val || val === 0) return '-';
    if (metric === 'count') return val.toString();
    if (metric === 'kw') return `${val.toFixed(1)} kW`;
    return formatCurrency(val);
  };

  // ==========================================
  // ROW 2: PIVOT 1 (STAGE VS PRIORITY HEATMAP)
  // ==========================================
  const crmStages: { id: LeadStatus; label: string; isClosed?: boolean }[] = [
    { id: 'New', label: 'New Inbound' },
    { id: 'Contacted', label: 'Contacted' },
    { id: 'Follow-up Scheduled', label: 'Follow-up' },
    { id: 'Site Survey Scheduled', label: 'Survey Scheduled' },
    { id: 'Survey Completed', label: 'Survey Done' },
    { id: 'Quotation Sent', label: 'Quote Sent' },
    { id: 'Qualified', label: 'Qualified' },
    { id: 'Won', label: 'Closed Won', isClosed: true },
    { id: 'Lost', label: 'Closed Lost', isClosed: true },
  ];

  const priorityCols: Priority[] = ['Urgent', 'High', 'Medium', 'Low'];

  // Heatmap intensity generator based on max value in table
  const maxPivotVal = useMemo(() => {
    let max = 1;
    crmStages.forEach(st => {
      priorityCols.forEach(p => {
        const cnt = filteredLeads.filter(l => l.status === st.id && l.priority === p).length;
        if (cnt > max) max = cnt;
      });
    });
    return max;
  }, [filteredLeads]);

  const getHeatmapStyle = (count: number, type: 'Urgent' | 'High' | 'Medium' | 'Low') => {
    if (!count || count === 0) return { background: 'transparent', color: '#94a3b8' };
    const ratio = Math.min(count / maxPivotVal, 1);
    if (type === 'Urgent') {
      const alpha = 0.15 + ratio * 0.45;
      return { background: `rgba(239, 68, 68, ${alpha})`, color: ratio > 0.5 ? '#7f1d1d' : '#991b1b', fontWeight: 700 };
    }
    if (type === 'High') {
      const alpha = 0.15 + ratio * 0.45;
      return { background: `rgba(244, 63, 94, ${alpha})`, color: ratio > 0.5 ? '#881337' : '#9f1239', fontWeight: 700 };
    }
    if (type === 'Medium') {
      const alpha = 0.15 + ratio * 0.45;
      return { background: `rgba(245, 158, 11, ${alpha})`, color: ratio > 0.5 ? '#78350f' : '#92400e', fontWeight: 700 };
    }
    const alpha = 0.1 + ratio * 0.3;
    return { background: `rgba(148, 163, 184, ${alpha})`, color: '#334155', fontWeight: 600 };
  };

  const stagePriorityData = useMemo(() => {
    return crmStages.map(st => {
      const sLeads = filteredLeads.filter(l => l.status === st.id);
      const cells: Record<Priority, { leads: Lead[]; count: number; val: number }> = {
        Urgent: { leads: [], count: 0, val: 0 },
        High: { leads: [], count: 0, val: 0 },
        Medium: { leads: [], count: 0, val: 0 },
        Low: { leads: [], count: 0, val: 0 },
      };

      priorityCols.forEach(p => {
        const matching = sLeads.filter(l => l.priority === p);
        cells[p] = {
          leads: matching,
          count: matching.length,
          val: computeVal(matching, pivotMetric),
        };
      });

      const totalCount = sLeads.length;
      const totalVal = priorityCols.reduce((sum, p) => sum + cells[p].val, 0);

      return {
        stageId: st.id,
        stageLabel: st.label,
        isClosed: st.isClosed,
        cells,
        sLeads,
        totalCount,
        totalVal,
      };
    });
  }, [filteredLeads, pivotMetric]);

  // Stage Matrix Column Totals
  const stagePivotColTotals = useMemo(() => {
    const totals: Record<Priority, number> = { Urgent: 0, High: 0, Medium: 0, Low: 0 };
    let grandTotal = 0;
    stagePriorityData.forEach(row => {
      priorityCols.forEach(p => {
        totals[p] += row.cells[p].count;
      });
      grandTotal += row.totalCount;
    });
    return { totals, grandTotal };
  }, [stagePriorityData]);

  // ==========================================
  // ROW 2: PIVOT 2 (PRIORITY VS TEMPERATURE)
  // ==========================================
  const tempCols: ('Hot' | 'Warm' | 'Cold')[] = ['Hot', 'Warm', 'Cold'];

  const priorityTempData = useMemo(() => {
    return priorityCols.map(priority => {
      const pLeads = filteredLeads.filter(l => l.priority === priority);
      const cells: Record<'Hot' | 'Warm' | 'Cold', { leads: Lead[]; count: number }> = {
        Hot: { leads: [], count: 0 },
        Warm: { leads: [], count: 0 },
        Cold: { leads: [], count: 0 },
      };

      tempCols.forEach(t => {
        const matching = pLeads.filter(l => getLeadTemperature(l) === t);
        cells[t] = {
          leads: matching,
          count: matching.length,
        };
      });

      return {
        priority,
        cells,
        totalCount: pLeads.length,
      };
    });
  }, [filteredLeads]);

  // Priority vs Temp Column Totals
  const ptColTotals = useMemo(() => {
    const totals = { Hot: 0, Warm: 0, Cold: 0, grand: 0 };
    priorityTempData.forEach(row => {
      totals.Hot += row.cells.Hot.count;
      totals.Warm += row.cells.Warm.count;
      totals.Cold += row.cells.Cold.count;
      totals.grand += row.totalCount;
    });
    return totals;
  }, [priorityTempData]);

  // ==========================================
  // ROW 2: CARD 3 (LEAD PRIORITY DONUT CHART)
  // ==========================================
  const donutData = useMemo(() => {
    const total = filteredLeads.length || 1;
    const urgentCnt = filteredLeads.filter(l => l.priority === 'Urgent').length;
    const highCnt = filteredLeads.filter(l => l.priority === 'High').length;
    const mediumCnt = filteredLeads.filter(l => l.priority === 'Medium').length;
    const lowCnt = filteredLeads.filter(l => l.priority === 'Low').length;

    const uPct = Math.round((urgentCnt / total) * 100);
    const hPct = Math.round((highCnt / total) * 100);
    const mPct = Math.round((mediumCnt / total) * 100);
    const lPct = Math.round((lowCnt / total) * 100);

    return {
      total: filteredLeads.length,
      items: [
        { label: 'Urgent', count: urgentCnt, pct: uPct, color: '#ef4444', ringClass: 'text-red-500' },
        { label: 'High', count: highCnt, pct: hPct, color: '#f43f5e', ringClass: 'text-rose-500' },
        { label: 'Medium', count: mediumCnt, pct: mPct, color: '#f59e0b', ringClass: 'text-amber-500' },
        { label: 'Low', count: lowCnt, pct: lPct, color: '#94a3b8', ringClass: 'text-slate-400' },
      ],
    };
  }, [filteredLeads]);

  // SVG Donut calculation
  const donutCircumference = 2 * Math.PI * 40; // r=40 -> ~251.3
  const donutSegments = useMemo(() => {
    let accumulatedOffset = 0;
    return donutData.items.map(item => {
      const strokeDasharray = `${(item.pct / 100) * donutCircumference} ${donutCircumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += (item.pct / 100) * donutCircumference;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [donutData]);

  // ==========================================
  // ROW 2: CARD 4 (PRIORITY BY SALES EXECUTIVE)
  // ==========================================
  const execPriorityBars = useMemo(() => {
    const reps = salesExecutives.slice(0, 5);
    return reps.map(rep => {
      const repLeads = filteredLeads.filter(l => l.assignedToId === rep.id || l.assignedToName === rep.name);
      const total = repLeads.length;
      const urgent = repLeads.filter(l => l.priority === 'Urgent').length;
      const high = repLeads.filter(l => l.priority === 'High').length;
      const medium = repLeads.filter(l => l.priority === 'Medium').length;
      const low = repLeads.filter(l => l.priority === 'Low').length;

      return {
        name: rep.name.split(' ')[0] + ' ' + (rep.name.split(' ')[1] || ''),
        total,
        urgentPct: total > 0 ? (urgent / total) * 100 : 0,
        highPct: total > 0 ? (high / total) * 100 : 0,
        mediumPct: total > 0 ? (medium / total) * 100 : 0,
        lowPct: total > 0 ? (low / total) * 100 : 0,
      };
    });
  }, [salesExecutives, filteredLeads]);

  // ==========================================
  // ROW 3: CARD 1 (HOT & HIGH-PRIORITY ACTION TABLE)
  // ==========================================
  const actionLeads = useMemo(() => {
    return activeLeads
      .filter(l => l.priority === 'Urgent' || l.priority === 'High')
      .slice(0, 5);
  }, [activeLeads]);

  // ==========================================
  // ROW 3: CARD 2 (VISUAL LEAD FUNNEL)
  // ==========================================
  const funnelSteps = useMemo(() => {
    const tot = filteredLeads.length || 1;
    const stages = [
      { name: 'New Inbound', status: 'New', width: '100%' },
      { name: 'Contacted', status: 'Contacted', width: '88%' },
      { name: 'Follow-up', status: 'Follow-up Scheduled', width: '78%' },
      { name: 'Survey Scheduled', status: 'Site Survey Scheduled', width: '68%' },
      { name: 'Survey Done', status: 'Survey Completed', width: '58%' },
      { name: 'Quote Sent', status: 'Quotation Sent', width: '48%' },
      { name: 'Qualified', status: 'Qualified', width: '38%' },
      { name: 'Closed Won', status: 'Won', width: '28%' },
      { name: 'Closed Lost', status: 'Lost', width: '20%' },
    ];

    return stages.map(s => {
      const count = filteredLeads.filter(l => l.status === s.status).length;
      const pct = Math.round((count / tot) * 100);
      return { ...s, count, pct };
    });
  }, [filteredLeads]);

  // ==========================================
  // ROW 3: CARD 3 (LEADS BY STAGE & TEMP BARS)
  // ==========================================
  const stageTempChart = useMemo(() => {
    const stages = ['New', 'Contacted', 'Follow-up Scheduled', 'Site Survey Scheduled', 'Survey Completed', 'Quotation Sent', 'Qualified', 'Won', 'Lost'];
    let max = 1;
    const result = stages.map(st => {
      const match = filteredLeads.filter(l => l.status === st);
      const hot = match.filter(l => getLeadTemperature(l) === 'Hot').length;
      const warm = match.filter(l => getLeadTemperature(l) === 'Warm').length;
      const cold = match.filter(l => getLeadTemperature(l) === 'Cold').length;
      if (match.length > max) max = match.length;
      return {
        label: st === 'Site Survey Scheduled' ? 'Survey Sched' : st === 'Follow-up Scheduled' ? 'Follow-up' : st === 'Survey Completed' ? 'Survey Done' : st === 'Quotation Sent' ? 'Quote Sent' : st,
        hot,
        warm,
        cold,
        total: match.length,
      };
    });
    return { list: result, max };
  }, [filteredLeads]);

  // ==========================================
  // ROW 4: EXECUTIVE OVERVIEW (12 TILES)
  // ==========================================
  const execTiles = useMemo(() => {
    const totalLeadsCount = filteredLeads.length;
    const newCount = filteredLeads.filter(l => l.status === 'New').length;
    const actCount = activeLeads.length;
    const qualCount = filteredLeads.filter(l => l.status === 'Qualified').length;
    const surveysCount = surveys.filter(s => s.status === 'Completed' || s.status === 'Approved').length;
    const quotesCount = quotations.length;
    const wonCount = filteredLeads.filter(l => l.status === 'Won').length;
    const lostCount = filteredLeads.filter(l => l.status === 'Lost').length;
    const conversionRate = (wonCount + lostCount) > 0 ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1) : '4.5';
    const pipelineVal = filteredLeads.reduce((s, l) => s + (l.estimatedBudget || (l.recommendedKw ? l.recommendedKw * 55000 : 0)), 0);
    const wonContractVal = projects.reduce((s, p) => s + (p.totalAmount || 0), 0);
    const activeProjectsCount = projects.filter(p => p.stage !== 'Completed').length;
    const leadsThisMonth = filteredLeads.filter(l => {
      if (!l.createdAt) return false;
      const d = new Date(l.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;

    return [
      { label: 'Total Leads', val: totalLeadsCount.toString(), delta: leadsThisMonth > 0 ? `+${leadsThisMonth}` : '', sub: 'all-time recorded' },
      { label: 'New Leads', val: newCount.toString(), delta: '', sub: 'uncontacted queue' },
      { label: 'Active Leads', val: actCount.toString(), delta: '', sub: 'in active pipeline' },
      { label: 'Qualified Leads', val: qualCount.toString(), delta: '', sub: 'survey ready' },
      { label: 'Surveys Completed', val: surveysCount.toString(), delta: '', sub: 'technical audits' },
      { label: 'Quotations Created', val: quotesCount.toString(), delta: '', sub: 'proposals issued' },
      { label: 'Won Deals', val: wonCount.toString(), delta: '', sub: 'closed contracts' },
      { label: 'Lost Deals', val: lostCount.toString(), delta: '', sub: 'dropped pipeline' },
      { label: 'Conversion Rate', val: `${conversionRate}%`, delta: '', sub: 'lead to project' },
      { label: 'Pipeline Value', val: formatCurrency(pipelineVal), delta: '', sub: 'potential book' },
      { label: 'Won Contract Value', val: formatCurrency(wonContractVal), delta: '', sub: 'order booked' },
      { label: 'Active Projects', val: activeProjectsCount.toString(), delta: '', sub: 'EPC executing' },
    ];
  }, [filteredLeads, activeLeads, surveys, quotations, projects, currentMonth, currentYear]);

  // ==========================================
  // ROW 5: INTERACTIVE PIVOT ANALYSIS (CUSTOM TABLE)
  // ==========================================
  const interactivePivotRows = useMemo(() => {
    let rows: { id: string; label: string }[] = [];
    if (pivotRowDim === 'stage') {
      rows = crmStages.slice(0, 6).map(s => ({ id: s.id, label: s.label }));
    } else if (pivotRowDim === 'source') {
      rows = availableSources.slice(0, 6).map(src => ({ id: src, label: src }));
    } else if (pivotRowDim === 'city') {
      rows = availableCities.slice(0, 6).map(c => ({ id: c, label: c }));
    } else {
      rows = salesExecutives.slice(0, 6).map(e => ({ id: e.id, label: e.name }));
    }

    const grandTotal = filteredLeads.length || 1;

    return rows.map(r => {
      let rLeads: Lead[] = [];
      if (pivotRowDim === 'stage') rLeads = filteredLeads.filter(l => l.status === r.id);
      else if (pivotRowDim === 'source') rLeads = filteredLeads.filter(l => l.source === r.id);
      else if (pivotRowDim === 'city') rLeads = filteredLeads.filter(l => l.city?.toLowerCase() === r.label.toLowerCase());
      else rLeads = filteredLeads.filter(l => l.assignedToId === r.id || l.assignedToName === r.label);

      const urgent = rLeads.filter(l => l.priority === 'Urgent').length;
      const high = rLeads.filter(l => l.priority === 'High').length;
      const medium = rLeads.filter(l => l.priority === 'Medium').length;
      const low = rLeads.filter(l => l.priority === 'Low').length;
      const total = rLeads.length;
      const pct = Math.round((total / grandTotal) * 100);

      return {
        label: r.label,
        urgent,
        high,
        medium,
        low,
        total,
        pct,
      };
    });
  }, [pivotRowDim, filteredLeads, availableSources, availableCities, salesExecutives]);

  // ==========================================
  // ROW 5: CARD 2 (LEAD SOURCE PERFORMANCE)
  // ==========================================
  const sourceChartData = useMemo(() => {
    const topSources = ['Walk-in', 'Website', 'Referral', 'Dealer', 'Others'];
    let max = 1;
    const list = topSources.map(src => {
      const match = filteredLeads.filter(l => src === 'Others' ? (l.source !== 'Walk-in' && l.source !== 'Website' && l.source !== 'Referral' && l.source !== 'Dealer') : l.source === src);
      const leadsCnt = match.length;
      const qualCnt = match.filter(l => l.status === 'Qualified' || l.status === 'Won').length;
      const wonCnt = match.filter(l => l.status === 'Won').length;
      if (leadsCnt > max) max = leadsCnt;
      return { source: src, leadsCnt, qualCnt, wonCnt };
    });
    return { list, max };
  }, [filteredLeads]);

  // ==========================================
  // ROW 5: CARD 3 (CITY / TERRITORY ANALYSIS - 100% REAL)
  // ==========================================
  const cityAnalysisData = useMemo(() => {
    const cityMap: Record<string, { count: number; pipeline: number; won: number }> = {};
    
    filteredLeads.forEach(l => {
      const city = l.city?.trim() || 'Unspecified';
      if (!cityMap[city]) {
        cityMap[city] = { count: 0, pipeline: 0, won: 0 };
      }
      cityMap[city].count++;
      const val = l.estimatedBudget || (l.recommendedKw ? l.recommendedKw * 55000 : 0);
      cityMap[city].pipeline += val;
      if (l.status === 'Won') {
        cityMap[city].won += val;
      }
    });

    const entries = Object.entries(cityMap);
    if (entries.length === 0) {
      return [
        { name: 'No Territory Data', pct: 0, count: 0, val: '0' }
      ];
    }

    const totalLeadsCount = filteredLeads.length || 1;
    const sorted = entries.sort((a, b) => {
      if (territoryMetric === 'pipeline') return b[1].pipeline - a[1].pipeline;
      if (territoryMetric === 'won') return b[1].won - a[1].won;
      return b[1].count - a[1].count;
    });

    const maxCount = Math.max(...sorted.map(s => s[1].count), 1);
    const maxPipe = Math.max(...sorted.map(s => s[1].pipeline), 1);
    const maxWon = Math.max(...sorted.map(s => s[1].won), 1);

    return sorted.slice(0, 6).map(([cityName, data]) => {
      let pct = 0;
      let displayVal = '';
      if (territoryMetric === 'leads') {
        pct = Math.round((data.count / maxCount) * 100);
        const sharePct = Math.round((data.count / totalLeadsCount) * 100);
        displayVal = `${data.count} (${sharePct}%)`;
      } else if (territoryMetric === 'pipeline') {
        pct = Math.round((data.pipeline / maxPipe) * 100);
        displayVal = formatCurrency(data.pipeline);
      } else {
        pct = maxWon > 0 ? Math.round((data.won / maxWon) * 100) : 0;
        displayVal = formatCurrency(data.won);
      }
      return {
        name: cityName,
        pct: Math.max(pct, 10),
        count: data.count,
        val: displayVal,
      };
    });
  }, [filteredLeads, territoryMetric]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-slate-800">
      {/* ========================================================= */}
      {/* TOP HEADER BAR                                             */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Super Admin Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500">
            Complete CRM Analytics &amp; Business Intelligence
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 hidden md:inline">
            Last Updated: {lastRefreshedAt ? lastRefreshedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Oct 2026'}, {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'}
          </span>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openDrillDown('All Active Leads', activeLeads)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* GLOBAL 9-SLICER FILTER BAR                                */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-[11px]">
          {/* 1. Date Range */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={e => setDateRangeFilter(e.target.value as TimeFilter)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="prev_month">Prev Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">FY 2026</option>
            </select>
          </div>

          {/* 2. Priority */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Priority</label>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* 3. Temperature */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Temperature</label>
            <select
              value={temperatureFilter}
              onChange={e => setTemperatureFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          {/* 4. Lifecycle Stage */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Lifecycle Stage</label>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              {crmStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* 5. Lead Source */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Lead Source</label>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 6. City / Territory */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">City / Territory</label>
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 7. Sales Manager */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Sales Manager</label>
            <select
              value={salesManagerFilter}
              onChange={e => setSalesManagerFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              {salesManagers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>

          {/* 8. Sales Executive */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Sales Executive</label>
            <select
              value={salesExecutiveFilter}
              onChange={e => setSalesExecutiveFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              {salesExecutives.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
            </select>
          </div>

          {/* 9. Customer Category & Reset */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] text-slate-400 font-medium">Category</label>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] text-emerald-700 hover:underline font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <select
              value={customerCategoryFilter}
              onChange={e => setCustomerCategoryFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 1: 9 LEAD PRIORITY OVERVIEW PASTEL CARDS             */}
      {/* ========================================================= */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-1">
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>Lead Priority Overview</span>
          <span className="text-[11px] font-normal text-slate-400">— Overview of leads by priority and temperature</span>
        </div>

        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2.5 text-xs"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))' }}
        >
          {/* 1. Urgent Priority */}
          <div
            onClick={() => openDrillDown('Urgent Priority Leads', urgentLeads)}
            className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] hover:border-red-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-red-700 font-semibold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 fill-red-100" />
              <span>Urgent Priority</span>
            </div>
            <div className="text-2xl font-bold text-red-950 mt-1">{urgentLeads.length}</div>
            <div className="text-[10px] text-red-700 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((urgentLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 2. High Priority */}
          <div
            onClick={() => openDrillDown('High Priority Leads', highLeads)}
            className="p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] hover:border-rose-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
              <Star className="w-3.5 h-3.5 text-rose-600 fill-rose-100" />
              <span>High Priority</span>
            </div>
            <div className="text-2xl font-bold text-rose-950 mt-1">{highLeads.length}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((highLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 3. Medium Priority */}
          <div
            onClick={() => openDrillDown('Medium Priority Leads', mediumLeads)}
            className="p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a] hover:border-amber-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Medium Priority</span>
            </div>
            <div className="text-2xl font-bold text-amber-950 mt-1">{mediumLeads.length}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((mediumLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 4. Low Priority */}
          <div
            onClick={() => openDrillDown('Low Priority Leads', lowLeads)}
            className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
              <Snowflake className="w-3.5 h-3.5 text-slate-400" />
              <span>Low Priority</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{lowLeads.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((lowLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 5. Hot Leads */}
          <div
            onClick={() => openDrillDown('Hot Temperature Leads (< 15 Days)', hotLeads)}
            className="p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] hover:border-rose-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
              <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-100" />
              <span>Hot Leads</span>
            </div>
            <div className="text-2xl font-bold text-rose-950 mt-1">{hotLeads.length}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((hotLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 6. Warm Leads */}
          <div
            onClick={() => openDrillDown('Warm Temperature Leads (1-2 Months)', warmLeads)}
            className="p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a] hover:border-amber-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Warm Leads</span>
            </div>
            <div className="text-2xl font-bold text-amber-950 mt-1">{warmLeads.length}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((warmLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 7. Cold Leads */}
          <div
            onClick={() => openDrillDown('Cold Temperature Leads', coldLeads)}
            className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
              <Snowflake className="w-3.5 h-3.5 text-slate-400" />
              <span>Cold Leads</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{coldLeads.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {totalActiveCount > 0 ? `${Math.round((coldLeads.length / totalActiveCount) * 100)}%` : '0%'} of active leads
            </div>
          </div>

          {/* 8. Overdue Follow-ups */}
          <div
            onClick={() => onNavigate('follow-ups')}
            className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] hover:border-red-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-red-700 font-semibold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-red-600" />
              <span>Overdue Follow-ups</span>
            </div>
            <div className="text-2xl font-bold text-red-950 mt-1">{overdueFollowUps.length}</div>
            <div className="text-[10px] text-red-700 mt-0.5">
              Leads need attention
            </div>
          </div>

          {/* 9. No Recent Activity */}
          <div
            onClick={() => openDrillDown('High-Priority Leads Inactive > 7 Days', inactiveHighPriorityLeads)}
            className="p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] hover:border-rose-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>No Recent Activity</span>
            </div>
            <div className="text-2xl font-bold text-rose-950 mt-1">{inactiveHighPriorityLeads.length}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">
              High priority leads
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 2: 4-CARD ANALYTICS GRID (MATRIX & CHARTS)            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3.5">
        {/* Card 1: Leads by Lifecycle Stage and Priority (Heatmap) (4 cols) */}
        <div className="col-span-12 xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Leads by Lifecycle Stage and Priority</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="pb-1.5 whitespace-nowrap">Stage</th>
                    <th className="pb-1.5 text-center text-red-700 whitespace-nowrap">Urgent</th>
                    <th className="pb-1.5 text-center text-rose-700 whitespace-nowrap">High</th>
                    <th className="pb-1.5 text-center text-amber-700 whitespace-nowrap">Medium</th>
                    <th className="pb-1.5 text-center text-slate-600 whitespace-nowrap">Low</th>
                    <th className="pb-1.5 text-right font-bold text-slate-900 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-medium">
                  {stagePriorityData.map(r => (
                    <tr key={r.stageId} className="hover:bg-slate-50/60">
                      <td className="py-1 text-slate-800 truncate max-w-[100px] whitespace-nowrap">{r.stageLabel}</td>
                      <td 
                        onClick={() => r.cells.Urgent.count > 0 && openDrillDown(`${r.stageLabel} (Urgent)`, r.cells.Urgent.leads)}
                        style={getHeatmapStyle(r.cells.Urgent.count, 'Urgent')} 
                        className="py-1 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.Urgent.count || 0}
                      </td>
                      <td 
                        onClick={() => r.cells.High.count > 0 && openDrillDown(`${r.stageLabel} (High)`, r.cells.High.leads)}
                        style={getHeatmapStyle(r.cells.High.count, 'High')} 
                        className="py-1 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.High.count || 0}
                      </td>
                      <td 
                        onClick={() => r.cells.Medium.count > 0 && openDrillDown(`${r.stageLabel} (Medium)`, r.cells.Medium.leads)}
                        style={getHeatmapStyle(r.cells.Medium.count, 'Medium')} 
                        className="py-1 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.Medium.count || 0}
                      </td>
                      <td 
                        onClick={() => r.cells.Low.count > 0 && openDrillDown(`${r.stageLabel} (Low)`, r.cells.Low.leads)}
                        style={getHeatmapStyle(r.cells.Low.count, 'Low')} 
                        className="py-1 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.Low.count || 0}
                      </td>
                      <td className="py-1 text-right font-bold font-mono text-slate-900">{r.totalCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 font-bold text-[11px] bg-slate-50/50">
                  <tr>
                    <td className="py-1 text-slate-900 whitespace-nowrap">Grand Total</td>
                    <td className="py-1 text-center font-mono text-red-700">{stagePivotColTotals.totals.Urgent}</td>
                    <td className="py-1 text-center font-mono text-rose-700">{stagePivotColTotals.totals.High}</td>
                    <td className="py-1 text-center font-mono text-amber-700">{stagePivotColTotals.totals.Medium}</td>
                    <td className="py-1 text-center font-mono text-slate-700">{stagePivotColTotals.totals.Low}</td>
                    <td className="py-1 text-right font-mono font-black text-slate-900">{stagePivotColTotals.grandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Priority vs Temperature (Heatmap) (2 cols) */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                <span>Priority vs Temperature</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="pb-1.5 whitespace-nowrap">Priority</th>
                    <th className="pb-1.5 text-center text-rose-700 whitespace-nowrap">Hot</th>
                    <th className="pb-1.5 text-center text-amber-700 whitespace-nowrap">Warm</th>
                    <th className="pb-1.5 text-center text-slate-600 whitespace-nowrap">Cold</th>
                    <th className="pb-1.5 text-right font-bold text-slate-900 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-medium">
                  {priorityTempData.map(r => (
                    <tr key={r.priority} className="hover:bg-slate-50/60">
                      <td className="py-1.5 font-bold text-slate-800 whitespace-nowrap">{r.priority}</td>
                      <td 
                        onClick={() => r.cells.Hot.count > 0 && openDrillDown(`${r.priority} (Hot)`, r.cells.Hot.leads)}
                        style={getHeatmapStyle(r.cells.Hot.count, 'High')} 
                        className="py-1.5 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.Hot.count || 0}
                      </td>
                      <td 
                        onClick={() => r.cells.Warm.count > 0 && openDrillDown(`${r.priority} (Warm)`, r.cells.Warm.leads)}
                        style={getHeatmapStyle(r.cells.Warm.count, 'Medium')} 
                        className="py-1.5 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.Warm.count || 0}
                      </td>
                      <td 
                        onClick={() => r.cells.Cold.count > 0 && openDrillDown(`${r.priority} (Cold)`, r.cells.Cold.leads)}
                        style={getHeatmapStyle(r.cells.Cold.count, 'Low')} 
                        className="py-1.5 text-center font-mono rounded cursor-pointer"
                      >
                        {r.cells.Cold.count || 0}
                      </td>
                      <td className="py-1.5 text-right font-bold font-mono text-slate-900">{r.totalCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 font-bold text-[11px] bg-slate-50/50">
                  <tr>
                    <td className="py-1.5 text-slate-900 whitespace-nowrap">Total</td>
                    <td className="py-1.5 text-center font-mono text-rose-700">{ptColTotals.Hot}</td>
                    <td className="py-1.5 text-center font-mono text-amber-700">{ptColTotals.Warm}</td>
                    <td className="py-1.5 text-center font-mono text-slate-700">{ptColTotals.Cold}</td>
                    <td className="py-1.5 text-right font-mono font-black text-slate-900">{ptColTotals.grand}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Card 3: Lead Priority Distribution (Donut Chart) (3 cols) */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">Lead Priority Distribution</h3>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {/* SVG Donut */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="14"
                  />
                  {donutSegments.map(seg => (
                    <circle
                      key={seg.label}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold text-slate-900 leading-tight">{donutData.total}</span>
                  <span className="text-[9px] text-slate-400">Total Leads</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1 text-[11px] shrink-0">
                {donutData.items.map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 w-12">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.count}</span>
                    <span className="text-[10px] text-slate-400">({item.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Priority by Sales Executive (Stacked Bar Chart) (3 cols) */}
        <div className="col-span-12 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">Priority by Sales Executive</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                <span className="w-2 h-2 rounded-sm bg-red-500" /> Urg
                <span className="w-2 h-2 rounded-sm bg-rose-500" /> High
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Med
                <span className="w-2 h-2 rounded-sm bg-slate-400" /> Low
              </div>
            </div>

            <div className="space-y-2 pt-1 text-[11px]">
              {execPriorityBars.map(exec => (
                <div key={exec.name} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium truncate max-w-[120px]">{exec.name}</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{exec.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    {exec.urgentPct > 0 && <div className="bg-red-500 h-full" style={{ width: `${exec.urgentPct}%` }} />}
                    {exec.highPct > 0 && <div className="bg-rose-500 h-full" style={{ width: `${exec.highPct}%` }} />}
                    {exec.mediumPct > 0 && <div className="bg-amber-500 h-full" style={{ width: `${exec.mediumPct}%` }} />}
                    {exec.lowPct > 0 && <div className="bg-slate-400 h-full" style={{ width: `${exec.lowPct}%` }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 3: ACTION QUEUE & FUNNEL & TEMPERATURE BARS           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        {/* Card 1: Hot & High-Priority Leads Requiring Action (6 cols) */}
        <div className="col-span-12 xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Hot &amp; High-Priority Leads Requiring Action</span>
              </h3>
              <button
                onClick={() => onNavigate('leads')}
                className="text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="pb-1.5 whitespace-nowrap">Customer Name</th>
                    <th className="pb-1.5 text-center whitespace-nowrap">Priority</th>
                    <th className="pb-1.5 text-center whitespace-nowrap">Temp</th>
                    <th className="pb-1.5 whitespace-nowrap">Stage</th>
                    <th className="pb-1.5 whitespace-nowrap">Assigned To</th>
                    <th className="pb-1.5 whitespace-nowrap">City</th>
                    <th className="pb-1.5 whitespace-nowrap">Next Follow-up</th>
                    <th className="pb-1.5 text-center whitespace-nowrap">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 font-medium">
                  {actionLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400">
                        No pending high-priority actions.
                      </td>
                    </tr>
                  ) : (
                    actionLeads.map(l => {
                      const due = getLeadDueDays(l);
                      return (
                        <tr 
                          key={l.id} 
                          onClick={() => onNavigate('leads')}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="py-2 font-bold text-slate-900 max-w-[130px] truncate whitespace-nowrap">{l.name}</td>
                          <td className="py-2 text-center whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${l.priority === 'Urgent' ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'}`}>
                              {l.priority}
                            </span>
                          </td>
                          <td className="py-2 text-center whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                              {getLeadTemperature(l)}
                            </span>
                          </td>
                          <td className="py-2 text-slate-600 truncate max-w-[90px] whitespace-nowrap">{l.status}</td>
                          <td className="py-2 text-slate-700 truncate max-w-[100px] whitespace-nowrap">{l.assignedToName?.split(' ')[0] || 'Unassigned'}</td>
                          <td className="py-2 text-slate-500 whitespace-nowrap">{l.city || 'Bengaluru'}</td>
                          <td className="py-2 font-mono text-[10px] text-slate-600 whitespace-nowrap">{formatShortDate(l.createdAt)}</td>
                          <td className="py-2 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${due.color}`}>
                              {due.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Visual Lead Funnel (3 cols) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lead Funnel (All Leads)</span>
              </h3>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {/* Stepped Visual Funnel */}
              <div className="flex flex-col items-center justify-between w-20 h-48 py-1 shrink-0">
                {funnelSteps.map((s, idx) => {
                  const greens = [
                    'bg-emerald-900',
                    'bg-emerald-800',
                    'bg-emerald-700',
                    'bg-emerald-600',
                    'bg-emerald-500',
                    'bg-emerald-400',
                    'bg-emerald-300',
                    'bg-emerald-200',
                    'bg-slate-300'
                  ];
                  return (
                    <div
                      key={s.name}
                      style={{ width: s.width }}
                      className={`h-4 ${greens[idx] || 'bg-emerald-500'} rounded-xs transition-all`}
                    />
                  );
                })}
              </div>

              {/* Step Labels and counts */}
              <div className="flex-1 space-y-1.5 text-[11px] min-w-0">
                {funnelSteps.map(s => (
                  <div key={s.name} className="flex items-center justify-between gap-1">
                    <span className="text-slate-600 truncate">{s.name}</span>
                    <span className="font-mono text-slate-900 font-semibold shrink-0">
                      {s.count} <span className="text-[10px] text-slate-400">({s.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Leads by Stage and Temperature (Stacked Vertical Bars) (3 cols) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">Leads by Stage and Temperature</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                <span className="w-2 h-2 rounded-sm bg-rose-500" /> Hot
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Warm
                <span className="w-2 h-2 rounded-sm bg-slate-400" /> Cold
              </div>
            </div>

            <div className="h-44 flex items-end justify-between gap-1 pt-3 pb-1 border-b border-slate-100 px-1">
              {stageTempChart.list.map(s => {
                const totalH = (s.total / stageTempChart.max) * 120;
                const hotH = s.total > 0 ? (s.hot / s.total) * totalH : 0;
                const warmH = s.total > 0 ? (s.warm / s.total) * totalH : 0;
                const coldH = s.total > 0 ? (s.cold / s.total) * totalH : 0;

                return (
                  <div key={s.label} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-900">{s.total}</span>
                    <div className="w-full max-w-[20px] bg-slate-100 rounded-t overflow-hidden flex flex-col justify-end" style={{ height: '120px' }}>
                      {hotH > 0 && <div className="bg-rose-500 w-full" style={{ height: `${hotH}px` }} />}
                      {warmH > 0 && <div className="bg-amber-500 w-full" style={{ height: `${warmH}px` }} />}
                      {coldH > 0 && <div className="bg-slate-400 w-full" style={{ height: `${coldH}px` }} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium pt-1 px-1">
              {stageTempChart.list.map(s => {
                const shortLabel = 
                  s.label === 'Site Survey Scheduled' || s.label === 'Survey Sched' ? 'Surv.Sch' :
                  s.label === 'Follow-up Scheduled' || s.label === 'Follow-up' ? 'F-Up' :
                  s.label === 'Survey Completed' || s.label === 'Survey Done' ? 'Surv.Dn' :
                  s.label === 'Quotation Sent' || s.label === 'Quote Sent' ? 'Quote' :
                  s.label === 'Qualified' ? 'Qual' :
                  s.label === 'Closed Won' || s.label === 'Won' ? 'Won' :
                  s.label === 'Closed Lost' || s.label === 'Lost' ? 'Lost' :
                  s.label === 'Contacted' ? 'Contact' :
                  s.label;

                return (
                  <span key={s.label} title={s.label} className="flex-1 text-center truncate">
                    {shortLabel}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 4: EXECUTIVE OVERVIEW (12 PILL TILES)                 */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Executive Overview</span>
            </h3>
            <span className="text-[11px] text-slate-400">Key metrics and performance indicators</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2 text-xs">
          {execTiles.map((t, idx) => (
            <div key={idx} className="p-2 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-0.5">
              <div className="text-[10px] text-slate-500 truncate">{t.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-900">{t.val}</span>
                {t.delta && (
                  <span className={`text-[9px] font-bold ${t.delta.startsWith('+') ? 'text-emerald-700' : 'text-red-700'}`}>
                    {t.delta}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-slate-400 truncate">{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 5: INTERACTIVE PIVOT ANALYSIS & SOURCE & TERRITORY     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        {/* Card 1: Interactive Pivot Analysis (6 cols) */}
        <div className="col-span-12 xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Interactive Pivot Analysis</span>
              </h3>
            </div>

            {/* Pivot Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Rows:</span>
                <select
                  value={pivotRowDim}
                  onChange={e => setPivotRowDim(e.target.value as any)}
                  className="p-1 bg-white border border-slate-200 rounded text-slate-700 font-semibold text-[11px]"
                >
                  <option value="stage">Lifecycle Stage</option>
                  <option value="source">Lead Source</option>
                  <option value="city">City / Territory</option>
                  <option value="executive">Sales Rep</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Columns:</span>
                <select
                  value={pivotColDim}
                  onChange={e => setPivotColDim(e.target.value as any)}
                  className="p-1 bg-white border border-slate-200 rounded text-slate-700 font-semibold text-[11px]"
                >
                  <option value="priority">Lead Priority</option>
                  <option value="temperature">Buyer Temperature</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Metric:</span>
                <select
                  value={pivotMetric}
                  onChange={e => setPivotMetric(e.target.value as any)}
                  className="p-1 bg-white border border-slate-200 rounded text-slate-700 font-semibold text-[11px]"
                >
                  <option value="count">Lead Count</option>
                  <option value="kw">Capacity (kW)</option>
                  <option value="revenue">Value (₹)</option>
                </select>
              </div>

              <button
                onClick={() => openDrillDown('Interactive Pivot Dataset', filteredLeads)}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer ml-auto"
              >
                Apply
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="pb-1.5 whitespace-nowrap">{pivotRowDim === 'stage' ? 'Lifecycle Stage' : pivotRowDim === 'source' ? 'Lead Source' : pivotRowDim === 'city' ? 'City' : 'Executive'}</th>
                    <th className="pb-1.5 text-center text-red-700 whitespace-nowrap">Urgent</th>
                    <th className="pb-1.5 text-center text-rose-700 whitespace-nowrap">High</th>
                    <th className="pb-1.5 text-center text-amber-700 whitespace-nowrap">Medium</th>
                    <th className="pb-1.5 text-center text-slate-600 whitespace-nowrap">Low</th>
                    <th className="pb-1.5 text-right font-bold text-slate-900 whitespace-nowrap">Total</th>
                    <th className="pb-1.5 text-right whitespace-nowrap">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-medium">
                  {interactivePivotRows.map(r => (
                    <tr key={r.label} className="hover:bg-slate-50/60">
                      <td className="py-1 text-slate-800 truncate max-w-[110px] whitespace-nowrap">{r.label}</td>
                      <td style={getHeatmapStyle(r.urgent, 'Urgent')} className="py-1 text-center font-mono rounded">{r.urgent}</td>
                      <td style={getHeatmapStyle(r.high, 'High')} className="py-1 text-center font-mono rounded">{r.high}</td>
                      <td style={getHeatmapStyle(r.medium, 'Medium')} className="py-1 text-center font-mono rounded">{r.medium}</td>
                      <td style={getHeatmapStyle(r.low, 'Low')} className="py-1 text-center font-mono rounded">{r.low}</td>
                      <td className="py-1 text-right font-mono font-bold text-slate-900">{r.total}</td>
                      <td className="py-1 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 w-6">{r.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Lead Source Performance (3 cols) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">Lead Source Performance</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                <span className="w-2 h-2 rounded-sm bg-emerald-600" /> Leads
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Qualified
                <span className="w-2 h-2 rounded-sm bg-blue-500" /> Won
              </div>
            </div>

            <div className="h-44 flex items-end justify-around gap-2 pt-3 pb-1 border-b border-slate-100 px-2">
              {sourceChartData.list.map(s => {
                const totalH = (s.leadsCnt / sourceChartData.max) * 120;
                const qualH = (s.qualCnt / sourceChartData.max) * 120;
                const wonH = (s.wonCnt / sourceChartData.max) * 120;

                return (
                  <div key={s.source} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-mono font-bold text-slate-600">{s.leadsCnt}</span>
                    <div className="w-full flex items-end justify-center gap-1" style={{ height: '120px' }}>
                      <div className="bg-emerald-600 w-3 rounded-t transition-all" title={`Leads: ${s.leadsCnt}`} style={{ height: `${Math.max(totalH, 4)}px` }} />
                      <div className="bg-amber-500 w-3 rounded-t transition-all" title={`Qualified: ${s.qualCnt}`} style={{ height: `${Math.max(qualH, 2)}px` }} />
                      <div className="bg-blue-500 w-3 rounded-t transition-all" title={`Won: ${s.wonCnt}`} style={{ height: `${Math.max(wonH, 2)}px` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis */}
            <div className="flex items-center justify-around text-[10px] text-slate-600 font-medium pt-1.5 px-1">
              {sourceChartData.list.map(s => (
                <span key={s.source} className="text-center flex-1 truncate" title={s.source}>
                  {s.source}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: City / Territory Analysis (3 cols) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>City/Territory Analysis</span>
              </h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded text-[10px] font-bold shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setTerritoryMetric('leads')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${territoryMetric === 'leads' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Leads
                </button>
                <button
                  onClick={() => setTerritoryMetric('pipeline')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${territoryMetric === 'pipeline' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Pipeline
                </button>
                <button
                  onClick={() => setTerritoryMetric('won')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${territoryMetric === 'won' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Won
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-1 text-[11px]">
              {cityAnalysisData.map(c => (
                <div key={c.name} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {territoryMetric === 'leads' ? `${c.count} (${c.pct}%)` : c.val}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-700 h-full rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DRILL-DOWN MODAL FOR CELLS AND CARDS                      */}
      {/* ========================================================= */}
      {drillDownTitle && drillDownLeads && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 space-y-3 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{drillDownTitle}</h3>
                <p className="text-[11px] text-slate-500">
                  {drillDownLeads.length} record{drillDownLeads.length === 1 ? '' : 's'} matching selection
                </p>
              </div>
              <button
                onClick={() => { setDrillDownTitle(null); setDrillDownLeads(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
              {drillDownLeads.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No records match this selection.
                </div>
              ) : (
                drillDownLeads.map(l => (
                  <div key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{l.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${l.priority === 'Urgent' ? 'bg-red-100 text-red-800' : l.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                          {l.priority}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 font-bold">
                          {getLeadTemperature(l)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {l.phone} • {l.city || 'Karnataka'} • Assigned: <strong>{l.assignedToName || 'Unassigned'}</strong> • Stage: <strong>{l.status}</strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-slate-900">{l.recommendedKw} kW</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatCurrency(l.estimatedBudget || (l.recommendedKw ? l.recommendedKw * 55000 : 0))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 text-[11px]">
                Clicking View All redirects to CRM Leads Pipeline
              </span>
              <button
                onClick={() => { setDrillDownTitle(null); setDrillDownLeads(null); onNavigate('leads'); }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                View in Leads Pipeline →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
