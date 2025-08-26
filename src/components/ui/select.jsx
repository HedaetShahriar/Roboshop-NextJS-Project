'use client';

import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const Select = RadixSelect.Root;

export const SelectValue = RadixSelect.Value;

export const SelectTrigger = React.forwardRef(function SelectTrigger(
  { className, children, ...props },
  ref
) {
  return (
    <RadixSelect.Trigger
      ref={ref}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <RadixSelect.Icon>
        <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
});

export const SelectContent = React.forwardRef(function SelectContent(
  { className, children, ...props },
  ref
) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        ref={ref}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-sm shadow-md',
          className
        )}
        {...props}
      >
        <RadixSelect.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
          <ChevronUp className="h-4 w-4" />
        </RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport className="p-1">
          {children}
        </RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
          <ChevronDown className="h-4 w-4" />
        </RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
});

export const SelectItem = React.forwardRef(function SelectItem(
  { className, children, ...props },
  ref
) {
  return (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none focus:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
});
