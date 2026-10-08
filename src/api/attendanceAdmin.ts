import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';
import { ApiError } from './attendance';
import type { Deduction } from '../types/attendance';
import type {
  ActivateBody,
  BdaProfile,
  BdaProfilesResponse,
  BdaProfileUpdate,
  DeductionMutationResponse,
  DeductionsResponse,
  DeductionSummaryResponse,
  ReviewQueuesResponse,
} from '../types/attendanceAdmin';

// Admin endpoints need PUT, which the shared crmRequest helper in ./attendance does not offer.
// This is the same request/error contract (ApiError, `{success:false, error:{code,message}}`),
// kept local so the shared helper is not edited from a parallel change.
async function adminRequest<T>(
  path: string,
  token: string | null,
  opts: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'network_error', 'Could not reach the server');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = (body as { error?: unknown } | null)?.error;
    if (err && typeof err === 'object') {
      const { code, message, ...rest } = err as Record<string, unknown>;
      throw new ApiError(
        res.status,
        typeof code === 'string' ? code : null,
        typeof message === 'string' ? message : `Request failed (${res.status})`,
        rest,
      );
    }
    throw new ApiError(res.status, null, typeof err === 'string' ? err : `Request failed (${res.status})`);
  }
  if (body === null || typeof body !== 'object') {
    throw new ApiError(res.status, 'bad_response', 'The server sent an unreadable answer');
  }
  return body as T;
}

export const attendanceAdminKeys = {
  all: ['attendance-admin'] as const,
  deductions: (month: string, bdaEmail: string) => ['attendance-admin', 'deductions', month, bdaEmail] as const,
  summary: (month: string) => ['attendance-admin', 'summary', month] as const,
  queues: ['attendance-admin', 'queues'] as const,
  profiles: ['attendance-admin', 'profiles'] as const,
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Own rows for a BDA, every row for an admin (optionally one BDA). The server decides which. */
export function useDeductions(token: string | null, month: string, bdaEmail: string) {
  return useQuery({
    queryKey: attendanceAdminKeys.deductions(month, bdaEmail),
    enabled: Boolean(token),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ month });
      if (bdaEmail) params.set('bdaEmail', bdaEmail);
      return adminRequest<DeductionsResponse>(`/api/crm/deductions?${params.toString()}`, token, { signal });
    },
  });
}

export function useDeductionSummary(token: string | null, month: string, enabled: boolean) {
  return useQuery({
    queryKey: attendanceAdminKeys.summary(month),
    enabled: enabled && Boolean(token),
    queryFn: ({ signal }) =>
      adminRequest<DeductionSummaryResponse>(`/api/crm/deductions/summary?month=${encodeURIComponent(month)}`, token, {
        signal,
      }),
  });
}

export function useReviewQueues(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: attendanceAdminKeys.queues,
    enabled: enabled && Boolean(token),
    refetchInterval: 60_000,
    queryFn: ({ signal }) =>
      adminRequest<ReviewQueuesResponse>('/api/crm/admin/attendance/review-queues', token, { signal }),
  });
}

export function useBdaProfiles(token: string | null, enabled = true) {
  return useQuery({
    queryKey: attendanceAdminKeys.profiles,
    enabled: enabled && Boolean(token),
    queryFn: ({ signal }) => adminRequest<BdaProfilesResponse>('/api/crm/admin/bda-profiles', token, { signal }),
  });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Anything a ledger or queue change can touch: rows, per-BDA totals and the queues. */
function useInvalidateLedger() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: attendanceAdminKeys.all });
}

export function useWaiveDeduction(token: string | null) {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({ deductionId, reason }: { deductionId: string; reason: string }) =>
      adminRequest<DeductionMutationResponse>(`/api/crm/deductions/${encodeURIComponent(deductionId)}/waive`, token, {
        method: 'POST',
        body: { reason },
      }),
    onSuccess: invalidate,
  });
}

