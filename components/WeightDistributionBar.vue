<template>
    <div class="weight-distribution-bar">
        <div
            v-if="items.length && totalWeight > 0"
            v-for="item in items"
            :key="item.label"
            v-tooltip.top="
                `${item.label} ${formatWeight(item.weight)} (${_round((item.weight / totalWeight) * 100)}%)`
            "
            :class="[
                'weight-bar-chart__section',
                { 'border-1 border-solid border-500': item.addBorder },
            ]"
            :style="{
                backgroundColor: item.color,
                width: `${(item.weight / totalWeight) * 100}%`,
            }"
        ></div>
        <div
            v-else
            class="weight-bar-chart__section w-full"
            :style="{
                backgroundColor: constants.COLORS.EMPTY_WEIGHT,
            }"
        ></div>
    </div>
</template>

<script lang="ts" setup>
import { round as _round } from 'lodash-es';
const props = defineProps<{
    items: WeightBarChartItem[];
}>();
const { formatWeight } = useLangUtils();
const totalWeight = computed(() =>
    props.items.reduce((acc, item) => acc + item.weight, 0),
);
</script>

<style lang="scss">
.weight-distribution-bar {
    display: flex;
    gap: 2px;
    height: 16px;
}
</style>
