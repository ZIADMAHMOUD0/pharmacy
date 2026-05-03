import { batchAPI } from '../services/api';
import { createResourceCache } from './createResourceCache';

/**
 * Shared batches cache.
 *
 * Previously, ManageBatches called three different endpoints (`getAll`,
 * `getExpired`, `getExpiringSoon`) when the filter chip changed — that meant
 * an extra round-trip every time the admin clicked between "All / Expired /
 * Expiring". The cached approach fetches `getAll()` once and lets the page
 * derive expired/expiring/valid subsets in memory using the
 * `is_expired` / `expiry_date` fields the API already returns.
 *
 * Idle prefetch is *off* here because batches matter only for admins/managers,
 * and we don't want to pay the cost on customer pages. ManageBatches calls
 * `refetch()` on mount, which is a no-op if the cache is fresh.
 */
const { Provider: BatchesCacheProvider, useCache: useBatchesCache } =
  createResourceCache({
    fetcher: () => batchAPI.getAll(),
    label: 'batches',
    prefetchOnMount: false,
  });

export { BatchesCacheProvider, useBatchesCache };
