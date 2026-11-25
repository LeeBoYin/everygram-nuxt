<template>
    <div class="admin-overview__kpis gap-3 mb-3">
        <AdminKpiCard v-for="card in cards" :key="card.label" v-bind="card" />
    </div>
    <div class="grid">
        <div class="col-6">
            <AdminCard title="啟用漏斗" class="h-full">
                <AdminBarChart :items="funnel" />
            </AdminCard>
        </div>
        <div class="col-6">
            <AdminCard title="語言分佈" class="h-full">
                <AdminBarChart
                    :items="toAdminChartItems(stats.users.byLocale, 'locale')"
                />
            </AdminCard>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    stats: AdminStats;
    previous?: AdminStats | null;
}>();

const toCard = (
    label: string,
    getValue: (stats: AdminStats) => number,
    detail?: string,
) => ({
    label,
    value: formatAdminNumber(getValue(props.stats)),
    detail,
    change: formatAdminChange(
        getValue(props.stats),
        props.previous ? getValue(props.previous) : undefined,
    ),
});

const cards = computed(() => [
    toCard('使用者總數', (stats) => stats.users.total),
    toCard('MAU', (stats) => stats.users.mau),
    toCard('裝備總數', (stats) => stats.gears.total),
    toCard(
        '行程總數',
        (stats) => stats.trips.total,
        `私人 ${formatAdminNumber(props.stats.trips.private)}／公開 ${formatAdminNumber(props.stats.trips.public)}`,
    ),
    toCard('總瀏覽數', (stats) => stats.publicTrips.totalViews),
]);

const funnel = computed(() => {
    const { total, withGear, withTrip, withPublicTrip } = props.stats.users;
    return [
        { label: '全部使用者', count: total },
        { label: '有裝備', count: withGear },
        { label: '有行程', count: withTrip },
        { label: '有公開行程', count: withPublicTrip },
    ].map((item) => ({
        ...item,
        label: `${item.label} ${formatAdminRatio(item.count, total)}`,
    }));
});
</script>

<style scoped lang="scss">
.admin-overview__kpis {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
}
</style>
