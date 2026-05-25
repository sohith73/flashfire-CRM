import { useEffect, useRef, useState } from 'react';
import { useCrmAuth } from '../auth/CrmAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.flashfirejobs.com';

export interface CallMinutesEntry {
  minutes: number;
  seconds: number;
  calls: number;
  lastCalledAt?: string;
}

/** Backend-side phone normalizer mirror — must match Utils/ZoomPhone.js. */
function normalize(input?: string | null): string | null {
  if (!input) return null;
  let d = String(input).replace(/\D+/g, '');
  if (!d) return null;
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d;
}

/**
 * Fetch total call minutes for a list of phones from the Zoom Phone CallLog
 * collection. Returns a `lookup(phone)` helper that finds the entry whether
 * the caller passes the raw or normalized phone.
 *
 * Batches all phones into a single request and re-fetches only when the
 * sorted normalized phone set actually changes.
 */
export function useCallMinutes(rawPhones: Array<string | null | undefined>) {
  const { token } = useCrmAuth();
  const [byNormalized, setByNormalized] = useState<Record<string, CallMinutesEntry>>({});
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    const normalized = Array.from(
      new Set(rawPhones.map((p) => normalize(p)).filter(Boolean) as string[])
    ).sort();
    if (normalized.length === 0) {
      if (lastKeyRef.current !== '') {
        lastKeyRef.current = '';
        setByNormalized({});
      }
      return;
    }
    const key = normalized.join(',');
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    const ctrl = new AbortController();
    (async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(
          `${API_BASE_URL}/api/crm/call-logs/minutes-by-phone?phones=${encodeURIComponent(key)}`,
          { headers, signal: ctrl.signal }
        );
        if (!res.ok) return; // silent — table still works without the chip
        const json = await res.json();
        if (json?.success) setByNormalized(json.data || {});
      } catch {
        /* swallowed — no minutes shown on failure */
      }
    })();
    return () => ctrl.abort();
  }, [rawPhones, token]);

  const lookup = (phone?: string | null): CallMinutesEntry | null => {
    const n = normalize(phone);
    if (!n) return null;
    return byNormalized[n] || null;
  };

  return { lookup, byNormalized };
}
