import TableFilters from "@/components/dashboard/shared/table/TableFilters";
import PaginationServer from "@/components/dashboard/shared/table/PaginationServer";
import { getOrdersAndTotal, getOrdersQuickCounts } from "@/lib/ordersService";
import { getPageAndSize } from "@/lib/ordersService";
import OrdersRows from "./server/OrdersRows";
import OrdersMobileList from "./server/OrdersMobileList";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Download, Filter, FileDown, Boxes, Check } from "lucide-react";
import Link from "next/link";
import DisplayControls from "./client/DisplayControls";
import OrdersBulkActionsPanel from "./client/OrdersBulkActionsPanel";
import { bulkOrders, updateOrderStatus } from "./server/actions";
import { adminAssignRider, adminUpdateOrderStatus } from "@/app/dashboard/admin/orders/actions";
import OrdersAdvancedExtra from "./client/OrdersAdvancedExtra";
import QuickRanges from "./client/QuickRanges";
import DensityToggle from "./client/DensityToggle";
import ToastForm from "./client/ToastForm";
import { Fragment } from "react";

export default async function OrdersTable({ sp = {}, readOnly = false, basePath = "/dashboard/seller/orders" }) {
  const q = (sp?.search || sp?.q || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  const status = (sp?.status || '').toString();
  const density = ((sp?.density || 'cozy').toString() === 'compact') ? 'compact' : 'cozy';
  const { page, pageSize } = getPageAndSize(sp);

  const [{ orders, total }, counts] = await Promise.all([
    getOrdersAndTotal(sp),
    getOrdersQuickCounts(sp),
  ]);

  const queryBase = {
    search: q || undefined,
    from: fromStr || undefined,
    to: toStr || undefined,
    sort: sortKey !== 'newest' ? sortKey : undefined,
    status: status || undefined,
    pageSize: (pageSize && Number(pageSize) !== 10) ? String(pageSize) : undefined,
  };

  const colsParam = (sp?.cols || '').toString();
  const allColsDefault = ['order', 'customer', 'payment', 'status', 'created', 'total', 'billing', 'actions'];
  let visibleColsArray = (
    colsParam
      ? colsParam.split(',').map(s => s.trim()).filter(Boolean)
      : allColsDefault
  );
  if (readOnly) {
    visibleColsArray = visibleColsArray.filter(c => c !== 'actions');
  }

  const totalCount = Number(total || 0);
  const pageCount = Math.max(0, Math.min(pageSize, totalCount - ((page - 1) * pageSize)));

  const formId = "bulkOrdersForm";

  return (
    <div className="flex flex-col min-h-0 gap-2">
      <div className="shrink-0">
        <TableFilters
          compact
          title="Orders"
          subtitle="Track, filter, and manage your orders"
          config={{ showStatusBar: true }}
          sortOptions={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'amount-high', label: 'Amount: high → low' },
            { value: 'amount-low', label: 'Amount: low → high' },
            { value: 'status-asc', label: 'Status A→Z' },
            { value: 'status-desc', label: 'Status Z→A' },
          ]}
          searchPlaceholder="Search by order number, customer, phone, email"
          counts={counts}
          countsUrl={`/api/seller/orders/counts?${new URLSearchParams(queryBase).toString()}`}
          advancedExtra={<OrdersAdvancedExtra />}
          rightActions={(
            <div className="flex items-center gap-2">
              {/* Bulk */}
              {!readOnly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button id="orders-bulk-trigger" type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                      <Boxes size={14} />
                      Bulk
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(92vw,520px)] p-3 rounded-xl shadow-lg border bg-white">
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium text-muted-foreground px-1 inline-flex items-center gap-1"><Boxes size={12} /> Bulk actions</div>
                      <OrdersBulkActionsPanel formId={formId} defaultScope="selected" pageCount={pageCount} total={totalCount} />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                    <Download size={14} />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-lg border bg-white">
                  <ul>
                    <li>
                      <Link href={`/api/seller/orders/export`} className="rounded px-2 py-1 hover:bg-zinc-50 text-xs inline-flex items-center gap-1"><Filter size={12} /> All (filtered)</Link>
                    </li>
                    <li>
                      <Link href={`/api/seller/orders/export?${new URLSearchParams({ ...queryBase, page: String(page), pageSize: String(pageSize) }).toString()}`} className="rounded px-2 py-1 hover:bg-zinc-50 text-xs inline-flex items-center gap-1"><FileDown size={12} /> Current page</Link>
                    </li>
                  </ul>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Display */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                    <LayoutGrid size={14} />
                    Display
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[min(92vw,460px)] p-3 rounded-xl shadow-lg border bg-white">
                  <div className="space-y-3">
                    <DisplayControls basePath={basePath} allCols={allColsDefault} visibleCols={visibleColsArray} query={{
                      ...queryBase,
                      cols: (colsParam && colsParam !== allColsDefault.join(',')) ? colsParam : undefined,
                    }} />
                    <div className="border-t my-2" />
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium text-muted-foreground px-1 inline-flex items-center gap-1">
                        Quick actions
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <QuickRanges />
                        <DensityToggle />
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        />
      </div>

      {/* Hidden forms for per-row status updates (avoid nested forms) */}
      {!readOnly && (
        <div className="hidden" aria-hidden="true">
          {orders.map((o) => (
            <ToastForm
              key={o._id}
              id={`orderStatus-${o._id}`}
              action={updateOrderStatus}
              onSubmitToast={`Updating #${o.number || o._id.slice(-6)}…`}
              successToast={`Order updated`}
              errorToast={`Failed to update order`}
            >
              <input type="hidden" name="id" value={o._id} />
              <input type="hidden" name="status" value="" />
            </ToastForm>
          ))}
        </div>
      )}
      {readOnly && (
        <div className="hidden" aria-hidden="true">
          {orders.map((o) => (
            <Fragment key={o._id}>
              <ToastForm id={`adminAssign-${o._id}`} action={adminAssignRider} onSubmitToast={`Assigning…`} successToast={`Assigned`} errorToast={`Failed`}>
                <input type="hidden" name="id" value={o._id} />
                <input type="hidden" name="rider" value="" />
              </ToastForm>
              <ToastForm id={`adminStatus-${o._id}`} action={adminUpdateOrderStatus} onSubmitToast={`Updating…`} successToast={`Updated`} errorToast={`Failed`}>
                <input type="hidden" name="id" value={o._id} />
                <input type="hidden" name="status" value="" />
              </ToastForm>
            </Fragment>
          ))}
        </div>
      )}

      {/* Bulk form + rows */}
      {readOnly ? (
        <>
          {/* Mobile list */}
          <OrdersMobileList orders={orders} density={density} readOnly basePath={basePath} />
          {/* Desktop table */}
          <OrdersRows orders={orders} visibleCols={visibleColsArray} density={density} sortKey={sortKey} query={queryBase} basePath={basePath} tableHeight={560} readOnly />
        </>
      ) : (
        <ToastForm
          id={formId}
          action={bulkOrders}
          className="min-h-0 flex-1 flex flex-col gap-2"
          onSubmitToast="Applying bulk action…"
          successToast="Bulk action applied"
          errorToast="Bulk action failed"
          requireField="bulkAction"
        >
          {/* carry current filters for scope targeting */}
          {q ? <input type="hidden" name="search" value={q} /> : null}
          {fromStr ? <input type="hidden" name="from" value={fromStr} /> : null}
          {toStr ? <input type="hidden" name="to" value={toStr} /> : null}
          {sortKey ? <input type="hidden" name="sort" value={sortKey} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input type="hidden" name="page" value={String(page)} />
          <input type="hidden" name="pageSize" value={String(pageSize)} />

          {/* Mobile list */}
          <OrdersMobileList orders={orders} density={density} basePath={basePath} />
          {/* Desktop table */}
          <OrdersRows orders={orders} visibleCols={visibleColsArray} density={density} sortKey={sortKey} query={queryBase} basePath={basePath} tableHeight={560} />
        </ToastForm>
      )}


      {/* Pagination */}
      <div className="shrink-0">
        <PaginationServer
          basePath={basePath}
          total={total}
          page={page}
          pageSize={pageSize}
          query={{ ...queryBase, density: density !== 'cozy' ? density : undefined, cols: (colsParam && colsParam !== allColsDefault.join(',')) ? colsParam : undefined }}
        />
      </div>
    </div>
  );
}

