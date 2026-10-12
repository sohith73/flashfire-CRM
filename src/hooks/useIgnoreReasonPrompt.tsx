import { useCallback, useRef, useState, type ReactNode } from 'react';
import IgnoreReasonDialog from '../components/IgnoreReasonDialog';
import type { IgnoreReasonInput } from '../utils/bdaStatusOptions';

interface Target {
  bookingId: string;
  clientName?: string | null;
  clientEmail?: string | null;
  onConfirmed: () => void;
}

/**
 * Gate for "mark Ignored": ask() opens the reason dialog, and once the user picks a
 * reason it runs onConfirmed (the view's normal status update). The view's request
 * builder then calls takeReason(bookingId) to put the reason in the body.
 *
 * The reason is parked per booking, not passed as an argument, so it survives the
 * views' existing detours (plan-details modal, rating gate) without changing their
 * long positional signatures. takeReason removes it, so it is sent at most once.
 */
export function useIgnoreReasonPrompt(): {
  ask: (target: Target) => void;
  takeReason: (bookingId: string) => IgnoreReasonInput | undefined;
  dialog: ReactNode;
} {
  const [target, setTarget] = useState<Target | null>(null);
  const reasons = useRef(new Map<string, IgnoreReasonInput>());

  const ask = useCallback((t: Target) => setTarget(t), []);

  const takeReason = useCallback((bookingId: string) => {
    const r = reasons.current.get(bookingId);
    reasons.current.delete(bookingId);
    return r;
  }, []);

  const dialog = target ? (
    <IgnoreReasonDialog
      clientName={target.clientName}
      clientEmail={target.clientEmail}
      onConfirm={(reason) => {
        reasons.current.set(target.bookingId, reason);
        target.onConfirmed();
      }}
      onClose={() => setTarget(null)}
    />
  ) : null;

  return { ask, takeReason, dialog };
}
