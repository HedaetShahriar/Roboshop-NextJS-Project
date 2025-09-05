import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { createCoupon, setCouponStatus, deleteCoupon, updateCoupon, bulkCouponStatus } from "./actions";
import SelectAllCheckbox from "./client/SelectAllCheckbox";
import ConfirmButton from "./client/ConfirmButton";

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  const coupons = await db.collection('coupons').find({}).sort({ createdAt: -1 }).limit(200).toArray();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Coupons</h2>
        <p className="text-sm text-muted-foreground">Create and manage coupon codes</p>
      </div>

      <div className="rounded border bg-white p-3">
        <form action={createCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 text-sm">
          <input name="code" placeholder="CODE" className="border rounded px-2 py-1" required />
          <select name="type" className="border rounded px-2 py-1">
            <option value="percent">Percent %</option>
            <option value="amount">Amount</option>
          </select>
          <input name="value" type="number" step="0.01" min="0" placeholder="Value" className="border rounded px-2 py-1" required />
          <input name="minOrder" type="number" step="0.01" min="0" placeholder="Min order (optional)" className="border rounded px-2 py-1" />
          <input name="startsAt" type="datetime-local" className="border rounded px-2 py-1" />
          <input name="endsAt" type="datetime-local" className="border rounded px-2 py-1" />
          <input name="maxRedemptions" type="number" min="0" placeholder="Max redemptions" className="border rounded px-2 py-1" />
          <div className="lg:col-span-6">
            <button type="submit" className="h-8 px-3 rounded bg-zinc-900 text-white">Create</button>
          </div>
        </form>
      </div>

      <div className="rounded border bg-white overflow-auto">
    <form id="couponsBulkForm" action={bulkCouponStatus} className="min-w-full">
          <div className="p-2 border-b flex items-center gap-2 text-xs">
            <button type="submit" name="bulkAction" value="activate" className="px-2 py-1 border rounded">Activate</button>
            <button type="submit" name="bulkAction" value="deactivate" className="px-2 py-1 border rounded">Deactivate</button>
          </div>
          <table className="min-w-full table-auto text-sm">
          <thead className="sticky top-0 bg-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]">
            <tr>
      <th className="px-3 py-2"><SelectAllCheckbox formId="couponsBulkForm" name="ids" /></th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Value</th>
              <th className="px-3 py-2 text-left">Min Order</th>
              <th className="px-3 py-2 text-left">Usage</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c._id.toString()} className="border-t">
                <td className="px-3 py-2 align-top"><input type="checkbox" name="ids" value={c._id.toString()} /></td>
                <td className="px-3 py-2 font-mono text-xs align-top">{c.code}</td>
                <td className="px-3 py-2">{c.type}</td>
                <td className="px-3 py-2">{c.type === 'percent' ? `${c.value}%` : `৳ ${c.value}`}</td>
                <td className="px-3 py-2">{c.minOrder ? `৳ ${c.minOrder}` : '-'}</td>
                <td className="px-3 py-2">{c.usageCount || 0}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}</td>
                <td className="px-3 py-2 capitalize">{c.status}</td>
                <td className="px-3 py-2 text-right align-top">
                  <form action={setCouponStatus} className="inline-flex items-center gap-2 mr-2">
                    <input type="hidden" name="id" value={c._id.toString()} />
                    <input type="hidden" name="status" value={c.status === 'active' ? 'inactive' : 'active'} />
                    <button type="submit" className="px-2 py-1 border rounded text-xs">{c.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  </form>
                  {/* Hidden delete form submitted by ConfirmButton */}
                  <form id={`delete-coupon-${c._id.toString()}`} action={deleteCoupon} className="hidden">
                    <input type="hidden" name="id" value={c._id.toString()} />
                  </form>
                  <ConfirmButton
                    className="px-2 py-1 border rounded text-xs text-rose-600"
                    message="Delete this coupon?"
                    formId={`delete-coupon-${c._id.toString()}`}
                  >
                    Delete
                  </ConfirmButton>
                  <div className="mt-2">
                    <details>
                      <summary className="text-xs cursor-pointer select-none">Edit</summary>
                      <form action={updateCoupon} className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <input type="hidden" name="id" value={c._id.toString()} />
                        <select name="type" defaultValue={c.type} className="border rounded px-2 py-1">
                          <option value="percent">Percent %</option>
                          <option value="amount">Amount</option>
                        </select>
                        <input name="value" type="number" step="0.01" min="0" defaultValue={c.value} className="border rounded px-2 py-1" />
                        <input name="minOrder" type="number" step="0.01" min="0" defaultValue={c.minOrder || ''} className="border rounded px-2 py-1" />
                        <input name="maxRedemptions" type="number" min="0" defaultValue={c.maxRedemptions || 0} className="border rounded px-2 py-1" />
                        <input name="startsAt" type="datetime-local" defaultValue={c.startsAt ? new Date(c.startsAt).toISOString().slice(0,16) : ''} className="border rounded px-2 py-1" />
                        <input name="endsAt" type="datetime-local" defaultValue={c.endsAt ? new Date(c.endsAt).toISOString().slice(0,16) : ''} className="border rounded px-2 py-1" />
                        <div className="col-span-full">
                          <button type="submit" className="h-7 px-2 rounded bg-zinc-900 text-white">Save</button>
                        </div>
                      </form>
                    </details>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-3 text-muted-foreground">No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
        </form>
      </div>
    </div>
  );
}
