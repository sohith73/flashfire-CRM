import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ComposedChart,
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Calendar, RefreshCcw } from 'lucide-react';
import { useCrmAuth } from '../auth/CrmAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.flashfirejobs.com';

// ── Color palette ──────────────────────────────────────────────────
const COLORS = {
  mql: '#6366F1',
  sql: '#0EA5E9',
  converted: '#22C55E',
  revenue: '#F59E0B',
  mqlLight: '#A5B4FC',
  sqlLight: '#7DD3FC',
  convertedLight: '#86EFAC',
  slate: '#64748B',
  rose: '#F43F5E',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  emerald: '#10B981',
  orange: '#F97316',
  cyan: '#06B6D4',
  pink: '#EC4899',
  lime: '#84CC16',
  indigo: '#6366F1',
  teal: '#14B8A6',
};

const PIE_COLORS = ['#6366F1', '#0EA5E9', '#22C55E', '#F59E0B', '#F43F5E', '#8B5CF6', '#F97316', '#14B8A6', '#EC4899', '#84CC16'];

const STATUS_COLORS: Record<string, string> = {
  'not-scheduled': '#9CA3AF',
  scheduled: '#F59E0B',
  completed: '#22C55E',
  canceled: '#EF4444',
  rescheduled: '#3B82F6',
  'no-show': '#FB7185',
  ignored: '#6B7280',
  paid: '#6366F1',
};

// ── Types ──────────────────────────────────────────────────────────
interface AnalyticsData {
  funnel: { mql: number; sql: number; converted: number; total: number; mqlToSqlRate: number; sqlToConvertedRate: number; overallConversion: number };
  volumeTrend: Array<{ date: string; total: number; MQL: number; SQL: number; Converted: number }>;
  conversionTrend: Array<{ week: string; sqlRate: number; convertedRate: number; total: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; count: number; avgDeal: number }>;
  revenueTrend: Array<{ month: string; revenue: number; deals: number }>;
  sourceBreakdown: Array<{ source: string; total: number; mql: number; sql: number; converted: number }>;
  sourceConversion: Array<{ source: string; total: number; conversionRate: number; sqlRate: number }>;
  dayOfWeek: Array<{ day: string; dayNum: number; total: number; converted: number }>;
  hourOfDay: Array<{ hour: number; label: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  avgDealSize: Array<{ plan: string; avgDeal: number; minDeal: number; maxDeal: number; count: number }>;
  leadAging: Array<{ bucket: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
  planConversion: Array<{ plan: string; total: number; paidRate: number; sqlRate: number }>;
  velocity: Array<{ month: string; avgDays: number; minDays: number; maxDays: number; count: number }>;
  bdaPerformance: Array<{ name: string; email: string; claimed: number; converted: number; completed: number; revenue: number; conversionRate: number }>;
  leadSourceType: Array<{ source: string; total: number; mql: number; sql: number; converted: number }>;
  monthlyComparison: Array<{ month: string; total: number; mql: number; sql: number; converted: number; revenue: number }>;
}

type DateRange = 'all' | '7d' | '30d' | '90d' | '6m' | '1y';

export interface QualifiedLeadsGraphsFilters {
  fromDate?: string;
  toDate?: string;
  qualification?: string;
  status?: string;
  planName?: string;
  utmSource?: string;
  minAmount?: string;
  maxAmount?: string;
}

interface Props {
  className?: string;
  filters?: QualifiedLeadsGraphsFilters;
}

// ── Shared tooltip style ───────────────────────────────────────────
const tooltipStyle = { borderRadius: 8, borderColor: '#E2E8F0', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
const cursorStyle = { fill: 'rgba(15,23,42,0.04)' };

// ── Chart card wrapper (memoized) ──────────────────────────────────
const ChartCard = memo(({ title, subtitle, children, className = '' }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-5 ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
    </div>
    {children}
  </div>
));
ChartCard.displayName = 'ChartCard';

// ── KPI Card ───────────────────────────────────────────────────────
const KpiCard = memo(({ label, value, sub, trend, color = 'text-slate-900' }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | null; color?: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
      {trend === 'down' && <TrendingDown size={14} className="text-rose-500" />}
    </div>
    {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
  </div>
));
KpiCard.displayName = 'KpiCard';

// ── Custom Funnel Bar Shape ────────────────────────────────────────
const FunnelBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} ry={6} />;
};

// ── Status label mapping ───────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  'not-scheduled': 'Not Scheduled',
  scheduled: 'Scheduled',
  completed: 'Completed',
  canceled: 'Canceled',
  rescheduled: 'Rescheduled',
  'no-show': 'No-Show',
  ignored: 'Ignored',
  paid: 'Paid',
};

const SOURCE_LABELS: Record<string, string> = {
  calendly: 'Calendly',
  meta_lead_ad: 'Meta Ads',
  manual: 'Manual',
  frontend_direct: 'Website',
  bulk_import: 'Bulk Import',
};

// ── Format helpers ─────────────────────────────────────────────────
const fmtCurrency = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
};
const fmtDate = (d: string) => {
  const parts = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
};

