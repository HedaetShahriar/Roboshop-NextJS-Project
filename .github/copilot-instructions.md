# Roboshop – AI assistant guide

This repo is a Next.js 15 (App Router) app with MongoDB, NextAuth, Tailwind (v4), and a modular service layer. Use these rules to stay productive and consistent.

## Architecture and data flow
- App Router, mostly Server Components. Prefer server-rendered flows. Avoid client-only event handlers in Server Components.
- Auth: NextAuth v4. Use `getServerSession(authOptions)` for server-side auth/role checks. See `src/app/api/auth/[...nextauth]/route.js`.
- DB: `src/lib/mongodb.js` exports `getDb()`. Collections: `orders`, `products`, etc.
- Service layer pattern:
  - Query builders: shape Mongo filters/sorting/paging from URL params.
    - Orders: `src/lib/ordersQuery.js` (`buildOrdersWhere`, `getSortFromKey`, `getPageAndSize`).
    - Products: `src/lib/productsQuery.js` (`buildProductsWhere`, `getProductsSort`, `getPageAndSize`).
  - Services: perform DB ops and return `{ data, total, page, pageSize }`.
    - Orders: `src/lib/ordersService.js` (`getOrdersAndTotal`, `getStatusCounts`).
    - Products: `src/lib/productsService.js` (`getProductsAndTotal`).
- APIs: colocated under `src/app/api/**`. Common helpers in `src/lib/api.js` (`getAuthedSession`, `parseSearchParams`, response helpers).

## UI and patterns
- Shared filters: `src/components/dashboard/shared/table/TableFilters.jsx` (Client Component). Supports search, date range, sort, optional status bar, and explicit Apply/Reset buttons. Control with `config` and `sortOptions`. Example:
  ```jsx
  <TableFilters config={{ showStatusBar: false }} sortOptions={[{ value:'newest', label:'Newest'}]} />
  ```
- Server tables: build with links and forms; no React event handlers in Server Components.
  - Orders server table: `src/components/dashboard/seller/order/OrdersTable.jsx` shows server-only patterns:
    - Column toggles via query string (`cols`), sorting via links (`sort`), paging with GET forms.
    - Actions via server actions in form `action` (e.g., `advance`, `bulkAdvance`). Pass the server action into child form components as props.
    - Bulk actions submit selected `ids` or a `selectAll` flag along with current filters; server fetches current page and applies.
    - CSV export via API: `/api/seller/orders/export`.
- UI components use Tailwind and shadcn-style primitives in `src/components/ui/*` (Button, Input, etc.). Prefer these for consistency.

## Seller dashboard pages
- Layout enforces role access: `src/app/dashboard/layout.js`. Use Server Components with auth checks.
- Orders page (`src/app/dashboard/seller/orders/page.js`): renders `TableFilters` (with status counts from `getStatusCounts`) and the server `OrdersTable`.
- Products page (`src/app/dashboard/seller/products/page.js`): uses `TableFilters` with `showStatusBar: false` and product sort options, then renders `ProductsTable`.

## Sorting, filters, and URL params
- Accept both `search` and `q`. Use `from`/`to` (ISO date), `sort`, `page`, `pageSize`. For orders, optional `status`. Build links with a helper that preserves current params.
- When adding new list pages:
  1) Create a `*Query.js` with `build*Where`, `get*Sort`, `getPageAndSize` mirroring orders/products.
  2) Create a `*Service.js` that returns `{ items, total, page, pageSize }`.
  3) Server table that reads `searchParams`, builds `mkQS`, uses links/forms only.
  4) Reuse `TableFilters` (optionally hide status bar, customize `sortOptions`).

## Common pitfalls and gotchas
- Do not pass `onChange`/event handlers into Server Components. Use GET/POST forms or links.
- Server actions must be in the same Server Component file and passed down as props to child form components. Don’t reference them from module-scope helpers.
- When sorting by numeric strings (amount/price), use aggregation `$addFields` with `$toDouble`.
- For status sorting, use `collation({ locale:'en', strength:2 })` to sort case-insensitively.

## Dev workflow
- Run dev: `npm run dev` (Turbopack). Build: `npm run build`. Start: `npm start`.
- ESLint: `npm run lint` (flat config using `next/core-web-vitals`). The config ignores `.next`, `out`, `build`.
- Env: define `MONGODB_URI` in `.env.local` or process env; `mongodb` v6 client is used.

## Examples
- Orders export endpoint: `src/app/api/seller/orders/export/route.js` uses the same query logic as the table to build CSV.
- Bulk actions in orders: see handling of `selectAll`, `ids`, and current filter propagation via hidden inputs.

Stick to these conventions to fit seamlessly with the repo’s structure and avoid client/server rendering issues.
