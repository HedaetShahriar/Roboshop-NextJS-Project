import { getProductsAndTotalCached as getProductsAndTotal } from "@/lib/productsService";
import { deleteSingle } from "./actions";

export default async function DeleteForms({ sp }) {
  const { products } = await getProductsAndTotal(sp);
  return (
    <div className="hidden" aria-hidden="true">
      {products.map((p) => {
        const id = p._id?.toString?.() || p._id;
        return (
          <form key={id} id={`delete-product-${id}`} action={deleteSingle}>
            <input type="hidden" name="id" value={id} />
          </form>
        );
      })}
    </div>
  );
}
