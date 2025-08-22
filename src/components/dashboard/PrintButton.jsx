"use client";
import { Button } from "@/components/ui/button";

export default function PrintButton({ className = "", size = "sm", variant = "outline" }) {
  return (
    <Button type="button" size={size} variant={variant} className={className} onClick={() => window.print()}>
      <span className="mr-2">🖨️</span> Print
    </Button>
  );
}
