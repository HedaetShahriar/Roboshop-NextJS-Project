// "use client";
// import { useEffect, useMemo, useState, useTransition } from "react";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";

// const SORT_OPTIONS = [
//   { value: "newest", label: "Newest", field: "createdAt", dir: "desc" },
//   { value: "oldest", label: "Oldest", field: "createdAt", dir: "asc" },
//   { value: "amount-high", label: "Amount High → Low", field: "amounts.total", dir: "desc" },
//   { value: "amount-low", label: "Amount Low → High", field: "amounts.total", dir: "asc" },
//   { value: "status-asc", label: "Status A → Z", field: "status", dir: "asc" },
//   { value: "status-desc", label: "Status Z → A", field: "status", dir: "desc" },
// ];
// const STATUS_OPTIONS = [
//   "processing",
//   "packed",
//   "assigned",
//   "shipped",
//   "delivered",
//   "cancelled",
// ];

// function formatAmount(n) {
//   const num = Number(n || 0);
//   return num.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });
// }

// function parseStatusMulti(val) {
//   if (!val) return [];
//   try {
//     if (val.startsWith("[")) return JSON.parse(val);
//     return val.split(",").map((s) => s.trim()).filter(Boolean);
//   } catch { return []; }
// }

// function useQueryState() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const [isPending, startTransition] = useTransition();

//   const state = useMemo(() => {
//     const page = Math.max(1, Number(searchParams.get("page") || 1));
//     const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") || 20)));
//     const sort = searchParams.get("sort") || "newest";
//     const status = parseStatusMulti(searchParams.get("status"));
//     const q = searchParams.get("q") || "";
//     return { page, pageSize, sort, status, q };
//   }, [searchParams]);

//   const setState = (updates) => {
//     const sp = new URLSearchParams(searchParams);
//     for (const [k, v] of Object.entries(updates)) {
//       if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) sp.delete(k);
//       else if (Array.isArray(v)) sp.set(k, JSON.stringify(v));
//       else sp.set(k, String(v));
//     }
//     startTransition(() => router.push(`${pathname}?${sp.toString()}`));
//   };

//   return [state, setState, isPending];
// }

// export default function SellerOrdersTable() {
//   const [state, setState, isPending] = useQueryState();
//   const [data, setData] = useState({ orders: [], total: 0, page: 1, pageSize: 20 });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   // Column visibility state
//   const [visibleCols, setVisibleCols] = useState({
//     order: true,
//     status: true,
//     items: true,
//     total: true,
//     placed: true,
//     action: true,
//   });
//   // Row selection state
//   const [selected, setSelected] = useState([]);

//   useEffect(() => {
//     let cancelled = false;
//     async function load() {
//       setLoading(true);
//       setError("");
//       try {
//         const params = new URLSearchParams();
//         params.set("page", String(state.page));
//         params.set("pageSize", String(state.pageSize));
//         if (state.sort) params.set("sort", state.sort);
//   if (state.status && state.status.length) params.set("status", JSON.stringify(state.status));
//         if (state.q) params.set("q", state.q);
//         const res = await fetch(`/api/seller/orders?${params.toString()}`, { cache: "no-store" });
//         if (!res.ok) throw new Error(`Failed: ${res.status}`);
//         const json = await res.json();
//         if (!cancelled) setData(json);
//       } catch (e) {
//         if (!cancelled) setError(e?.message || "Failed to load");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }
//     load();
//     return () => { cancelled = true; };
//   }, [state.page, state.pageSize, state.sort, state.status, state.q]);

//   const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 20)));

//   // Column sorting state
//   const [sortField, sortDir] = useMemo(() => {
//     const opt = SORT_OPTIONS.find(o => o.value === state.sort) || SORT_OPTIONS[0];
//     return [opt.field, opt.dir];
//   }, [state.sort]);

//   // Multi-select status chips
//   const onToggleStatus = (status) => {
//     const set = new Set(state.status);
//     if (set.has(status)) set.delete(status); else set.add(status);
//     setState({ status: Array.from(set), page: 1 });
//   };

//   // Column sort by header click
//   const onSort = (field) => {
//     let nextSort = "newest";
//     if (field === "createdAt") {
//       nextSort = state.sort === "newest" ? "oldest" : "newest";
//     } else if (field === "amounts.total") {
//       nextSort = state.sort === "amount-high" ? "amount-low" : "amount-high";
//     } else if (field === "status") {
//       nextSort = state.sort === "status-asc" ? "status-desc" : "status-asc";
//     }
//     setState({ sort: nextSort, page: 1 });
//   };

