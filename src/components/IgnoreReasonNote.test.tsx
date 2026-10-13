import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IgnoreReasonNote from './IgnoreReasonNote';

const reason = {
  code: 'duplicate',
  label: 'Duplicate lead',
  note: 'booked twice with two emails',
  setByName: 'Sid',
  setAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

describe('IgnoreReasonNote', () => {
  it('shows label and note for an ignored lead', () => {
    render(<IgnoreReasonNote status="ignored" reason={reason} />);
    const el = screen.getByTestId('ignore-reason');
    expect(el).toHaveTextContent('Ignore reason: Duplicate lead: booked twice with two emails');
    expect(el.title).toContain('Ignored: Duplicate lead. booked twice with two emails');
    expect(el.title).toContain('by Sid');
  });

  it('renders nothing when the lead is not ignored any more', () => {
    render(<IgnoreReasonNote status="no-show" reason={reason} />);
    expect(screen.queryByTestId('ignore-reason')).not.toBeInTheDocument();
  });

  it('renders nothing for old ignored leads with no stored reason', () => {
    render(<IgnoreReasonNote status="ignored" reason={null} />);
    expect(screen.queryByTestId('ignore-reason')).not.toBeInTheDocument();
  });

  it('falls back to the local label when the server sent only a code', () => {
    render(<IgnoreReasonNote status="ignored" reason={{ code: 'spam', label: '' }} />);
    expect(screen.getByTestId('ignore-reason')).toHaveTextContent('Spam or fake lead');
  });
});
