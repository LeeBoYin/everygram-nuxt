// data of the admin trends, history and monthly view growth

type MonthlyNewField = 'newUsers' | 'newGears' | 'newTrips';

export type AdminTrendMetric = {
    key: string;
    label: string;
    getValue: (stats: AdminStats) => number;
    // only for the new items of each month, which the backfill also has;
    // the other metrics are the state at the end of each month (snapshots only)
    backfillField?: MonthlyNewField;
};

export const ADMIN_TREND_METRICS: AdminTrendMetric[] = [
    {
        key: 'newUsers',
        label: '每月新增使用者',
        backfillField: 'newUsers',
        getValue: (stats) => stats.users.newThisMonth,
    },
    {
        key: 'newGears',
        label: '每月新增裝備',
        backfillField: 'newGears',
        getValue: (stats) => stats.gears.newThisMonth,
    },
    {
        key: 'newTrips',
        label: '每月新增行程',
        backfillField: 'newTrips',
        getValue: (stats) => stats.trips.newThisMonth,
    },
    {
        key: 'users',
        label: '使用者總數',
        getValue: (stats) => stats.users.total,
    },
    { key: 'mau', label: 'MAU', getValue: (stats) => stats.users.mau },
    {
        key: 'gears',
        label: '裝備總數',
        getValue: (stats) => stats.gears.total,
    },
    {
        key: 'trips',
        label: '行程總數',
        getValue: (stats) => stats.trips.total,
    },
    {
        key: 'publicTrips',
        label: '公開行程數',
        getValue: (stats) => stats.trips.public,
    },
];

// 'YYYY-MM' moved by a number of months
export const shiftAdminMonth = (month: string, offset: number) => {
    const [year, monthNumber] = month.split('-').map(Number);
    return new Date(Date.UTC(year, monthNumber - 1 + offset, 1))
        .toISOString()
        .slice(0, 7);
};

// every month from the earliest to the latest one, so gaps stay visible
const toMonthRange = (months: string[]) => {
    if (!months.length) {
        return [];
    }
    const sorted = [...months].sort();
    const last = sorted[sorted.length - 1];
    const range = [sorted[0]];
    while (range[range.length - 1] < last) {
        range.push(shiftAdminMonth(range[range.length - 1], 1));
    }
    return range;
};

// the month in Asia/Taipei (UTC+8 all year round) in which the backfill ran
export const toAdminBackfillMonth = (backfill: AdminBackfill) =>
    new Date(backfill.computedAt.toDate().getTime() + 8 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 7);

// `null` means there is no data for the month
export const buildAdminTrend = (
    { backfillField, getValue }: AdminTrendMetric,
    snapshots: AdminStats[],
    backfill: AdminBackfill | null,
): { months: string[]; values: (number | null)[] } => {
    const snapshotValues = new Map(
        snapshots.map((stats) => [stats.period!, getValue(stats)]),
    );
    const backfillMonths = backfillField
        ? Object.keys(backfill?.months ?? {})
        : [];
    const firstBackfillMonth = [...backfillMonths].sort()[0];
    // the backfill covers every month up to the one it ran in
    const lastBackfillMonth = firstBackfillMonth
        ? toAdminBackfillMonth(backfill!)
        : undefined;
    const months = toMonthRange([
        ...snapshotValues.keys(),
        ...backfillMonths,
        ...(lastBackfillMonth ? [lastBackfillMonth] : []),
    ]);

    const values = months.map((month) => {
        // The snapshot wins over the backfill: it was counted right at the end
        // of the month, while the backfill only counts the data which still
        // exists when it runs (deleted items are missing, and the month it runs
        // in is incomplete).
        const snapshotValue = snapshotValues.get(month);
        if (snapshotValue !== undefined) {
            return snapshotValue;
        }
        if (!backfillField || !firstBackfillMonth) {
            return null;
        }
        const backfilled = backfill!.months[month];
        if (backfilled) {
            return backfilled[backfillField];
        }
        // the backfill leaves out months without any new item
        return month >= firstBackfillMonth && month <= lastBackfillMonth!
            ? 0
            : null;
    });
    return { months, values };
};

// trips with more views than in the snapshot, the biggest increase first
export const buildAdminViewGrowth = (
    current: Record<string, number>,
    previous: Record<string, number>,
) =>
    Object.entries(current)
        .map(([tripId, viewCount]) => ({
            tripId,
            viewCount,
            // trips which are not in the snapshot had no view at that time
            increase: viewCount - (previous[tripId] ?? 0),
        }))
        .filter(({ increase }) => increase > 0)
        .sort(
            (a, b) =>
                b.increase - a.increase || a.tripId.localeCompare(b.tripId),
        );