export function useActivateDeduction(token: string | null) {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({ deductionId, reason, action }: { deductionId: string } & ActivateBody) =>
      adminRequest<DeductionMutationResponse>(
        `/api/crm/deductions/${encodeURIComponent(deductionId)}/activate`,
        token,
        { method: 'POST', body: { reason, action } },
      ),
    onSuccess: invalidate,
  });
}

/**
 * Waive an active row, or activate / waive a needs_review row. The server has two endpoints for
 * this (plan 8.3), so the row's status picks the right one and callers just pass the decision.
 */
export function useResolveDeduction(token: string | null) {
  const waive = useWaiveDeduction(token);
  const activate = useActivateDeduction(token);
  const { mutateAsync: waiveAsync } = waive;
  const { mutateAsync: activateAsync } = activate;
  return useCallback(
    (deduction: Pick<Deduction, 'deductionId' | 'status'>, decision: 'activate' | 'waive', reason: string) => {
      if (deduction.status === 'needs_review') {
        return activateAsync({ deductionId: deduction.deductionId, reason, action: decision });
      }
      return waiveAsync({ deductionId: deduction.deductionId, reason });
    },
    [waiveAsync, activateAsync],
  );
}

export function useReassignBooking(token: string | null) {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({ bookingId, email }: { bookingId: string; email: string }) =>
      adminRequest<{ success: true }>(
        `/api/crm/admin/bookings/${encodeURIComponent(bookingId)}/attendance-assignee`,
        token,
        { method: 'PUT', body: { email } },
      ),
    onSuccess: invalidate,
  });
}

export function useConvertToMiss(token: string | null) {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({ bookingId, bdaEmail, reason }: { bookingId: string; bdaEmail: string; reason: string }) =>
      adminRequest<{ success: true }>(
        `/api/crm/admin/attendance/${encodeURIComponent(bookingId)}/convert-to-miss`,
        token,
        { method: 'POST', body: { reason, bdaEmail } },
      ),
    onSuccess: invalidate,
  });
}

/**
 * Closes a "marked present, never joined" flag without fining anyone.
 * This endpoint is not in the original contract; it is added to api-contracts.md with this change.
 */
export function useDismissIntegrityFlag(token: string | null) {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({ bookingId, bdaEmail, reason }: { bookingId: string; bdaEmail: string; reason: string }) =>
      adminRequest<{ success: true }>(
        `/api/crm/admin/attendance/${encodeURIComponent(bookingId)}/dismiss-integrity-flag`,
        token,
        { method: 'POST', body: { reason, bdaEmail } },
      ),
    onSuccess: invalidate,
  });
}

interface SaveProfileVars {
  email: string;
  update: BdaProfileUpdate;
}

/**
 * Saves a profile edit with the change shown at once. If the server refuses it, the cached
 * profile goes back to what it was. Saves run one after another (`scope`), so a fast second
 * click cannot overtake the first.
 */
export function useSaveBdaProfile(token: string | null) {
  const client = useQueryClient();
  return useMutation({
    scope: { id: 'bda-profile-save' },
    mutationFn: ({ email, update }: SaveProfileVars) =>
      adminRequest<{ success: true; profile?: BdaProfile }>(
        `/api/crm/admin/bda-profiles/${encodeURIComponent(email)}`,
        token,
        { method: 'PUT', body: update },
      ),
    onMutate: async ({ email, update }) => {
      await client.cancelQueries({ queryKey: attendanceAdminKeys.profiles });
      const previous = client.getQueryData<BdaProfilesResponse>(attendanceAdminKeys.profiles);
      if (previous) {
        client.setQueryData<BdaProfilesResponse>(attendanceAdminKeys.profiles, {
          ...previous,
          profiles: previous.profiles.map((p) => (p.email === email ? { ...p, ...update } : p)),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(attendanceAdminKeys.profiles, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: attendanceAdminKeys.profiles }),
  });
}
