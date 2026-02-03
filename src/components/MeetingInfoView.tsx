import { useEffect, useState } from 'react';
import { Loader2, ExternalLink, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCrmAuth } from '../auth/CrmAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.flashfirejobs.com';

interface MeetingInfoRow {
  bookingId: string;
  clientName: string;
  dateOfMeet: string | null;
  meetingVideoUrl: string;
}

export default function MeetingInfoView() {
  const { token } = useCrmAuth();
  const [rows, setRows] = useState<MeetingInfoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE_URL}/api/meeting-links`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setRows(data.data);
        else setError(data.message || 'Failed to load');
      })
      .catch(() => setError('Failed to load meeting info'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="bg-gray-50 border border-slate-200 px-6 py-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Video className="text-orange-500" size={28} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Meeting Info</p>
            <h1 className="text-3xl font-bold text-slate-900">Meeting Info</h1>
            <p className="text-slate-600 max-w-2xl mt-1">
              Client names, meeting dates, and Google Drive video URLs linked from n8n. Only leads with a saved recording appear here.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 p-4 text-orange-700">{error}</div>
      )}

      <div className="overflow-hidden bg-white border border-slate-200">
        <table className="w-full text-[10px] table-auto border-separate border-spacing-y-1 border-spacing-x-0.5">
          <thead className="sticky top-0 z-10">
            <tr className="text-left bg-gray-100 text-slate-500">
              <th className="px-3 py-2 font-semibold text-[10px]">Client Name</th>
              <th className="px-3 py-2 font-semibold text-[10px]">Date of Meet</th>
              <th className="px-3 py-2 font-semibold text-[10px]">Google Drive Video URL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bookingId} className="bg-white border border-slate-200 rounded-xl shadow">
                <td className="px-3 py-2 font-semibold text-slate-900">{row.clientName}</td>
                <td className="px-3 py-2 text-slate-700">
                  {row.dateOfMeet
                    ? format(parseISO(row.dateOfMeet), 'MMM d, yyyy • h:mm a')
                    : '—'}
                </td>
                <td className="px-3 py-2">
                  <a
                    href={row.meetingVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold truncate max-w-[320px]"
                    title={row.meetingVideoUrl}
                  >
                    <ExternalLink size={12} />
                    {row.meetingVideoUrl.replace(/^https?:\/\//, '').slice(0, 40)}…
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-slate-500 text-sm">
                  No meeting info yet. Entries will appear here once n8n sends recordings and they are matched to leads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
