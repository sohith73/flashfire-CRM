import { Ban } from 'lucide-react';
import { ignoreReasonLabel, type IgnoreReason } from '../utils/bdaStatusOptions';
import { formatRelativeTime } from '../utils/relativeTime';

interface IgnoreReasonNoteProps {
  status?: string | null;
  reason?: IgnoreReason | null;
  /** xs fits the dense table rows, sm the lead cards and detail panels. */
  size?: 'xs' | 'sm';
  className?: string;
}

/**
 * Why a lead was ignored, shown under its status. Renders nothing unless the lead is
 * Ignored and has a stored reason (leads ignored before reasons existed have none).
 * The full text is always in the DOM; xs only clamps it visually to two lines, and
 * the hover title plus the status history popover carry the rest.
 */
export default function IgnoreReasonNote({ status, reason, size = 'xs', className = '' }: IgnoreReasonNoteProps) {
  if (status !== 'ignored' || !reason || !(reason.label || reason.code)) return null;

  const label = ignoreReasonLabel(reason);
  const note = reason.note?.trim() || null;
  const by = reason.setByName || reason.setByEmail;
  const title = [
    `Ignored: ${label}${note ? `. ${note}` : ''}`,
    by ? `by ${by}${reason.setAt ? `, ${formatRelativeTime(reason.setAt)}` : ''}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const xs = size === 'xs';
  return (
    <div
      className={`flex items-start gap-1 rounded border border-slate-200 bg-slate-50 text-slate-600 ${
        xs ? 'mt-0.5 max-w-[180px] px-1 py-0.5 text-[9px] leading-snug' : 'mt-2 px-2 py-1.5 text-xs leading-snug'
      } ${className}`}
      title={title}
      data-testid="ignore-reason"
    >
      <Ban size={xs ? 9 : 12} className={`shrink-0 text-slate-400 ${xs ? 'mt-[1px]' : 'mt-0.5'}`} aria-hidden="true" />
      <p className={`min-w-0 break-words ${xs ? 'line-clamp-2' : ''}`}>
        <span className="sr-only">Ignore reason: </span>
        <span className="font-semibold text-slate-700">{label}</span>
        {note && <span>: {note}</span>}
      </p>
    </div>
  );
}
