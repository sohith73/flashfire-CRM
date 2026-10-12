import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IgnoreReasonDialog from './IgnoreReasonDialog';
import StatusHistoryPopover from './StatusHistoryPopover';
import { useIgnoreReasonPrompt } from '../hooks/useIgnoreReasonPrompt';
import {
  BDA_STATUS_OPTIONS,
  IGNORE_REASONS,
  ignoreReasonProblem,
  statusMenuFor,
} from '../utils/bdaStatusOptions';
import type { IgnoreReasonInput } from '../utils/bdaStatusOptions';

const FULL_MENU = ['not-scheduled', 'scheduled', 'completed', 'no-show', 'paid', 'canceled', 'ignored'] as const;

describe('statusMenuFor', () => {
  it('gives a BDA only Completed, No Show, Paid, Ignored, in that order', () => {
    expect(statusMenuFor({ role: 'bda' }, FULL_MENU)).toEqual(['completed', 'no-show', 'paid', 'ignored']);
    expect(statusMenuFor({ role: 'bda' }, FULL_MENU)).toEqual([...BDA_STATUS_OPTIONS]);
  });

  it('gives admins the full menu, including role "bda" accounts flagged isAdmin', () => {
    expect(statusMenuFor({ role: 'admin' }, FULL_MENU)).toEqual([...FULL_MENU]);
    expect(statusMenuFor({ role: 'bda', isAdmin: true }, FULL_MENU)).toEqual([...FULL_MENU]);
  });

  it('treats a missing user as a BDA', () => {
    expect(statusMenuFor(null, FULL_MENU)).toEqual(['completed', 'no-show', 'paid', 'ignored']);
  });
});

describe('ignoreReasonProblem', () => {
  it('needs a known code, and a note only for Other', () => {
    expect(ignoreReasonProblem(null, '')).toBe('Pick a reason.');
    expect(ignoreReasonProblem('nope', '')).toBe('Pick a reason from the list.');
    expect(ignoreReasonProblem('duplicate', '')).toBeNull();
    expect(ignoreReasonProblem('other', '   ')).toMatch(/Other/);
    expect(ignoreReasonProblem('other', 'went with a competitor')).toBeNull();
    expect(ignoreReasonProblem('duplicate', 'x'.repeat(501))).toMatch(/500/);
  });
});

describe('IgnoreReasonDialog', () => {
  function setup() {
    const onConfirm = vi.fn<(r: IgnoreReasonInput) => void>();
    const onClose = vi.fn();
    render(<IgnoreReasonDialog clientName="Ahme muskan" clientEmail="a@x.test" onConfirm={onConfirm} onClose={onClose} />);
    return { onConfirm, onClose, user: userEvent.setup() };
  }

  it('lists every reason as a radio and shows who the lead is', () => {
    setup();
    expect(screen.getAllByRole('radio')).toHaveLength(IGNORE_REASONS.length);
    expect(screen.getByText('Ahme muskan · a@x.test')).toBeInTheDocument();
  });

  it('will not submit without a reason', async () => {
    const { onConfirm, onClose, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Mark Ignored' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a reason.');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sends the code, and the trimmed note when there is one', async () => {
    const { onConfirm, onClose, user } = setup();
    await user.click(screen.getByLabelText('Duplicate lead'));
    await user.click(screen.getByRole('button', { name: 'Mark Ignored' }));
    expect(onConfirm).toHaveBeenCalledWith({ code: 'duplicate' });
    expect(onClose).toHaveBeenCalled();
  });

  it('requires a written reason for Other', async () => {
    const { onConfirm, user } = setup();
    await user.click(screen.getByLabelText('Other'));
    await user.click(screen.getByRole('button', { name: 'Mark Ignored' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Reason'), '  joined a bootcamp  ');
    await user.click(screen.getByRole('button', { name: 'Mark Ignored' }));
    expect(onConfirm).toHaveBeenCalledWith({ code: 'other', note: 'joined a bootcamp' });
  });

  it('works from the keyboard: arrow through radios, Enter submits', async () => {
    const { onConfirm, user } = setup();
    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
    await user.keyboard(' '); // select the focused radio
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledWith({ code: IGNORE_REASONS[1].code });
  });

  it('Cancel closes without confirming', async () => {
    const { onConfirm, onClose, user } = setup();
    await user.click(screen.getByLabelText('Spam or fake lead'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('useIgnoreReasonPrompt', () => {
  function Harness({ onUpdate }: { onUpdate: (reason: IgnoreReasonInput | undefined) => void }) {
    const prompt = useIgnoreReasonPrompt();
    const [taken, setTaken] = useState<string>('');
    const update = () => {
      const r = prompt.takeReason('b1');
      onUpdate(r);
      // A second take must come back empty: the reason is sent at most once.
      setTaken(prompt.takeReason('b1') === undefined ? 'once' : 'twice');
    };
    return (
      <>
        <button type="button" onClick={() => prompt.ask({ bookingId: 'b1', clientName: 'C', onConfirmed: update })}>
          Ignore
        </button>
        <span data-testid="taken">{taken}</span>
        {prompt.dialog}
      </>
    );
  }

  it('opens the dialog, runs the update after confirm, and hands the reason over once', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<Harness onUpdate={onUpdate} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ignore' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Not interested'));
    await user.click(screen.getByRole('button', { name: 'Mark Ignored' }));

    expect(onUpdate).toHaveBeenCalledWith({ code: 'not_interested' });
    expect(screen.getByTestId('taken')).toHaveTextContent('once');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does nothing when the dialog is cancelled', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<Harness onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: 'Ignore' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe('StatusHistoryPopover', () => {
  it('shows the ignore reason on the history entry', async () => {
    const user = userEvent.setup();
    render(
      <StatusHistoryPopover
        history={[{ status: 'ignored', changedByName: 'Sid', source: 'bda', changedAt: '2026-10-12T05:00:00Z', reason: 'Duplicate lead: booked twice' }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'View status history' }));
    expect(screen.getByText('Duplicate lead: booked twice')).toBeInTheDocument();
  });
});
