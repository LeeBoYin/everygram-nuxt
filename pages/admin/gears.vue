<template>
    <h1 class="text-2xl mt-0">裝備</h1>
    <AdminStatsState v-slot="{ stats: { gears } }">
        <div class="grid">
            <div class="col-4">
                <AdminKpiCard
                    class="h-full"
                    label="裝備總數"
                    :value="formatAdminNumber(gears.total)"
                    :detail="`使用中 ${formatAdminNumber(gears.active)}／已封存 ${formatAdminNumber(gears.archived)}／本月新增 ${formatAdminNumber(gears.newThisMonth)}`"
                />
            </div>
            <div class="col-2">
                <AdminKpiCard
                    class="h-full"
                    label="每人平均"
                    :value="formatAdminNumber(gears.perUserAvg)"
                />
            </div>
            <div class="col-2">
                <AdminKpiCard
                    class="h-full"
                    label="每人中位數"
                    :value="formatAdminNumber(gears.perUserMedian)"
                />
            </div>
            <div class="col-2">
                <AdminKpiCard
                    class="h-full"
                    label="有照片"
                    :value="formatAdminRatio(gears.withPhoto, gears.total)"
                    :detail="`${formatAdminNumber(gears.withPhoto)} 件`"
                />
            </div>
            <div class="col-2">
                <AdminKpiCard
                    class="h-full"
                    label="有價格"
                    :value="formatAdminRatio(gears.withPrice, gears.total)"
                    :detail="`${formatAdminNumber(gears.withPrice)} 件`"
                />
            </div>
            <div class="col-6">
                <AdminCard title="每人裝備數（人數）" class="h-full">
                    <AdminBarChart
                        :items="toAdminChartItems(gears.perUserBuckets)"
                    />
                </AdminCard>
            </div>
            <div class="col-6">
                <AdminCard title="類別" class="h-full">
                    <AdminBarChart
                        :items="toAdminChartItems(gears.byCategory, 'category')"
                    />
                </AdminCard>
            </div>
            <div class="col-6">
                <AdminCard title="封存原因" class="h-full">
                    <AdminBarChart
                        :items="
                            toAdminChartItems(
                                gears.byArchiveReason,
                                'archiveReason',
                            )
                        "
                    />
                </AdminCard>
            </div>
            <div class="col-6">
                <AdminCard title="匯入來源" class="h-full">
                    <AdminBarChart
                        :items="toAdminChartItems(gears.bySource, 'source')"
                    />
                </AdminCard>
            </div>
            <div class="col-6">
                <AdminCard title="品牌 Top 30">
                    <AdminRankTable
                        :columns="BRAND_COLUMNS"
                        :rows="gears.topBrands"
                    >
                        <template #key="{ row }">
                            {{ formatAdminBrand(row.key) }}
                        </template>
                    </AdminRankTable>
                </AdminCard>
            </div>
            <div class="col-6">
                <AdminCard title="自訂品牌 Top 50">
                    <p class="mt-0 text-sm text-color-secondary">
                        可以考慮加入內建品牌清單的名稱。
                    </p>
                    <AdminRankTable
                        :columns="BRAND_COLUMNS"
                        :rows="gears.topCustomBrands"
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
useSeoMeta({ title: '裝備｜管理後台' });

const BRAND_COLUMNS = [
    { field: 'key', header: '品牌' },
    { field: 'count', header: '裝備數' },
];
</script>
