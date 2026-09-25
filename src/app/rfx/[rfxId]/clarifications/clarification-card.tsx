"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type WorkflowState = "review" | "sent";

const buttonBase = "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors";

/**
 * One clarification: subject/question editable before send, buyer must
 * approve. Demo-only send -- no email is actually dispatched, matching the
 * existing ClarificationAction workflow on the Response Intelligence page.
 */
export function ClarificationCard({
  vendorName,
  subject,
  question,
  affectedLines,
  alreadySent,
}: {
  vendorName: string;
  subject: string;
  question: string;
  affectedLines: string;
  alreadySent: boolean;
}) {
  const [state, setState] = useState<WorkflowState>(alreadySent ? "sent" : "review");
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [sentAt, setSentAt] = useState<string | null>(null);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{vendorName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{affectedLines}</p>
        </div>
        <Badge tone={state === "sent" ? "emerald" : "amber"}>{state === "sent" ? "Sent" : "Pending approval"}</Badge>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Subject</p>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{subject}</p>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Message</p>
        {state === "review" && isEditing ? (
          <textarea
            value={editedQuestion}
            onChange={(event) => setEditedQuestion(event.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        ) : (
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{editedQuestion}</p>
        )}

        {state === "review" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className={`${buttonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
            >
              {isEditing ? "Done editing" : "Edit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSentAt(new Date().toLocaleString("en-US"));
                setState("sent");
              }}
              className={`${buttonBase} bg-indigo-600 text-white hover:bg-indigo-500`}
            >
              Approve &amp; Send
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            <p className="font-medium">✓ Clarification sent</p>
            {sentAt && <p className="mt-1">Approved by Procurement Team · {sentAt}</p>}
            <p className="mt-1 text-emerald-700 dark:text-emerald-400">
              Demo action only -- no email was actually sent, and the underlying clarification record is unchanged.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
