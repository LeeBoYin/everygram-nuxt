<template>
    <SectionPanel>
        <template #header>
            <SectionTitleBar
                class="px-3 py-2 lg:py-3 border-round-top-md"
                sticky
            >
                <h2 class="text-2xl">{{ title }}</h2>
                <slot name="header-actions" />
            </SectionTitleBar>
        </template>
        <div
            v-if="displayGearCatergories.length"
            v-for="category in displayGearCatergories"
            :key="category"
            class="flex flex-column gap-3"
        >
            <CategoryHeader
                :category="category"
                :weight="gearWeightByCategory[category]"
            >
                <template #actions>
                    <slot name="category-actions" :category="category" />
                </template>
            </CategoryHeader>
            <slot
                name="category-body"
                :category="category"
                :gears="gearsByCategory[category]"
            />
        </div>
        <div v-else>
            <slot name="empty-state" />
        </div>
    </SectionPanel>
</template>

<script setup lang="ts">
import { mapValues as _mapValues, sumBy as _sumBy } from 'lodash-es';
const props = defineProps<{
    title: string;
    gears: GearWithQuantity[];
}>();

const gearsByCategory = computed(() =>
    dataUtils.groupGearsByCategory(props.gears),
);

const displayGearCatergories = computed(() =>
    constants.GEAR_CATEGORY_KEYS.filter(
        (category) => gearsByCategory.value[category]?.length,
    ),
);

const gearWeightByCategory = computed(() =>
    _mapValues(gearsByCategory.value, (gears) =>
        _sumBy(gears, (gear) => (+gear.weight || 0) * gear.quantity),
    ),
);
</script>
