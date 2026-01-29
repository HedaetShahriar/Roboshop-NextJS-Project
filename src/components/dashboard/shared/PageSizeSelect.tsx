"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ChangeEvent } from "react";

interface PageSizeSelectProps {
  value: number | string;
}

export default function PageSizeSelect({ value }: PageSizeSelectProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const onChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('pageSize', e.target.value);
    sp.set('page', '1');
    router.replace(`${pathname}?${sp.toString()}`);
  };

  return (
    <select className="border rounded-md h-9 px-2 text-sm" value={String(value)} onChange={onChange}>
      <option value="10">10</option>
      <option value="20">20</option>
      <option value="50">50</option>
      <option value="100">100</option>
    </select>
  );
}
