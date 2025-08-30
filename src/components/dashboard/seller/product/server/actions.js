// Centralized server actions for Products table
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";
import { revalidatePath, revalidateTag } from "next/cache";
import { getProductsAndTotalCached as getProductsAndTotal } from "@/lib/productsService";
import { buildProductsWhere } from "@/lib/productsQuery";
import { addProductAudit } from "@/lib/audit";

// Adjust single product stock by delta
export async function adjustStock(prevState, formData) {
    'use server';
    // Support both direct form action (formData only) and useActionState(prev, formData)
    if (!(formData instanceof FormData)) formData = /** @type {FormData} */ (prevState);
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return { ok: false };
    const id = formData.get('id');
    const delta = Number(formData.get('delta'));
    if (!id || isNaN(delta)) return { ok: false };
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return; }
    const doc = await db.collection('products').findOne({ _id });
    if (!doc) return { ok: false };
    const current = Number(doc.current_stock || 0);
    const next = Math.max(0, current + delta);
    await db.collection('products').updateOne({ _id }, { $set: { current_stock: next, updatedAt: new Date() } });
    revalidateTag('products:list');
    revalidatePath('/dashboard/seller/products');
    return { ok: true };
}

// Update pricing for a single product (price + optional discount)
export async function updatePricing(prevState, formData) {
    'use server';
    if (!(formData instanceof FormData)) formData = /** @type {FormData} */ (prevState);
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return { ok: false };
    const id = formData.get('id');
    let price = Number(formData.get('price'));
    const hasDiscount = formData.get('hasDiscount') ? true : false;
    let discount = Number(formData.get('discountPrice'));
    if (!id || isNaN(price) || price <= 0) return { ok: false };
    if (hasDiscount) {
        if (isNaN(discount) || discount <= 0 || discount >= price) return { ok: false };
    } else {
        discount = 0;
    }
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return; }
    await db.collection('products').updateOne({ _id }, { $set: { price, has_discount_price: !!hasDiscount, discount_price: discount, updatedAt: new Date() } });
    revalidateTag('products:list');
    revalidatePath('/dashboard/seller/products');
    return { ok: true };
}

// Clear discount on a single product
export async function clearDiscountSingle(prevState, formData) {
    'use server';
    if (!(formData instanceof FormData)) formData = /** @type {FormData} */ (prevState);
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return { ok: false };
    const id = formData.get('id');
    if (!id) return { ok: false };
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return; }
    await db.collection('products').updateOne({ _id }, { $set: { has_discount_price: false, discount_price: 0, updatedAt: new Date() } });
    revalidateTag('products:list');
    revalidatePath('/dashboard/seller/products');
    return { ok: true };
}

// Toggle visibility for a single product (hide/show to customers)
export async function setVisibility(prevState, formData) {
    'use server';
    if (!(formData instanceof FormData)) formData = /** @type {FormData} */ (prevState);
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return { ok: false };
    const id = formData.get('id');
    const hiddenRaw = formData.get('hidden');
    if (!id || (hiddenRaw === null || hiddenRaw === undefined)) return { ok: false };
    const nextHidden = String(hiddenRaw) === '1' || String(hiddenRaw) === 'true' ? true : false;
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return { ok: false }; }
    await db.collection('products').updateOne({ _id }, { $set: { is_hidden: nextHidden, updatedAt: new Date() } });
    try {
        await addProductAudit({ userEmail: session?.user?.email, action: nextHidden ? 'hide' : 'show', ids: [String(id)], scope: 'single' });
    } catch {}
    revalidateTag('products:list');
    revalidatePath('/dashboard/seller/products');
    return { ok: true };
}

