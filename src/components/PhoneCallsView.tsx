import { useCallback, useEffect, useState } from 'react';
import { Loader2, Phone, PhoneIncoming, PhoneOutgoing, RefreshCcw, Search } from 'lucide-react';
import { useCrmAuth } from '../auth/CrmAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.flashfirejobs.com';

interface CallRow {
  callId: string;
  direction: 'inbound' | 'outbound' | 'internal';
  status: string;
  salesEmail?: string;
  salesName?: string;
  leadName?: string;
  leadEmail?: string;
  leadNumber?: string;
  bookingId?: string;
  startedAt?: string;
  durationSec?: number;
  recordingUrl?: string;
  transcriptUrl?: string;
}

const fmtDuration = (s = 0) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
};

const fmtTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
};

const statusColor = (s: string) => {
  if (s === 'answered' || s === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'missed') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (s === 'voicemail') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'ringing') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export default function PhoneCallsView() {
  const { token } = useCrmAuth();
  const [rows, setRows] = useState<CallRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [search, setSearch] = useState('');

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: '100' });
      if (direction !== 'all') params.append('direction', direction);
      if (search.trim()) params.append('search', search.trim());
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/crm/call-logs/recent?${params}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Server ${res.status}`);
      setRows(json.data || []);
      setTotal(json.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  }, [token, direction, search]);

  useEffect(() => {
    const t = setTimeout(fetchRows, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchRows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Phone size={18} className="text-orange-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Phone Calls</h2>
            <p className="text-xs text-slate-500">Zoom Phone calls — auto-matched to leads by number.</p>
          </div>
        </div>
        <button
          onClick={fetchRows}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCcw size={14} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead / sales / number…"
            className="h-9 pl-8 pr-3 w-72 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'inbound', 'outbound'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded ${direction === d ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
            >
              {d === 'all' ? 'All' : d === 'inbound' ? 'Inbound' : 'Outbound'}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">
          {loading ? 'Loading…' : `${rows.length} of ${total}`}
        </span>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-orange-500" size={24} />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Phone size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-semibold">No calls yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Zoom Phone events will appear here. Make a test call to verify the webhook.
            Backend must have <code className="bg-slate-100 px-1 rounded">ZOOM_*</code> env vars set,
            and the Zoom Marketplace app must point at{' '}
            <code className="bg-slate-100 px-1 rounded">/api/zoom-phone/webhook</code>.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <th className="py-2 px-3 font-semibold">When</th>
                  <th className="py-2 px-3 font-semibold">Dir</th>
                  <th className="py-2 px-3 font-semibold">Sales</th>
                  <th className="py-2 px-3 font-semibold">Lead</th>
                  <th className="py-2 px-3 font-semibold">Number</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold text-right">Duration</th>
                  <th className="py-2 px-3 font-semibold">Recording</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.callId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{fmtTime(r.startedAt)}</td>
                    <td className="py-2 px-3">
                      {r.direction === 'inbound' ? (
                        <PhoneIncoming size={14} className="text-blue-600" />
                      ) : r.direction === 'outbound' ? (
                        <PhoneOutgoing size={14} className="text-emerald-600" />
                      ) : (
                        <Phone size={14} className="text-slate-400" />
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <div className="font-semibold">{r.salesName || '—'}</div>
                      <div className="text-[10px] text-slate-500">{r.salesEmail}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <div className="font-semibold">{r.leadName || '—'}</div>
                      <div className="text-[10px] text-slate-500">{r.leadEmail || ''}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-mono">{r.leadNumber || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 font-semibold">{fmtDuration(r.durationSec)}</td>
                    <td className="py-2 px-3">
                      {r.recordingUrl ? (
                        <audio
                          src={`${API_BASE_URL}/api/crm/call-logs/${encodeURIComponent(r.callId)}/recording`}
                          controls
                          preload="none"
                          className="h-7 w-44"
                        />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
