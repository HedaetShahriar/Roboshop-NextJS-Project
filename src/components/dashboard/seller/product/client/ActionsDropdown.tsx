"use client";

import React, { createContext, useContext, useMemo, useState, type ReactNode, type MouseEvent } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ActionsDropdownContextValue {
  close: () => void;
}

const ActionsDropdownCtx = createContext<ActionsDropdownContextValue>({ close: () => {} });

export function useActionsDropdown(): ActionsDropdownContextValue {
  return useContext(ActionsDropdownCtx);
}

interface ActionsDropdownProps {
  title?: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  sticky?: "partial" | "always";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoCloseOnItemClick?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  showCaret?: boolean;
}

export default function ActionsDropdown({
  title = "Actions",
  children,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  avoidCollisions = true,
  collisionPadding = 8,
  sticky = "always",
  open: controlledOpen,
  onOpenChange,
  autoCloseOnItemClick = false,
  triggerClassName = "inline-flex items-center rounded border px-2 py-1 bg-white hover:bg-zinc-50 text-xs",
  contentClassName = "w-[min(92vw,520px)] max-h-[min(85vh,calc(100dvh-24px))] overflow-auto overscroll-contain p-3 rounded-xl shadow-lg border bg-white",
  showCaret = true,
}: ActionsDropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const ctx = useMemo(() => ({ close: () => setOpen(false) }), [setOpen]);

  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!autoCloseOnItemClick) return;
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    // Do not close when interacting with form inputs
    if (target.closest("input, select, textarea, label")) return;
    // Close for buttons/links or explicit data-dropdown-close
    if (target.closest("[data-dropdown-close], button, a")) {
      setOpen(false);
    }
  };

  return (
    <div className="text-xs">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className={triggerClassName} aria-label={title} aria-expanded={open}>
            {title}
            {showCaret ? <span className={`ml-1 transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▾</span> : null}
          </button>
        </DropdownMenuTrigger>
        <ActionsDropdownCtx.Provider value={ctx}>
          <DropdownMenuContent
            align={align}
            side={side}
            sideOffset={sideOffset}
            avoidCollisions={avoidCollisions}
            collisionPadding={collisionPadding}
            sticky={sticky}
            className={contentClassName}
            onClick={handleContentClick}
          >
            {children}
          </DropdownMenuContent>
        </ActionsDropdownCtx.Provider>
      </DropdownMenu>
    </div>
  );
}
