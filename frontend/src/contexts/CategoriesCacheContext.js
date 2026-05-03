import { categoryAPI } from '../services/api';
import { createResourceCache } from './createResourceCache';

/**
 * Shared categories cache.
 *
 * Categories are read by ManageProducts (filter dropdown), ManageCategories
 * (master list), the customer storefront (sidebar + home page), and the
 * search palette. Without sharing, the same payload would fly over the wire
 * once per page open. With this provider mounted at the app shell, every
 * consumer reads instantly after the first call.
 *
 * Mutations in ManageCategories should call `invalidate()` so the next
 * `refetch()` actually goes to the network instead of serving the stale
 * pre-mutation list.
 */
const { Provider: CategoriesCacheProvider, useCache: useCategoriesCache } =
  createResourceCache({
    fetcher: () => categoryAPI.getAll(),
    label: 'categories',
  });

export { CategoriesCacheProvider, useCategoriesCache };
