<template>
    <h1 class="text-2xl mt-0">行程</h1>
    <AdminStatsState v-slot="{ stats: { trips, publicTrips } }">
        <div class="grid">
            <div class="col-3">
                <AdminKpiCard
                    class="h-full"
                    label="行程總數"
                    :value="formatAdminNumber(trips.total)"
                    :detail="`私人 ${formatAdminNumber(trips.private)}／公開 ${formatAdminNumber(trips.public)}／本月新增 ${formatAdminNumber(trips.newThisMonth)}`"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    class="h-full"
                    label="每人平均行程數"
                    :value="formatAdminNumber(trips.perUserAvg)"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    class="h-full"
                    label="每個行程平均裝備種類"
                    :value="formatAdminNumber(trips.avgGearsPerTrip)"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    class="h-full"
                    label="空行程（0 件裝備）"
                    :value="formatAdminNumber(trips.emptyTrips)"
                    :detail="`占 ${formatAdminRatio(trips.emptyTrips, trips.total)}`"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    class="h-full"
                    label="有封面圖"
                    :value="formatAdminRatio(trips.withBanner, trips.total)"
                    :detail="`${formatAdminNumber(trips.withBanner)} 個行程`"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    class="h-full"
                    label="公開行程平均 base weight"
                    :value="`${formatAdminNumber(trips.publicAvgBaseWeight)} g`"
                />
            </div>
            <div class="col-6">
                <AdminCard title="日期模式" class="h-full">
                    <AdminBarChart
                        :items="toAdminChartItems(trips.byDateMode, 'dateMode')"
                    />
                </AdminCard>
            </div>
            <div class="col-12">
                <AdminCard title="瀏覽數 Top 20">
                    <AdminRankTable
                        :columns="VIEWED_COLUMNS"
                        :rows="publicTrips.topViewed"
                    >
                        <template #title="{ row }">
                            <NuxtLink
                                :to="`/trip-share/${row.tripId}`"
                                target="_blank"
                                class="underline"
                            >
                                {{ row.title || '（沒有標題）' }}
                            </NuxtLink>
                        </template>
                        <template #published="{ row }">
                            {{ formatAdminDate(row.published) }}
                        </template>
                    </AdminRankTable>
                </AdminCard>
            </div>
            <div class="col-12">
                <AdminCard title="發佈最多公開行程的使用者">
                    <AdminRankTable
                        :columns="CREATOR_COLUMNS"
                        :rows="publicTrips.topCreators"
                    />
                </AdminCard>
            </div>
        </div>
    </AdminStatsState>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
});
useSeoMeta({ title: '行程｜管理後台' });

const VIEWED_COLUMNS = [
    { field: 'title', header: '標題' },
    { field: 'ownerName', header: '作者' },
    { field: 'ownerEmail', header: 'email' },
    { field: 'viewCount', header: '瀏覽數' },
    { field: 'published', header: '發佈日' },
];
const CREATOR_COLUMNS = [
    { field: 'displayName', header: '名字' },
    { field: 'email', header: 'email' },
    { field: 'count', header: '公開行程數' },
];
</script>