//   // Column visibility toggle
//   const toggleCol = (col) => setVisibleCols((v) => ({ ...v, [col]: !v[col] }));

//   // Row selection
//   const onSelectRow = (id) => {
//     setSelected((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
//   };
//   const onSelectAll = () => {
//     if (selected.length === data.orders.length) setSelected([]);
//     else setSelected(data.orders.map((o) => typeof o._id === 'object' && o._id?.$oid ? o._id.$oid : String(o._id)));
//   };

//   // Export to CSV
//   const exportCSV = () => {
//     const cols = [
//       visibleCols.order && 'Order',
//       visibleCols.status && 'Status',
//       visibleCols.items && 'Items',
//       visibleCols.total && 'Total',
//       visibleCols.placed && 'Placed',
//     ].filter(Boolean);
//     const rows = data.orders.map((o) => [
//       visibleCols.order ? (o.orderNumber || (typeof o._id === 'object' && o._id?.$oid ? o._id.$oid : String(o._id))) : null,
//       visibleCols.status ? (o.status || '-') : null,
//       visibleCols.items ? (Array.isArray(o.items) ? o.items.length : 0) : null,
//       visibleCols.total ? (o?.amounts?.total ?? '') : null,
//       visibleCols.placed ? (o.createdAt ? new Date(o.createdAt).toLocaleString() : '-') : null,
//     ].filter((v) => v !== null));
//     const csv = [cols, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'orders.csv';
//     a.click();
//     setTimeout(() => URL.revokeObjectURL(url), 1000);
//   };

//   // Bulk actions
//   const [bulkLoading, setBulkLoading] = useState(false);
//   const bulkAction = async (action) => {
//     if (!selected.length) return;
//     setBulkLoading(true);
//     try {
//       // Example: POST to /api/seller/orders/bulk with { ids, action }
//       const res = await fetch('/api/seller/orders/bulk', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ids: selected, action }),
//       });
//       if (!res.ok) throw new Error('Bulk action failed');
//       setSelected([]);
//       // Reload data
//       setState({});
//     } catch (e) {
//       alert(e?.message || 'Bulk action failed');
//     } finally {
//       setBulkLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-3">
//   <div className="flex flex-wrap items-center gap-2">
//         <input
//           type="search"
//           placeholder="Search orders..."
//           defaultValue={state.q}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") setState({ q: e.currentTarget.value, page: 1 });
//           }}
//           className="h-9 w-56 rounded border px-2 text-sm"
//         />
//         <div className="flex flex-wrap gap-1">
//           {STATUS_OPTIONS.map((s) => (
//             <button
//               key={s}
//               type="button"
//               onClick={() => onToggleStatus(s)}
//               className={[
//                 "text-xs rounded-full border px-2 py-1 capitalize",
//                 state.status.includes(s) ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 hover:bg-zinc-50"
//               ].join(" ")}
//             >
//               {s}
//             </button>
//           ))}
//         </div>
//         <select
//           value={state.sort}
//           onChange={(e) => setState({ sort: e.target.value, page: 1 })}
//           className="h-9 rounded border px-2 text-sm"
//         >
//           {SORT_OPTIONS.map((o) => (
//             <option key={o.value} value={o.value}>{o.label}</option>
//           ))}
//         </select>
//   <button onClick={exportCSV} className="ml-2 h-9 px-3 rounded border bg-white text-xs hover:bg-zinc-50">Export CSV</button>
//         {selected.length > 0 && (
//           <div className="flex gap-1 items-center ml-2">
//             <span className="text-xs text-gray-500">Bulk:</span>
//             <button disabled={bulkLoading} onClick={() => bulkAction('markShipped')} className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">Mark as Shipped</button>
//             <button disabled={bulkLoading} onClick={() => bulkAction('cancel')} className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">Cancel</button>
//             <button disabled={bulkLoading} onClick={() => bulkAction('delete')} className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50 text-red-600">Delete</button>
//           </div>
//         )}
//         <div className="ml-auto text-xs text-gray-500">
//           Page {data.page}/{totalPages} · {data.pageSize}/page · Total {data.total}
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-2 items-center">
//         <span className="text-xs text-gray-500">Columns:</span>
//         {Object.entries(visibleCols).map(([col, v]) => (
//           <label key={col} className="text-xs flex items-center gap-1">
//             <input type="checkbox" checked={v} onChange={() => toggleCol(col)} />
//             {col.charAt(0).toUpperCase() + col.slice(1)}
//           </label>
//         ))}
//       </div>

