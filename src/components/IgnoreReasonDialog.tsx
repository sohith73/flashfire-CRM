import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  IGNORE_NOTE_MAX_LENGTH,
  IGNORE_REASONS,
  ignoreReasonProblem,
  type IgnoreReasonInput,
} from '../utils/bdaStatusOptions';

interface IgnoreReasonDialogProps {
  /** Who is being ignored, shown under the title. */
  clientName?: string | null;
  clientEmail?: string | null;
  onConfirm: (reason: IgnoreReasonInput) => void;
  onClose: () => void;
}

/**
 * Asks why a lead is being marked Ignored before the status changes. Mount it only
 * while it should be open; closing unmounts it and drops the choice. Nothing is sent
 * from here: onConfirm hands the reason back and the caller makes the status request.
 */
export default function IgnoreReasonDialog({ clientName, clientEmail, onConfirm, onClose }: IgnoreReasonDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(typeof document === 'undefined' ? null : document.activeElement);
  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const titleId = useId();
  const noteId = useId();
  const errorId = useId();

  const problem = ignoreReasonProblem(code, note);
  const noteRequired = code === 'other';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    firstRadioRef.current?.focus();
    const remembered = opener.current;
    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      if (remembered instanceof HTMLElement && remembered.isConnected) remembered.focus();
    };
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (problem !== null || !code) return;
    const trimmed = note.trim();
    onConfirm(trimmed ? { code, note: trimmed } : { code });
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold">
              Why are you ignoring this lead?
            </h2>
            {(clientName || clientEmail) && (
              <p className="mt-0.5 truncate text-sm text-slate-600">
                {[clientName, clientEmail].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <fieldset aria-describedby={tried && problem ? errorId : undefined}>
            <legend className="sr-only">Reason</legend>
            <div className="space-y-1">
              {IGNORE_REASONS.map((r, i) => (
                <label
                  key={r.code}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                    code === r.code ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={i === 0 ? firstRadioRef : undefined}
                    type="radio"
                    name="ignore-reason"
                    value={r.code}
                    checked={code === r.code}
                    onChange={() => setCode(r.code)}
                    className="accent-orange-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={noteId} className="block text-sm font-semibold text-slate-800">
              {noteRequired ? 'Reason' : 'Note (optional)'}
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={IGNORE_NOTE_MAX_LENGTH + 50}
              required={noteRequired}
              aria-invalid={tried && problem !== null && noteRequired}
              className={`mt-1 block w-full resize-y rounded-lg border px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500 ${
                tried && problem !== null && noteRequired ? 'border-red-400' : 'border-slate-300'
              }`}
              placeholder={noteRequired ? 'What happened?' : 'Anything the admin should know'}
            />
          </div>

          {tried && problem && (
            <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
              {problem}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
          >
            Mark Ignored
          </button>
        </div>
      </form>
    </dialog>
  );
}
