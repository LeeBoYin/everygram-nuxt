import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
} from 'firebase/firestore';

// the stats functions scan all data and may run for up to 5 minutes
const CALLABLE_TIMEOUT_MS = 300_000;

const callAdminFunction = async <T>(name: string): Promise<T> => {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions(undefined, 'asia-northeast1');
    const result = await httpsCallable<unknown, T>(functions, name, {
        timeout: CALLABLE_TIMEOUT_MS,
    })();
    return result.data;
};

// stats of the admin dashboard, shared by the layout and the pages
export const useAdminStats = () => {
    const latest = useState<AdminStats | null>('adminStatsLatest', () => null);
    // the most recent monthly snapshot, to compare `latest` with
    const previous = useState<AdminStats | null>(
        'adminStatsPrevious',
        () => null,
    );
    const isLoading = useState('adminStatsLoading', () => true);
    const isRefreshing = useState('adminStatsRefreshing', () => false);
    const { errorToast } = useErrorToast();

    const fetchStats = async () => {
        isLoading.value = true;
        try {
            const db = firebaseUtils.getFirestoreDB();
            const [latestDoc, snapshots] = await Promise.all([
                getDoc(doc(db, 'adminStats', 'latest')),
                // ordering by `period` also leaves out the `backfill` document
                getDocs(
                    query(
                        collection(db, 'adminSnapshots'),
                        orderBy('period', 'desc'),
                        limit(1),
                    ),
                ),
            ]);
            latest.value = (latestDoc.data() as AdminStats) ?? null;
            previous.value =
                (snapshots.docs[0]?.data() as AdminStats | undefined) ?? null;
        } catch (error) {
            errorToast('讀取統計資料失敗', error);
        } finally {
            isLoading.value = false;
        }
    };

    const refreshStats = async () => {
        if (isRefreshing.value) {
            return;
        }
        isRefreshing.value = true;
        try {
            await callAdminFunction('refreshAdminStats');
            await fetchStats();
        } catch (error) {
            errorToast('重新計算失敗', error);
        } finally {
            isRefreshing.value = false;
        }
    };

    const fetchAdminUserRows = async () =>
        (await callAdminFunction<{ users: AdminUserRow[] }>('getAdminUsers'))
            .users;

    const backfillHistory = () =>
        callAdminFunction<{ monthCount: number }>('backfillAdminHistory');

    return {
        latest,
        previous,
        isLoading,
        isRefreshing,
        fetchStats,
        refreshStats,
        fetchAdminUserRows,
        backfillHistory,
    };
};

// all monthly snapshots (oldest first) and the backfill, for the trends and the
// history pages
export const useAdminHistory = () => {
    const snapshots = ref<AdminStats[]>([]);
    const backfill = ref<AdminBackfill | null>(null);
    const isLoading = ref(true);
    const hasError = ref(false);
    const { errorToast } = useErrorToast();

    onMounted(async () => {
        try {
            const db = firebaseUtils.getFirestoreDB();
            const [snapshotDocs, backfillDoc] = await Promise.all([
                // ordering by `period` also leaves out the `backfill` document
                getDocs(
                    query(
                        collection(db, 'adminSnapshots'),
                        orderBy('period', 'asc'),
                    ),
                ),
                getDoc(doc(db, 'adminSnapshots', 'backfill')),
            ]);
            snapshots.value = snapshotDocs.docs.map(
                (snapshot) => snapshot.data() as AdminStats,
            );
            backfill.value = (backfillDoc.data() as AdminBackfill) ?? null;
        } catch (error) {
            hasError.value = true;
            errorToast('讀取歷史資料失敗', error);
        } finally {
            isLoading.value = false;
        }
    });

    return { snapshots, backfill, isLoading, hasError };
};