//       <div className="overflow-x-auto rounded border bg-white">
//         <table className="min-w-full text-sm">
//           <thead className="bg-zinc-50 text-left">
//             <tr>
//               <th className="px-2 py-2">
//                 <input type="checkbox" checked={selected.length === data.orders.length && data.orders.length > 0} onChange={onSelectAll} />
//               </th>
//               {visibleCols.order && <th className="px-3 py-2 cursor-pointer select-none" onClick={() => onSort("orderNumber")}>Order</th>}
//               {visibleCols.status && <th className="px-3 py-2 cursor-pointer select-none" onClick={() => onSort("status")}>Status {sortField === "status" && <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>}</th>}
//               {visibleCols.items && <th className="px-3 py-2">Items</th>}
//               {visibleCols.total && <th className="px-3 py-2 cursor-pointer select-none" onClick={() => onSort("amounts.total")}>Total {sortField === "amounts.total" && <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>}</th>}
//               {visibleCols.placed && <th className="px-3 py-2 cursor-pointer select-none" onClick={() => onSort("createdAt")}>Placed {sortField === "createdAt" && <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>}</th>}
//               {visibleCols.action && <th className="px-3 py-2">Action</th>}
//             </tr>
//           </thead>
//           <tbody className="divide-y">
//             {data.orders.map((o) => {
//               const id = typeof o._id === 'object' && o._id?.$oid ? o._id.$oid : String(o._id);
//               const items = Array.isArray(o.items) ? o.items.length : 0;
//               const created = o.createdAt ? new Date(o.createdAt) : null;
//               return (
//                 <tr key={id} className={"hover:bg-zinc-50 " + (selected.includes(id) ? "bg-zinc-100" : "") }>
//                   <td className="px-2 py-2">
//                     <input type="checkbox" checked={selected.includes(id)} onChange={() => onSelectRow(id)} />
//                   </td>
//                   {visibleCols.order && <td className="px-3 py-2 font-medium">{o.orderNumber || id}</td>}
//                   {visibleCols.status && <td className={"px-3 py-2 capitalize " + (o.status === "cancelled" ? "text-red-600" : o.status === "delivered" ? "text-green-700" : "")}>{o.status || '-'}</td>}
//                   {visibleCols.items && <td className="px-3 py-2">{items}</td>}
//                   {visibleCols.total && <td className="px-3 py-2">{formatAmount(o?.amounts?.total)}</td>}
//                   {visibleCols.placed && <td className="px-3 py-2">{created ? created.toLocaleString() : '-'}</td>}
//                   {visibleCols.action && <td className="px-3 py-2">
//                     <a href={`/dashboard/seller/orders/${id}`} className="text-blue-600 underline text-xs">View</a>
//                   </td>}
//                 </tr>
//               );
//             })}
//             {(!loading && data.orders.length === 0) && (
//               <tr>
//                 <td colSpan={1 + Object.values(visibleCols).filter(Boolean).length} className="px-3 py-10 text-center text-gray-500">No orders found.</td>
//               </tr>
//             )}
//           </tbody>
//         </table>

//         {loading && (
//           <div className="p-3 text-sm text-gray-500">Loading…</div>
//         )}
//         {error && (
//           <div className="p-3 text-sm text-red-600">{error}</div>
//         )}
//       </div>

//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2 text-sm">
//           <span>Rows per page:</span>
//           <select
//             value={state.pageSize}
//             onChange={(e) => setState({ pageSize: Number(e.target.value), page: 1 })}
//             className="h-8 rounded border px-2"
//           >
//             {[10, 20, 50, 100].map((n) => (
//               <option key={n} value={n}>{n}</option>
//             ))}
//           </select>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             className="text-sm px-2 py-1 rounded border disabled:opacity-50"
//             onClick={() => setState({ page: Math.max(1, data.page - 1) })}
//             disabled={data.page <= 1 || loading || isPending}
//           >
//             Previous
//           </button>
//           <button
//             className="text-sm px-2 py-1 rounded border disabled:opacity-50"
//             onClick={() => setState({ page: Math.min(totalPages, data.page + 1) })}
//             disabled={data.page >= totalPages || loading || isPending}
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
