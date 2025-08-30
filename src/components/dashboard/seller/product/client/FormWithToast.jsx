"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function FormWithToast({
  action,
  className = "",
  onSubmitToast,
  successToast = "Done",
  errorToast = "Something went wrong",
  confirmMessage,
  children,
}) {
  // Bind to server action to observe completion
  const [result, formAction, pending] = useActionState(action, null);
  const wasPending = useRef(false);
  const loadingIdRef = useRef(null);
  // Plain success/error toasts only; native confirm() when confirmMessage is set

  useEffect(() => {
    if (wasPending.current && !pending) {
      // Dismiss the loading toast first
      if (loadingIdRef.current) {
        toast.dismiss(loadingIdRef.current);
        loadingIdRef.current = null;
      }
  // Show success if server returned ok !== false; otherwise error
  const ok = result == null ? true : result?.ok !== false;
  if (ok) toast.success(successToast);
  else toast.error(result?.message || errorToast);
    }
    wasPending.current = pending;
  }, [pending, result, successToast, errorToast]);

  const submittedRef = useRef(null);

  const handleSubmit = (e) => {
    if (confirmMessage && !confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }
  // Capture submitted form data
  try { submittedRef.current = new FormData(e.currentTarget); } catch { submittedRef.current = null; }
    // Default: show loading and let native submit call formAction
    if (onSubmitToast) {
      loadingIdRef.current = toast.loading(onSubmitToast);
    }
  };

  return (
  <form action={formAction} className={className} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