// Bulk operations for products, with support for selected/page/filtered scopes
export async function bulkProducts(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const action = formData.get('bulkAction');
    const scope = (formData.get('scope') || 'selected').toString(); // selected | page | filtered
    const db = await getDb();
    const now = new Date();

    // Build targeting
    let filter = null;
    let ids = formData.getAll('ids');
    if (scope === 'page') {
        const s = {
            search: formData.get('search')?.toString() || '',
            from: formData.get('from')?.toString() || undefined,
            to: formData.get('to')?.toString() || undefined,
            sort: formData.get('sort')?.toString() || 'newest',
            page: Number(formData.get('page')?.toString() || '1'),
            pageSize: Number(formData.get('pageSize')?.toString() || '20'),
            inStock: formData.get('inStock')?.toString() || undefined,
            hasDiscount: formData.get('hasDiscount')?.toString() || undefined,
            minPrice: formData.get('minPrice')?.toString() || undefined,
            maxPrice: formData.get('maxPrice')?.toString() || undefined,
            lowStock: formData.get('lowStock')?.toString() || undefined,
        };
        const { products: pageProducts } = await getProductsAndTotal(s);
        ids = pageProducts.map(p => p._id.toString());
    } else if (scope === 'filtered') {
        const s = {
            search: formData.get('search')?.toString() || '',
            from: formData.get('from')?.toString() || undefined,
            to: formData.get('to')?.toString() || undefined,
            inStock: formData.get('inStock')?.toString() || undefined,
            hasDiscount: formData.get('hasDiscount')?.toString() || undefined,
            minPrice: formData.get('minPrice')?.toString() || undefined,
            maxPrice: formData.get('maxPrice')?.toString() || undefined,
            lowStock: formData.get('lowStock')?.toString() || undefined,
        };
        filter = buildProductsWhere(s);
    }

    // Normalize ids to ObjectId filter when needed
    const idsFilter = () => {
        const list = (ids || []).map(x => {
            try { return new ObjectId(String(x)); } catch { return null; }
        }).filter(Boolean);
        return list.length ? { _id: { $in: list } } : null;
    };

    if (!action) return;

    // Helpers for choosing the final filter (selected/page vs filtered)
    const targetFilter = () => (filter ? filter : idsFilter());
    const tf = targetFilter();
    if (!tf) return;

    // Parse inputs
    const stockDeltaRaw = Number(formData.get('bulkStockDelta'));
    const stockSetRaw = Number(formData.get('bulkStockSet'));
    const discountPriceRaw = Number(formData.get('bulkDiscountPrice'));
    const discountPercentRaw = Number(formData.get('bulkDiscountPercent'));
    const priceSetRaw = Number(formData.get('bulkPriceSet'));
    const confirmDelete = (formData.get('confirmDelete') || '').toString();

    const dryRun = (formData.get('dryRun') || '').toString() === '1';
    // Execute
    if (action === 'stockInc' || action === 'stockDec') {
        const delta = isNaN(stockDeltaRaw) ? 0 : (action === 'stockDec' ? -Math.abs(stockDeltaRaw) : Math.abs(stockDeltaRaw));
        if (delta === 0) return;
        if (dryRun) return;
        await db.collection('products').updateMany(tf, [
            { $set: { current_stock: { $max: [0, { $add: [{ $ifNull: ['$current_stock', 0] }, delta] }] }, updatedAt: now } }
        ]);
    } else if (action === 'stockSet') {
        const next = Math.max(0, isNaN(stockSetRaw) ? 0 : stockSetRaw);
        if (dryRun) return;
        await db.collection('products').updateMany(tf, { $set: { current_stock: next, updatedAt: now } });
    } else if (action === 'setDiscount') {
        const discount = Number(discountPriceRaw);
        if (isNaN(discount) || discount <= 0) return;
        // Ensure price > discount
        const combined = filter ? { $and: [filter, { price: { $gt: discount } }] } : { ...tf, price: { $gt: discount } };
        if (dryRun) return;
        await db.collection('products').updateMany(combined, { $set: { has_discount_price: true, discount_price: discount, updatedAt: now } });
    } else if (action === 'discountPercent') {
        const pct = Number(discountPercentRaw);
        if (isNaN(pct) || pct <= 0 || pct >= 100) return;
        const factor = (100 - pct) / 100;
        if (dryRun) return;
        await db.collection('products').updateMany(tf, [
            { $set: { discount_price: { $round: [{ $multiply: [{ $toDouble: { $ifNull: ['$price', 0] } }, factor] }, 2] }, has_discount_price: true, updatedAt: now } }
        ]);
    } else if (action === 'clearDiscount') {
        if (dryRun) return;
        await db.collection('products').updateMany(tf, { $set: { has_discount_price: false, discount_price: 0, updatedAt: now } });
    } else if (action === 'priceSet') {
        const p = Number(priceSetRaw);
        if (isNaN(p) || p <= 0) return;
        if (dryRun) return;
        await db.collection('products').updateMany(tf, [
            {
                $set: {
                    price: p,
                    has_discount_price: { $cond: [{ $gte: [{ $ifNull: ['$discount_price', 0] }, p] }, false, { $ifNull: ['$has_discount_price', false] }] },
                    discount_price: { $cond: [{ $gte: [{ $ifNull: ['$discount_price', 0] }, p] }, 0, { $ifNull: ['$discount_price', 0] }] },
                    updatedAt: now
                }
            }
        ]);
    } else if (action === 'priceRound99') {
        if (dryRun) return;
        // Compute floor to integer - 0.01 => xx.99
        await db.collection('products').updateMany(tf, [
            {
                $set: {
                    price: { $subtract: [{ $toInt: { $ifNull: ['$price', 0] } }, 0.01] },
                    updatedAt: now
                }
            }
        ]);
    } else if (action === 'priceRoundWhole') {
        if (dryRun) return;
        // Round price to nearest whole (0 decimals). Adjust discount_price similarly and ensure it's < price
        await db.collection('products').updateMany(tf, [
            {
                $set: {
                    price: { $round: [{ $toDouble: { $ifNull: ['$price', 0] } }, 0] },
                    // Propose rounded discount
                    _roundedDiscount: { $round: [{ $toDouble: { $ifNull: ['$discount_price', 0] } }, 0] },
                    updatedAt: now,
                }
            },
            {
                $set: {
                    // If roundedDiscount >= price then clear discount, else keep roundedDiscount
                    has_discount_price: {
                        $cond: [
                            { $and: [{ $gt: ['$_roundedDiscount', 0] }, { $lt: ['$_roundedDiscount', '$price'] }] },
                            true,
                            false
                        ]
                    },
                    discount_price: {
                        $cond: [
                            { $and: [{ $gt: ['$_roundedDiscount', 0] }, { $lt: ['$_roundedDiscount', '$price'] }] },
                            '$_roundedDiscount',
                            0
                        ]
                    }
                }
            },
            { $unset: ['_roundedDiscount'] }
        ]);
    } else if (action === 'hide') {
        if (dryRun) return;
        await db.collection('products').updateMany(tf, { $set: { is_hidden: true, updatedAt: now } });
    } else if (action === 'show') {
        if (dryRun) return;
        await db.collection('products').updateMany(tf, { $set: { is_hidden: false, updatedAt: now } });
    } else if (action === 'deleteProducts') {
        const confirmDelete = (formData.get('confirmDelete') || '').toString();
        if (confirmDelete !== 'DELETE') return;
        if (dryRun) return;
        await db.collection('products').deleteMany(tf);
    }
    // Audit (best-effort)
    try {
        await addProductAudit({
            userEmail: session?.user?.email,
            action: String(action),
            scope,
            ids: Array.isArray(ids) ? ids : [],
            filters: filter || {},
            params: {
                stockDeltaRaw, stockSetRaw, discountPriceRaw, discountPercentRaw, priceSetRaw,
            }
        });
    } catch { }
    revalidateTag('products:list');
    revalidatePath('/dashboard/seller/products');
}
