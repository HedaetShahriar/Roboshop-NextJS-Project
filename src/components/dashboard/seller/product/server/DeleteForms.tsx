import { getProductsAndTotalCached as getProductsAndTotal } from "@/lib/productsService";
import { deleteSingle } from "./actions";
import type { Product } from "@/types";

interface SearchParams {
  search?: string;
  q?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string | number;
  pageSize?: string | number;
  inStock?: string;
  hasDiscount?: string;
  minPrice?: string;
  maxPrice?: string;
  lowStock?: string;
  category?: string;
  subcategory?: string;
}

interface DeleteFormsProps {
  sp: SearchParams;
}

// Wrapper to make deleteSingle compatible with direct form action
async function deleteSingleAction(formData: FormData): Promise<void> {
  "use server";
  await deleteSingle(null, formData);
}

export default async function DeleteForms({ sp }: DeleteFormsProps) {
  const { products } = await getProductsAndTotal(sp);
  return (
    <div className="hidden" aria-hidden="true">
      {products.map((p: Product) => {
        const id =
          typeof p._id === "object" && p._id !== null && "toString" in p._id
            ? p._id.toString()
            : String(p._id);
        return (
          <form
            key={id}
            id={`delete-product-${id}`}
            action={deleteSingleAction}
          >
            <input type="hidden" name="id" value={id} />
          </form>
        );
      })}
    </div>
  );
}
