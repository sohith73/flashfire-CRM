// Admin and ledger shapes for the Deductions tab, review queues and BDA registry.
// Source of truth: DASH/BDA attendance/docs/api-contracts.md. Row-level types (Deduction,
// DeductionRule, DeductionStatus) live in ./attendance.ts and are reused here, not redeclared.
import type { Deduction, DeductionRule, SignalKind } from './attendance';

export type DeductionsMode = 'off' | 'shadow' | 'live';

export interface RuleTotal {
  count: number;
  amountInr: number;
}

export type RuleTotals = Record<DeductionRule, RuleTotal>;

export interface DeductionsResponse {
  success: true;
  month: string;
  mode: DeductionsMode;
  rows: Deduction[];
  totals: {
    byRule: Partial<RuleTotals>;
    activeAmountInr: number;
  };
}

export interface DeductionSummaryRow {
  bdaEmail: string;
  name: string;
  activeAmountInr: number;
  count: number;
  byRule: Partial<RuleTotals>;
}

export interface DeductionSummaryResponse {
  success: true;
  month: string;
  perBda: DeductionSummaryRow[];
}

export interface WaiveBody {
  reason: string;
}

export interface ActivateBody {
  reason: string;
  action: 'activate' | 'waive';
}

export interface DeductionMutationResponse {
  success: true;
  deduction: Deduction;
}

export interface MarkedNeverJoinedItem {
  bookingId: string;
  clientName: string;
  bdaEmail: string;
  scheduledStart: string;
  markedAt: string;
  signal: SignalKind;
}

export interface StuckStatusItem {
  bookingId: string;
  clientName: string;
  bdaEmail: string;
  scheduledStart: string;
  bookingStatus: string;
}

export interface NeedsReassignmentItem {
  bookingId: string;
  clientName: string;
  scheduledStart: string;
  assignedBdaEmail: string;
  reason: string;
}

export interface ReviewQueuesResponse {
  success: true;
  needsReview: Deduction[];
  markedNeverJoined: MarkedNeverJoinedItem[];
  stuckStatus: StuckStatusItem[];
  needsReassignment: NeedsReassignmentItem[];
}

export interface BdaProfile {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  aliases: string[];
  calendlyUserUri?: string | null;
  zoomUserId?: string | null;
  googleUserId?: string | null;
  discordUserId: string | null;
  /** Approved leave dates, 'YYYY-MM-DD' in IST. */
  leaveDays: string[];
  active: boolean;
  tracked: boolean;
}

export interface UnknownBdaName {
  name: string;
  count: number;
  lastSeenAt: string;
  source: string;
}

export interface BdaProfilesResponse {
  success: true;
  profiles: BdaProfile[];
  unknownNames: UnknownBdaName[];
}

/** The fields PUT /api/crm/admin/bda-profiles/:email accepts. */
export interface BdaProfileUpdate {
  aliases: string[];
  discordUserId: string | null;
  leaveDays: string[];
  tracked: boolean;
  active: boolean;
}
