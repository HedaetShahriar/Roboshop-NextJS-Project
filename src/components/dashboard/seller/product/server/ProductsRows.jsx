import ProductsMobileCard from "./ProductsMobileCard";
import ProductsTableRow from "./ProductsTableRow";
import SelectAllOnPage from "../client/SelectAllOnPage";
import { getProductsAndTotalCached as getProductsAndTotal } from "@/lib/productsService";
import { adjustStock, updatePricing, clearDiscountSingle, setVisibility, deleteSingle } from "./actions";
import Link from "next/link";

export default async function ProductsRows({ sp, visibleColsArray, formId = "bulkProductsForm" }) {
    const { products, total, page, pageSize } = await getProductsAndTotal(sp);
    const visibleCols = new Set(visibleColsArray || []);

    if (products.length === 0) {
        return (
            <div className="rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">
                <div>No products match your filters.</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                    <Link href="/dashboard/seller/products" replace className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Reset filters</Link>
                    <Link href="/dashboard/add-product" className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Add product</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* keep page values in the form for bulk scope */}
            <input type="hidden" name="page" value={String(page)} form={formId} />
            <input type="hidden" name="pageSize" value={String(pageSize)} form={formId} />

            {/* Mobile list */}
            <div className="sm:hidden space-y-2 overflow-auto">
                {products.map((p) => {
                    const id = p._id?.toString?.() || p._id;
                    return (
                        <ProductsMobileCard key={id} p={p} id={id} adjustStockAction={adjustStock} updatePricingAction={updatePricing} clearDiscountAction={clearDiscountSingle} setVisibilityAction={setVisibility} deleteAction={deleteSingle} />
                    );
                })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block min-h-0 flex-1 overflow-auto rounded border bg-white">
                <table className="min-w-full table-auto text-xs sm:text-sm">
                    <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                        <tr className="text-left">
                            <th scope="col" className="px-1 py-2 text-[11px] text-muted-foreground">
                                <SelectAllOnPage />
                            </th>
                            <th scope="col" className="px-2 py-2 font-medium text-right w-[1%] whitespace-nowrap">#</th>
                            {visibleCols.has('image') && <th scope="col" className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2 font-medium">Product</th>}
                            {visibleCols.has('info') && <th scope="col" className="px-3 py-2 font-medium">Info</th>}
                            {visibleCols.has('category') && <th scope="col" className="px-3 py-2 font-medium">Category</th>}
                            {visibleCols.has('added') && <th scope="col" className="px-3 py-2 font-medium">Added</th>}
                            {visibleCols.has('price') && <th scope="col" className="px-3 py-2 font-medium text-right">Price</th>}
                            {visibleCols.has('stock') && <th scope="col" className="px-3 py-2 font-medium text-center">Stock</th>}
                            {visibleCols.has('rating') && <th scope="col" className="px-3 py-2 font-medium text-center">Rating</th>}
                            {visibleCols.has('actions') && <th scope="col" className="px-2 sm:px-3 py-2 font-medium text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => {
                            const id = p._id?.toString?.() || p._id;
                            return (
                                <ProductsTableRow
                                    key={id}
                                    p={p}
                                    id={id}
                                    index={i}
                                    page={page}
                                    pageSize={pageSize}
                                    visibleCols={visibleCols}
                                    adjustStockAction={adjustStock}
                                    updatePricingAction={updatePricing}
                                    clearDiscountAction={clearDiscountSingle}
                                    setVisibilityAction={setVisibility}
                                    deleteAction={deleteSingle}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
