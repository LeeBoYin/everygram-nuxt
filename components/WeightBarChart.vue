<template>
    <div class="weight-bar-chart flex flex-column gap-3">
        <!-- labels -->
        <div v-if="showLabel" class="flex flex-column gap-1">
            <div v-for="(item, index) in sortedItems" :key="item.label">
                <div
                    :class="[
                        'flex gap-2 align-items-center py-1',
                        { 'cursor-pointer': item.subItems },
                    ]"
                    @click="itemsToggle[index] = !itemsToggle[index]"
                >
                    <div
                        class="weight-bar-chart__bar"
                        :style="{
                            backgroundColor: item.color,
                            width: getBarWidth(item.weight),
                            outline: item.addBorder
                                ? '1px solid var(--gray-500)'
                                : '',
                        }"
                    ></div>
                    <div class="text-ellipsis flex-shrink-1">
                        {{ item.label }}
                        <span
                            v-if="item.subItems"
                            :class="[
                                'pi text-xs text-color-light',
                                {
                                    'pi-chevron-up': itemsToggle[index],
                                    'pi-chevron-down': !itemsToggle[index],
                                },
                            ]"
                        ></span>
                    </div>
                    <DashedLine />
                    <div class="white-space-nowrap">
                        {{ formatWeight(item.weight) }}
                    </div>
                    <div
                        class="w-2rem text-color-light text-right white-space-nowrap"
                    >
                        {{
                            _round(
                                (totalWeight ? item.weight / totalWeight : 0) *
                                    100,
                            )
                        }}%
                    </div>
                </div>
                <!-- sub items -->
                <div
                    v-if="item.subItems && itemsToggle[index]"
                    class="flex flex-column gap-1 mt-1 ml-3 text-color-light"
                >
                    <div
                        v-for="subItem in item.subItems"
                        class="flex gap-2 align-items-center py-1"
                        :key="subItem.label"
                    >
                        <div>{{ subItem.label }}</div>
                        <DashedLine />
                        <div>{{ formatWeight(subItem.weight) }}</div>
                        <div class="w-2rem text-color-light text-right">
                            {{
                                _round(
                                    (totalWeight
                                        ? subItem.weight / totalWeight
                                        : 0) * 100,
                                )
                            }}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { round as _round } from 'lodash-es';
const props = defineProps<{
    items: WeightBarChartItem[];
    showLabel?: boolean;
}>();

const { formatWeight } = useLangUtils();

const totalWeight = computed(() =>
    props.items.reduce((acc, item) => acc + item.weight, 0),
);
const sortedItems = computed(() =>
    props.items.sort((a, b) => b.weight - a.weight),
);
const itemsToggle = ref<Record<number, boolean>>(
    props.items.reduce(
        (acc, item, index) => {
            acc[index] = false;
            return acc;
        },
        {} as Record<number, boolean>,
    ),
);
const maxItemWeight = computed(() =>
    Math.max(...props.items.map((item) => item.weight), 0),
);
const getBarWidth = (weight: number) => {
    if (
        props.items.length <= 1 ||
        totalWeight.value === 0 ||
        maxItemWeight.value === 0
    ) {
        return '';
    }
    return `${(weight / maxItemWeight.value) * 140}px`;
};
</script>

<style lang="scss">
.weight-bar-chart {
    &__section {
        flex: 1 1 auto;
        transition: all 0.3s;
        &:first-child {
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
        }
        &:last-child {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
        }
        &:hover {
            transition: 0.2s;
            transform: scaleY(1.2);
        }
    }
    &__bar {
        max-width: 140px;
        min-width: 6px;
        height: 12px;
        border-radius: 2px;
        flex-shrink: 0;
        transition: all 0.3s;
    }
}
</style>
