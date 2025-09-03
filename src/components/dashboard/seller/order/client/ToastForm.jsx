"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

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
}) {
  const [result, formAction, pending] = useActionState(action, null);
  const wasPending = useRef(false);
  const loadingIdRef = useRef(null);

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

  const handleSubmit = (e) => {
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
