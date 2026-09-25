"use client";

import { useState } from "react";
import { generateClarificationDraft, type ExceptionGroup } from "./view-model";

type WorkflowState = "idle" | "drafting" | "sent";

const buttonBase = "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors";

/**
 * Exception -> Generate clarification -> buyer reviews/edits -> buyer
 * approves -> demo send confirmation. Purely client-local state: nothing
 * is sent, and the underlying Clarification/Exception seed data is never
 * mutated -- there is no write path back to it from here.
 */
export function ClarificationAction({ group, vendorName }: { group: ExceptionGroup; vendorName: string }) {
  const [state, setState] = useState<WorkflowState>("idle");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);

  const startDraft = () => {
    const draft = generateClarificationDraft(group, vendorName);
    setSubject(draft.subject);
    setMessage(draft.message);
    setIsEditing(false);
    setState("drafting");
  };

  const cancel = () => {
    setState("idle");
    setIsEditing(false);
  };

  const approveAndSend = () => {
    setSentAt(new Date().toLocaleString("en-US"));
    setState("sent");
  };

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={startDraft}
        className={`${buttonBase} w-fit border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950`}
      >
        Generate clarification
      </button>
    );
  }

  if (state === "sent") {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        <p className="font-medium">✓ Clarification sent</p>
        <p className="mt-1">Approved by Procurement Team · {sentAt}</p>
        <p className="mt-1 text-emerald-700 dark:text-emerald-400">
          Demo action only -- no email was actually sent, and the underlying clarification record is unchanged.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-2 text-emerald-700 underline hover:no-underline dark:text-emerald-400"
        >
          Draft again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs dark:border-indigo-800 dark:bg-indigo-950">
        <label className="block text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
          Subject
        </label>
        {isEditing ? (
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-0.5 w-full rounded border border-indigo-300 bg-white px-2 py-1 text-xs text-indigo-950 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-100"
          />
        ) : (
          <p className="mt-0.5 font-medium text-indigo-900 dark:text-indigo-200">{subject}</p>
        )}

        <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
          Message
        </label>
        {isEditing ? (
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={9}
            className="mt-0.5 w-full rounded border border-indigo-300 bg-white px-2 py-1 text-xs text-indigo-950 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-100"
          />
        ) : (
          <p className="mt-0.5 whitespace-pre-line text-indigo-900 dark:text-indigo-200">{message}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={cancel}
          className={`${buttonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={`${buttonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={approveAndSend}
          className={`${buttonBase} bg-indigo-600 text-white hover:bg-indigo-500`}
        >
          Approve &amp; Send
        </button>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Demo action -- approving does not send an email or modify the underlying clarification record.
      </p>
    </div>
  );
}
