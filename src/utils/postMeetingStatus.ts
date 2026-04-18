export const POST_MEETING_GRACE_MS = 5 * 60 * 1000;

export type PostMeetingBookingStatus = 'no-show' | 'completed';

export function validatePostMeetingBookingStatus(
  scheduledEventStartTime: string | Date | null | undefined,
  targetStatus: string
): { ok: true } | { ok: false; message: string } {
  if (targetStatus !== 'no-show' && targetStatus !== 'completed') {
    return { ok: true };
  }

  if (scheduledEventStartTime == null || scheduledEventStartTime === '') {
    return {
      ok: false,
      message:
        'No Show and Completed require a scheduled meeting time. Add or fix the meeting time first.',
    };
  }

  const startMs =
    typeof scheduledEventStartTime === 'string'
      ? new Date(scheduledEventStartTime).getTime()
      : scheduledEventStartTime.getTime();

  if (Number.isNaN(startMs)) {
    return {
      ok: false,
      message: 'Invalid scheduled meeting time; cannot set No Show or Completed.',
    };
  }

  if (Date.now() < startMs + POST_MEETING_GRACE_MS) {
    return {
      ok: false,
      message:
        'No Show and Completed are only allowed at least 5 minutes after the scheduled meeting start.',
    };
  }

  return { ok: true };
}
