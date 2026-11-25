<template>
    <AdminCard title="本月瀏覽增加 Top 20">
        <p v-if="!previous" class="m-0 text-color-secondary">
            {{
                isLoading
                    ? '讀取中…'
                    : '還沒有每月 snapshot，無法計算本月增加。每月 1 日會自動產生上個月的 snapshot。'
            }}
        </p>
        <template v-else>
            <p class="mt-0 text-sm text-color-secondary">
                和 {{ previous.period }} 的 snapshot 相比，只列目前公開的行程。
            </p>
            <p v-if="isLoadingRows" class="m-0 text-color-secondary">讀取中…</p>
            <AdminRankTable v-else :columns="COLUMNS" :rows="rows">
                <template #title="{ row }">
                    <NuxtLink
                        :to="`/trip-share/${row.tripId}`"
                        target="_blank"
                        class="underline"
                    >
                        {{ row.title || '（沒有標題）' }}
                    </NuxtLink>
                </template>
                <template #increase="{ row }">
                    +{{ formatAdminNumber(row.increase) }}
                </template>
                <template #published="{ row }">
                    {{ formatAdminDate(row.published) }}
                </template>
            </AdminRankTable>
        </template>
    </AdminCard>
</template>

<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore';

const TOP_LIMIT = 20;
const COLUMNS = [
    { field: 'title', header: '標題' },
    { field: 'ownerName', header: '作者' },
    { field: 'increase', header: '本月增加' },
    { field: 'viewCount', header: '累計瀏覽數' },
    { field: 'published', header: '發佈日' },
];

type Row = ReturnType<typeof buildAdminViewGrowth>[number] & {
    title: string;
    ownerName: string;
    published?: Timestamp;
};

const { latest, previous, isLoading } = useAdminStats();
const { errorToast } = useErrorToast();
const rows = ref<Row[]>([]);
const isLoadingRows = ref(true);
let requestId = 0;

// the stats only have the view counts, so titles come from `tripShare`
const fetchRows = async () => {
    const currentRequest = ++requestId;
    if (!latest.value || !previous.value) {
        return;
    }
    isLoadingRows.value = true;
    try {
        const db = firebaseUtils.getFirestoreDB();
        const growth = buildAdminViewGrowth(
            latest.value.publicTrips.viewCounts,
            previous.value.publicTrips.viewCounts,
        );
        const result: Row[] = [];
        // trips which are no longer public have no `tripShare`: read further
        // down the ranking until the list is full
        for (
            let start = 0;
            start < growth.length && result.length < TOP_LIMIT;
            start += TOP_LIMIT
        ) {
            const items = growth.slice(start, start + TOP_LIMIT);
            const docs = await Promise.all(
                items.map(({ tripId }) => getDoc(doc(db, 'tripShare', tripId))),
            );
            docs.forEach((tripShareDoc, index) => {
                const tripShare = tripShareDoc.data() as TripShare | undefined;
                if (tripShare) {
                    result.push({
                        ...items[index],
                        title: tripShare.title,
                        ownerName: tripShare.owner?.displayName ?? '',
                        published: tripShare.published,
                    });
                }
            });
        }
        if (currentRequest === requestId) {
            rows.value = result.slice(0, TOP_LIMIT);
        }
    } catch (error) {
        errorToast('讀取瀏覽增加排行失敗', error);
    } finally {
        if (currentRequest === requestId) {
            isLoadingRows.value = false;
        }
    }
};

watch([latest, previous], fetchRows, { immediate: true });
</script>
