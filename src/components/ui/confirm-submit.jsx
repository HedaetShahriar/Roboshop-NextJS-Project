"use client";
import { useState } from "react";
import { Button } from "./button";

export function ConfirmSubmit({
  formId,
  triggerText = "Submit",
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  triggerVariant = "destructive",
  confirmVariant = "destructive",
  size = "sm",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const submitForm = () => {
    const form = document.getElementById(formId);
    if (form) form.requestSubmit();
    setOpen(false);
  };
  return (
    <>
      <Button type="button" size={size} variant={triggerVariant} className={className} onClick={() => setOpen(true)}>
        {triggerText}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-md border bg-white p-4 shadow-lg">
            <div className="text-base font-semibold">{title}</div>
            <div className="mt-1 text-sm text-gray-600">{description}</div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                {cancelText}
              </Button>
              <Button type="button" variant={confirmVariant} size="sm" onClick={submitForm}>
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
