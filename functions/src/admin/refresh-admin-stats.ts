import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { computeStats } from './compute-stats';
import { requireAdmin } from './require-admin';

// Callable function for admins to recompute `adminStats/latest`
export const refreshAdminStats = onCall(
    { region: 'asia-northeast1', timeoutSeconds: 300, memory: '512MiB' },
    async (request) => {
        await requireAdmin(request);
        const stats = await computeStats(new Date());
        await getFirestore().collection('adminStats').doc('latest').set(stats);
        return { computedAt: stats.computedAt.toMillis() };
    },
);
