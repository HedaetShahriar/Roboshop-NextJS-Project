"use client";

import type { ReactNode } from "react";

interface SubmitFormButtonProps {
  formId: string;
  sourceId?: string;
  targetName?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export default function SubmitFormButton({
  formId,
  sourceId,
  targetName,
  className = "",
  disabled = false,
  children = "Submit",
}: SubmitFormButtonProps) {
  function handleClick() {
    if (disabled) return;
    try {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      if (!form) return;
      if (sourceId && targetName) {
        const src = document.getElementById(sourceId) as HTMLInputElement | null;
        if (src) {
          let input = form.querySelector(
            `input[name="${targetName}"]`
          ) as HTMLInputElement | null;
          if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = String(targetName);
            form.appendChild(input);
          }
          input.value = String(src.value ?? "");
        }
      }
      form.requestSubmit();
    } catch {
      // no-op
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}
