import { UserRecord } from 'firebase-admin/auth';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import _ from 'lodash';
import { listAllUsers, readCollection, toDate, toMonthKey } from './admin-data';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_BRANDS_LIMIT = 30;
const TOP_CUSTOM_BRANDS_LIMIT = 50;
const TOP_VIEWED_LIMIT = 20;
const TOP_CREATORS_LIMIT = 10;
const UNSET = 'unset';

const GEAR_BUCKETS: { key: string; max: number }[] = [
    { key: '0', max: 0 },
    { key: '1-10', max: 10 },
    { key: '11-50', max: 50 },
    { key: '51-100', max: 100 },
    { key: '100+', max: Infinity },
];

// sorted by count (descending), then key
const toCountItems = (keys: string[], limit?: number): CountItem[] =>
    Object.entries(_.countBy(keys))
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
        .slice(0, limit);

const average = (values: number[]) =>
    values.length ? _.round(_.mean(values), 2) : 0;

const median = (values: number[]) => {
    if (!values.length) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
};

const toCount = (value: unknown) =>
    typeof value === 'number' && value > 0 ? value : 0;

const toText = (value: unknown) =>
    typeof value === 'string' && value ? value : UNSET;

const normalizeBrand = (brand: unknown) =>
    typeof brand === 'string'
        ? brand.trim().toLowerCase().replace(/\s+/g, ' ')
        : '';

const findOwnerId = (role: Trip['role'] | undefined) =>
    Object.entries(role ?? {}).find(([, value]) => value === 'owner')?.[0];

// full scan of everything the stats are computed from
export const loadStatsData = async () => {
    const [authUsers, userMetas, gearDocs, tripDocs, tripShares, tripMetas] =
        await Promise.all([
            listAllUsers(),
            readCollection<UserMeta>('userMeta', [
                'locale',
                'currency',
                'gearCount',
                'tripCount',
                'tripShareCount',
            ]),
            readCollection<Gear>('gear', [
                'brand',
                'category',
                'isArchived',
                'archiveReason',
                'photo',
                'imgUrl',
                'price',
                'source',
                'created',
            ]),
            readCollection<Trip>('trip', [
                'gears',
                'wornGears',
                'isPublished',
                'dateMode',
                'bannerImage',
                'created',
            ]),
            readCollection<TripShare>('tripShare', [
                'title',
                'role',
                'owner',
                'baseWeight',
                'published',
            ]),
            readCollection<TripMeta>('tripMeta', ['viewCount']),
        ]);
    return {
        authUsers,
        userMetas,
        gearDocs,
        tripDocs,
        tripShares,
        tripMetas,
    };
};

