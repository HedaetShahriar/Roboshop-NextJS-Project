"use client";

import { useState } from "react";

export default function ConversationLazy({ messages = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="mt-2 border rounded p-2 bg-zinc-50" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer select-none text-sm font-medium flex items-center gap-2">
        <span className="i-lucide-message-square-text h-4 w-4" aria-hidden />
        Conversation <span className="text-xs text-gray-500">(latest 20)</span>
      </summary>
      {open ? (
        <ul className="mt-2 space-y-1 max-h-56 overflow-auto pr-1 will-change-transform">
          {messages?.map((m, idx) => {
            const isSeller = (m?.by || '').toLowerCase() === 'seller';
            return (
              <li key={idx} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-md px-2 py-1 text-sm ${isSeller ? 'bg-blue-50 text-blue-900' : 'bg-white border'}`}>
                  <div className="text-[11px] opacity-70 capitalize">{m?.by} • {m?.at ? new Date(m.at).toLocaleString() : ''}</div>
                  <div>{m?.text}</div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </details>
  );
}
