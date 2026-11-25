<template>
    <h1 class="text-2xl mt-0">歷史</h1>
    <div
        v-if="!selected"
        class="bg-white border-1 border-200 border-round-md p-5 text-color-secondary"
    >
        <template v-if="isLoading">讀取中…</template>
        <template v-else-if="hasError">讀取失敗，請重新整理。</template>
        <template v-else>
            還沒有每月 snapshot。每月 1 日會自動產生上個月的 snapshot。
        </template>
    </div>
    <template v-else>
        <div class="flex align-items-center gap-3 mb-3">
            <PrimeDropdown
                v-model="selectedPeriod"
                :options="periods"
                aria-label="月份"
                class="w-14rem"
            />
            <span class="text-sm text-color-secondary">
                {{ selected.period }} 的月底數據，計算時間：{{
                    formatAdminDate(selected.computedAt)
                }}
            </span>
        </div>
        <AdminOverview :stats="selected" :previous="previous" />
    </template>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
});
useSeoMeta({ title: '歷史｜管理後台' });

const { snapshots, isLoading, hasError } = useAdminHistory();
const selectedPeriod = ref<string | null>(null);

// newest first
const periods = computed(() =>
    snapshots.value.map(({ period }) => period!).reverse(),
);
const findSnapshot = (period: string) =>
    snapshots.value.find((stats) => stats.period === period);

const selected = computed(() =>
    selectedPeriod.value ? findSnapshot(selectedPeriod.value) : undefined,
);
// only the month right before counts as "last month"
const previous = computed(() =>
    selectedPeriod.value
        ? findSnapshot(shiftAdminMonth(selectedPeriod.value, -1))
        : undefined,
);

// select the newest month once loaded
watch(periods, ([newest]) => {
    selectedPeriod.value = newest ?? null;
});
</script>