// `period` ('YYYY-MM') is only set for monthly snapshots, and decides which
// month counts as "this month".
export const buildStats = (
    {
        authUsers,
        userMetas,
        gearDocs,
        tripDocs,
        tripShares,
        tripMetas,
    }: Awaited<ReturnType<typeof loadStatsData>>,
    now: Date,
    period?: string,
): AdminStats => {
    const month = period ?? toMonthKey(now);
    const isInMonth = (value: unknown) => {
        const date = toDate(value);
        return date !== null && toMonthKey(date) === month;
    };

    // users
    const userMap = new Map<string, UserRecord>(
        authUsers.map((user) => [user.uid, user]),
    );
    const metaMap = new Map(userMetas.map(({ id, data }) => [id, data]));
    // `userMeta` of existing users only
    const metas = authUsers.flatMap((user) => metaMap.get(user.uid) ?? []);
    const countActiveWithin = (days: number) =>
        authUsers.filter((user) => {
            const refreshed = toDate(user.metadata.lastRefreshTime);
            return (
                refreshed !== null &&
                now.getTime() - refreshed.getTime() <= days * DAY_MS
            );
        }).length;
    const dormant90d = authUsers.filter((user) => {
        // users who never refreshed a token fall back to sign in / sign up
        const lastActive =
            toDate(user.metadata.lastRefreshTime) ??
            toDate(user.metadata.lastSignInTime) ??
            toDate(user.metadata.creationTime);
        return (
            lastActive !== null &&
            now.getTime() - lastActive.getTime() > 90 * DAY_MS
        );
    }).length;
    const providers = authUsers.flatMap((user) => {
        const ids = (user.providerData ?? []).map((item) => item.providerId);
        return ids.length ? ids : [UNSET];
    });

    // gears
    const gears = gearDocs.map(({ data }) => data);
    const archivedGears = gears.filter((gear) => gear.isArchived === true);
    const gearCounts = metas.map((meta) => toCount(meta.gearCount));
    const bucketCounts = _.countBy(
        gearCounts,
        (count) => GEAR_BUCKETS.find((bucket) => count <= bucket.max)!.key,
    );
    const brandKeys: string[] = [];
    const customBrands: string[] = [];
    for (const gear of gears) {
        if (typeof gear.brand?.key === 'string' && gear.brand.key) {
            brandKeys.push(gear.brand.key);
            continue;
        }
        const custom = normalizeBrand(gear.brand?.custom);
        if (custom) {
            brandKeys.push(`custom:${custom}`);
            customBrands.push(custom);
        }
    }

    // trips
    const trips = tripDocs.map(({ data }) => data);
    const publicCount = trips.filter(
        (trip) => trip.isPublished === true,
    ).length;
    const gearsPerTrip = trips.map(
        (trip) =>
            new Set([
                ...Object.keys(trip.gears ?? {}),
                ...Object.keys(trip.wornGears ?? {}),
            ]).size,
    );
    const baseWeights = tripShares
        .map(({ data }) => data.baseWeight)
        .filter((weight): weight is number => Number.isFinite(weight));

    // public trips
    const viewCounts: Record<string, number> = Object.fromEntries(
        tripMetas.map(({ id, data }) => [id, toCount(data.viewCount)]),
    );
    const topViewed: TopTrip[] = _.orderBy(
        tripShares.filter(({ id }) => viewCounts[id] > 0),
        [({ id }) => viewCounts[id], 'id'],
        ['desc', 'asc'],
    )
        .slice(0, TOP_VIEWED_LIMIT)
        .map(({ id, data }) => {
            const owner = userMap.get(findOwnerId(data.role) ?? '');
            return {
                tripId: id,
                title: data.title ?? '',
                ownerName: owner?.displayName ?? data.owner?.displayName ?? '',
                ownerEmail: owner?.email ?? '',
                viewCount: viewCounts[id],
                // Firestore rejects `undefined`
                ...(data.published ? { published: data.published } : {}),
            };
        });
    const topCreators: TopCreator[] = toCountItems(
        tripShares.flatMap(({ data }) => findOwnerId(data.role) ?? []),
        TOP_CREATORS_LIMIT,
    ).map(({ key, count }) => ({
        uid: key,
        displayName: userMap.get(key)?.displayName ?? '',
        email: userMap.get(key)?.email ?? '',
        count,
    }));

    return {
        computedAt: AdminTimestamp.fromDate(now),
        ...(period ? { period } : {}),
        users: {
            total: authUsers.length,
            newThisMonth: authUsers.filter((user) =>
                isInMonth(user.metadata.creationTime),
            ).length,
            dau: countActiveWithin(1),
            wau: countActiveWithin(7),
            mau: countActiveWithin(30),
            dormant90d,
            withGear: gearCounts.filter((count) => count >= 1).length,
            withTrip: metas.filter((meta) => toCount(meta.tripCount) >= 1)
                .length,
            withPublicTrip: metas.filter(
                (meta) => toCount(meta.tripShareCount) >= 1,
            ).length,
            byProvider: toCountItems(providers),
            byLocale: toCountItems(
                authUsers.map((user) => toText(metaMap.get(user.uid)?.locale)),
            ),
            byCurrency: toCountItems(
                authUsers.map((user) =>
                    toText(metaMap.get(user.uid)?.currency),
                ),
            ),
        },
        gears: {
            total: gears.length,
            active: gears.length - archivedGears.length,
            archived: archivedGears.length,
            newThisMonth: gears.filter((gear) => isInMonth(gear.created))
                .length,
            perUserAvg: average(gearCounts),
            perUserMedian: median(gearCounts),
            perUserBuckets: GEAR_BUCKETS.map(({ key }) => ({
                key,
                count: bucketCounts[key] ?? 0,
            })),
            byCategory: toCountItems(
                gears.map((gear) => toText(gear.category)),
            ),
            topBrands: toCountItems(brandKeys, TOP_BRANDS_LIMIT),
            topCustomBrands: toCountItems(
                customBrands,
                TOP_CUSTOM_BRANDS_LIMIT,
            ),
            byArchiveReason: toCountItems(
                archivedGears.map((gear) => toText(gear.archiveReason)),
            ),
            // `imgUrl` is the photo field of old data
            withPhoto: gears.filter(
                (gear) => gear.photo?.url || gear.imgUrl?.sm,
            ).length,
            withPrice: gears.filter((gear) => Number.isFinite(gear.price))
                .length,
            bySource: toCountItems(
                gears.map((gear) => gear.source || 'manual'),
            ),
        },
        trips: {
            total: trips.length,
            private: trips.length - publicCount,
            public: publicCount,
            newThisMonth: trips.filter((trip) => isInMonth(trip.created))
                .length,
            perUserAvg: average(metas.map((meta) => toCount(meta.tripCount))),
            avgGearsPerTrip: average(gearsPerTrip),
            emptyTrips: gearsPerTrip.filter((count) => count === 0).length,
            byDateMode: toCountItems(
                trips.map((trip) => toText(trip.dateMode)),
            ),
            withBanner: trips.filter((trip) => trip.bannerImage?.url).length,
            publicAvgBaseWeight: average(baseWeights),
        },
        publicTrips: {
            totalViews: _.sum(Object.values(viewCounts)),
            topViewed,
            viewCounts,
            topCreators,
        },
    };
};

export const computeStats = async (
    now: Date,
    period?: string,
): Promise<AdminStats> => buildStats(await loadStatsData(), now, period);
