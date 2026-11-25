import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { listAllUsers, readCollection, toDate, toMonthKey } from './admin-data';
import { requireAdmin } from './require-admin';

// Callable function for owners to rebuild the monthly new counts from the
// creation times of the existing data. Safe to run again (overwrites).
export const backfillAdminHistory = onCall(
    { region: 'asia-northeast1', timeoutSeconds: 300, memory: '512MiB' },
    async (request) => {
        await requireAdmin(request, 'owner');

        const [users, gears, trips] = await Promise.all([
            listAllUsers(),
            readCollection<Gear>('gear', ['created']),
            readCollection<Trip>('trip', ['created']),
        ]);

        const months: AdminBackfill['months'] = {};
        const count = (
            values: unknown[],
            field: 'newUsers' | 'newGears' | 'newTrips',
        ) => {
            for (const value of values) {
                // old data without a creation time is skipped
                const date = toDate(value);
                if (!date) {
                    continue;
                }
                const month = toMonthKey(date);
                months[month] ??= { newUsers: 0, newGears: 0, newTrips: 0 };
                months[month][field] += 1;
            }
        };
        count(
            users.map((user) => user.metadata.creationTime),
            'newUsers',
        );
        count(
            gears.map(({ data }) => data.created),
            'newGears',
        );
        count(
            trips.map(({ data }) => data.created),
            'newTrips',
        );

        await getFirestore()
            .collection('adminSnapshots')
            .doc('backfill')
            .set({ computedAt: FieldValue.serverTimestamp(), months });
        return { monthCount: Object.keys(months).length };
    },
);
