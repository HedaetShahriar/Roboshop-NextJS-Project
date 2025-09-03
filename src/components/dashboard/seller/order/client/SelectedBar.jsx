"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SelectedBar({ formId = "bulkOrdersForm" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;
    const onChange = () => {
      const boxes = form.querySelectorAll('input[type="checkbox"][name="ids"]');
      let c = 0; boxes.forEach((b) => { if (b.checked) c += 1; });
      setCount(c);
    };
    form.addEventListener('change', onChange);
    onChange();
    return () => form.removeEventListener('change', onChange);
  }, [formId]);

  const visible = count > 0;

  return (
    <div className={(visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-1') + " fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-40 transition-all"}>
      <div className="mx-auto max-w-6xl rounded-xl border bg-white shadow-lg p-3 flex items-center gap-3">
        <div className="text-sm"><span className="font-semibold">{count}</span> selected</div>
        <div className="flex items-center gap-2 ml-auto">
          <Button form={formId} type="submit" name="bulkAction" value="pack" size="sm" variant="outline">Mark packed</Button>
          <Button form={formId} type="submit" name="bulkAction" value="ship" size="sm" variant="outline">Mark shipped</Button>
          <Button form={formId} type="submit" name="bulkAction" value="deliver" size="sm" variant="outline">Mark delivered</Button>
          <Button form={formId} type="submit" name="bulkAction" value="cancel" size="sm" variant="destructive">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