// ── Main Component ─────────────────────────────────────────────────
export default function QualifiedLeadsGraphs({ className = '', filters = {} }: Props) {
  const { token } = useCrmAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Use parent filters when provided; otherwise fall back to internal date range
  const dateParams = useMemo(() => {
    if (filters.fromDate || filters.toDate) {
      return {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      };
    }
    if (dateRange === 'all') return {};
    const to = new Date();
    const from = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
    from.setDate(from.getDate() - (daysMap[dateRange] || 0));
    return {
      fromDate: from.toISOString().split('T')[0],
      toDate: to.toISOString().split('T')[0],
    };
  }, [dateRange, filters.fromDate, filters.toDate]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const params = new URLSearchParams();
      if (dateParams.fromDate) params.append('fromDate', dateParams.fromDate);
      if (dateParams.toDate) params.append('toDate', dateParams.toDate);
      if (filters.qualification && filters.qualification !== 'all') params.append('qualification', filters.qualification);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.planName && filters.planName !== 'all') params.append('planName', filters.planName);
      if (filters.utmSource && filters.utmSource !== 'all') params.append('utmSource', filters.utmSource);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/leads/analytics?${params}`, { headers });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch analytics');
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, dateParams, filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── Derived data ───────────────────────────────────────────────
  const funnelData = useMemo(() => {
    if (!data) return [];
    const { funnel } = data;
    return [
      { name: 'MQL', value: funnel.mql, fill: COLORS.mql },
      { name: 'SQL', value: funnel.sql, fill: COLORS.sql },
      { name: 'Converted', value: funnel.converted, fill: COLORS.converted },
    ];
  }, [data]);

  const monthlyGrowth = useMemo(() => {
    if (!data?.monthlyComparison || data.monthlyComparison.length < 2) return null;
    const arr = data.monthlyComparison;
    const curr = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    if (!prev || prev.total === 0) return null;
    const growth = ((curr.total - prev.total) / prev.total) * 100;
    return { pct: Math.round(growth * 10) / 10, direction: growth >= 0 ? 'up' as const : 'down' as const };
  }, [data]);

  const totalRevenue = useMemo(() => {
    if (!data?.revenueByPlan) return 0;
    return data.revenueByPlan.reduce((s, r) => s + r.revenue, 0);
  }, [data]);

  // ── Render ─────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={28} />
        <span className="ml-3 text-sm text-slate-500">Loading analytics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
        <p className="text-rose-700 text-sm">{error}</p>
        <button onClick={fetchAnalytics} className="mt-3 text-sm text-rose-600 underline">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { funnel } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lead Analytics</h2>
          <p className="text-xs text-slate-500">
            {filters.fromDate || filters.toDate
              ? 'Using filters from above (date, qualification, status, etc.)'
              : 'MQL, SQL & Converted pipeline analysis'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Only show internal date toggle when parent has NO date filters */}
          {!filters.fromDate && !filters.toDate && (
            <>
              {(['all', '7d', '30d', '90d', '6m', '1y'] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                    dateRange === r
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r.toUpperCase()}
                </button>
              ))}
            </>
          )}
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
          >
            <RefreshCcw size={14} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Leads" value={funnel.total.toLocaleString()} sub="All qualifications" trend={monthlyGrowth?.direction} />
        <KpiCard label="MQL" value={funnel.mql.toLocaleString()} sub={`${funnel.total > 0 ? Math.round((funnel.mql / funnel.total) * 100) : 0}% of total`} color="text-indigo-600" />
        <KpiCard label="SQL" value={funnel.sql.toLocaleString()} sub={`${fmtPct(funnel.mqlToSqlRate)} qualification rate`} color="text-sky-600" />
        <KpiCard label="Converted" value={funnel.converted.toLocaleString()} sub={`${fmtPct(funnel.overallConversion)} overall conversion`} color="text-emerald-600" />
        <KpiCard label="Revenue" value={fmtCurrency(totalRevenue)} sub={`${data.revenueByPlan.reduce((s, r) => s + r.count, 0)} deals closed`} color="text-amber-600" />
        <KpiCard
          label="MoM Growth"
          value={monthlyGrowth ? `${monthlyGrowth.pct > 0 ? '+' : ''}${monthlyGrowth.pct}%` : '—'}
          sub="vs previous month"
          trend={monthlyGrowth?.direction}
        />
      </div>

      {/* ── Row 1: Funnel + Pipeline Status ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Conversion Funnel */}
        <ChartCard title="Conversion Funnel" subtitle="MQL → SQL → Converted pipeline">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 600 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} />
                <Bar dataKey="value" shape={<FunnelBar />}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
            <span>MQL→SQL: <strong className="text-slate-700">{fmtPct(funnel.mqlToSqlRate)}</strong></span>
            <span>SQL→Converted: <strong className="text-slate-700">{fmtPct(funnel.sqlToConvertedRate)}</strong></span>
            <span>Overall: <strong className="text-slate-700">{fmtPct(funnel.overallConversion)}</strong></span>
          </div>
        </ChartCard>

        {/* 2. Pipeline by Status (Donut) */}
        <ChartCard title="Pipeline by Status" subtitle="Lead distribution across all statuses">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown.filter(s => s.count > 0).map(s => ({ ...s, label: STATUS_LABELS[s.status] || s.status }))}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {data.statusBreakdown.filter(s => s.count > 0).map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#E5E7EB'} />
                  ))}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 2: Conversion Rate Trend ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate Trend (Line) */}
        <ChartCard title="Conversion Rate Trend" subtitle="Weekly SQL & Converted rates">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.conversionTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="sqlRate" stroke={COLORS.sql} strokeWidth={2} dot={false} name="SQL Rate" />
                <Line type="monotone" dataKey="convertedRate" stroke={COLORS.converted} strokeWidth={2} dot={false} name="Converted Rate" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: Timing Analysis ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 13. Leads by Day of Week */}
        <ChartCard title="Leads by Day of Week" subtitle="Which days generate the most leads">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dayOfWeek} margin={{ bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} />
                <Bar dataKey="total" fill={COLORS.mqlLight} name="Total Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" fill={COLORS.converted} name="Converted" radius={[4, 4, 0, 0]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 14. Leads by Hour of Day */}
        <ChartCard title="Leads by Hour of Day" subtitle="Peak hours for lead generation">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourOfDay} margin={{ bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} interval={1} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} />
                <Bar dataKey="count" fill={COLORS.cyan} name="Leads" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
