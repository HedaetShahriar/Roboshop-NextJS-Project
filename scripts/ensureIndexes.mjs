import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

const client = new MongoClient(uri, {});

async function run() {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'roboshop');
  const products = db.collection('products');

  // Single-field indexes
  const ops = [
    { key: { createdAt: -1 }, name: 'products_createdAt_desc' },
    { key: { slug: 1 }, name: 'products_slug_1' },
    { key: { sku: 1 }, name: 'products_sku_1' },
    { key: { category: 1 }, name: 'products_category_1' },
    { key: { price: 1 }, name: 'products_price_1' },
    { key: { current_stock: -1 }, name: 'products_stock_desc' },
    { key: { has_discount_price: 1 }, name: 'products_has_discount_1' },
    { key: { discount_price: 1 }, name: 'products_discount_price_1' },
    { key: { product_rating: -1 }, name: 'products_rating_desc' },
    { key: { product_rating_count: -1 }, name: 'products_rating_count_desc' },
  ];

  // Collated index for case-insensitive name sorting/search prefix
  ops.push({ key: { name: 1 }, name: 'products_name_1_ci', collation: { locale: 'en', strength: 2 } });

  // Compound indexes tuned for common sorts/filters
  ops.push({ key: { price: 1, createdAt: -1 }, name: 'products_price_1_createdAt_desc' });
  ops.push({ key: { current_stock: -1, createdAt: -1 }, name: 'products_stock_desc_createdAt_desc' });
  ops.push({ key: { product_rating: -1, product_rating_count: -1, createdAt: -1 }, name: 'products_rating_desc_count_desc_createdAt_desc' });
  ops.push({ key: { has_discount_price: 1, discount_price: 1, createdAt: -1 }, name: 'products_discount_combo' });

  await products.createIndexes(ops);

  console.log('Indexes ensured for products.');
}

run()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => client.close());
