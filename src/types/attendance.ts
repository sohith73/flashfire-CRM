// Contract types for BDA attendance. Source of truth: DASH/BDA attendance/docs/api-contracts.md.
// Unknown or not-yet-computed values arrive as null, never missing.

/** One countable meeting and its Mark Present window (all times ISO, server clock). */
export interface Window {
  bookingId: string;
  clientName: string;
  scheduledStart: string;
  windowOpensAt: string;
  windowClosesAt: string;
  marked: boolean;
  markedPresentAt: string | null;
  verdict: 'present' | 'absent' | null;
  verdictSignal: SignalKind | null;
}

export interface MyWindowResponse {
  success: true;
  /** The server clock at the moment of the response. The countdown is derived from this. */
  serverTime: string;
  /** Registry flag for the logged-in user. When false the card renders nothing. */
  tracked: boolean;
  current: Window | null;
  next: Window | null;
}

export interface MarkPresentResponse {
  success: true;
  marked: true;
  markedPresentAt: string;
}

export type SignalKind = 'button_meet' | 'button_crm' | 'extension_join' | 'google_meet';

export interface AttendanceSignal {
  kind: SignalKind;
  eventAt: string;
}

export interface AttendanceSession {
  joinedAt: string;
  leftAt: string | null;
}

export interface MeetingAttendance {
  verdict: 'present' | 'absent' | null;
  verdictAt: string | null;
  markedPresentAt: string | null;
  signals: AttendanceSignal[];
  inAt: string | null;
  outAt: string | null;
  timeSpentMs: number;
  sessions: AttendanceSession[];
  /** true when the times come from Google Meet conference records */
  verified: boolean;
  matchedBy: 'stable_id' | 'name' | null;
  integrityFlag: 'marked_never_joined' | null;
}

export interface CallSummary {
  calls: number;
  connected: boolean;
  firstCallAt: string | null;
  /** Minutes after the scheduled start. Negative means before the start. */
  firstCallOffsetMin: number | null;
  talkSec: number;
  calledWithin30Min: boolean;
  lastCallAt: string | null;
}

export interface StatusUpdate {
  status: string;
  updatedBy: string | null;
  updatedAt: string | null;
  /** true when the booking is stuck on scheduled long after the meeting */
  stuck: boolean;
}

export type DeductionRule = 'missed_meeting' | 'no_show_not_called' | 'status_not_updated';
export type DeductionStatus = 'shadow' | 'needs_review' | 'active' | 'waived' | 'voided';

/** The small form of a deduction that rides on every meeting row. */
export interface DeductionChip {
  deductionId: string;
  rule: DeductionRule;
  amountInr: number;
  status: DeductionStatus;
  waiverReason: string | null;
}

/** The full ledger row from GET /api/crm/deductions. */
export interface Deduction {
  deductionId: string;
  bdaEmail: string;
  bdaName: string;
  bookingId: string;
  clientName: string;
  rule: DeductionRule;
  month: string;
  amountInr: number;
  tierIndex: number | null;
  status: DeductionStatus;
  evidence: {
    scheduledStart: string;
    windowClosedAt: string | null;
    signals: AttendanceSignal[];
    bookingStatus: string | null;
    callSummary: Partial<CallSummary> | null;
    clientName: string;
  };
  waivedBy: string | null;
  waivedByName: string | null;
  waivedAt: string | null;
  waiverReason: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
}

/**
 * Transcript reference. Stays null until Part E ships, so the shape is deliberately loose:
 * a bare URL string or an object with an optional url.
 */
export type TranscriptRef = string | { url?: string | null };

/** The attendance fields every meeting row gains on /api/meeting-links and /api/leads/paginated. */
export interface MeetingAttendanceFields {
  attendance: MeetingAttendance | null;
  callSummary: CallSummary | null;
  statusUpdate: StatusUpdate | null;
  deductions: DeductionChip[] | null;
  transcript: TranscriptRef | null;
}

/**
 * One row of GET /api/crm/attendance/my-month?month=YYYY-MM.
 * This endpoint is not in the original contract; it is added to api-contracts.md with this change.
 */
export interface MyMonthRow extends MeetingAttendanceFields {
  bookingId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  bookingStatus: string | null;
}

export interface MyMonthResponse {
  success: true;
  month: string;
  rows: MyMonthRow[];
}
