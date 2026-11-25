<template>
    <p v-if="!months.length" class="m-0 text-color-secondary">沒有資料</p>
    <div v-else class="h-15rem" role="img" :aria-label="description">
        <PrimeChart
            type="line"
            :data="chartData"
            :options="CHART_OPTIONS"
            class="h-full"
        />
    </div>
</template>

<script setup lang="ts">
// $eg-c-primary, canvas cannot read SCSS variables
const LINE_COLOR = '#7e6e58';

// must not change, PrimeVue re-creates the chart when the options change
const CHART_OPTIONS = {
    maintainAspectRatio: false,
    animation: false,
    // show the value of the nearest month without hitting the point
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
        x: { grid: { display: false } },
        y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: '#ededed' },
            border: { display: false },
        },
    },
};

// a `null` value is a month without data, shown as a gap
const props = defineProps<{
    label: string;
    months: string[];
    values: (number | null)[];
}>();

const description = computed(
    () =>
        `${props.label}：${props.months
            .map((month, index) => {
                const value = props.values[index];
                return `${month} ${value === null ? '沒有資料' : formatAdminNumber(value)}`;
            })
            .join('、')}`,
);
const chartData = computed(() => ({
    labels: props.months,
    datasets: [
        {
            label: props.label,
            data: props.values,
            borderColor: LINE_COLOR,
            backgroundColor: LINE_COLOR,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
    ],
}));
</script>
