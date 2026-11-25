<template>
    <h1 class="text-2xl mt-0">趨勢</h1>
    <div
        v-if="isLoading || hasError || !hasData"
        class="bg-white border-1 border-200 border-round-md p-5 text-color-secondary"
    >
        <template v-if="isLoading">讀取中…</template>
        <template v-else-if="hasError">讀取失敗，請重新整理。</template>
        <template v-else>
            還沒有歷史資料。每月 1 日會自動產生上個月的 snapshot，owner
            也可以在管理者頁按「回補歷史資料」。
        </template>
    </div>
    <template v-else>
        <AdminCard title="指標" class="mb-3">
            <div class="flex flex-wrap gap-4">
                <div
                    v-for="metric in ADMIN_TREND_METRICS"
                    :key="metric.key"
                    class="flex align-items-center gap-2"
                >
                    <PrimeCheckbox
                        v-model="selectedKeys"
                        :inputId="`metric-${metric.key}`"
                        :value="metric.key"
                    />
                    <label :for="`metric-${metric.key}`">
                        {{ metric.label }}
                    </label>
                </div>
            </div>
            <p v-if="partialMonth" class="mb-0 text-sm text-color-secondary">
                {{ partialMonth }}
                的每月新增來自回補，只算到回補當下，還不是整個月。
            </p>
        </AdminCard>
        <p v-if="!charts.length" class="text-color-secondary">
            請至少選一個指標。
        </p>
        <!-- one chart per metric: their scales differ too much to share an axis -->
        <div v-else class="grid">
            <div v-for="chart in charts" :key="chart.key" class="col-6">
                <AdminCard :title="chart.label" class="h-full">
                    <AdminLineChart
                        :label="chart.label"
                        :months="chart.months"
                        :values="chart.values"
                    />
                </AdminCard>
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
});
useSeoMeta({ title: '趨勢｜管理後台' });

const { snapshots, backfill, isLoading, hasError } = useAdminHistory();
const selectedKeys = ref(ADMIN_TREND_METRICS.map(({ key }) => key));

const hasData = computed(
    () =>
        snapshots.value.length > 0 ||
        Object.keys(backfill.value?.months ?? {}).length > 0,
);
const charts = computed(() =>
    ADMIN_TREND_METRICS.filter(({ key }) =>
        selectedKeys.value.includes(key),
    ).map((metric) => ({
        key: metric.key,
        label: metric.label,
        ...buildAdminTrend(metric, snapshots.value, backfill.value),
    })),
);
// the month the backfill ran in, as long as no snapshot has replaced it
const partialMonth = computed(() => {
    if (!backfill.value || !Object.keys(backfill.value.months).length) {
        return null;
    }
    const month = toAdminBackfillMonth(backfill.value);
    return snapshots.value.some(({ period }) => period === month)
        ? null
        : month;
});
</script>
