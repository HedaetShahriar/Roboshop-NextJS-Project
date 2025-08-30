"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function CopyLinkButton({ url, className = "", title = "Copy link" }) {
  const onClick = async () => {
    try {
      const abs = url.startsWith("http") ? url : `${location.origin}${url}`;
      await navigator.clipboard?.writeText(abs);
      toast.success("Link copied");
    } catch (e) {
      toast.error("Failed to copy");
    }
  };
  return (
    <button type="button" className={className} title={title} onClick={onClick}>
      <Copy className="size-3.5" /> Copy
    </button>
  );
}
