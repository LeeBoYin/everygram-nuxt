<template>
    <SectionPanel>
        <template #header>
            <SectionTitleBar
                class="px-3 py-2 lg:py-3 border-round-top-md"
                sticky
            >
                <h2>{{ title }}</h2>
                <slot name="header-actions" />
            </SectionTitleBar>
        </template>
        <div
            v-if="displayConsumableCatergories.length"
            v-for="category in displayConsumableCatergories"
            :key="category"
            class="flex flex-column gap-3"
        >
            <CategoryHeader
                :category="category"
                :weight="consumableWeightByCategory[category]"
            >
                <template #actions>
                    <slot name="category-actions" :category="category" />
                </template>
            </CategoryHeader>
            <slot
                name="category-body"
                :category="category"
                :consumables="consumablesByCategory[category]"
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
    consumables: Consumable[];
}>();

const consumablesByCategory = computed(() =>
    dataUtils.groupConsumablesByCategory(props.consumables),
);

const displayConsumableCatergories = computed(() =>
    constants.CONSUMABLE_CATEGORY_KEYS.filter(
        (category) => consumablesByCategory.value[category]?.length,
    ),
);

const consumableWeightByCategory = computed(() =>
    _mapValues(consumablesByCategory.value, (consumables) =>
        _sumBy(consumables, dataUtils.getConsumableWeight),
    ),
);
</script>
