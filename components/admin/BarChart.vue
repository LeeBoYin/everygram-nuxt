<template>
    <p v-if="!items.length" class="m-0 text-color-secondary">沒有資料</p>
    <div
        v-else
        :style="{ height: `${items.length * ROW_HEIGHT + AXIS_HEIGHT}px` }"
        role="img"
        :aria-label="labels.join('、')"
    >
        <PrimeChart
            type="bar"
            :data="chartData"
            :options="CHART_OPTIONS"
            class="h-full"
        />
    </div>
</template>

<script setup lang="ts">
const ROW_HEIGHT = 32;
const AXIS_HEIGHT = 32;
// $eg-c-primary, canvas cannot read SCSS variables
const BAR_COLOR = '#7e6e58';

// must not change, PrimeVue re-creates the chart when the options change
const CHART_OPTIONS = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
        x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: '#ededed' },
            border: { display: false },
        },
        y: { grid: { display: false } },
    },
};

const props = defineProps<{ items: { label: string; count: number }[] }>();

// the count is part of the label, so values are readable without hovering
const labels = computed(() =>
    props.items.map(
        ({ label, count }) => `${label}（${formatAdminNumber(count)}）`,
    ),
);
const chartData = computed(() => ({
    labels: labels.value,
    datasets: [
        {
            label: '數量',
            data: props.items.map(({ count }) => count),
            backgroundColor: BAR_COLOR,
            borderRadius: 4,
            maxBarThickness: 18,
        },
    ],
}));
</script>
