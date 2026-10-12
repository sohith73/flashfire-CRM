import { isCrmAdminUser } from '../components/attendance/deductionHelpers';

/**
 * What a BDA may pick in a status menu, and the reasons offered when a lead is ignored.
 *
 * Mirrors the backend rule in BACKEND/flashfire-website-backend/Utils/bdaStatusRules.js,
 * which is the one that actually enforces it (HTTP 403 / 400). Keep both lists in sync.
 */

export const BDA_STATUS_OPTIONS = ['completed', 'no-show', 'paid', 'ignored'] as const;

type StatusViewer = { role?: string; isAdmin?: boolean } | null | undefined;

/**
 * The status menu for this viewer. Admins get the full menu unchanged; everyone else
 * gets the full menu filtered down to the BDA options, in the menu's own order.
 * An unknown or missing user is treated as a BDA: the server decides either way.
 */
export function statusMenuFor<T extends string>(viewer: StatusViewer, adminMenu: readonly T[]): T[] {
  if (isCrmAdminUser(viewer)) return [...adminMenu];
  return adminMenu.filter((s) => (BDA_STATUS_OPTIONS as readonly string[]).includes(s));
}

export function canSetAnyStatus(viewer: StatusViewer): boolean {
  return isCrmAdminUser(viewer);
}

export interface IgnoreReasonOption {
  code: string;
  label: string;
}

export const IGNORE_REASONS: readonly IgnoreReasonOption[] = [
  { code: 'not_interested', label: 'Not interested' },
  { code: 'invalid_contact', label: 'Wrong or invalid contact details' },
  { code: 'duplicate', label: 'Duplicate lead' },
  { code: 'not_eligible', label: 'Not eligible (location, visa or experience)' },
  { code: 'budget', label: "Can't afford a plan" },
  { code: 'spam', label: 'Spam or fake lead' },
  { code: 'other', label: 'Other' },
];

export const IGNORE_NOTE_MAX_LENGTH = 500;

/** What the CRM sends as `ignoreReason` in PUT /api/campaign-bookings/:id/status. */
export interface IgnoreReasonInput {
  code: string;
  note?: string;
}

/** Null when the choice can be sent, otherwise the message to show. */
export function ignoreReasonProblem(code: string | null, note: string): string | null {
  if (!code) return 'Pick a reason.';
  if (!IGNORE_REASONS.some((r) => r.code === code)) return 'Pick a reason from the list.';
  const trimmed = note.trim();
  if (trimmed.length > IGNORE_NOTE_MAX_LENGTH) return `Keep the note under ${IGNORE_NOTE_MAX_LENGTH} characters.`;
  if (code === 'other' && !trimmed) return 'Write a short reason for "Other".';
  return null;
}
