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

// Update product details (name, image, sku/slug, category, subcategory, price/discount, stock, visibility)
export async function updateProductDetails(prevState, formData) {
    'use server';
    if (!(formData instanceof FormData)) formData = /** @type {FormData} */ (prevState);
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return { ok: false };
    const id = formData.get('id');
    if (!id) return { ok: false, message: 'Missing id' };

    // Basic fields
    const name = formData.get('name')?.toString().trim();
    const image = formData.get('image')?.toString().trim();
    const sku = formData.get('sku')?.toString().trim();
    const slug = formData.get('slug')?.toString().trim();
    const category = formData.get('category')?.toString().trim();
    const subcategory = formData.get('subcategory')?.toString().trim();
    const description = formData.get('description')?.toString() || '';
    const hasDiscountRaw = formData.get('hasDiscount');
    const hasDiscount = hasDiscountRaw ? ['1','true','on','yes'].includes(String(hasDiscountRaw).toLowerCase()) : false;
    let price = formData.get('price');
    let discountPrice = formData.get('discountPrice');
    let currentStock = formData.get('current_stock');
    const hiddenRaw = formData.get('is_hidden');

    const update = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (image !== undefined) update.image = image;
    if (sku !== undefined) update.sku = sku;
    if (slug !== undefined) update.slug = slug;
    if (category !== undefined) update.category = category || null;
    if (subcategory !== undefined) update.subcategory = subcategory || null;
    update.description = description;

    // Numbers and booleans
    if (price !== undefined) {
        const p = Number(price);
        if (isNaN(p) || p <= 0) return { ok: false, message: 'Invalid price' };
        update.price = p;
    }
    if (discountPrice !== undefined) {
        const d = Number(discountPrice);
        if (hasDiscount) {
            if (isNaN(d) || d <= 0) return { ok: false, message: 'Invalid discount' };
            // If price provided in same request, ensure discount < price. Else, will check against existing later ideally.
            if (update.price && d >= update.price) return { ok: false, message: 'Discount must be less than price' };
            update.has_discount_price = true;
            update.discount_price = d;
        } else {
            update.has_discount_price = false;
            update.discount_price = 0;
        }
    } else if (formData.has('hasDiscount')) {
        // Toggle hasDiscount even if discountPrice absent
        if (!hasDiscount) {
            update.has_discount_price = false;
            update.discount_price = 0;
        }
    }

    if (currentStock !== undefined) {
        const s = Number(currentStock);
        if (isNaN(s) || s < 0) return { ok: false, message: 'Invalid stock' };
        update.current_stock = Math.floor(s);
    }

    if (hiddenRaw !== undefined && hiddenRaw !== null) {
        update.is_hidden = String(hiddenRaw) === '1' || String(hiddenRaw) === 'true' ? true : false;
    }

    // Complex arrays: specs, gallery, variants, markets
    const parseArrayOfObjects = (prefix, keys) => {
        // Collect entries like prefix[0][key]
        const map = new Map();
        for (const [k, v] of formData.entries()) {
            if (typeof k !== 'string') continue;
            const m = k.match(new RegExp(`^${prefix}\\[(\\d+)\\]\\[(.+)\\]$`));
            if (!m) continue;
            const idx = Number(m[1]);
            const field = m[2];
            if (!keys.includes(field)) continue;
            if (!map.has(idx)) map.set(idx, {});
            map.get(idx)[field] = typeof v === 'string' ? v : String(v);
        }
        // Sort by idx and coerce types where needed
        const arr = Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([,obj])=>obj);
        return arr;
    };

    const specs = parseArrayOfObjects('specs', ['key','value']).filter(x=> (x.key?.trim()||'') !== '' && (x.value?.trim()||'') !== '');
    const gallery = parseArrayOfObjects('gallery', ['url','alt']).filter(x=> (x.url?.trim()||'') !== '');
    const variants = parseArrayOfObjects('variants', ['size','color','sku','priceDelta','stock']).map(v=> ({
        size: v.size || '',
        color: v.color || '',
        sku: v.sku || '',
        priceDelta: isNaN(Number(v.priceDelta)) ? 0 : Number(v.priceDelta),
        stock: isNaN(Number(v.stock)) ? 0 : Math.max(0, Math.floor(Number(v.stock)))
    })).filter(v=> v.size || v.color || v.sku);
    const markets = parseArrayOfObjects('markets', ['market','price','taxIncluded']).map(m=> ({
        market: m.market || '',
        price: isNaN(Number(m.price)) ? 0 : Number(m.price),
        taxIncluded: String(m.taxIncluded) === '1' || String(m.taxIncluded).toLowerCase() === 'true'
    })).filter(m=> m.market);

    if (specs.length) update.specs = specs; else update.specs = [];
    if (gallery.length) update.gallery = gallery; else update.gallery = [];
    if (variants.length) update.variants = variants; else update.variants = [];
    if (markets.length) update.markets = markets; else update.markets = [];

    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return { ok: false } }
    await db.collection('products').updateOne({ _id }, { $set: update });
    try {
        await addProductAudit({ userEmail: session?.user?.email, action: 'update', ids: [String(id)], scope: 'single', params: update });
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
