<template>
    <div class="trip-weight-info">
        <div
            :class="[
                'flex flex-column gap-3 p-3 bg-white lg:border-round-top-md',
                { 'lg:border-round-bottom-md': !wornGears.length },
            ]"
        >
            <h3 class="flex justify-content-between text-lg">
                <div>
                    {{ $t('LABEL_PACK_WEIGHT') }}
                </div>
                <div>
                    {{ formatWeight(backpackWeight) }}
                </div>
            </h3>
            <WeightBarChart :items="backpackWeightItems" :showLabel="true" />
            <div class="flex flex-column gap-1">
                <div class="surface-100 px-3 py-2 border-round-top-md">
                    <div class="flex justify-content-between my-1">
                        <div>
                            {{ $t('LABEL_BASE_WEIGHT') }}
                        </div>
                        <div>
                            {{ formatWeight(gearsWeight) }}
                        </div>
                    </div>
                </div>
                <div class="surface-100 px-3 py-2 border-round-bottom-md">
                    <div class="flex justify-content-between my-1">
                        <div>
                            {{ $t('LABEL_CONSUMABLES') }}
                        </div>
                        <div>
                            {{ formatWeight(consumablesWeight) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="wornGears.length"
            class="flex flex-column gap-3 p-3 bg-white lg:border-round-bottom-md border-top-solid border-top-1 border-200"
        >
            <div class="surface-100 px-3 py-2 border-round-md">
                <div class="flex justify-content-between my-1">
                    <div>
                        {{ $t('LABEL_WORN_GEARS') }}
                    </div>
                    <div>
                        {{ formatWeight(wornGearsWeight) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    gears: GearWithQuantity[];
    wornGears: GearWithQuantity[];
    consumables: Consumable[];
}>();
const { gears, wornGears, consumables } = toRefs(props);
const {
    gearsWeight,
    gearWeightByCategory,
    consumablesWeight,
    consumableWeightByCategory,
    backpackWeight,
    wornGearsWeight,
} = useTripWeightData({
    gearsRef: gears,
    wornGearsRef: wornGears,
    consumablesRef: consumables,
});
const i18n = useI18n();
const { formatWeight, gearCategoryToLabel, consumableCategoryToLabel } =
    useLangUtils();

const consumablesWeightItems = computed<WeightBarChartSubItem[]>(() =>
    Object.entries(consumableWeightByCategory.value)
        .map(([category, weight]) => ({
            label: consumableCategoryToLabel(category as ConsumableCategory),
            weight,
        }))
        .sort((a, b) => b.weight - a.weight),
);
const backpackWeightItems = computed<WeightBarChartItem[]>(() => [
    ...Object.entries(gearWeightByCategory.value).map(([category, weight]) => ({
        label: gearCategoryToLabel(category as GearCategory),
        weight,
        color: constants.GEAR_CATEGORIES[category as GearCategory].color,
    })),
    ...(consumablesWeight.value
        ? [
              {
                  label: i18n.t('LABEL_CONSUMABLES'),
                  weight: consumablesWeight.value,
                  color: constants.COLORS.CONSUMABLES_WEIGHT,
                  addBorder: true,
                  subItems: consumablesWeightItems.value,
              },
          ]
        : []),
]);
</script>

<style lang="scss">
@import '~/assets/theme/primeflex/core/_variables.scss';
.trip-weight-info {
    margin: 0 calc(-1 * var(--page-container-padding));
    @media (min-width: $lg) {
        margin: 0;
    }
}
</style>
