import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { toPreviousMonthKey } from './admin-data';
import { buildStats, loadStatsData } from './compute-stats';

// Runs on the 1st of each month and saves the state at the end of last month,
// e.g. the run on 12/1 00:00 is saved as `adminSnapshots/2026-11`.
export const monthlyAdminSnapshot = onSchedule(
    {
        schedule: '0 0 1 * *',
        timeZone: 'Asia/Taipei',
        region: 'asia-northeast1',
        timeoutSeconds: 300,
        memory: '512MiB',
    },
    async (event) => {
        // the scheduled time keeps the period right even if the run is delayed
        const period = toPreviousMonthKey(
            event.scheduleTime ? new Date(event.scheduleTime) : new Date(),
        );
        const now = new Date();
        const data = await loadStatsData();
        const snapshot = buildStats(data, now, period);
        // `latest` has no `period`, its "this month" is the current month
        const latest = buildStats(data, now);

        const db = getFirestore();
        const batch = db.batch();
        batch.set(db.collection('adminSnapshots').doc(period), snapshot);
        batch.set(db.collection('adminStats').doc('latest'), latest);
        await batch.commit();
    },
);
