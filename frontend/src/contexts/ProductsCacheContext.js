import { productAPI } from '../services/api';
import { createResourceCache } from './createResourceCache';

/**
 * Shared products cache.
 *
 * Migrated from a hand-rolled implementation onto the generic
 * `createResourceCache` factory so all the resource caches in the app
 * (products, categories, batches) share the same SWR semantics, idle
 * prefetch, in-flight coalescing, and `byId` map.
 *
 * NOTE on the data field name: the factory exposes the cached array as
 * `items`. Consumers that previously read `products` should destructure
 * `items` (optionally aliasing it back to `products` if it reads better in
 * context). This keeps every cache in the app consistent.
 */
const { Provider: ProductsCacheProvider, useCache: useProductsCache } =
  createResourceCache({
    fetcher: () => productAPI.getAll(),
    label: 'products',
  });

export { ProductsCacheProvider, useProductsCache };
