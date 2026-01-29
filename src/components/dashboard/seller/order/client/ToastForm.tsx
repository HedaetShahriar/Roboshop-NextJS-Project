"use client";

import { useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

interface ActionResult {
  ok?: boolean;
  message?: string;
}

// Support both server action signatures
type ActionFn = 
  | ((prevState: ActionResult | null, formData: FormData) => Promise<ActionResult | null>)
  | ((formData: FormData) => Promise<void>);

interface ToastFormProps {
  id?: string;
  action: ActionFn;
  className?: string;
  onSubmitToast?: string;
  successToast?: string;
  errorToast?: string;
  requireField?: string;
  requireFieldHasValue?: boolean;
  confirmMessage?: string;
  children?: ReactNode;
}

// Wrapper to normalize action signatures
function wrapAction(action: ActionFn): (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult | null> {
  return async (_prevState: ActionResult | null, formData: FormData) => {
    try {
      const result = await (action as (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult | null>)(_prevState, formData);
      // If result is undefined/void, treat as success
      if (result === undefined || result === null) return { ok: true };
      return result;
    } catch {
      return { ok: false, message: 'Action failed' };
    }
  };
}

export default function ToastForm({
  id,
  action,
  className = "",
  onSubmitToast = "Working…",
  successToast = "Done",
  errorToast = "Something went wrong",
  requireField,
  requireFieldHasValue = true,
  confirmMessage,
  children,
}: ToastFormProps) {
  const wrappedAction = wrapAction(action);
  const [result, formAction, pending] = useActionState(wrappedAction, null);
  const wasPending = useRef(false);
  const loadingIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (wasPending.current && !pending) {
      // Dismiss loading toast
      if (loadingIdRef.current) {
        toast.dismiss(loadingIdRef.current);
        loadingIdRef.current = null;
      }
  const ok = result == null ? true : result?.ok !== false;
  const msg = (result && typeof result.message === 'string' && result.message) ? result.message : undefined;
  if (ok) toast.success(msg || successToast);
  else toast.error(msg || errorToast);
    }
    wasPending.current = pending;
  }, [pending, result, successToast, errorToast]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Ignore submit events coming from nested/portal forms (e.g., dialogs)
    // Only show toast when this specific form is the one being submitted.
    if (e.currentTarget !== e.target) {
      return;
    }
    if (confirmMessage && !confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }
    try {
      if (requireField) {
        const fd = new FormData(e.currentTarget);
        if (!fd.has(requireField)) return;
        if (requireFieldHasValue) {
          const val = fd.get(requireField);
          if (val == null || String(val).trim() === '') return;
        }
      }
    } catch {}
    if (onSubmitToast) {
      loadingIdRef.current = toast.loading(onSubmitToast);
    }
  };

  return (
    <form id={id} action={formAction} className={className} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
